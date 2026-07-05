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

export interface AgentStatus {
  agentId: string;
  agentName: string;
  status: "thinking" | "working" | "done" | "error";
  message: string;
}

export interface AgentCommMessage {
  from: string;
  to: string;
  message: string;
  timestamp: string;
}

export interface SubtaskInfo {
  id: string;
  name: string;
  goal: string;
  dependsOn: string[];
}

export interface ChatStreamChunk {
  type: "text" | "error" | "done" | "tool_call" | "agent_status" | "agent_comms" | "decomposition" | "agent_result";
  content?: string;
  toolName?: string;
  toolInput?: unknown;
  agentId?: string;
  agentName?: string;
  status?: string;
  message?: string;
  from?: string;
  to?: string;
  timestamp?: string;
  task?: string;
  subtasks?: SubtaskInfo[];
  result?: string;
}
