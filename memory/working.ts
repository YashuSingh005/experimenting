import type { MemoryFact } from "./long-term.ts";
import type { KnowledgeChunk } from "./vector-store.ts";
import { LongTermMemory } from "./long-term.ts";
import { VectorStore } from "./vector-store.ts";

export interface WorkingMemoryContext {
  systemPrompt: string;
  recentTurns: Array<{ role: "user" | "assistant"; content: string }>;
  explicitFacts: MemoryFact[];
  relevantFacts: MemoryFact[];
  relevantKnowledge: KnowledgeChunk[];
}

export class WorkingMemory {
  private longTerm: LongTermMemory;
  private vectorStore: VectorStore | null;
  private recentTurns: Array<{ role: "user" | "assistant"; content: string }> = [];
  private maxRecentTurns = 15;
  private maxRelevantFacts = 8;
  private maxRelevantKnowledge = 4;

  constructor(longTerm: LongTermMemory, vectorStore: VectorStore | null = null) {
    this.longTerm = longTerm;
    this.vectorStore = vectorStore;
  }

  addTurn(role: "user" | "assistant", content: string): void {
    this.recentTurns.push({ role, content });
    if (this.recentTurns.length > this.maxRecentTurns * 2) {
      this.recentTurns = this.recentTurns.slice(-this.maxRecentTurns * 2);
    }
  }

  clearTurns(): void {
    this.recentTurns = [];
  }

  async buildContext(userQuery: string): Promise<WorkingMemoryContext> {
    const explicitFacts = this.longTerm.getExplicitFacts();
    const relevantFacts = this.longTerm.searchFacts(userQuery, this.maxRelevantFacts);
    
    let relevantKnowledge: KnowledgeChunk[] = [];
    if (this.vectorStore) {
      try {
        relevantKnowledge = await this.vectorStore.searchHybrid(userQuery, this.maxRelevantKnowledge);
      } catch (error) {
        console.warn("Vector store search failed, continuing without knowledge:", error);
      }
    }

    const factLines = [...explicitFacts, ...relevantFacts]
      .map((f) => `- ${f.fact} (importance: ${f.importance}/10)`)
      .join("\n");

    const knowledgeLines = relevantKnowledge
      .map((k) => `- [${k.source}] ${k.text.slice(0, 300)}`)
      .join("\n");

    const recentTurnsText = this.recentTurns
      .slice(-this.maxRecentTurns)
      .map((t) => `${t.role}: ${t.content}`)
      .join("\n");

    const systemPrompt = `You are a helpful AI assistant with persistent memory.

IMPORTANT FACTS (explicitly remembered + relevant):
${factLines || "  (none)"}

RELEVANT KNOWLEDGE BASE:
${knowledgeLines || "  (none)"}

RECENT CONVERSATION:
${recentTurnsText || "  (none)"}

---

Instructions:
- Use the facts above to personalize responses
- If user says "remember X", treat it as explicit memory (high importance)
- If user says "forget X", remove that fact
- Be natural - don't explicitly mention the memory system unless asked`;

    return {
      systemPrompt,
      recentTurns: this.recentTurns.slice(-this.maxRecentTurns),
      explicitFacts,
      relevantFacts,
      relevantKnowledge,
    };
  }

  async injectKnowledge(source: string, text: string, chunkSize = 1000, overlap = 200): Promise<number> {
    if (!this.vectorStore) {
      throw new Error("Vector store not available. Cannot inject knowledge.");
    }
    const chunks: Array<{ id: string; text: string; source: string; metadata: Record<string, unknown> }> = [];

    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      const chunkText = text.slice(i, i + chunkSize);
      if (chunkText.trim().length > 50) {
        chunks.push({
          id: crypto.randomUUID(),
          text: chunkText,
          source,
          metadata: { chunkIndex: chunks.length },
        });
      }
    }

    if (chunks.length > 0) {
      await this.vectorStore.addChunks(chunks);
    }

    return chunks.length;
  }

  setMaxRecentTurns(n: number): void {
    this.maxRecentTurns = n;
  }

  getRecentTurns(): Array<{ role: "user" | "assistant"; content: string }> {
    return this.recentTurns;
  }
}

export async function createWorkingMemory(
  longTerm: LongTermMemory,
  vectorStore: VectorStore | null = null
): Promise<WorkingMemory> {
  return new WorkingMemory(longTerm, vectorStore);
}