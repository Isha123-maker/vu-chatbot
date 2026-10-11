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

async function search(question: string, topK = 5) {
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

async function main() {
  const question = process.argv.slice(2).join(" ");
  if (!question) {
    console.log('Usage: npx tsx --env-file=.env.local scripts/search.ts "your question"');
    return;
  }
  const top = await search(question);
  top.forEach((r, i) => {
    console.log(`\n#${i + 1}  score ${r.score.toFixed(3)}  (${r.chunk.source})`);
    console.log(r.chunk.text.slice(0, 1200));
  });
}

main();