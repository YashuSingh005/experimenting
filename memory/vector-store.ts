import * as lancedb from "@lancedb/lancedb";
import { openai } from "@ai-sdk/openai";
import { getMemoryPassword } from "./crypto.ts";
import * as fs from "fs/promises";

const DB_DIR = ".memory/vector";
const TABLE_NAME = "knowledge";
const EMBEDDING_DIM = 1536;

export interface KnowledgeChunk {
  id: string;
  text: string;
  source: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  createdAt: number;
}

const embeddingModel = openai.embedding("text-embedding-3-small");

async function getEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.doEmbed({ values: [text] });
  const embedding = result.embeddings[0];
  if (!embedding) throw new Error("Failed to generate embedding");
  return embedding;
}

async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const result = await embeddingModel.doEmbed({ values: texts });
  const embeddings = result.embeddings;
  if (!embeddings || embeddings.length !== texts.length) {
    throw new Error("Failed to generate embeddings");
  }
  return embeddings;
}

export class VectorStore {
  private db: lancedb.Connection | null = null;
  private table: lancedb.Table | null = null;
  private password: string;

  constructor(password?: string) {
    this.password = password || "";
  }

  async init(): Promise<void> {
    if (!this.password) {
      this.password = await getMemoryPassword();
    }

    await fs.mkdir(DB_DIR, { recursive: true });
    this.db = await lancedb.connect(DB_DIR);

    const tables = await this.db.tableNames();
    if (!tables.includes(TABLE_NAME)) {
      this.table = await this.db.createTable(TABLE_NAME, [
        {
          id: "init",
          text: "",
          source: "system",
          embedding: new Array(EMBEDDING_DIM).fill(0),
          metadata: {},
          createdAt: Date.now(),
        },
      ]);
      await this.table.delete("id = 'init'");
    } else {
      this.table = await this.db.openTable(TABLE_NAME);
    }
  }

  private async ensureTable(): Promise<lancedb.Table> {
    if (!this.table) throw new Error("VectorStore not initialized");
    return this.table;
  }

  async addChunks(chunks: Omit<KnowledgeChunk, "embedding" | "createdAt">[]): Promise<void> {
    const table = await this.ensureTable();

    const texts = chunks.map((c) => c.text);
    const embeddings = await getEmbeddings(texts);

    const records = chunks.map((c, i) => ({
      ...c,
      embedding: embeddings[i],
      createdAt: Date.now(),
    }));

    await table.add(records);
  }

  async search(query: string, limit = 5): Promise<KnowledgeChunk[]> {
    const table = await this.ensureTable();

    const vector = await getEmbedding(query);

    const results = await table.search(vector).limit(limit).toArray();

    return results as unknown as KnowledgeChunk[];
  }

  async searchHybrid(query: string, limit = 5): Promise<KnowledgeChunk[]> {
    const table = await this.ensureTable();

    const vector = await getEmbedding(query);

    const results = await table.search(vector).limit(limit * 2).toArray();

    return (results as unknown as KnowledgeChunk[]).slice(0, limit);
  }

  async deleteBySource(source: string): Promise<number> {
    const table = await this.ensureTable();
    const before = await table.query().toArray();
    await table.delete(`source = '${source}'`);
    const after = await table.query().toArray();
    return before.length - after.length;
  }

  async getStats(): Promise<{ count: number; sources: string[] }> {
    const table = await this.ensureTable();
    const all = await table.query().toArray();
    const chunks = all as unknown as KnowledgeChunk[];
    const sources = [...new Set(chunks.map((c) => c.source))];
    return { count: chunks.length, sources };
  }
}

export async function createVectorStore(password?: string): Promise<VectorStore> {
  const store = new VectorStore(password);
  await store.init();
  return store;
}