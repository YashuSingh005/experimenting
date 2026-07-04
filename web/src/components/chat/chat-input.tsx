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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
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
    <div className="border-t border-white/5 bg-gradient-to-t from-black via-black to-transparent px-4 pb-4 pt-2">
      <div className="mx-auto max-w-3xl">
        <div className="glass flex items-end gap-2 rounded-2xl border border-white/10 p-2 transition-all focus-within:border-primary/50">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message YASHU..."
            rows={1}
            className="max-h-[200px] min-h-[24px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-muted-foreground"
            disabled={streaming}
          />

          {streaming ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={stopStreaming}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
            >
              <Square className="h-4 w-4" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-all disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </motion.button>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          YASHU may produce inaccurate information. Verify important facts.
        </p>
      </div>
    </div>
  );
}
