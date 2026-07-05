import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { settingsService } from "@/services/settings-service";
import type { AISettings } from "@/types";
import { createReadOnlyTools, createAdminTools } from "@/lib/ai/tools";
import { decomposeTask } from "./manager-agent";
import { runSubAgent } from "./sub-agent";
import { AgentBus } from "./bus";
import type { StreamCallbacks, SubtaskInfo } from "./types";

const USE_MULTI_AGENT = true;

function createProvider() {
  return createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  });
}

function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 11);
}

async function runSingleAgent(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  userRole: "admin" | "user",
  callbacks: StreamCallbacks,
): Promise<void> {
  const provider = createProvider();
  const settings: AISettings = await settingsService.getSettings();
  const tools = userRole === "admin" ? createAdminTools() : createReadOnlyTools();
  const systemPrompt = settings.system_prompt || "You are a helpful AI assistant. Respond in markdown format.";
  const model = provider.chat(settings.model_name, {
    temperature: settings.temperature,
    topP: settings.top_p,
    maxTokens: settings.max_tokens,
  });

  const { textStream } = await streamText({
    model,
    system: systemPrompt,
    messages,
    tools: Object.keys(tools).length > 0 ? tools : undefined,
    onStepFinish: ({ toolCalls }) => {
      for (const tc of toolCalls) {
        callbacks.onToolCall?.(String(tc.toolName), tc.input);
      }
    },
  });

  try {
    for await (const chunk of textStream) {
      callbacks.onText(chunk);
    }
    callbacks.onFinish?.();
  } catch (error) {
    callbacks.onError?.(error as Error);
  }
}

function getLatestUserMessage(
  messages: Array<{ role: string; content: string }>,
): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return messages[messages.length - 1]?.content ?? "";
}

export async function runOrchestrator(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  userRole: "admin" | "user",
  callbacks: StreamCallbacks,
): Promise<void> {
  if (!USE_MULTI_AGENT) {
    return runSingleAgent(messages, userRole, callbacks);
  }

  const provider = createProvider();
  const settings: AISettings = await settingsService.getSettings();
  const userTask = getLatestUserMessage(messages);

  try {
    callbacks.onAgentStatus?.({
      agentId: "manager",
      agentName: "Manager",
      status: "thinking",
      message: "Analyzing task...",
    });

    const subtasks: SubtaskInfo[] = await decomposeTask(userTask);

    callbacks.onDecomposition?.(userTask, subtasks);
    callbacks.onAgentStatus?.({
      agentId: "manager",
      agentName: "Manager",
      status: "done",
      message: `Decomposed into ${subtasks.length} subtasks`,
    });

    if (subtasks.length === 0) {
      return runSingleAgent(messages, userRole, callbacks);
    }

    const bus = new AgentBus();
    const subtaskNames = new Map(subtasks.map((s) => [s.id, s.name]));
    const completed = new Set<string>();
    const results: string[] = [];

    for (const subtask of subtasks) {
      const depsMet = subtask.dependsOn.every((d) => completed.has(d));
      if (!depsMet) {
        callbacks.onAgentStatus?.({
          agentId: subtask.id,
          agentName: subtask.name,
          status: "thinking",
          message: `Waiting for: ${subtask.dependsOn.map((d) => subtaskNames.get(d)).filter(Boolean).join(", ")}`,
        });
        continue;
      }

      callbacks.onAgentStatus?.({
        agentId: subtask.id,
        agentName: subtask.name,
        status: "working",
        message: `Starting work: ${subtask.goal}`,
      });

      try {
        const result = await runSubAgent(subtask, bus, userRole, subtaskNames, userTask, callbacks);
        results.push(result);
        completed.add(subtask.id);

        callbacks.onAgentStatus?.({
          agentId: subtask.id,
          agentName: subtask.name,
          status: "done",
          message: "Completed",
        });
        callbacks.onAgentResult?.(subtask.id, result.slice(0, 300));
      } catch (error) {
        callbacks.onAgentStatus?.({
          agentId: subtask.id,
          agentName: subtask.name,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const commsMessages = bus.getAllMessages();
    for (const comm of commsMessages) {
      callbacks.onAgentComms?.(comm);
    }

    callbacks.onAgentStatus?.({
      agentId: "manager",
      agentName: "Manager",
      status: "thinking",
      message: "Synthesizing results...",
    });

    const model = provider.chat(settings.model_name, {
      temperature: settings.temperature,
      topP: settings.top_p,
      maxTokens: settings.max_tokens,
    });

    const synthesisPrompt = `The user asked: "${userTask}"

Here are the results from specialized agents:

${results.map((r, i) => `--- ${subtasks[i]?.name ?? "Agent"} ---\n${r}`).join("\n\n")}

Synthesize a cohesive final response that addresses the user's original request. Combine the information from all agents into a clear, well-structured answer.`;

    const { textStream } = await streamText({
      model,
      system: settings.system_prompt || "You are a helpful AI assistant. Respond in markdown format.",
      prompt: synthesisPrompt,
    });

    try {
      for await (const chunk of textStream) {
        callbacks.onText(chunk);
      }
    } catch (error) {
      callbacks.onError?.(error as Error);
      return;
    }

    callbacks.onAgentStatus?.({
      agentId: "manager",
      agentName: "Manager",
      status: "done",
      message: "All tasks completed",
    });
    callbacks.onFinish?.();
  } catch (error) {
    callbacks.onError?.(error as Error);
  }
}
