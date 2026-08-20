"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import { Copy, Check, Sparkles, User } from "lucide-react";

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
                      return (
                        <code
                          className="rounded-md border border-primary/15 bg-primary/10 px-1.5 py-0.5 text-[13px] font-mono text-primary"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return (
                      <div className="relative my-3 overflow-hidden rounded-xl border border-border/60">
                        <div className="flex items-center justify-between bg-white/[0.04] px-3 py-1.5">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {className?.replace("language-", "").split(" ")[0] ?? "code"}
                          </span>
                          <button
                            onClick={() => {
                              const text = String(children).replace(/\n$/, "");
                              navigator.clipboard.writeText(text);
                            }}
                            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                            aria-label="Copy code"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        <pre className="!my-0 !rounded-none !border-0 !bg-[#0a0a0f] !p-3 text-[12.5px]">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
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
            </div>
          )}
        </div>

        {/* Copy button (assistant) */}
        {isAssistant && !isStreaming && content && (
          <button
            onClick={handleCopy}
            className="mt-1 ml-1 flex items-center gap-1 text-[11px] text-muted-foreground opacity-0 transition-all hover:text-foreground group-hover:opacity-100"
          >
            {copied ? (
              <><Check className="h-3 w-3 text-green-500" /><span className="text-green-500">copied</span></>
            ) : (
              <><Copy className="h-3 w-3" /><span>copy</span></>
            )}
          </button>
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