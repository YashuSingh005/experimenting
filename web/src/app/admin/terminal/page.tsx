"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Terminal, Loader2 } from "lucide-react";

export default function AdminTerminalPage() {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<{ command: string; output: string }[]>([]);
  const [running, setRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const execute = async () => {
    if (!command.trim() || running) return;
    setRunning(true);

    const cmd = command;
    setCommand("");

    try {
      const res = await fetch("/api/admin/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });

      if (res.ok) {
        const data = await res.json();
        setHistory((prev) => [...prev, { command: cmd, output: data.output ?? "" }]);
      } else {
        const data = await res.json();
        setHistory((prev) => [
          ...prev,
          { command: cmd, output: `Error: ${data.error ?? "Command failed"}` },
        ]);
      }
    } catch {
      setHistory((prev) => [
        ...prev,
        { command: cmd, output: "Error: Connection failed" },
      ]);
    } finally {
      setRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      execute();
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">Terminal</h1>
        <p className="mt-1 text-muted-foreground">
          Execute commands in the project root
        </p>
      </motion.div>

      <div className="glass rounded-xl border border-white/5 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/5 bg-black/30 px-4 py-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">
            {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Connected" : "Terminal"}
          </span>
        </div>

        <div
          ref={scrollRef}
          className="h-[50vh] overflow-y-auto bg-black/50 p-4 font-mono text-sm scrollbar-thin"
        >
          {history.length === 0 && (
            <div className="text-muted-foreground">
              <p className="mb-4 text-green-400">
                Welcome to the admin terminal. Type a command and press Enter.
              </p>
              <p className="text-xs text-muted-foreground/50">
                Available: npm, git, node, python, ls, cat, etc.
              </p>
            </div>
          )}

          {history.map((item, i) => (
            <div key={i} className="mb-4">
              <div className="flex items-center gap-2">
                <span className="text-green-400">$</span>
                <span className="text-white">{item.command}</span>
              </div>
              {item.output && (
                <pre className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {item.output}
                </pre>
              )}
            </div>
          ))}

          {running && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Running...</span>
            </div>
          )}
        </div>

        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-2 rounded-lg bg-black/50 px-3 py-2">
            <span className="text-green-400 text-sm">$</span>
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              disabled={running}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
