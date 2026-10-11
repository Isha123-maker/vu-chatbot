import fs from "node:fs";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

type Chunk = { id: string; source: string; text: string; embedding: number[] };
const chunks: Chunk[] = JSON.parse(fs.readFileSync("vector-store/chunks.json", "utf-8"));

// How close two "arrows" point: 1 = same direction, 0 = unrelated
function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function search(question: string, topK = 3) {
  const res = await ai.models.embedContent({
    model: "gemini-embedding-001", // must be the SAME model used for the chunks
    contents: question,
    config: { taskType: "QUESTION_ANSWERING" },
  });
  const q = res.embeddings![0].values!;

  return chunks
    .map((c) => ({ chunk: c, score: cosine(q, c.embedding) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, topK);
}

function buildPrompt(question: string, top: { chunk: Chunk; score: number }[]): string {
  const context = top
    .map((r, i) => `[Source ${i + 1}: ${r.chunk.source}]\n${r.chunk.text}`)
    .join("\n\n");

  return `You are a helpful assistant for Virtual University of Pakistan (VU) students.
Answer the question using ONLY the context below.
If the answer is not in the context, say you don't know and suggest contacting VU.
Do not guess or add rules that are not written in the context.
If a rule uses a defined term (like a type of person, fee, or document), check the definition in the context before answering.
When you give fees, dates, or deadlines, add a short note that this comes from VU's published pages collected in October 2026, and the student should confirm on the official VU website. Do not apply a rule or figure to a specific program unless the context says so.

Context:
${context}

Question: ${question}`;
}

async function main() {
  const question = process.argv.slice(2).join(" ");
  if (!question) {
    console.log('Usage: npx tsx --env-file=.env.local scripts/ask.ts "your question"');
    return;
  }
  const top = await search(question);
  const prompt = buildPrompt(question, top);

  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  console.log("\n=== ANSWER ===\n");
  console.log(res.text);
  console.log("\n=== SOURCES USED ===");
  top.forEach((r) => console.log("-", r.chunk.source));
}

main();