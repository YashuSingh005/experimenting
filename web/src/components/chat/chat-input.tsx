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
    <div className="border-t border-border/50 bg-gradient-to-t from-black via-black/95 to-transparent px-3 pt-2 pb-safe sm:px-4 sm:pb-4">
      <div className="mx-auto md:max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card/80 p-2 backdrop-blur transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_20px_rgba(121,98,255,0.12)]">
          {/* Prompt indicator */}
          <span className="hidden select-none font-mono text-sm text-primary/60 sm:inline">$</span>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="type a message..."
            rows={1}
            className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/50 sm:text-sm sm:font-mono"
            disabled={streaming}
          />

          {streaming ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={stopStreaming}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-muted-foreground transition-colors hover:text-foreground sm:h-8 sm:w-8"
              aria-label="Stop generating"
            >
              <Square className="h-3.5 w-3.5" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_16px_rgba(121,98,255,0.3)] transition-all hover:brightness-110 disabled:opacity-30 disabled:shadow-none sm:h-8 sm:w-8"
              aria-label="Send message"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </div>
        <p className="mt-1.5 text-center font-mono text-[10px] text-muted-foreground/40">
          yashu may produce inaccurate information. verify important facts.
        </p>
      </div>
    </div>
  );
}
