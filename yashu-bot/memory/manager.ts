import {
  VectorStore,
  LongTermMemory,
  WorkingMemory,
  createVectorStore,
  createLongTermMemory,
  createWorkingMemory,
  processUserInput,
  type MemorySystem,
} from "./index.ts";

export interface MemoryManager {
  system: MemorySystem;
  initialized: boolean;
}

let globalManager: MemoryManager | null = null;

export async function getMemoryManager(password?: string, options?: { enableVectorStore?: boolean }): Promise<MemoryManager> {
  if (globalManager?.initialized) {
    return globalManager;
  }

  const longTerm = await createLongTermMemory(password);
  let vectorStore: VectorStore | null = null;

  if (options?.enableVectorStore !== false) {
    try {
      vectorStore = await createVectorStore(password);
    } catch (error) {
      console.warn("Vector store initialization failed, continuing without knowledge base:", error);
    }
  }

  const working = await createWorkingMemory(longTerm, vectorStore);

  globalManager = {
    system: { vectorStore, longTerm, working },
    initialized: true,
  };

  return globalManager;
}

export async function addUserMessage(manager: MemoryManager, content: string): Promise<void> {
  manager.system.working.addTurn("user", content);
}

export async function addAssistantMessage(manager: MemoryManager, content: string): Promise<void> {
  manager.system.working.addTurn("assistant", content);
}

export async function buildAgentContext(manager: MemoryManager, userQuery: string): Promise<string> {
  const context = await manager.system.working.buildContext(userQuery);
  return context.systemPrompt;
}

export async function handleMemoryCommands(
  manager: MemoryManager,
  userInput: string
): Promise<{ response?: string; shouldContinue: boolean }> {
  const result = await processUserInput(manager.system, userInput);

  const messages: string[] = [];

  if (result.explicitFact) {
    messages.push(`✓ Remembered: "${result.explicitFact.fact}"`);
  }

  if (result.forgetFact) {
    messages.push(`✗ Forgotten: "${result.forgetFact}"`);
  }

  // Auto-extraction is silent - don't notify user
  // if (result.extractedCount > 0) {
  //   messages.push(`🔍 Auto-extracted ${result.extractedCount} new fact(s)`);
  // }

  if (messages.length > 0) {
    return { response: messages.join("\n"), shouldContinue: false };
  }

  return { shouldContinue: true };
}

export async function injectKnowledge(
  manager: MemoryManager,
  source: string,
  text: string
): Promise<number> {
  return manager.system.working.injectKnowledge(source, text);
}

export async function getMemoryStats(manager: MemoryManager): Promise<{
  facts: ReturnType<LongTermMemory["getStats"]>;
  knowledge: Awaited<ReturnType<VectorStore["getStats"]>> | { count: 0; sources: [] };
}> {
  return {
    facts: manager.system.longTerm.getStats(),
    knowledge: manager.system.vectorStore 
      ? await manager.system.vectorStore.getStats() 
      : { count: 0, sources: [] },
  };
}

export async function persistMemory(manager: MemoryManager): Promise<void> {
  await manager.system.longTerm.persist();
}

export async function cleanupMemory(manager: MemoryManager): Promise<number> {
  return manager.system.longTerm.cleanup();
}