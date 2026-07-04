import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { settingsService } from "@/services/settings-service";
import type { AISettings } from "@/types";
import { createReadOnlyTools, createAdminTools } from "./tools";

function createProvider() {
  return createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  });
}

function getModel(provider: ReturnType<typeof createProvider>, modelName: string, settings: AISettings) {
  return provider.chat(modelName, {
    temperature: settings.temperature,
    topP: settings.top_p,
    maxTokens: settings.max_tokens,
  });
}

export interface StreamCallbacks {
  onText: (chunk: string) => void;
  onToolCall?: (toolName: string, input: unknown) => void;
  onFinish?: () => void;
  onError?: (error: Error) => void;
}

export async function streamAIResponse(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  userRole: "admin" | "user",
  callbacks: StreamCallbacks,
): Promise<void> {
  const provider = createProvider();
  const settings: AISettings = await settingsService.getSettings();

  const tools =
    userRole === "admin" ? createAdminTools() : createReadOnlyTools();

  const systemPrompt =
    settings.system_prompt ||
    "You are a helpful AI assistant. Respond in markdown format.";

  const model = getModel(provider, settings.model_name, settings);

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
