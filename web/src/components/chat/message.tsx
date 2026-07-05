"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group flex gap-3 px-2 py-4 sm:px-4 sm:py-5",
        role === "assistant" && "bg-white/[0.015]",
      )}
    >
      {/* Role indicator */}
      <div className="flex shrink-0 items-start pt-0.5">
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-mono font-bold",
            role === "assistant"
              ? "bg-primary/10 text-primary"
              : "bg-accent text-muted-foreground",
          )}
        >
          {role === "assistant" ? "A" : "U"}
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-medium text-muted-foreground">
            {role === "assistant" ? "assistant" : "user"}
          </span>
          {role === "assistant" && !content && isStreaming && (
            <span className="inline-flex gap-0.5">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
          )}
        </div>

        <div className="prose prose-invert max-w-none text-sm leading-relaxed text-foreground/85">
          {role === "assistant" && !content && isStreaming ? null : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code
                        className="rounded bg-white/8 px-1.5 py-0.5 text-sm font-mono text-primary"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="relative my-3">
                      <div className="flex items-center justify-between rounded-t-md bg-white/[0.03] px-3 py-1.5 text-[11px] font-mono text-muted-foreground">
                        <span>
                          {className?.replace("language-", "") ?? "code"}
                        </span>
                        <button
                          onClick={() => {
                            const text = String(children).replace(/\n$/, "");
                            navigator.clipboard.writeText(text);
                          }}
                          className="hover:text-foreground"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <pre className="!mt-0 rounded-t-none !bg-black/60">
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
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>

        {!isStreaming && content && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-muted-foreground opacity-0 transition-all hover:text-foreground group-hover:opacity-100"
          >
            {copied ? (
              <><Check className="h-3 w-3 text-green-500" /><span className="text-green-500">copied</span></>
            ) : (
              <><Copy className="h-3 w-3" /><span>copy</span></>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
