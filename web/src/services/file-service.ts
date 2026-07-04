import { readFile, writeFile, mkdir, rm, rename, readdir, stat } from "node:fs/promises";
import { join, relative, basename, dirname, extname } from "node:path";
import { existsSync } from "node:fs";
import type { FileEntry } from "@/types/admin";

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();

function sanitizePath(inputPath: string): string {
  const resolved = join(PROJECT_ROOT, inputPath);
  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error("Path traversal detected");
  }
  return resolved;
}

export class FileService {
  async listTree(dirPath = "."): Promise<FileEntry[]> {
    const fullPath = sanitizePath(dirPath);
    const entries = await readdir(fullPath, { withFileTypes: true });
    const result: FileEntry[] = [];

    for (const entry of entries) {
      const entryPath = join(dirPath, entry.name);
      const fullEntryPath = join(fullPath, entry.name);

      if (entry.isDirectory()) {
        const children = await this.listTree(entryPath).catch(() => []);
        result.push({
          name: entry.name,
          path: entryPath,
          type: "directory",
          children,
        });
      } else {
        const stats = await stat(fullEntryPath);
        result.push({
          name: entry.name,
          path: entryPath,
          type: "file",
          size: stats.size,
          modifiedAt: stats.mtime.toISOString(),
        });
      }
    }

    return result.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  async readTextFile(filePath: string): Promise<string> {
    const fullPath = sanitizePath(filePath);
    return readFile(fullPath, "utf-8");
  }

  async writeTextFile(filePath: string, content: string): Promise<void> {
    const fullPath = sanitizePath(filePath);
    await writeFile(fullPath, content, "utf-8");
  }

  async createFile(filePath: string): Promise<void> {
    const fullPath = sanitizePath(filePath);
    await writeFile(fullPath, "", "utf-8");
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = sanitizePath(filePath);
    await rm(fullPath, { recursive: true });
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    const fullOldPath = sanitizePath(oldPath);
    const fullNewPath = sanitizePath(newPath);
    await rename(fullOldPath, fullNewPath);
  }

  async createDirectory(dirPath: string): Promise<void> {
    const fullPath = sanitizePath(dirPath);
    await mkdir(fullPath, { recursive: true });
  }

  async searchFiles(pattern: string): Promise<string[]> {
    const { Glob } = await import("glob");
    const g = new Glob(pattern, { cwd: PROJECT_ROOT, nodir: true });
    const results: string[] = [];
    for await (const file of g) {
      results.push(file);
    }
    return results;
  }

  async getFileInfo(filePath: string): Promise<FileEntry> {
    const fullPath = sanitizePath(filePath);
    const stats = await stat(fullPath);
    return {
      name: basename(filePath),
      path: filePath,
      type: stats.isDirectory() ? "directory" : "file",
      size: stats.size,
      modifiedAt: stats.mtime.toISOString(),
    };
  }
}

export const fileService = new FileService();
