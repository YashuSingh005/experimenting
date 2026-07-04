"use client";

import { useState, useEffect, useRef } from "react";
import { ChatProvider, useChat } from "@/components/chat/chat-store";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessage } from "@/components/chat/message";
import { ChatInput } from "@/components/chat/chat-input";
import { motion } from "framer-motion";
import { Sparkles, Menu } from "lucide-react";

function ChatContent() {
  const { messages, streaming } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-screen bg-black">
      <ChatSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col lg:pl-72">
        {/* Mobile header */}
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-white">YASHU</span>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-thin"
        >
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <Sparkles className="mx-auto h-12 w-12 text-primary/50" />
                <h2 className="mt-4 text-xl font-semibold text-white">
                  Start a conversation
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ask me anything — I&apos;m here to help
                </p>
              </motion.div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl pt-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={streaming && msg === messages[messages.length - 1] && msg.role === "assistant"}
                />
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatContent />
    </ChatProvider>
  );
}
