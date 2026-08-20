"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatProvider, useChat } from "@/components/chat/chat-store";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessage } from "@/components/chat/message";
import { ChatInput } from "@/components/chat/chat-input";
import { Menu, Terminal, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "explain how AI agents work",
  "write a python script to back up a folder",
  "debug this: why is my next.js build failing",
  "what is the best way to learn system design?",
];

function WelcomeState() {
  const { sendMessage } = useChat();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex h-full flex-col items-center justify-center px-4"
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 shadow-[0_0_40px_rgba(121,98,255,0.25)] sm:h-20 sm:w-20"
      >
        <Sparkles className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
      </motion.div>

      <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        hi, it's <span className="text-primary">yashu</span>
      </h1>
      <p className="mt-2 px-4 text-center font-mono text-sm text-muted-foreground">
        your AI agent for engineering work. ask anything.
      </p>

      <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-2 px-1 sm:mt-10 sm:grid-cols-2 sm:px-0">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.3 }}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => sendMessage(s)}
            className="rounded-xl border border-border bg-card px-3 py-3 text-left font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:py-2.5"
          >
            {s}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function ChatContent() {
  const { messages, streaming } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touched = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      const last = touched.current ? "smooth" : "auto";
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: last });
    }
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    touched.current = el.scrollHeight - el.scrollTop - el.clientHeight > 120;
  };

  return (
    <div className="relative flex h-dvh overflow-hidden bg-black">
      {/* Animated aurora background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="animate-blob absolute -top-24 left-1/2 h-72 w-96 -translate-x-1/2 rounded-full bg-primary/[0.10] blur-3xl sm:h-80 sm:w-[36rem]" />
        <div className="animate-blob-delayed absolute -bottom-20 right-0 h-64 w-72 rounded-full bg-primary/[0.07] blur-3xl sm:w-96" />
        <div className="animate-blob-slow absolute left-0 top-1/3 h-56 w-56 rounded-full bg-purple-500/[0.06] blur-3xl" />
      </div>

      <ChatSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col lg:pl-72">
        {/* Mobile header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 border-b border-border/60 bg-black/60 px-3 py-2.5 pt-safe backdrop-blur lg:hidden"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-muted-foreground transition-colors active:bg-accent"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </motion.button>
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm text-muted-foreground">~/yashu</span>
          </div>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-green-400/80">
            <span className="h-1.5 w-1.5 animate-pulse-subtle rounded-full bg-green-400" />
            online
          </span>
        </motion.div>

        {/* Messages area */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin"
        >
          {messages.length === 0 ? (
            <WelcomeState />
          ) : (
            <div className="mx-auto w-full px-2.5 pb-4 sm:px-4 sm:pb-6 md:max-w-3xl">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    isStreaming={
                      streaming &&
                      msg === messages[messages.length - 1] &&
                      msg.role === "assistant"
                    }
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <ChatInput />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ChatProvider>
      <ChatContent />
    </ChatProvider>
  );
}
