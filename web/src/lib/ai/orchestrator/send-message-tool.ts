import { tool } from "ai";
import { z } from "zod";
import type { AgentBus } from "./bus";

export function createSendMessageTool(bus: AgentBus, currentAgentId: string) {
  return tool<{ recipient: string; message: string }, string>({
    description: "Send a message to another agent working on this task.",
    inputSchema: z.object({
      recipient: z.string().describe("Name of the recipient agent (e.g. 'data-modeler', 'api-builder')"),
      message: z.string().describe("The message content to send"),
    }),
    execute: async ({ recipient, message }) => {
      const comm = bus.send(currentAgentId, recipient, message);
      return `Message sent to ${recipient} at ${comm.timestamp}`;
    },
  });
}
