"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatRelativeTime, truncate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useChat } from "./chat-store";
import {
  MessageSquare,
  Plus,
  Trash2,
  LogOut,
  Bot,
  Menu,
  X,
} from "lucide-react";

interface ChatSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function ChatSidebar({ open, onClose }: ChatSidebarProps) {
  const router = useRouter();
  const { sessions, setSessions, currentChatId, setCurrentChatId, setMessages, deleteChat, newChat } = useChat();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/history");
        if (res.ok) {
          const json = await res.json();
          setSessions(json.sessions ?? []);
        }
      } catch {}
    };
    load();
  }, [setSessions]);

  const loadChat = async (id: string) => {
    setCurrentChatId(id);
    onClose();
    try {
      const res = await fetch(`/api/history?chatId=${id}`);
      if (res.ok) {
        const json = await res.json();
        setMessages(
          (json.messages ?? []).map((m: { id: string; role: string; content: string; created_at: string }) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.created_at,
          })),
        );
      }
    } catch {}
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-black">
      <div className="flex items-center justify-between border-b border-white/5 p-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold text-white">YASHU</span>
        </div>
      </div>

      <div className="p-3">
        <button
          onClick={() => { newChat(); onClose(); }}
          className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm text-muted-foreground transition-all hover:border-primary/50 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 scrollbar-thin">
        <AnimatePresence initial={false}>
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={cn(
                "group relative mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all",
                currentChatId === session.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white",
              )}
              onClick={() => loadChat(session.id)}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate">{truncate(session.title, 40)}</p>
                <p className="text-xs opacity-50">
                  {formatRelativeTime(session.created_at)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(session.id);
                }}
                className="shrink-0 rounded p-1 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="border-t border-white/5 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-white/5 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-white/5 lg:block">
        {sidebar}
      </aside>

      {/* Mobile */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 z-50 h-screen w-72 border-r border-white/5 bg-black lg:hidden"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
