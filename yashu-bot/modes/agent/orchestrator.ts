import { isCancel, text } from "@clack/prompts";
import chalk from "chalk";
import { stepCountIs, streamText } from "ai";
import { getAgentModel } from "../../ai";
import { getMemoryManager, buildAgentContext, addUserMessage, addAssistantMessage, handleMemoryCommands, persistMemory } from "../../memory/manager.ts";

export async function runAgentMode() {
  console.log(chalk.bold("\n🤖 Yashu Bot - Streaming Chat with Memory\n"));
  console.log(chalk.dim("Commands: 'remember X', 'forget Y', 'bye'\n"));

  const memoryManager = await getMemoryManager(undefined, { enableVectorStore: false });

  while (true) {
    const goal = await text({
      message: "You>",
      placeholder: "Type 'bye' to exit",
    });

    if (isCancel(goal)) break;

    const input = goal.trim();
    if (!input) continue;

    if (input.toLowerCase() === "bye" || input.toLowerCase() === "exit") {
      await persistMemory(memoryManager);
      console.log(chalk.yellow("\nBye!\n"));
      break;
    }

    const memoryResult = await handleMemoryCommands(memoryManager, input);
    if (!memoryResult.shouldContinue) {
      if (memoryResult.response) console.log(chalk.cyan(memoryResult.response));
      await persistMemory(memoryManager);
      continue;
    }

    try {
      const systemPrompt = await buildAgentContext(memoryManager, input);

      const { textStream } = await streamText({
        model: getAgentModel(),
        system: systemPrompt,
        prompt: input,
        stopWhen: stepCountIs(10),
      });

      let fullText = "";
      for await (const chunk of textStream) {
        process.stdout.write(chunk);
        fullText += chunk;
      }
      console.log();

      await addUserMessage(memoryManager, input);
      await addAssistantMessage(memoryManager, fullText);
      await persistMemory(memoryManager);

    } catch (error) {
      console.error(chalk.red("Error:"), error instanceof Error ? error.message : String(error));
    }
  }
}