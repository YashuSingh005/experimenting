import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

function createProvider() {
  return createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  });
}

export interface StreamCallbacks {
  onText: (chunk: string) => void;
  onFinish?: () => void;
  onError?: (error: Error) => void;
}

const SYSTEM_PROMPT =
  process.env.YASHU_SYSTEM_PROMPT ||
  "You are Yashu, a helpful AI engineering assistant. You respond in clean markdown. Be concise, practical, and direct. You help with coding, debugging, learning, and engineering work.";

export async function streamAIResponse(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  callbacks: StreamCallbacks,
): Promise<void> {
  const provider = createProvider();
  const modelName = process.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini";

  const model = provider.chat(modelName);

  const { textStream } = await streamText({
    model,
    system: SYSTEM_PROMPT,
    messages,
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: 4096,
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