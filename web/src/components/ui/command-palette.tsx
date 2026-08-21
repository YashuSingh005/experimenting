"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Search,
  Command,
  Keyboard,
  Plus,
  Trash2,
  RotateCcw,
  Copy,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Terminal,
  Sparkles,
  MessageSquare,
  X,
  ChevronRight,
  Volume2,
  VolumeX,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  section?: string;
  action: () => void;
  keywords?: string[];
  disabled?: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: CommandItem[];
  placeholder?: string;
  title?: string;
}

export function CommandPalette({
  isOpen,
  onClose,
  items,
  placeholder = "Search commands...",
  title = "Command Palette",
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;

    const lowerQuery = query.toLowerCase();
    return items
      .map((item) => {
        const searchText = [
          item.label,
          item.description,
          item.shortcut,
          ...(item.keywords || []),
        ].join(" ").toLowerCase();

        let score = 0;
        if (item.label.toLowerCase().startsWith(lowerQuery)) score += 100;
        if (searchText.includes(lowerQuery)) score += 50;
        if (item.keywords?.some((k) => k.toLowerCase().includes(lowerQuery))) score += 25;

        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }, [items, query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected && !selected.disabled) {
          selected.action();
          onClose();
        }
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
        return;
      }
    },
    [filteredItems, selectedIndex, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleGlobalKeyDown);
    }
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedElement?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const sections = useMemo(() => {
    const grouped: Record<string, CommandItem[]> = {};
    filteredItems.forEach((item) => {
      const section = item.section || "Commands";
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(item);
    });
    return grouped;
  }, [filteredItems]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl" />

          {/* Palette */}
          <div className="relative rounded-2xl border border-border/50 bg-black/95 backdrop-blur-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="w-full bg-transparent py-2 pl-10 pr-4 text-foreground placeholder:text-muted-foreground/50 font-mono text-sm outline-none"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Search commands"
                  aria-autocomplete="list"
                  aria-controls="command-list"
                  role="combobox"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono text-muted-foreground/50 bg-white/5 border border-border/30">
                  <Command className="h-3 w-3" />
                  <span>K</span>
                </kbd>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="rounded-md p-2 text-muted-foreground/60 transition-colors hover:text-foreground hover:bg-accent"
                aria-label="Close palette"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              id="command-list"
              className="max-h-[50vh] overflow-y-auto scrollbar-thin"
              role="listbox"
              aria-label="Commands"
            >
              {Object.entries(sections).map(([sectionName, sectionItems]) => (
                <div key={sectionName}>
                  <div className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 border-b border-border/30">
                    {sectionName}
                  </div>
                  <AnimatePresence initial={false}>
                    {sectionItems.map((item, index) => {
                      const globalIndex = filteredItems.indexOf(item);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <motion.button
                          key={item.id}
                          data-index={globalIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.1, delay: index * 0.01 }}
                          whileHover={{ x: 4 }}
                          onClick={() => {
                            if (!item.disabled) {
                              item.action();
                              onClose();
                            }
                          }}
                          disabled={item.disabled}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                            isSelected
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                            item.disabled && "opacity-40 cursor-not-allowed"
                          )}
                          role="option"
                          aria-selected={isSelected}
                          aria-disabled={item.disabled}
                        >
                          {item.icon && (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                              {item.icon}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="block font-mono text-sm truncate">{item.label}</span>
                            {item.description && (
                              <span className="block text-[11px] truncate text-muted-foreground/60">
                                {item.description}
                              </span>
                            )}
                          </div>
                          {item.shortcut && (
                            <kbd className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono text-muted-foreground/50 bg-white/5 border border-border/30">
                              {item.shortcut
                                .split("+")
                                .map((key, i) => (
                                  <span key={i} className="flex items-center gap-1">
                                    {i > 0 && <span className="text-[8px]">+</span>}
                                    {key}
                                  </span>
                                ))}
                            </kbd>
                          )}
                          {isSelected && (
                            <ChevronRight className="h-4 w-4 text-primary/60" />
                          )}
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ))}

              {filteredItems.length === 0 && query && (
                <div className="px-4 py-8 text-center text-muted-foreground/60">
                  <Search className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30" />
                  <p className="font-mono text-sm">No commands found for &ldquo;{query}&rdquo;</p>
                </div>
              )}

              {filteredItems.length === 0 && !query && (
                <div className="px-4 py-8 text-center text-muted-foreground/60">
                  <Sparkles className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30 animate-pulse" />
                  <p className="font-mono text-sm">Type to search commands</p>
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center justify-between border-t border-border/30 px-4 py-2 text-[10px] font-mono text-muted-foreground/50">
              <div className="flex items-center gap-3">
                <span>↑↓</span> Navigate
                <span className="mx-1">·</span>
                <span>⏎</span> Execute
                <span className="mx-1">·</span>
                <span>Esc</span> Close
              </div>
              <span className="flex items-center gap-1">
                <Command className="h-3 w-3" />
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-border/30">K</kbd>
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") {
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle, close]);

  return { isOpen, open, close, toggle };
}

export function createDefaultCommands(actions: {
  newChat: () => void;
  deleteChat: () => void;
  regenerate: () => void;
  copyLast: () => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  focusMode: () => void;
  shortcuts: () => void;
  settings: () => void;
  toggleSound: () => void;
}): CommandItem[] {
  return [
    {
      id: "new-chat",
      label: "New Chat",
      description: "Start a fresh conversation",
      shortcut: "⌘N",
      icon: <Plus className="h-4 w-4" />,
      section: "Chat",
      action: actions.newChat,
      keywords: ["new", "chat", "conversation", "start", "fresh"],
    },
    {
      id: "delete-chat",
      label: "Delete Current Chat",
      description: "Remove the current conversation",
      shortcut: "⌘⇧D",
      icon: <Trash2 className="h-4 w-4" />,
      section: "Chat",
      action: actions.deleteChat,
      keywords: ["delete", "remove", "chat", "conversation"],
    },
    {
      id: "regenerate",
      label: "Regenerate Response",
      description: "Get a new answer for the last message",
      shortcut: "⌘⇧R",
      icon: <RotateCcw className="h-4 w-4" />,
      section: "Chat",
      action: actions.regenerate,
      keywords: ["regenerate", "retry", "redo", "again"],
    },
    {
      id: "copy-last",
      label: "Copy Last Response",
      description: "Copy the last AI response to clipboard",
      shortcut: "⌘⇧C",
      icon: <Copy className="h-4 w-4" />,
      section: "Chat",
      action: actions.copyLast,
      keywords: ["copy", "clipboard", "last", "response"],
    },
    {
      id: "toggle-theme",
      label: "Toggle Theme",
      description: "Switch between light and dark mode",
      shortcut: "⌘⇧T",
      icon: <Sun className="h-4 w-4" />,
      section: "Appearance",
      action: actions.toggleTheme,
      keywords: ["theme", "dark", "light", "mode", "toggle"],
    },
    {
      id: "toggle-sidebar",
      label: "Toggle Sidebar",
      description: "Show or hide the chat sidebar",
      shortcut: "⌘B",
      icon: <MessageSquare className="h-4 w-4" />,
      section: "Appearance",
      action: actions.toggleSidebar,
      keywords: ["sidebar", "menu", "sessions", "toggle", "hide", "show"],
    },
    {
      id: "focus-mode",
      label: "Toggle Focus Mode",
      description: "Distraction-free reading mode",
      shortcut: "⌘⇧F",
      icon: <Terminal className="h-4 w-4" />,
      section: "Appearance",
      action: actions.focusMode,
      keywords: ["focus", "mode", "distraction", "reading", "zen"],
    },
    {
      id: "toggle-sound",
      label: "Toggle Sound Effects",
      description: "Enable or disable UI sound effects",
      shortcut: "⌘⇧S",
      icon: <Volume2 className="h-4 w-4" />,
      section: "Appearance",
      action: actions.toggleSound,
      keywords: ["sound", "audio", "effects", "toggle", "mute", "unmute"],
    },
    {
      id: "shortcuts",
      label: "Keyboard Shortcuts",
      description: "Show all available shortcuts",
      shortcut: "⌘/",
      icon: <Keyboard className="h-4 w-4" />,
      section: "Help",
      action: actions.shortcuts,
      keywords: ["shortcuts", "keys", "keyboard", "help", "commands"],
    },
    {
      id: "settings",
      label: "Settings",
      description: "Open settings panel",
      shortcut: "⌘,",
      icon: <Settings className="h-4 w-4" />,
      section: "Help",
      action: actions.settings,
      keywords: ["settings", "preferences", "config", "options"],
    },
    {
      id: "help",
      label: "Help & Documentation",
      description: "View help and documentation",
      shortcut: "F1",
      icon: <HelpCircle className="h-4 w-4" />,
      section: "Help",
      action: () => window.open("https://github.com", "_blank"),
      keywords: ["help", "docs", "documentation", "guide", "support"],
    },
  ];
}