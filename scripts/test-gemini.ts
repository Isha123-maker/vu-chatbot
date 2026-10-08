import { model } from "../lib/gemini";
import * as readline from "readline";

async function main() {
  const chat = model.startChat({
    history: [],
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("Chat started. Type 'exit' to quit.\n");

  const askLoop = () => {
    rl.question("You: ", async (userInput) => {
      if (userInput.toLowerCase() === "exit") {
        rl.close();
        return;
      }

      const result = await chat.sendMessage(userInput);
      const response = result.response.text();

      console.log("Gemini:", response, "\n");

      askLoop();
    });
  };

  askLoop();
}

main().catch((err) => {
  console.error("Something went wrong:", err);
});