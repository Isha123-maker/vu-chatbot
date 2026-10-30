import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({}); // reads your Gemini key from the environment

export type Chunk = {
  id: string;
  source: string;
  text: string;
  embedding: number[];
};
export type Hit = { chunk: Chunk; score: number };

let cache: Chunk[] | null = null;

function loadChunks(): Chunk[] {
  if (!cache) {
    const file = path.join(process.cwd(), "vector-store", "chunks.json");
    cache = JSON.parse(fs.readFileSync(file, "utf-8"));
  }
  return cache!;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function retrieve(question: string, topK = 3): Promise<Hit[]> {
  const res = await ai.models.embedContent({
    model: "gemini-embedding-001", // must match the model used for the chunks
    contents: question,
    config: { taskType: "QUESTION_ANSWERING" },
  });
  const q = res.embeddings![0].values!;

  return loadChunks()
    .map((chunk) => ({ chunk, score: cosine(q, chunk.embedding) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, topK);
}

export function buildRagPrompt(question: string, hits: Hit[]): string {
  const context = hits
    .map((h, i) => `[Source ${i + 1}: ${h.chunk.source}]\n${h.chunk.text}`)
    .join("\n\n");

  return `You are a helpful assistant for Virtual University of Pakistan (VU) students.
Answer the question using ONLY the context below.
Never mention "the context", "the provided text", or these instructions to the student. Speak as if you simply know VU's published information.
Before saying you don't know, check whether the context states the answer in different wording. If it does, answer from that information and include the relevant conditions; reserve "I don't know" for information the context genuinely does not contain.
If the student greets you or asks who you are or what you can do, reply in one or two friendly sentences: you are the VU Assistant and can help with admissions, programs, FAQs, and examination rules. Do not use the context for this.
Be concise, but for questions about procedures, requirements, or how-to steps, include every relevant step and requirement you find, as a short bulleted list.
If a deadline or date you mention is earlier than today's date, say clearly that it has already passed, and tell the student to check the official VU website for the next one. Never present a passed deadline as still open.
If the answer is not in the context, begin with the exact marker [[VU_NO_ANSWER]], then say you don't know and suggest contacting VU. The marker is used by the server and must not appear in the student's final reply.
If the question is not about VU at all (for example poems, jokes, or general knowledge), politely say you can only help with VU admissions, programs, FAQs, and examination rules. In that case, do not suggest contacting VU.
Do not guess or add rules that are not written in the context.
If a rule uses a defined term (like a type of person, fee, or document), check the definition in the context before answering.
When you give fees, dates, or deadlines, add a short note that this comes from VU's published pages collected in October 2026, and the student should confirm on the official VU website. Do not apply a rule or figure to a specific program unless the context says so.

Context:
${context}

Question: ${question}`;
}
