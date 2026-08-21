"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import { Copy, Check, Sparkles, User, RotateCcw, Heart, ThumbsDown, Share2, Flag, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { CodeBlock, InlineCode } from "@/components/ui/code-block";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: MessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAssistant = role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={cn(
        "group flex w-full gap-2.5 py-2.5 sm:gap-3 sm:py-4",
        isAssistant ? "justify-start" : "justify-end",
      )}
    >
      {/* Assistant avatar */}
      {isAssistant && (
        <div className="flex shrink-0 items-start pt-0.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/80 to-primary/40 shadow-[0_0_14px_rgba(121,98,255,0.35)] sm:h-8 sm:w-8">
            <Sparkles className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
          </div>
        </div>
      )}

      {/* Message body */}
      <div className={cn("min-w-0 max-w-[88%] sm:max-w-[78%]")}>
        {/* Header row */}
        <div className={cn("mb-1 flex items-center gap-2 px-0.5", !isAssistant && "justify-end")}>
          <span className="font-mono text-[11px] font-semibold tracking-wide text-muted-foreground">
            {isAssistant ? (
              <>
                yashu
                <span className="ml-1.5 inline-flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-1.5 py-px text-[9px] font-medium text-green-400">
                  <span className="h-1 w-1 rounded-full bg-green-400" />
                  online
                </span>
              </>
            ) : (
              "you"
            )}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed transition-colors sm:px-4 sm:py-3",
            isAssistant
              ? "border border-border/70 bg-card/50 text-foreground/90 backdrop-blur-sm hover:border-primary/30"
              : "bubble-shimmer border border-primary/25 bg-gradient-to-br from-primary/25 to-primary/10 text-foreground",
          )}
        >
          {/* Accent line on assistant messages */}
          {isAssistant && (
            <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-gradient-to-b from-primary/70 to-primary/20" />
          )}

          {/* Streaming skeleton */}
          {isAssistant && !content && isStreaming ? (
            <span className="inline-flex gap-1 py-1">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
          ) : (
            <div className="prose prose-invert max-w-none text-sm text-foreground/90 [overflow-wrap:anywhere]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code({ className, children, ...props }) {
                    const isInline = !className?.includes("language-") && !className?.includes("hljs");
                    if (isInline) {
                      return <InlineCode>{children}</InlineCode>;
                    }
                    const language = className?.replace("language-", "").split(" ")[0] ?? "";
                    const codeText = String(children).replace(/\n$/, "");
                    return (
                      <CodeBlock
                        code={codeText}
                        language={language}
                        showLineNumbers={true}
                        maxHeight={400}
                      />
                    );
                  },
                  pre({ children }) {
                    return <>{children}</>;
                  },
                  p({ children }) {
                    return <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="my-1.5 list-disc space-y-1 pl-4">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="my-1.5 list-decimal space-y-1 pl-4">{children}</ol>;
                  },
                  li({ children }) {
                    return <li className="marker:text-primary/60">{children}</li>;
                  },
                  a({ children, ...props }) {
                    return (
                      <a {...props} className="text-primary underline underline-offset-2 hover:brightness-125">
                        {children}
                      </a>
                    );
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="my-2 border-l-2 border-primary/40 pl-3 text-muted-foreground">
                        {children}
                      </blockquote>
                    );
                  },
                  h1: (p) => <h1 className="mb-2 mt-3 text-lg font-bold" {...p} />,
                  h2: (p) => <h2 className="mb-2 mt-3 text-base font-bold" {...p} />,
                  h3: (p) => <h3 className="mb-1.5 mt-2.5 text-sm font-bold" {...p} />,
                  table: (p) => (
                    <table className="my-2 w-full overflow-hidden rounded-lg border border-border/60 text-xs" {...p} />
                  ),
                  th: (p) => <th className="border border-border/60 bg-white/[0.04] px-2 py-1.5 text-left font-semibold" {...p} />,
                  td: (p) => <td className="border border-border/60 px-2 py-1.5" {...p} />,
                }}
              >
                {content}
              </ReactMarkdown>
              {isStreaming && content && (
                <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-[pulse-subtle_0.8s_ease-in-out_infinite] rounded-sm bg-primary/80" />
              )}
              {!isStreaming && content && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 rounded-sm bg-primary/80"
                />
              )}
            </div>
          )}
        </div>

        {/* Message Actions (assistant) */}
        {isAssistant && !isStreaming && content && (
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const text = content.replace(/\n$/, "");
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  toast.success("Copied to clipboard");
                }}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-mono text-muted-foreground/60 transition-all hover:text-foreground hover:bg-accent",
                  copied && "text-green-500"
                )}
                aria-label={copied ? "Copied" : "Copy response"}
              >
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "copied" : "copy"}</span>
              </button>

              <button
                onClick={() => {
                  navigator.share?.({ title: "Yashu AI Response", text: content.slice(0, 200) })
                    .catch(() => navigator.clipboard.writeText(content))
                    .then(() => toast.success("Copied for sharing"))
                    .catch(() => toast.error("Failed to share"));
                }}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-mono text-muted-foreground/60 transition-all hover:text-foreground hover:bg-accent"
                aria-label="Share response"
              >
                <Share2 className="h-3 w-3" />
                <span>share</span>
              </button>

              <button
                onClick={() => toast.success("Message flagged for review")}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-mono text-muted-foreground/60 transition-all hover:text-red-400 hover:bg-red-500/10"
                aria-label="Flag response"
              >
                <Flag className="h-3 w-3" />
                <span>flag</span>
              </button>
            </div>

            <button
              onClick={() => {
                const event = new CustomEvent("yashu:regenerate", { detail: { messageId: Date.now() } });
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-mono text-muted-foreground/60 transition-all hover:text-foreground hover:bg-accent"
              aria-label="Regenerate response"
            >
              <RotateCcw className="h-3 w-3" />
              <span>retry</span>
            </button>
          </div>
        )}

        {/* Reaction buttons (assistant) */}
        {isAssistant && !isStreaming && content && (
          <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
            <button
              onClick={() => toast.success("Thanks for the feedback!")}
              className="rounded-md p-1.5 text-muted-foreground/50 transition-all hover:text-green-500 hover:bg-green-500/10"
              aria-label="Like response"
            >
              <Heart className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => toast.success("We'll do better next time")}
              className="rounded-md p-1.5 text-muted-foreground/50 transition-all hover:text-red-500 hover:bg-red-500/10"
              aria-label="Dislike response"
            >
              <ThumbsDown className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* User avatar */}
      {!isAssistant && (
        <div className="flex shrink-0 items-start pt-0.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-white/[0.05] sm:h-8 sm:w-8">
            <User className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
          </div>
        </div>
      )}
    </motion.div>
  );
}