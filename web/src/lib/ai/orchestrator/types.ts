export interface SubtaskInfo {
  id: string;
  name: string;
  goal: string;
  dependsOn: string[];
}

export interface AgentCommMessage {
  from: string;
  to: string;
  message: string;
  timestamp: string;
}

export interface AgentStatus {
  agentId: string;
  agentName: string;
  status: "thinking" | "working" | "done" | "error";
  message: string;
}

export interface StreamCallbacks {
  onText: (chunk: string) => void;
  onAgentStatus?: (status: AgentStatus) => void;
  onAgentComms?: (comms: AgentCommMessage) => void;
  onDecomposition?: (task: string, subtasks: SubtaskInfo[]) => void;
  onAgentResult?: (agentId: string, result: string) => void;
  onFinish?: () => void;
  onError?: (error: Error) => void;
  onToolCall?: (toolName: string, input: unknown) => void;
}
