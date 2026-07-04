import { tool } from "ai";
import { z } from "zod";
import { fileService } from "@/services/file-service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolSet = Record<string, any>;

export function createReadOnlyTools(): ToolSet {
  return {
    read_file: tool<{ path: string }, string>({
      description: "Read a text file from the workspace.",
      inputSchema: z.object({
        path: z.string().describe("File path relative to project root"),
      }),
      execute: async ({ path }) => {
        try {
          return await fileService.readTextFile(path);
        } catch {
          return `Error: Could not read file at ${path}`;
        }
      },
    }),

    list_files: tool<{ path: string }, string>({
      description: "List files and directories under a path.",
      inputSchema: z.object({
        path: z.string().default("."),
      }),
      execute: async ({ path }) => {
        try {
          const entries = await fileService.listTree(path);
          return JSON.stringify(entries, null, 2);
        } catch {
          return `Error: Could not list files at ${path}`;
        }
      },
    }),

    search_files: tool<{ pattern: string }, string>({
      description: "Search for files matching a glob pattern.",
      inputSchema: z.object({
        pattern: z.string().describe("Glob pattern (e.g. **/*.ts)"),
      }),
      execute: async ({ pattern }) => {
        try {
          const results = await fileService.searchFiles(pattern);
          return results.join("\n");
        } catch {
          return `Error: Could not search for ${pattern}`;
        }
      },
    }),

    web_search: tool<{ query: string }, string>({
      description: "Search the web for information.",
      inputSchema: z.object({
        query: z.string().describe("Search query"),
      }),
      execute: async ({ query }) => {
        try {
          const response = await fetch(
            `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`,
          );
          return await response.text();
        } catch {
          return `Error: Could not search for ${query}`;
        }
      },
    }),
  };
}

export function createAdminTools(): ToolSet {
  return {
    ...createReadOnlyTools(),

    write_file: tool<{ path: string; content: string }, string>({
      description: "Create or overwrite a file in the workspace.",
      inputSchema: z.object({
        path: z.string().describe("File path relative to project root"),
        content: z.string().describe("File content"),
      }),
      execute: async ({ path, content }) => {
        try {
          await fileService.writeTextFile(path, content);
          return `File ${path} written successfully.`;
        } catch (error) {
          return `Error: Could not write file at ${path}: ${error}`;
        }
      },
    }),

    create_file: tool<{ path: string }, string>({
      description: "Create an empty file in the workspace.",
      inputSchema: z.object({
        path: z.string().describe("File path relative to project root"),
      }),
      execute: async ({ path }) => {
        try {
          await fileService.createFile(path);
          return `File ${path} created successfully.`;
        } catch (error) {
          return `Error: Could not create file at ${path}: ${error}`;
        }
      },
    }),

    delete_file: tool<{ path: string }, string>({
      description: "Delete a file or directory from the workspace.",
      inputSchema: z.object({
        path: z.string().describe("Path relative to project root"),
      }),
      execute: async ({ path }) => {
        try {
          await fileService.deleteFile(path);
          return `${path} deleted successfully.`;
        } catch (error) {
          return `Error: Could not delete ${path}: ${error}`;
        }
      },
    }),

    rename_file: tool<{ oldPath: string; newPath: string }, string>({
      description: "Rename or move a file or directory.",
      inputSchema: z.object({
        oldPath: z.string(),
        newPath: z.string(),
      }),
      execute: async ({ oldPath, newPath }) => {
        try {
          await fileService.renameFile(oldPath, newPath);
          return `Renamed ${oldPath} to ${newPath} successfully.`;
        } catch (error) {
          return `Error: Could not rename ${oldPath}: ${error}`;
        }
      },
    }),

    create_directory: tool<{ path: string }, string>({
      description: "Create a new directory.",
      inputSchema: z.object({
        path: z.string().describe("Directory path relative to project root"),
      }),
      execute: async ({ path }) => {
        try {
          await fileService.createDirectory(path);
          return `Directory ${path} created successfully.`;
        } catch (error) {
          return `Error: Could not create directory at ${path}: ${error}`;
        }
      },
    }),

    execute_command: tool<{ command: string }, string>({
      description:
        "Execute a shell command in the project root. Use for npm, git, python, etc.",
      inputSchema: z.object({
        command: z.string().describe("Shell command to execute"),
      }),
      execute: async ({ command }) => {
        const { executeCommand } = await import("@/services/terminal-service");
        try {
          const output = await executeCommand(command);
          return output || "Command executed successfully (no output).";
        } catch (error) {
          return `Error: Command failed: ${error}`;
        }
      },
    }),
  };
}
