import { model } from "@/lib/gemini";
import { retrieve, buildRagPrompt } from "@/lib/retrieval";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    // 1. find the best chunks for this question
    const hits = await retrieve(message);

    // 2. wrap the question and the chunks in our strict prompt
    const prompt = buildRagPrompt(message, hits);

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(prompt);
    const responseText = result.response.text();

    return NextResponse.json({
      reply: responseText,
      sources: Array.from(new Set(hits.map((h) => h.chunk.source))),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Something went wrong talking to the assistant." },
      { status: 500 }
    );
  }
}