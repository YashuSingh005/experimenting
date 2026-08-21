"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatProvider, useChat } from "@/components/chat/chat-store";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessage } from "@/components/chat/message";
import { ChatInput } from "@/components/chat/chat-input";
import { Menu, Terminal, Sparkles, Command, Keyboard, Sun, Moon, MessageSquare, RotateCcw, Copy, Trash2, Plus, Settings, HelpCircle, Maximize2, Minimize2, Search, X, Volume2, VolumeX } from "lucide-react";
import { ParticleBackground, FloatingOrbs } from "@/components/ui/particle-background";
import { CommandPalette, useCommandPalette, createDefaultCommands } from "@/components/ui/command-palette";
import { ThinkingIndicator } from "@/components/ui/thinking-indicator";
import { useSound, playSendSound, playReceiveSound, playErrorSound, enableSound, disableSound, isSoundEnabled } from "@/lib/sound";
import toast from "react-hot-toast";

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
  const {
    messages,
    streaming,
    currentChatId,
    sessions,
    newChat,
    deleteChat,
    stopStreaming,
    setCurrentChatId,
    setMessages,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  const lastAssistantMessageRef = useRef<string | null>(null);
  const prevStreamingRef = useRef(false);

  const { play } = useSound();
  const { isOpen: paletteOpen, close: closePalette, toggle: togglePalette } = useCommandPalette();

  useEffect(() => {
    const stored = localStorage.getItem("yashu-theme");
    if (stored) {
      setTheme(stored as "light" | "dark");
      document.documentElement.classList.toggle("dark", stored === "dark");
    }
    const soundStored = localStorage.getItem("yashu-sound");
    if (soundStored !== null) {
      setSoundEnabled(soundStored === "true");
    }
  }, []);

  useEffect(() => {
    if (soundEnabled) {
      enableSound();
    } else {
      disableSound();
    }
    localStorage.setItem("yashu-sound", String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    if (streaming && !prevStreamingRef.current) {
      play("send");
    }
    if (!streaming && prevStreamingRef.current && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant") {
        play("receive");
      }
    }
    prevStreamingRef.current = streaming;
  }, [streaming, messages, play]);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("yashu-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    toast.success(`Switched to ${next} mode`);
  }, [theme]);

  const handleRegenerate = useCallback(() => {
    if (!currentChatId || messages.length < 2) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      setMessages(messages.slice(0, -2));
      const event = new CustomEvent("yashu:regenerate", { detail: { message: lastUserMsg.content } });
      window.dispatchEvent(event);
      toast.success("Regenerating response...");
    }
  }, [currentChatId, messages, setMessages]);

  const handleCopyLast = useCallback(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (lastAssistant) {
      navigator.clipboard.writeText(lastAssistant.content);
      toast.success("Copied last response");
    } else {
      toast.error("No response to copy");
    }
  }, [messages]);

  const handleDeleteChat = useCallback(() => {
    if (currentChatId) {
      deleteChat(currentChatId);
      toast.success("Chat deleted");
    }
  }, [currentChatId, deleteChat]);

  const handleNewChat = useCallback(() => {
    newChat();
    setSidebarOpen(false);
    toast.success("New chat started");
  }, [newChat]);

  const handleFocusMode = useCallback(() => {
    setFocusMode((prev) => {
      const next = !prev;
      toast.success(next ? "Focus mode enabled" : "Focus mode disabled");
      return next;
    });
  }, []);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "/") {
        e.preventDefault();
        togglePalette();
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      if (e.key === "Escape") {
        setShowShortcuts(false);
        closePalette();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
        textarea?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePalette, closePalette]);

  const commands = useMemo(
    () =>
      createDefaultCommands({
        newChat: handleNewChat,
        deleteChat: handleDeleteChat,
        regenerate: handleRegenerate,
        copyLast: handleCopyLast,
        toggleTheme,
        toggleSidebar: () => setSidebarOpen((prev) => !prev),
        focusMode: handleFocusMode,
        shortcuts: () => setShowShortcuts(true),
        settings: () => toast.success("Settings panel coming soon"),
        toggleSound: () => setSoundEnabled((prev) => !prev),
      }),
    [handleNewChat, handleDeleteChat, handleRegenerate, handleCopyLast, toggleTheme, handleFocusMode]
  );

  return (
    <div className="relative flex h-dvh overflow-hidden bg-black">
      {/* Particle background */}
      <ParticleBackground particleCount={50} />
      <FloatingOrbs count={6} />

      {/* Original aurora blobs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="animate-blob absolute -top-24 left-1/2 h-72 w-96 -translate-x-1/2 rounded-full bg-primary/[0.10] blur-3xl sm:h-80 sm:w-[36rem]" />
        <div className="animate-blob-delayed absolute -bottom-20 right-0 h-64 w-72 rounded-full bg-primary/[0.07] blur-3xl sm:w-96" />
        <div className="animate-blob-slow absolute left-0 top-1/3 h-56 w-56 rounded-full bg-purple-500/[0.06] blur-3xl" />
      </div>

      <ChatSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={cn(
        "relative z-10 flex min-w-0 flex-1 flex-col transition-all duration-300",
        "lg:pl-72",
        focusMode && "lg:pl-0"
      )}>
        {/* Desktop header */}
        {!focusMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="hidden lg:flex items-center justify-between gap-4 border-b border-border/60 bg-black/60 px-4 py-2.5 backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Toggle sidebar"
              >
                <MessageSquare className="h-5 w-5" />
              </motion.button>
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="font-mono text-sm text-muted-foreground">~/yashu</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-green-400/80">
                <span className="h-1.5 w-1.5 animate-pulse-subtle rounded-full bg-green-400" />
                online
              </span>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={togglePalette}
                className="relative rounded-lg p-2 text-muted-foreground/60 transition-all hover:text-foreground hover:bg-accent"
                aria-label="Command palette (⌘K)"
              >
                <Command className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[9px] font-mono text-primary">
                  ⌘K
                </span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="rounded-lg p-2 text-muted-foreground/60 transition-all hover:text-foreground hover:bg-accent"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSoundEnabled((prev) => !prev)}
                className="rounded-lg p-2 text-muted-foreground/60 transition-all hover:text-foreground hover:bg-accent"
                aria-label={soundEnabled ? "Disable sound effects" : "Enable sound effects"}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleFocusMode}
                className="rounded-lg p-2 text-muted-foreground/60 transition-all hover:text-foreground hover:bg-accent"
                aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
              >
                {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowShortcuts(true)}
                className="rounded-lg p-2 text-muted-foreground/60 transition-all hover:text-foreground hover:bg-accent"
                aria-label="Keyboard shortcuts (?)"
              >
                <Keyboard className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>
        )}

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
          className={cn(
            "flex-1 overflow-y-auto overscroll-contain scrollbar-thin",
            focusMode && "max-w-3xl mx-auto w-full"
          )}
        >
          {messages.length === 0 ? (
            <WelcomeState />
          ) : (
            <div className={cn("mx-auto w-full px-2.5 pb-4 sm:px-4 sm:pb-6", focusMode ? "max-w-2xl" : "md:max-w-3xl")}>
              <AnimatePresence initial={false}>
                {messages.map((msg, index) => {
                  const isLastAssistant = streaming && index === messages.length - 1 && msg.role === "assistant";
                  return (
                    <ChatMessage
                      key={msg.id}
                      role={msg.role}
                      content={msg.content}
                      isStreaming={isLastAssistant}
                    />
                  );
                })}
                {streaming && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                  <ThinkingIndicator size="md" showText className="mx-auto max-w-3xl px-4" />
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <ChatInput />

        {/* Command Palette */}
        <CommandPalette
          isOpen={paletteOpen}
          onClose={closePalette}
          items={commands}
          placeholder="Search commands, actions, settings..."
          title="Yashu Commands"
        />

        {/* Keyboard Shortcuts Overlay */}
        <AnimatePresence>
          {showShortcuts && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowShortcuts(false)}
              role="dialog"
              aria-modal="true"
              aria-label="Keyboard shortcuts"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full max-w-2xl max-h-[80vh] overflow-auto rounded-2xl border border-border/50 bg-black/95 backdrop-blur-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                  <h2 className="font-mono text-lg font-bold">Keyboard Shortcuts</h2>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowShortcuts(false)}
                    className="rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:text-foreground hover:bg-accent"
                    aria-label="Close shortcuts"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>

                <div className="p-6 space-y-6">
                  {[
                    { title: "Navigation", shortcuts: [
                      { key: "⌘K", desc: "Open command palette" },
                      { key: "⌘B", desc: "Toggle sidebar" },
                      { key: "⌘⇧F", desc: "Toggle focus mode" },
                      { key: "?", desc: "Show this help" },
                      { key: "Esc", desc: "Close dialogs / stop streaming" },
                    ]},
                    { title: "Chat Actions", shortcuts: [
                      { key: "⌘N", desc: "New chat" },
                      { key: "⌘⇧D", desc: "Delete current chat" },
                      { key: "⌘⇧R", desc: "Regenerate response" },
                      { key: "⌘⇧C", desc: "Copy last response" },
                      { key: "⌘Enter", desc: "Focus input / send message" },
                    ]},
                    { title: "Appearance", shortcuts: [
                      { key: "⌘⇧T", desc: "Toggle theme" },
                    ]},
                    { title: "Editing", shortcuts: [
                      { key: "Enter", desc: "Send message" },
                      { key: "Shift+Enter", desc: "New line in input" },
                      { key: "↑ / ↓", desc: "Navigate command palette" },
                      { key: "Tab", desc: "Cycle command palette" },
                    ]},
                  ].map((section) => (
                    <div key={section.title}>
                      <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground/60 mb-3">{section.title}</h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {section.shortcuts.map((s) => (
                          <div key={s.key} className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg bg-white/5 border border-border/30">
                            <span className="text-sm text-muted-foreground">{s.desc}</span>
                            <kbd className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-mono text-primary bg-primary/10 border border-primary/20 whitespace-nowrap">
                              {s.key.split("+").map((k, i) => (
                                <span key={i} className="flex items-center gap-1">
                                  {i > 0 && <span className="text-[9px] text-muted-foreground">+</span>}
                                  {k}
                                </span>
                              ))}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border/30 px-6 py-3 text-center">
                  <p className="font-mono text-xs text-muted-foreground/60">
                    Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-border/30">?</kbd> anytime to reopen this
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Home() {
  return (
    <ChatProvider>
      <ChatContent />
    </ChatProvider>
  );
}