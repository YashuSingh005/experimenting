"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Copy, Check, Maximize2, Minimize2, FileCode } from "lucide-react";
import toast from "react-hot-toast";

interface CodeBlockProps {
  code: string;
  language?: string;
  fileName?: string;
  showLineNumbers?: boolean;
  maxHeight?: number;
  defaultExpanded?: boolean;
}

export function CodeBlock({
  code,
  language = "",
  fileName,
  showLineNumbers = true,
  maxHeight = 400,
  defaultExpanded = false,
}: CodeBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const [copiedLine, setCopiedLine] = useState<number | null>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lines = code.split("\n");
  const lineCount = lines.length;

  const handleCopy = async (text?: string | React.MouseEvent<HTMLButtonElement>) => {
    const textToCopy = typeof text === "string" ? text : code;
    try {
      await navigator.clipboard.writeText(textToCopy);
      if (typeof text === "string") {
        setCopiedLine(Number(text.split("\n")[0].split(" ")[0]) || 1);
        setTimeout(() => setCopiedLine(null), 1500);
      } else {
        setCopied(true);
        toast.success(`Copied ${lineCount} lines`);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleExpand = () => {
    setExpanded((prev) => !prev);
  };

  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      js: "JavaScript",
      ts: "TypeScript",
      tsx: "TSX",
      jsx: "JSX",
      py: "Python",
      rs: "Rust",
      go: "Go",
      java: "Java",
      cpp: "C++",
      c: "C",
      cs: "C#",
      php: "PHP",
      rb: "Ruby",
      swift: "Swift",
      kt: "Kotlin",
      sh: "Shell",
      bash: "Bash",
      zsh: "Zsh",
      fish: "Fish",
      ps1: "PowerShell",
      sql: "SQL",
      html: "HTML",
      css: "CSS",
      scss: "SCSS",
      json: "JSON",
      yaml: "YAML",
      yml: "YAML",
      toml: "TOML",
      xml: "XML",
      md: "Markdown",
      dockerfile: "Dockerfile",
      makefile: "Makefile",
    };
    return labels[lang.toLowerCase()] || lang.toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "rounded-xl border border-border/60 overflow-hidden bg-[#0a0a0f]",
        expanded && "max-h-none",
        !expanded && `max-h-[${maxHeight}px]`
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-white/[0.04] px-3 py-2 border-b border-border/40">
        <div className="flex items-center gap-3">
          <FileCode className="h-3.5 w-3.5 text-muted-foreground/60" />
          {fileName && (
            <span className="font-mono text-[11px] text-muted-foreground/80 truncate max-w-[150px]">
              {fileName}
            </span>
          )}
          <span className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 bg-white/5 border border-border/30">
            {getLanguageLabel(language)}
          </span>
          {lineCount > 50 && (
            <span className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono text-muted-foreground/60 bg-white/5 border border-border/30">
              {lineCount} lines
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            disabled={copied}
            className={cn(
              "flex items-center gap-1 rounded-md p-1.5 text-[11px] font-mono text-muted-foreground/60 transition-all hover:text-foreground hover:bg-accent",
              copied && "text-green-500"
            )}
            aria-label={copied ? "Copied" : "Copy code"}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copied ? "copied" : "copy"}</span>
          </motion.button>

          {lineCount > 30 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleExpand}
              className="flex items-center gap-1 rounded-md p-1.5 text-[11px] font-mono text-muted-foreground/60 transition-all hover:text-foreground hover:bg-accent"
              aria-label={expanded ? "Collapse code" : "Expand code"}
            >
              {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </motion.button>
          )}
        </div>
      </div>

      {/* Code content */}
      <div className="relative">
        {/* Line numbers gutter */}
        {showLineNumbers && (
          <div
            className="absolute left-0 top-0 bottom-0 w-10 border-r border-border/30 bg-white/[0.02] overflow-hidden"
            aria-hidden="true"
          >
            <div className="h-full px-2 pt-3 text-right font-mono text-[11.5px] text-muted-foreground/40 select-none leading-[1.6]">
              {Array.from({ length: lineCount }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-[1.6rem] transition-colors",
                    copiedLine === i + 1 && "text-green-500 font-medium"
                  )}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Code with copy line on hover */}
        <pre
          ref={preRef}
          className={cn(
            "!my-0 !rounded-none !border-0 !bg-transparent !p-0 overflow-x-auto",
            showLineNumbers && "pl-10"
          )}
          style={{ padding: "1rem 1rem 1rem 1rem" }}
        >
          <code className={cn(language && `language-${language}`)}>
            {lines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  "relative group h-[1.6rem] leading-[1.6] transition-colors",
                  copiedLine === i + 1 && "bg-green-500/10"
                )}
              >
                <span className="inline-block w-full" />
                <AnimatePresence>
                  {copiedLine === i + 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="absolute right-2 top-0 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono text-green-500 bg-green-500/10 border border-green-500/20"
                    >
                      <Check className="h-2.5 w-2.5" />
                      copied
                    </motion.div>
                  )}
                </AnimatePresence>
                {line}
              </div>
            ))}
          </code>
        </pre>

        {/* Fade overlay when collapsed */}
        {!expanded && lineCount > 30 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none"
          />
        )}
      </div>
    </motion.div>
  );
}

interface InlineCodeProps {
  children: ReactNode;
  className?: string;
}

export function InlineCode({ children, className }: InlineCodeProps) {
  return (
    <code className={cn("rounded-md border border-primary/15 bg-primary/10 px-1.5 py-0.5 text-[13px] font-mono text-primary", className)}>
      {children}
    </code>
  );
}

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  cursor?: boolean;
  cursorColor?: string;
}

export function Typewriter({
  text,
  speed = 15,
  onComplete,
  className,
  cursor = true,
  cursorColor = "hsl(var(--primary))",
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
    setIsComplete(false);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const typeNextChar = () => {
      if (currentIndex < text.length) {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
        timeoutRef.current = setTimeout(typeNextChar, speed);
      } else {
        setIsComplete(true);
        onComplete?.();
      }
    };

    typeNextChar();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, speed, onComplete]);

  return (
    <span className={cn("font-mono", className)}>
      {displayedText}
      {cursor && !isComplete && (
        <motion.span
          className="relative inline-block h-4 w-px ml-0.5 align-middle"
          style={{ backgroundColor: cursorColor }}
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  className?: string;
}

export function StreamingText({ text, isStreaming, className }: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const targetTextRef = useRef(text);
  const animationRef = useRef<number>();

  useEffect(() => {
    targetTextRef.current = text;
  }, [text]);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(text);
      return;
    }

    setCursorVisible(true);
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, [isStreaming]);

  useEffect(() => {
    if (!isStreaming) return;

    const animate = () => {
      if (displayedText.length < targetTextRef.current.length) {
        setDisplayedText(targetTextRef.current.slice(0, displayedText.length + 1));
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current!);
  }, [isStreaming, displayedText.length]);

  return (
    <span className={cn(className)}>
      {displayedText}
      {isStreaming && (
        <motion.span
          className="relative inline-block h-4 w-px ml-0.5 align-middle"
          style={{ backgroundColor: "hsl(var(--primary))" }}
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.53, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
      )}
    </span>
  );
}