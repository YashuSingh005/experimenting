"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatDateTime, truncate } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Trash2, Eye, X } from "lucide-react";
import toast from "react-hot-toast";

interface ChatWithUser {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export default function AdminChatsPage() {
  const [chats, setChats] = useState<ChatWithUser[]>([]);
  const [search, setSearch] = useState("");
  const [selectedChat, setSelectedChat] = useState<ChatWithUser | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string; created_at: string }[]>([]);

  const loadChats = async () => {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("chat_sessions")
        .select("*, profiles!inner(name, email)")
        .order("created_at", { ascending: false })
        .limit(100);

      const mapped = (data ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        user_id: c.user_id,
        created_at: c.created_at,
        user_name: (c as unknown as { profiles: { name: string; email: string } }).profiles?.name,
        user_email: (c as unknown as { profiles: { name: string; email: string } }).profiles?.email,
      }));
      setChats(mapped);
    } catch {}
  };

  useEffect(() => {
    loadChats();
  }, []);

  const viewChat = async (chat: ChatWithUser) => {
    setSelectedChat(chat);
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: true });
      setMessages(data ?? []);
    } catch {}
  };

  const deleteChat = async (id: string) => {
    if (!confirm("Delete this conversation?")) return;
    try {
      const supabase = createAdminClient();
      await supabase.from("messages").delete().eq("chat_id", id);
      await supabase.from("chat_sessions").delete().eq("id", id);
      toast.success("Conversation deleted");
      loadChats();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filtered = chats.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.user_name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Chats</h1>
          <p className="mt-1 text-muted-foreground">
            View all conversations
          </p>
        </div>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Chat list */}
        <div className="glass rounded-xl border border-white/5 overflow-hidden max-h-[70vh] overflow-y-auto">
          {filtered.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center gap-3 border-b border-white/5 px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors"
              onClick={() => viewChat(chat)}
            >
              <MessageSquare className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {truncate(chat.title, 50)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {chat.user_name ?? "Unknown"} &middot; {formatDateTime(chat.created_at)}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No chats found</div>
          )}
        </div>

        {/* Message viewer */}
        {selectedChat ? (
          <div className="glass rounded-xl border border-white/5 overflow-hidden max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">
                  {truncate(selectedChat.title, 50)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedChat.user_name ?? "Unknown"}
                </p>
              </div>
              <button
                onClick={() => setSelectedChat(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-3 ${
                    msg.role === "assistant"
                      ? "bg-primary/5 border border-primary/10"
                      : "bg-white/5"
                  }`}
                >
                  <p className="mb-1 text-xs font-medium text-muted-foreground uppercase">
                    {msg.role}
                  </p>
                  <p className="text-sm text-white whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No messages in this conversation
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-white/10 p-8">
            <div className="text-center">
              <Eye className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Select a conversation to view messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
