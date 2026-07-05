"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Square } from "lucide-react";
import { useChat } from "./chat-store";

export function ChatInput() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, streaming, stopStreaming } = useChat();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    setInput("");
    sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-gradient-to-t from-black via-black to-transparent px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
      <div className="mx-auto md:max-w-3xl">
        <div className="flex items-end gap-2 rounded-lg border border-border bg-card p-2 transition-all focus-within:border-primary/50">
          {/* Prompt indicator */}
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">$</span>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="type a message..."
            rows={1}
            className="max-h-[120px] min-h-[20px] flex-1 resize-none bg-transparent px-1 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 font-mono"
            disabled={streaming}
          />

          {streaming ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={stopStreaming}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-muted-foreground hover:text-foreground"
            >
              <Square className="h-3.5 w-3.5" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-all disabled:opacity-30"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </div>
        <p className="mt-1.5 text-center font-mono text-[10px] text-muted-foreground/50">
          may produce inaccurate information. verify important facts.
        </p>
      </div>
    </div>
  );
}
