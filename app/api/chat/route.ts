import { model } from "@/lib/gemini";
import { retrieve, buildRagPrompt } from "@/lib/retrieval";
import { NextRequest, NextResponse } from "next/server";
import { isIP } from "node:net";
import fs from "node:fs";
import path from "node:path";
import { checkChatRateLimit } from "@/lib/chat-rate-limit";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_CHARS = 10_000;
const NO_ANSWER_MARKER = "[[VU_NO_ANSWER]]";

type ChatHistoryMessage = {
  role: "user" | "model";
  parts: [{ text: string }];
};

class PayloadTooLargeError extends Error {}
class InvalidRequestError extends Error {}

async function readJsonBody(req: Request): Promise<unknown> {
  const contentType = req.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new InvalidRequestError("Expected an application/json request.");
  }

  const contentLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new PayloadTooLargeError();
  }

  if (!req.body) throw new InvalidRequestError("Request body is required.");

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new PayloadTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch {
    throw new InvalidRequestError("Request body must contain valid JSON.");
  }
}

function validateChatBody(value: unknown): {
  message: string;
  history: ChatHistoryMessage[];
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InvalidRequestError("Request body must be a JSON object.");
  }

  const body = value as Record<string, unknown>;
  if (typeof body.message !== "string" || !body.message.trim()) {
    throw new InvalidRequestError("Please type a question first.");
  }
  if (body.message.length > 1000) {
    throw new InvalidRequestError("Your question is too long. Please keep it under 1000 characters.");
  }

  const rawHistory = body.history ?? [];
  if (!Array.isArray(rawHistory) || rawHistory.length > MAX_HISTORY_MESSAGES) {
    throw new InvalidRequestError("Conversation history is invalid or too long. Please start a new chat.");
  }

  let historyChars = 0;
  const history = rawHistory.map((item, index): ChatHistoryMessage => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new InvalidRequestError("Conversation history is invalid.");
    }

    const entry = item as Record<string, unknown>;
    const expectedRole = index % 2 === 0 ? "user" : "model";
    if (entry.role !== expectedRole || !Array.isArray(entry.parts) || entry.parts.length !== 1) {
      throw new InvalidRequestError("Conversation history is invalid.");
    }

    const part = entry.parts[0];
    if (!part || typeof part !== "object" || Array.isArray(part)) {
      throw new InvalidRequestError("Conversation history is invalid.");
    }

    const text = (part as Record<string, unknown>).text;
    const maxMessageChars = entry.role === "user" ? 1000 : 4000;
    if (typeof text !== "string" || !text.trim() || text.length > maxMessageChars) {
      throw new InvalidRequestError("Conversation history is invalid or too long.");
    }

    historyChars += text.length;
    if (historyChars > MAX_HISTORY_CHARS) {
      throw new InvalidRequestError("Conversation history is too long. Please start a new chat.");
    }

    return { role: expectedRole, parts: [{ text }] };
  });

  return { message: body.message, history };
}

function getClientIp(req: NextRequest): string | null {
  const configuredHeader = process.env.CHAT_CLIENT_IP_HEADER;
  if (process.env.NODE_ENV === "production" && !configuredHeader) return null;

  const headerName = configuredHeader ?? "x-forwarded-for";
  const headerValue = req.headers.get(headerName);
  const candidate = headerValue?.split(",", 1)[0].trim();

  if (candidate && isIP(candidate)) return candidate;
  return process.env.NODE_ENV === "production" ? null : "local-development";
}

function getSourceInfo(source: string) {
  const parts = source.split(/[\\/]/);
  const name = parts[parts.length - 1].replace(".txt", "");
  try {
    const file = path.join(process.cwd(), ...parts);
    const head = fs.readFileSync(file, "utf-8").slice(0, 500);
    const url = head.match(/https?:\/\/[^\s"'<>)]+/)?.[0];
    return { name, url };
  } catch {
    return { name };
  }
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  if (!clientIp) {
    return NextResponse.json(
      { error: "Chat is temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  try {
    const limit = await checkChatRateLimit(clientIp);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many questions too quickly. Please wait before trying again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSeconds),
            "Cache-Control": "no-store",
          },
        },
      );
    }
  } catch (error) {
    console.error("Chat rate limiter unavailable:", error);
    return NextResponse.json(
      { error: "Chat is temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  try {
    const rawBody = await readJsonBody(req);
    const { message, history } = validateChatBody(rawBody);

    // Words that usually mean "I'm continuing the last topic"
    const FOLLOW_UP =
      /\b(it|its|it's|that|this|those|these|they|them|their|there|same)\b|^(and|also|what about|how about)\b/i;

    const trimmed = message.trim();

    const isSmallTalk =
      /^(hi+|hello|hey|salam|assalam[\w-]*|who are you|what can you do)\b/i.test(
        trimmed,
      );

    const wordCount = trimmed.split(/\s+/).length;
    const looksLikeFollowUp =
      !isSmallTalk &&
      ((wordCount <= 6 && FOLLOW_UP.test(trimmed)) || wordCount <= 2);

    const lastUser = [...history]
      .reverse()
      .find((m) => m.role === "user");

    const searchText =
      looksLikeFollowUp && lastUser?.parts?.[0]?.text
        ? `${lastUser.parts[0].text} ${trimmed}`
        : trimmed;

    const hits = await retrieve(searchText);
    const prompt = buildRagPrompt(trimmed, hits);


    const chat = model.startChat({ history });
    const result = await chat.sendMessage(prompt);
    const rawReply = result.response.text().trim();
    const modelFlaggedNoAnswer = rawReply.startsWith(NO_ANSWER_MARKER);
    const reply = rawReply.replace(/^\[\[VU_NO_ANSWER\]\]\s*/i, "");
    const shouldHideSources =
      isSmallTalk ||
      modelFlaggedNoAnswer ||
      /i (?:don't|do not) know|i (?:couldn't|could not) find|can only help with vu/i.test(
        reply,
      );

    return NextResponse.json({
      reply,
      sources: shouldHideSources
        ? []
        : Array.from(new Set(hits.map((h) => h.chunk.source))).map(
            getSourceInfo,
          ),
    });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json(
        { error: "Request is too large. Please shorten your question or chat history." },
        { status: 413 },
      );
    }
    if (error instanceof InvalidRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Chat API error:", error);
    const text = error instanceof Error ? error.message : "";

    if (
      text.includes("429") ||
      text.includes("RESOURCE_EXHAUSTED") ||
      text.toLowerCase().includes("quota")
    ) {
      return NextResponse.json(
        {
          error:
            "The assistant is busy right now. Please wait a minute and try again.",
        },
        { status: 429 },
      );
    }
    if (
      text.includes("fetch failed") ||
      text.toLowerCase().includes("timeout")
    ) {
      return NextResponse.json(
        {
          error:
            "Could not reach the AI service. Please check your internet connection and try again.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      {
        error:
          "Something went wrong talking to the assistant. Please try again.",
      },
      { status: 500 },
    );
  }
}
