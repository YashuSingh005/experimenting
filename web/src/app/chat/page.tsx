"use client";

import { useState, useEffect, useRef } from "react";
import { ChatProvider, useChat } from "@/components/chat/chat-store";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessage } from "@/components/chat/message";
import { ChatInput } from "@/components/chat/chat-input";
import { AgentVisualizer } from "@/components/chat/agent-visualizer";
import { Menu, Terminal, Shield } from "lucide-react";

function ChatContent() {
  const { messages, streaming, agentActivities } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, agentActivities]);

  return (
    <div className="flex h-dvh bg-black">
      <ChatSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0 lg:pl-72">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-3 py-2.5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent active:bg-accent/80 lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-xs text-muted-foreground">~/assistant</span>
          </div>
          <a
            href="/admin"
            className="ml-auto flex items-center gap-1 rounded-md border border-border/50 px-2 py-1 text-[10px] font-mono text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Shield className="h-3 w-3" />
            admin
          </a>
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="relative flex-1 overflow-y-auto scrollbar-thin">
          {/* Agent Visualizer - floating top-right */}
          <AgentVisualizer />

          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center px-4">
              <div className="text-center">
                <Terminal className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="mt-3 font-mono text-sm text-muted-foreground">
                  type a message to start
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground/50">
                  shift+enter for newline
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full px-2 sm:px-4 md:max-w-3xl">
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
            </div>
          )}
        </div>

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
