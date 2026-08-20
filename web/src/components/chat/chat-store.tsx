"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import toast from "react-hot-toast";
import { generateId } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface ChatContextType {
  sessions: ChatSession[];
  currentChatId: string | null;
  messages: Message[];
  streaming: boolean;
  streamingContent: string;
  setCurrentChatId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  deleteChat: (id: string) => void;
  newChat: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

const SESSIONS_KEY = "yashu.sessions";
const messagesKey = (id: string) => `yashu.messages.${id}`;

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const stored = loadJSON<ChatSession[]>(SESSIONS_KEY, []);
    setSessions(stored);
    if (stored.length > 0) {
      const id = stored[0].id;
      setCurrentChatId(id);
      setMessages(loadJSON<Message[]>(messagesKey(id), []));
    }
  }, []);

  const persistSessions = useCallback((next: ChatSession[]) => {
    setSessions(next);
    window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
  }, []);

  const persistMessages = useCallback((id: string, next: Message[]) => {
    if (id) window.localStorage.setItem(messagesKey(id), JSON.stringify(next));
  }, []);

  const appendToLastMessage = useCallback(
    (id: string, content: string) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== "assistant") return prev;
        const next = [
          ...prev.slice(0, -1),
          { ...last, content: last.content + content },
        ];
        persistMessages(id, next);
        return next;
      });
    },
    [persistMessages],
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || streaming) return;

      const abortController = new AbortController();
      abortRef.current = abortController;

      const chatId = currentChatId ?? generateId();
      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };

      const nextMessages = [...messages, userMsg, assistantMsg];
      setMessages(nextMessages);
      persistMessages(chatId, nextMessages);

      if (!currentChatId) {
        const session: ChatSession = {
          id: chatId,
          title: content.slice(0, 60),
          created_at: new Date().toISOString(),
        };
        setCurrentChatId(chatId);
        persistSessions([session, ...sessions]);
      }

      setStreaming(true);
      setStreamingContent("");

      const history = nextMessages
        .slice(0, -1)
        .filter((m) => m.content.trim())
        .slice(-24)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, history, chatId }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Request failed (${res.status})`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream reader");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "text") {
                setStreamingContent((prev) => prev + data.content);
                appendToLastMessage(chatId, data.content);
              } else if (data.type === "error") {
                console.error("Stream error:", data.content);
                toast.error(data.content || "An error occurred during streaming");
              }
            } catch {
              // skip parse errors
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Chat error:", error);
          toast.error(error instanceof Error ? error.message : "Failed to send message");
        }
      } finally {
        setStreaming(false);
        setStreamingContent("");
        const finalMessages = loadJSON<Message[]>(messagesKey(chatId), []);
        if (finalMessages.length === 0) persistMessages(chatId, messages);
      }
    },
    [currentChatId, streaming, messages, sessions, appendToLastMessage, persistMessages, persistSessions],
  );

  const deleteChat = useCallback(
    (id: string) => {
      window.localStorage.removeItem(messagesKey(id));
      const next = sessions.filter((s) => s.id !== id);
      persistSessions(next);
      if (currentChatId === id) {
        setCurrentChatId(null);
        setMessages([]);
      }
    },
    [sessions, currentChatId, persistSessions],
  );

  const newChat = useCallback(() => {
    setCurrentChatId(null);
    setMessages([]);
    setStreamingContent("");
  }, []);

  return (
    <ChatContext.Provider
      value={{
        sessions,
        currentChatId,
        messages,
        streaming,
        streamingContent,
        setCurrentChatId,
        setMessages,
        sendMessage,
        stopStreaming,
        deleteChat,
        newChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
