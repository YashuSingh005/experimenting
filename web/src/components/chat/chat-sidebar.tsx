"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn, formatRelativeTime, truncate } from "@/lib/utils";
import { useChat } from "./chat-store";
import { MessageSquare, Plus, Trash2, Terminal, X } from "lucide-react";

interface ChatSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function ChatSidebar({ open, onClose }: ChatSidebarProps) {
  const {
    sessions,
    currentChatId,
    setCurrentChatId,
    setMessages,
    deleteChat,
    newChat,
  } = useChat();

  const loadChat = (id: string) => {
    setCurrentChatId(id);
    try {
      const stored = window.localStorage.getItem(`yashu.messages.${id}`);
      setMessages(stored ? JSON.parse(stored) : []);
    } catch {
      setMessages([]);
    }
    onClose();
  };

  const openNewChat = () => {
    newChat();
    onClose();
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-black/95 backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs text-muted-foreground">~/sessions</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* New chat button */}
      <div className="p-3">
        <button
          onClick={openNewChat}
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground active:scale-[0.99]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="font-mono text-xs">new session</span>
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-2 scrollbar-thin">
        {sessions.length === 0 ? (
          <p className="px-3 py-6 text-center font-mono text-xs text-muted-foreground/50">
            no sessions yet
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "group relative mb-0.5 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-all",
                  currentChatId === session.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
                onClick={() => loadChat(session.id)}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs">
                    {truncate(session.title, 35)}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground/60">
                    {formatRelativeTime(session.created_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(session.id);
                  }}
                  className="shrink-0 rounded p-1 opacity-0 transition-all hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                  aria-label="Delete session"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="pointer-events-auto fixed left-0 top-0 z-30 hidden h-full w-72 border-r border-border/70 bg-black lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-full w-72 border-r border-border/70 lg:hidden"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}