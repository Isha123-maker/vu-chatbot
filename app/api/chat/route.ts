import { model } from "@/lib/gemini";
import { retrieve, buildRagPrompt } from "@/lib/retrieval";
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

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
  try {
    const { message, history } = await req.json();

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Please type a question first." },
        { status: 400 },
      );
    }
    if (message.length > 1000) {
      return NextResponse.json(
        {
          error:
            "Your question is too long. Please keep it under 1000 characters.",
        },
        { status: 400 },
      );
    }
    
    const lastUser = [...(history || [])]
      .reverse()
      .find((m: { role: string }) => m.role === "user") as
      | { parts?: { text: string }[] }
      | undefined;

    const isShort = message.trim().split(/\s+/).length <= 6;
    const searchText =
      isShort && lastUser?.parts?.[0]?.text
        ? `${lastUser.parts[0].text} ${message.trim()}`
        : message.trim();

    const hits = await retrieve(searchText);
    const prompt = buildRagPrompt(message.trim(), hits);

    const chat = model.startChat({ history: history || [] });
    const result = await chat.sendMessage(prompt);

    const isSmallTalk =
      /^(hi+|hello|hey|salam|assalam[\w-]*|who are you|what can you do)\b/i.test(
        message.trim(),
      );

    return NextResponse.json({
      reply: result.response.text(),
      sources: isSmallTalk
        ? []
        : Array.from(new Set(hits.map((h) => h.chunk.source))).map(
            getSourceInfo,
          ),
    });

    return NextResponse.json({
      reply: result.response.text(),
      sources: Array.from(new Set(hits.map((h) => h.chunk.source))),
    });
  } catch (error) {
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
