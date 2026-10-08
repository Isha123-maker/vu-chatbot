import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY not found — check your .env.local file");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: `You are a helpful assistant for students at Virtual University of Pakistan (VU).
Keep answers concise and practical — students are often checking things quickly between classes.
If a question is about VU-specific policies, course registration, or deadlines, remind the user you don't have live access to VU's official records yet and they should confirm on VULMS.
For general knowledge or study-help questions, answer normally and helpfully.
Keep a friendly, respectful tone — this is for university students in Pakistan.`,
});