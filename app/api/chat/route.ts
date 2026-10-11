import { model } from "@/lib/gemini";
import { retrieve, buildRagPrompt } from "@/lib/retrieval";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Please type a question first." }, { status: 400 });
    }
    if (message.length > 1000) {
      return NextResponse.json(
        { error: "Your question is too long. Please keep it under 1000 characters." },
        { status: 400 }
      );
    }

    const hits = await retrieve(message.trim());
    const prompt = buildRagPrompt(message.trim(), hits);

    const chat = model.startChat({ history: history || [] });
    const result = await chat.sendMessage(prompt);

    return NextResponse.json({
      reply: result.response.text(),
      sources: Array.from(new Set(hits.map((h) => h.chunk.source))),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const text = error instanceof Error ? error.message : "";

    if (text.includes("429") || text.includes("RESOURCE_EXHAUSTED") || text.toLowerCase().includes("quota")) {
      return NextResponse.json(
        { error: "The assistant is busy right now. Please wait a minute and try again." },
        { status: 429 }
      );
    }
    if (text.includes("fetch failed") || text.toLowerCase().includes("timeout")) {
      return NextResponse.json(
        { error: "Could not reach the AI service. Please check your internet connection and try again." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong talking to the assistant. Please try again." },
      { status: 500 }
    );
  }
}