export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  isLoading?: boolean;
}

export interface ChatRequest {
  message: string;
  chatId: string;
}

export interface ChatStreamChunk {
  type: "text" | "error" | "done" | "tool_call";
  content?: string;
  toolName?: string;
  toolInput?: unknown;
}
