
import { isCancel, text } from "@clack/prompts";
import chalk from "chalk";
import { defaultAgentConfig } from "./types";
import { ActionTracker } from "./action-tracker";
import { ToolExecutor } from "./tool-executor";
import { createAgentTools } from "./agent-tools";
import { stepCountIs, streamText } from "ai";
import { getAgentModel } from "../../ai";
import { renderTerminalMarkdown } from "../../tui/terminal-md";
import { getMemoryManager, buildAgentContext, addUserMessage, addAssistantMessage, handleMemoryCommands, persistMemory } from "../../memory/manager.ts";

import { runApprovalFlow } from "./approvals";

export async function runAgentMode() {
  console.log(chalk.bold("\n🤖 Agent Mode\n"));
  console.log(chalk.dim("Type 'bye' to exit agent mode.\n"));

  const config = defaultAgentConfig();
  const tracker = new ActionTracker();
  const executor = new ToolExecutor(tracker, config);
  const tools = createAgentTools(executor);

  const memoryManager = await getMemoryManager(undefined, { 
    enableVectorStore: !!process.env.OPENAI_API_KEY 
  });

  while (true) {
    const goal = await text({
      message: "Agent>",
      placeholder: "What should I do next? (type 'bye' to exit)",
    });

    if (isCancel(goal)) {
      console.log(chalk.yellow("\nExiting Agent Mode...\n"));
      break;
    }

    const input = goal.trim();

    if (!input) continue;

    if (
      input.toLowerCase() === "bye" ||
      input.toLowerCase() === "exit" ||
      input.toLowerCase() === "quit"
    ) {
      console.log(chalk.yellow("\nLeaving Agent Mode...\n"));
      await persistMemory(memoryManager);
      break;
    }

    const memoryResult = await handleMemoryCommands(memoryManager, input);
    if (!memoryResult.shouldContinue) {
      if (memoryResult.response) {
        console.log(chalk.cyan(memoryResult.response));
      }
      await persistMemory(memoryManager);
      continue;
    }

    try {
      const systemPrompt = await buildAgentContext(memoryManager, input);

      let fullText = "";
      const { textStream } = await streamText({
        model: getAgentModel(),
        system: systemPrompt,
        tools,
        prompt: input,
        stopWhen: stepCountIs(40),
        onStepFinish: ({ toolCalls }) => {
          for (const tc of toolCalls) {
            const preview = JSON.stringify(tc.input).slice(0, 160);

            console.log(
              chalk.green("  ✓"),
              chalk.bold(String(tc.toolName)),
              chalk.dim(
                preview + (preview.length >= 160 ? "..." : "")
              ),
            );
          }
        },
      });

      for await (const chunk of textStream) {
        process.stdout.write(chunk);
        fullText += chunk;
      }
      console.log();

      // Streaming already printed the text; render markdown for formatting if needed
      // if (fullText.trim()) {
      //   console.log(renderTerminalMarkdown(fullText));
      // }

      await addUserMessage(memoryManager, input);
      await addAssistantMessage(memoryManager, fullText);

      // Only run approval flow if tools made changes
      const hasStagedChanges = tracker.hasStagedChanges?.() ?? false;
      if (!hasStagedChanges) {
        continue;
      }

      const ok = await runApprovalFlow(tracker);

      if (!ok) {
        executor.clearStaging();
        console.log(
          chalk.yellow("\nChanges discarded.\n")
        );
        continue;
      }

      const { errors } = executor.applyApprovedFromTracker();

      if (errors.length) {
        console.log(
          chalk.red(
            "\nSome operations could not be completed successfully:\n",
          ),
        );

        for (const error of errors) {
          console.log(chalk.red(`  • ${error}`));
        }
      } else {
        console.log(
          chalk.green(
            "\n✓ All approved changes have been applied successfully.\n",
          ),
        );
      }
    } catch (error) {
      console.error(
        chalk.red(
          "\n✗ Agent execution failed due to an unexpected error.\n",
        ),
      );

      if (error instanceof Error) {
        console.error(chalk.red(`Message: ${error.message}`));

        if (error.stack) {
          console.error(chalk.dim(error.stack));
        }
      } else {
        console.error(chalk.red(String(error)));
      }
    } finally {
      executor.clearStaging();
    }
  }
}