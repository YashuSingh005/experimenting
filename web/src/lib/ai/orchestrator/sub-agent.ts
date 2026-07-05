import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { SubtaskInfo, StreamCallbacks } from "./types";
import type { AgentBus } from "./bus";
import { createSendMessageTool } from "./send-message-tool";
import { createReadOnlyTools, createAdminTools } from "@/lib/ai/tools";

function createProvider() {
  return createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  });
}

export async function runSubAgent(
  subtask: SubtaskInfo,
  bus: AgentBus,
  userRole: "admin" | "user",
  subtaskNames: Map<string, string>,
  fullTask: string,
  callbacks: StreamCallbacks,
): Promise<string> {
  const provider = createProvider();
  const modelId = process.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini";
  const model = provider.chat(modelId);

  const context = bus.getContextFor(subtask.id, subtaskNames);
  const baseTools = userRole === "admin" ? createAdminTools() : createReadOnlyTools();
  const tools = {
    ...baseTools,
    send_message_to_agent: createSendMessageTool(bus, subtask.id),
  };

  const systemPrompt = `You are a specialized AI agent called "${subtask.name}".

Your goal: ${subtask.goal}

Overall task context: ${fullTask}

${context ? `\nContext from other agents:\n${context}` : ""}

Complete your assigned goal. Use your tools to research, read files, and communicate with other agents via send_message_to_agent. Output your findings and results clearly.`;

  let fullResult = "";

  const { textStream } = await streamText({
    model,
    system: systemPrompt,
    prompt: `Complete your assigned goal: ${subtask.goal}`,
    tools,
    onStepFinish: ({ toolCalls }) => {
      for (const tc of toolCalls) {
        callbacks.onToolCall?.(String(tc.toolName), tc.input);
      }
    },
  });

  try {
    for await (const chunk of textStream) {
      fullResult += chunk;
      callbacks.onText(chunk);
    }
  } catch (error) {
    callbacks.onError?.(error as Error);
    throw error;
  }

  bus.setDepResult(subtask.id, fullResult);
  return fullResult;
}
