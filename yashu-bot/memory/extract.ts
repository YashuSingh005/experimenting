import { generateText } from "ai";
import { getAgentModel } from "../ai";
import type { MemoryFact } from "./long-term.ts";

const EXTRACTION_PROMPT = `Extract important facts from the conversation that should be remembered long-term.

Return JSON array of facts with:
- fact: the information to remember (one sentence, specific)
- importance: 0-10 (10 = critical, never forget; 7+ = important; 3-6 = nice to have; <3 = trivial)
- reason: why this matters

Focus on:
- User identity (name, role, preferences)
- Project details (goals, constraints, tech stack)
- Explicit requests ("remember X", "my name is Y")
- Decisions made
- Recurring patterns

Ignore:
- Greetings, filler, transient topics
- One-off questions without lasting relevance

Example output:
[
  {"fact": "User's name is Yashu", "importance": 9, "reason": "Explicitly stated identity"},
  {"fact": "Project uses TypeScript with Bun", "importance": 7, "reason": "Tech stack context"},
  {"fact": "User prefers minimal comments in code", "importance": 5, "reason": "Stated preference"}
]`;

export interface ExtractedFact {
  fact: string;
  importance: number;
  reason: string;
}

export async function extractFacts(
  conversation: Array<{ role: "user" | "assistant"; content: string }>,
  existingFacts: MemoryFact[]
): Promise<ExtractedFact[]> {
  const existingText = existingFacts
    .map((f) => `- ${f.fact} (importance: ${f.importance})`)
    .join("\n");

  const convoText = conversation
    .slice(-20)
    .map((t) => `${t.role}: ${t.content}`)
    .join("\n");

  const { text } = await generateText({
    model: getAgentModel(),
    system: EXTRACTION_PROMPT,
    prompt: `EXISTING FACTS (avoid duplicates):
${existingText || "  (none)"}

NEW CONVERSATION:
${convoText}

Extract NEW facts only. Return JSON array.`,
    temperature: 0.3,
  });

  try {
    const parsed = JSON.parse(text.trim());
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (f): f is ExtractedFact =>
          typeof f.fact === "string" &&
          typeof f.importance === "number" &&
          f.importance >= 0 &&
          f.importance <= 10
      );
    }
  } catch {
    // Failed to parse - return empty
  }

  return [];
}

export async function autoExtractAndStore(
  memory: { getAllFacts: () => MemoryFact[]; addFact: (fact: string, importance: number, source: "auto") => string },
  conversation: Array<{ role: "user" | "assistant"; content: string }>
): Promise<number> {
  const existing = memory.getAllFacts();
  const extracted = await extractFacts(conversation, existing);

  let added = 0;
  for (const f of extracted) {
    // Stronger deduplication: check similarity, not just exact match
    const exists = existing.some(
      (ef) => similarity(ef.fact.toLowerCase(), f.fact.toLowerCase()) > 0.8
    );
    if (!exists && f.importance >= 5) { // Raised threshold from 4 to 5
      memory.addFact(f.fact, f.importance, "auto");
      added++;
    }
  }

  return added;
}

function similarity(a: string, b: string): number {
  // Simple Jaccard similarity on words
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}

const EXPLICIT_PATTERNS = [
  /^remember (?:that )?(.+)$/i,
  /^please remember (?:that )?(.+)$/i,
  /^note (?:that )?(.+)$/i,
  /^my name is (.+)$/i,
  /^i am (.+)$/i,
  /^i work (?:as|at|on) (.+)$/i,
  /^my (.+) is (.+)$/i,
  /\bremember\b.{0,30}?(\S.{0,100})/i,
  /\bdon't forget\b.{0,30}?(\S.{0,100})/i,
  /\bdo not forget\b.{0,30}?(\S.{0,100})/i,
];

export function detectExplicitMemoryCommand(input: string): { fact: string; importance: number } | null {
  for (const pattern of EXPLICIT_PATTERNS) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return {
        fact: match[1].trim(),
        importance: 10,
      };
    }
  }
  return null;
}

export function detectForgetCommand(input: string): string | null {
  const patterns = [
    /^forget (?:that )?(.+)$/i,
    /^don't remember (.+)$/i,
    /^remove (?:the fact )?(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}