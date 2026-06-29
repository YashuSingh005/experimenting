import { getMemoryPassword, encrypt, decrypt } from "./crypto.ts";
import * as fs from "fs/promises";
import * as path from "path";

const MEMORY_FILE = ".memory/long-term.json";

export interface MemoryFact {
  id: string;
  fact: string;
  importance: number;
  source: "explicit" | "auto";
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  ttl?: number;
}

export class LongTermMemory {
  private facts: Map<string, MemoryFact> = new Map();
  private password: string;
  private dirty = false;

  constructor(password?: string) {
    this.password = password || "";
  }

  async init(): Promise<void> {
    if (!this.password) {
      this.password = await getMemoryPassword();
    }

    await fs.mkdir(path.dirname(MEMORY_FILE), { recursive: true });

    try {
      const encrypted = await fs.readFile(MEMORY_FILE, "utf8");
      const json = decrypt(encrypted, this.password);
      const data = JSON.parse(json);

      for (const fact of data.facts || []) {
        this.facts.set(fact.id, fact);
      }
    } catch {
      // File doesn't exist or corrupt - start fresh
    }
  }

  private save(): void {
    this.dirty = true;
  }

  async persist(): Promise<void> {
    if (!this.dirty) return;

    const data = {
      version: 1,
      facts: Array.from(this.facts.values()),
    };

    const encrypted = encrypt(JSON.stringify(data), this.password);
    await fs.writeFile(MEMORY_FILE, encrypted);
    this.dirty = false;
  }

  addFact(fact: string, importance: number, source: "explicit" | "auto" = "auto", ttl?: number): string {
    const id = crypto.randomUUID();
    const now = Date.now();

    this.facts.set(id, {
      id,
      fact,
      importance,
      source,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0,
      ttl,
    });

    this.save();
    return id;
  }

  getFact(id: string): MemoryFact | undefined {
    const fact = this.facts.get(id);
    if (fact) {
      fact.lastAccessed = Date.now();
      fact.accessCount++;
      this.save();
    }
    return fact;
  }

  getAllFacts(): MemoryFact[] {
    return Array.from(this.facts.values());
  }

  getExplicitFacts(): MemoryFact[] {
    return Array.from(this.facts.values()).filter((f) => f.source === "explicit");
  }

  getHighImportanceFacts(threshold = 7): MemoryFact[] {
    return Array.from(this.facts.values())
      .filter((f) => f.importance >= threshold)
      .sort((a, b) => b.importance - a.importance);
  }

  searchFacts(query: string, limit = 10): MemoryFact[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.facts.values())
      .filter((f) => f.fact.toLowerCase().includes(lowerQuery))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  updateImportance(id: string, importance: number): boolean {
    const fact = this.facts.get(id);
    if (fact) {
      fact.importance = Math.max(0, Math.min(10, importance));
      this.save();
      return true;
    }
    return false;
  }

  deleteFact(id: string): boolean {
    const deleted = this.facts.delete(id);
    if (deleted) this.save();
    return deleted;
  }

  async cleanup(importanceThreshold = 3, maxAgeDays = 30): Promise<number> {
    const now = Date.now();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    let removed = 0;

    for (const [id, fact] of this.facts.entries()) {
      const expired = fact.ttl && now - fact.createdAt > fact.ttl;
      const oldAndUnimportant = now - fact.lastAccessed > maxAge && fact.importance < importanceThreshold;
      const neverAccessed = fact.accessCount === 0 && now - fact.createdAt > maxAge;

      if (expired || (oldAndUnimportant && fact.source !== "explicit") || (neverAccessed && fact.source !== "explicit")) {
        this.facts.delete(id);
        removed++;
      }
    }

    if (removed > 0) this.save();
    return removed;
  }

  getStats(): { total: number; explicit: number; auto: number; avgImportance: number } {
    const facts = Array.from(this.facts.values());
    const explicit = facts.filter((f) => f.source === "explicit").length;
    const auto = facts.filter((f) => f.source === "auto").length;
    const avgImportance = facts.length ? facts.reduce((s, f) => s + f.importance, 0) / facts.length : 0;

    return { total: facts.length, explicit, auto, avgImportance };
  }
}

export async function createLongTermMemory(password?: string): Promise<LongTermMemory> {
  const memory = new LongTermMemory(password);
  await memory.init();
  return memory;
}