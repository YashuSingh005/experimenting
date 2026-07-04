"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Copy, Check, User, Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group flex gap-4 px-4 py-6 md:px-0",
        role === "assistant" && "bg-white/[0.02]",
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            role === "assistant"
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {role === "assistant" ? (
            <Bot className="h-4 w-4" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="text-sm font-medium text-white">
          {role === "assistant" ? "YASHU" : "You"}
        </div>

        <div className="prose prose-invert max-w-none text-sm leading-7 text-muted-foreground">
          {role === "assistant" && !content && isStreaming ? (
            <span className="inline-flex gap-1">
              <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
              <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
              <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
            </span>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code
                        className="rounded bg-white/10 px-1.5 py-0.5 text-sm font-mono text-primary"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="relative my-3">
                      <div className="flex items-center justify-between rounded-t-lg bg-white/5 px-4 py-2 text-xs text-muted-foreground">
                        <span>{className?.replace("language-", "") ?? "code"}</span>
                        <button
                          onClick={() => {
                            const text = String(children).replace(/\n$/, "");
                            navigator.clipboard.writeText(text);
                          }}
                          className="hover:text-white"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <pre className="!mt-0 rounded-t-none !bg-black/50">
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
            className="flex items-center gap-1.5 text-xs text-muted-foreground opacity-0 transition-all hover:text-white group-hover:opacity-100"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
