import { LongTermMemory } from "./long-term.ts";
import { VectorStore } from "./vector-store.ts";
import { WorkingMemory } from "./working.ts";
import { extractFacts, detectExplicitMemoryCommand, detectForgetCommand, type ExtractedFact } from "./extract.ts";

export interface MemorySystem {
  vectorStore: VectorStore | null;
  longTerm: LongTermMemory;
  working: WorkingMemory;
}

export interface ProcessResult {
  explicitFact?: { id: string; fact: string; importance: number };
  forgetFact?: string;
  extractedCount: number;
}

export async function processUserInput(
  system: MemorySystem,
  userInput: string
): Promise<ProcessResult> {
  // Check for explicit "remember" command
  const explicit = detectExplicitMemoryCommand(userInput);
  if (explicit) {
    const id = system.longTerm.addFact(explicit.fact, explicit.importance, "explicit");
    system.working.addTurn("user", userInput);
    return { explicitFact: { id, ...explicit }, extractedCount: 0 };
  }

  // Check for "forget" command
  const forgetQuery = detectForgetCommand(userInput);
  if (forgetQuery) {
    const facts = system.longTerm.searchFacts(forgetQuery);
    let forgotten = "";
    const firstFact = facts[0];
    if (firstFact) {
      system.longTerm.deleteFact(firstFact.id);
      forgotten = firstFact.fact;
    }
    system.working.addTurn("user", userInput);
    return { forgetFact: forgotten, extractedCount: 0 };
  }

  // Add to working memory
  system.working.addTurn("user", userInput);

  // Auto-extract facts periodically (every 5 turns) to avoid spam
  const recentTurns = system.working.getRecentTurns();
  const userTurns = recentTurns.filter(t => t.role === "user").length;
  let extractedCount = 0;
  
  if (userTurns % 5 === 0 && userTurns > 0) {
    extractedCount = await autoExtractAndStore(system.longTerm, recentTurns);
  }

  return { extractedCount };
}

async function autoExtractAndStore(
  longTerm: LongTermMemory,
  conversation: Array<{ role: "user" | "assistant"; content: string }>
): Promise<number> {
  const existing = longTerm.getAllFacts();
  const extracted = await extractFacts(conversation, existing);

  let added = 0;
  for (const f of extracted) {
    const exists = existing.some(
      (ef) => ef.fact.toLowerCase() === f.fact.toLowerCase()
    );
    if (!exists && f.importance >= 4) {
      longTerm.addFact(f.fact, f.importance, "auto");
      added++;
    }
  }

  return added;
}

export { encrypt, decrypt, getMemoryPassword } from "./crypto.ts";
export { LongTermMemory, createLongTermMemory, type MemoryFact } from "./long-term.ts";
export { VectorStore, createVectorStore, type KnowledgeChunk } from "./vector-store.ts";
export { WorkingMemory, createWorkingMemory, type WorkingMemoryContext } from "./working.ts";
export { extractFacts, autoExtractAndStore, detectExplicitMemoryCommand, detectForgetCommand, type ExtractedFact } from "./extract.ts";
export { getMemoryManager, addUserMessage, addAssistantMessage, buildAgentContext, handleMemoryCommands, injectKnowledge, getMemoryStats, persistMemory, cleanupMemory } from "./manager.ts";