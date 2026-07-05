"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
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
  setSessions: (sessions: ChatSession[]) => void;
  setCurrentChatId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (msg: Message) => void;
  appendToLastMessage: (content: string) => void;
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  deleteChat: (id: string) => Promise<void>;
  newChat: () => void;
  streamingContent: string;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const appendToLastMessage = useCallback((content: string) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.role !== "assistant") return prev;
      return [
        ...prev.slice(0, -1),
        { ...last, content: last.content + content },
      ];
    });
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || streaming) return;

      const abortController = new AbortController();
      abortRef.current = abortController;

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      addMessage(userMsg);
      setStreaming(true);
      setStreamingContent("");

      const assistantId = generateId();
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };
      addMessage(assistantMsg);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            chatId: currentChatId,
          }),
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
                appendToLastMessage(data.content);
                setStreamingContent((prev) => prev + data.content);
              } else if (data.type === "done") {
                if (data.chatId && !currentChatId) {
                  setCurrentChatId(data.chatId);
                  const res2 = await fetch("/api/history");
                  if (res2.ok) {
                    const json = await res2.json();
                    setSessions(json.sessions ?? []);
                  }
                }
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
      }
    },
    [currentChatId, streaming, addMessage, appendToLastMessage],
  );

  const deleteChat = useCallback(
    async (id: string) => {
      await fetch(`/api/history?chatId=${id}`, { method: "DELETE" });
      if (currentChatId === id) {
        setCurrentChatId(null);
        setMessages([]);
      }
      const res = await fetch("/api/history");
      if (res.ok) {
        const json = await res.json();
        setSessions(json.sessions ?? []);
      }
    },
    [currentChatId],
  );

  const newChat = useCallback(() => {
    setCurrentChatId(null);
    setMessages([]);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        sessions,
        currentChatId,
        messages,
        streaming,
        streamingContent,
        setSessions,
        setCurrentChatId,
        setMessages,
        addMessage,
        appendToLastMessage,
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
