import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";

export interface TerminalOutput {
  type: "stdout" | "stderr" | "exit";
  data: string;
  exitCode?: number;
}

export class TerminalSession extends EventEmitter {
  private process;
  private cwd: string;

  constructor(command: string, cwd?: string) {
    super();
    this.cwd = cwd || process.env.PROJECT_ROOT || process.cwd();

    this.process = spawn(command, [], {
      cwd: this.cwd,
      shell: true,
      env: { ...process.env },
    });

    this.process.stdout?.on("data", (data: Buffer) => {
      this.emit("output", {
        type: "stdout",
        data: data.toString(),
      } satisfies TerminalOutput);
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      this.emit("output", {
        type: "stderr",
        data: data.toString(),
      } satisfies TerminalOutput);
    });

    this.process.on("close", (code) => {
      this.emit("output", {
        type: "exit",
        data: `Process exited with code ${code}`,
        exitCode: code ?? -1,
      } satisfies TerminalOutput);
    });

    this.process.on("error", (err) => {
      this.emit("output", {
        type: "stderr",
        data: `Error: ${err.message}`,
      } satisfies TerminalOutput);
    });
  }

  write(data: string): void {
    this.process.stdin?.write(data);
  }

  kill(): void {
    this.process.kill();
  }
}

export async function executeCommand(
  command: string,
  cwd?: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, [], {
      cwd: cwd || process.env.PROJECT_ROOT || process.cwd(),
      shell: true,
      env: { ...process.env },
    });

    let output = "";

    proc.stdout?.on("data", (data: Buffer) => {
      output += data.toString();
    });

    proc.stderr?.on("data", (data: Buffer) => {
      output += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) resolve(output);
      else resolve(output);
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}
