import { getMemoryManager, handleMemoryCommands, buildAgentContext, addUserMessage, addAssistantMessage, persistMemory } from "./memory/manager.ts";
import { getAgentModel } from "./ai/index.ts";
import { streamText, stepCountIs } from "ai";

const manager = await getMemoryManager();
console.log("Yashu Bot - Streaming with Memory");
console.log("Type 'bye' to exit, 'remember X' to store facts\n");

async function main() {
  while (true) {
    const input = await prompt("You: ");
    if (!input) continue;
    
    if (input.toLowerCase() === "bye") {
      await persistMemory(manager);
      console.log("Bye! Memory saved.");
      break;
    }

    // Handle remember/forget
    const memResult = await handleMemoryCommands(manager, input);
    if (!memResult.shouldContinue) {
      if (memResult.response) console.log("Bot:", memResult.response);
      await persistMemory(manager);
      continue;
    }

    // Build context with memory
    const systemPrompt = await buildAgentContext(manager, input);
    
    // Stream response
    const { textStream } = await streamText({
      model: getAgentModel(),
      system: systemPrompt,
      prompt: input,
      stopWhen: stepCountIs(10),
    });

    process.stdout.write("Bot: ");
    let fullText = "";
    for await (const chunk of textStream) {
      process.stdout.write(chunk);
      fullText += chunk;
    }
    console.log();

    // Save to working memory
    await addUserMessage(manager, input);
    await addAssistantMessage(manager, fullText);
  }
}

function prompt(label: string): Promise<string> {
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => readline.question(label, (ans: string) => {
    readline.close();
    resolve(ans.trim());
  }));
}

await main();