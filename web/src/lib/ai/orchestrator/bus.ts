import type { AgentCommMessage } from "./types";

export class AgentBus {
  private messages: AgentCommMessage[] = [];
  private depsResults: Map<string, string> = new Map();

  send(from: string, to: string, message: string): AgentCommMessage {
    const msg: AgentCommMessage = {
      from,
      to,
      message,
      timestamp: new Date().toISOString(),
    };
    this.messages.push(msg);
    return msg;
  }

  getMessagesFor(agentId: string): AgentCommMessage[] {
    return this.messages.filter((m) => m.to === agentId);
  }

  getAllMessages(): AgentCommMessage[] {
    return [...this.messages];
  }

  setDepResult(agentId: string, result: string) {
    this.depsResults.set(agentId, result);
  }

  getDepResult(agentId: string): string | undefined {
    return this.depsResults.get(agentId);
  }

  getContextFor(agentId: string, subtaskNames: Map<string, string>): string {
    const incoming = this.getMessagesFor(agentId);
    const parts: string[] = [];
    if (incoming.length > 0) {
      parts.push("Messages from other agents:");
      for (const msg of incoming) {
        parts.push(`  [${msg.from} → you]: ${msg.message}`);
      }
    }
    this.depsResults.forEach((result, depId) => {
      const name = subtaskNames.get(depId) ?? depId;
      parts.push(`\nResult from "${name}":\n${result.slice(0, 2000)}`);
    });
    return parts.join("\n");
  }
}
