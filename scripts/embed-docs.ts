import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({}); // reads GEMINI_API_KEY from the environment

const DATA_DIR = "data";
const OUT_DIR = "vector-store";
const OUT_FILE = path.join(OUT_DIR, "chunks.json");
const MAX_CHARS = 1000; // chunk size
const BATCH_SIZE = 20;  // chunks per API call

type Chunk = { id: string; source: string; text: string; embedding: number[] };

function findTxtFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findTxtFiles(full));
    else if (entry.name.endsWith(".txt")) out.push(full);
  }
  return out;
}

// Group lines into chunks up to MAX_CHARS; each new chunk starts with the last line of the previous one (overlap)
function chunkText(text: string): string[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current: string[] = [];
  let size = 0;

  for (const line of lines) {
    if (size + line.length > MAX_CHARS && current.length > 0) {
      chunks.push(current.join("\n"));
      const last = current[current.length - 1];
      current = [last];
      size = last.length;
    }
    current.push(line);
    size += line.length + 1;
  }
  if (current.length > 0) chunks.push(current.join("\n"));
  return chunks;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function embedBatch(texts: string[]): Promise<number[][]> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: texts,
        config: { taskType: "RETRIEVAL_DOCUMENT" },
      });
      return res.embeddings!.map((e) => e.values!);
    } catch (err) {
      console.log(`  Attempt ${attempt} failed:`, (err as Error).message.slice(0, 150));
      if (attempt === 5) throw err;
      console.log("  Waiting 65 seconds for the quota to reset...");
      await sleep(65000);
    }
  }
  return [];
}

async function main() {
  const files = findTxtFiles(DATA_DIR);
  console.log(`Found ${files.length} files`);

  const pending: { source: string; text: string }[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(file, "utf-8");
    const title = path.basename(file, ".txt");
    for (const piece of chunkText(raw)) {
      // the title goes in front so each chunk knows which document it came from
      pending.push({ source: file, text: `${title}\n${piece}` });
    }
  }
  console.log(`Created ${pending.length} chunks`);

  const results: Chunk[] = [];
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    console.log(`Embedding chunks ${i + 1} to ${i + batch.length}...`);
    const vectors = await embedBatch(batch.map((b) => b.text));
    batch.forEach((b, j) =>
      results.push({ id: `chunk-${i + j}`, source: b.source, text: b.text, embedding: vectors[j] })
    );
    await sleep(500);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(results));
  console.log(`Saved ${results.length} chunks to ${OUT_FILE}`);
  console.log(`Embedding length: ${results[0].embedding.length} (expect 3072)`);
}

main();