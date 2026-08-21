"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ThinkingIndicatorProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function ThinkingIndicator({ className, size = "md", showText = false }: ThinkingIndicatorProps) {
  const sizes = {
    sm: { dotSize: 6, gap: 3, textSize: "text-[10px]" },
    md: { dotSize: 8, gap: 4, textSize: "text-xs" },
    lg: { dotSize: 10, gap: 5, textSize: "text-sm" },
  };

  const { dotSize, gap, textSize } = sizes[size];

  return (
    <motion.div
      className={cn("flex items-center gap-1.5", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center gap-1" role="status" aria-label="AI is thinking">
        <motion.span
          className={cn("rounded-full bg-primary", `h-[${dotSize}px] w-[${dotSize}px]`)}
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
        />
        <motion.span
          className={cn("rounded-full bg-primary", `h-[${dotSize}px] w-[${dotSize}px]`)}
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
        />
        <motion.span
          className={cn("rounded-full bg-primary", `h-[${dotSize}px] w-[${dotSize}px]`)}
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
        />
      </div>
      {showText && (
        <span className={cn("font-mono text-muted-foreground", textSize)}>
          thinking...
        </span>
      )}
    </motion.div>
  );
}

interface ThinkingBubbleProps {
  className?: string;
  steps?: string[];
  currentStep?: number;
}

export function ThinkingBubble({ className, steps = ["Analyzing...", "Planning...", "Generating..."], currentStep = 0 }: ThinkingBubbleProps) {
  return (
    <motion.div
      className={cn("flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/10", className)}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="flex shrink-0 items-center justify-center mt-0.5">
        <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/60 to-primary/30">
          <motion.div
            className="absolute inset-0 rounded-lg border-2 border-primary/40"
            animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-lg border-2 border-primary/30"
            animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          <motion.svg
            className="h-4 w-4 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <path d="M21 12.79A9 9 0 1 1 12.21 3 7 7 0 0 0 21 12.79z" />
          </motion.svg>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-mono text-xs text-muted-foreground mb-1.5">
          <span className="text-primary font-medium">yashu</span> is thinking
        </div>

        <div className="space-y-1.5" role="list" aria-label="Thinking steps">
          {steps.map((step, i) => (
            <motion.div
              key={step}
              className={cn(
                "flex items-center gap-2 font-mono text-xs",
                i < currentStep ? "text-green-400" : i === currentStep ? "text-foreground" : "text-muted-foreground/50"
              )}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: i <= currentStep ? 1 : 0.4, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <motion.span
                className={cn("flex h-3 w-3 items-center justify-center rounded font-medium text-[10px]", {
                  "bg-green-500 text-white": i < currentStep,
                  "bg-primary text-white animate-pulse": i === currentStep,
                  "border border-muted-foreground/30": i > currentStep,
                })}
              >
                {i < currentStep ? "✓" : i === currentStep ? (
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    …
                  </motion.span>
                ) : (
                  `${i + 1}`
                )}
              </motion.span>
              <span>{step}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

interface ThinkingDotsProps {
  className?: string;
  color?: string;
  count?: number;
}

export function ThinkingDots({ className, color = "hsl(var(--primary))", count = 3 }: ThinkingDotsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)} role="status" aria-label="Processing">
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          className="rounded-full"
          style={{
            width: 6,
            height: 6,
            backgroundColor: color,
          }}
          animate={{
            y: [0, -8, 0],
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.12,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

interface StreamingCursorProps {
  className?: string;
  color?: string;
}

export function StreamingCursor({ className, color = "hsl(var(--primary))" }: StreamingCursorProps) {
  return (
    <motion.span
      className={cn("inline-block h-4 w-px align-middle ml-0.5", className)}
      style={{ backgroundColor: color }}
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    />
  );
}