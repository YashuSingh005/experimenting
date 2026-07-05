import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { SubtaskInfo } from "./types";

const DECOMPOSITION_PROMPT = `You are a task decomposition specialist. Break down the user's request into clear, sequential subtasks.

For each subtask, provide:
- id: a short kebab-case identifier (e.g. "design-models")
- name: a human-readable name
- goal: a clear one-sentence description of what this subtask should accomplish
- dependsOn: array of subtask IDs that must be completed before this one (can be empty)

Rules:
- Keep subtasks focused and independent
- Maximum 5 subtasks
- Output ONLY valid JSON, no other text
- Format: { "subtasks": [ { "id": "...", "name": "...", "goal": "...", "dependsOn": [...] } ] }`;

function createProvider() {
  return createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  });
}

export async function decomposeTask(task: string): Promise<SubtaskInfo[]> {
  const provider = createProvider();
  const model = provider.chat(process.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini");

  const result = await generateText({
    model,
    system: DECOMPOSITION_PROMPT,
    prompt: task,
    temperature: 0.3,
  });

  try {
    const parsed = JSON.parse(result.text);
    if (parsed.subtasks && Array.isArray(parsed.subtasks)) {
      return parsed.subtasks as SubtaskInfo[];
    }
    return parseLegacyFormat(result.text);
  } catch {
    return parseLegacyFormat(result.text);
  }
}

function parseLegacyFormat(text: string): SubtaskInfo[] {
  const lines = text.split("\n").filter((l) => l.trim());
  const subtasks: SubtaskInfo[] = [];
  let current: Partial<SubtaskInfo> = {};
  for (const line of lines) {
    if (line.match(/^\d+[\.\)]/)) {
      if (current.id && current.name) {
        subtasks.push(current as SubtaskInfo);
      }
      current = {
        id: line.replace(/^\d+[\.\)]\s*/, "").toLowerCase().replace(/\s+/g, "-"),
        name: line.replace(/^\d+[\.\)]\s*/, ""),
        goal: line.replace(/^\d+[\.\)]\s*/, ""),
        dependsOn: [],
      };
    }
  }
  if (current.id && current.name) {
    subtasks.push(current as SubtaskInfo);
  }
  return subtasks;
}
