"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, Copy, RotateCcw, Flag, Share2, Check, Heart, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

interface MessageActionsProps {
  messageId: string;
  content: string;
  role: "user" | "assistant";
  onRegenerate?: () => void;
  onCopy?: () => void;
  isStreaming?: boolean;
  className?: string;
}

export function MessageActions({
  messageId,
  content,
  role,
  onRegenerate,
  onCopy,
  isStreaming,
  className,
}: MessageActionsProps) {
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null);
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleReaction = (type: "like" | "dislike") => {
    if (reaction === type) {
      setReaction(null);
      toast.success(type === "like" ? "Removed like" : "Removed dislike");
    } else {
      setReaction(type);
      toast.success(type === "like" ? "Thanks for the feedback!" : "We'll do better next time");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Yashu AI Response",
          text: content.slice(0, 200),
        });
      } else {
        await navigator.clipboard.writeText(content);
        toast.success("Copied for sharing");
      }
    } catch {
      toast.error("Failed to share");
    }
  };

  const handleFlag = () => {
    toast.success("Message flagged for review");
  };

  if (role === "user") {
    return (
      <div
        className={cn(
          "flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100",
          className
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, x: 8, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-0.5"
            >
              <button
                onClick={handleCopy}
                className={cn(
                  "rounded-md p-1.5 text-muted-foreground/60 transition-all hover:text-foreground hover:bg-accent",
                  copied && "text-green-500"
                )}
                aria-label={copied ? "Copied" : "Copy message"}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={handleShare}
                className="rounded-md p-1.5 text-muted-foreground/60 transition-all hover:text-foreground hover:bg-accent"
                aria-label="Share message"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100",
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, x: 8, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-0.5"
          >
            <button
              onClick={() => handleReaction("like")}
              className={cn(
                "rounded-md p-1.5 text-muted-foreground/60 transition-all hover:bg-accent",
                reaction === "like" && "text-green-500 bg-green-500/10"
              )}
              aria-label={reaction === "like" ? "Remove like" : "Like response"}
              aria-pressed={reaction === "like"}
            >
              <Heart
                className={cn("h-3.5 w-3.5 transition-transform", reaction === "like" && "fill-current scale-110")}
                strokeWidth={2.5}
              />
            </button>

            <button
              onClick={() => handleReaction("dislike")}
              className={cn(
                "rounded-md p-1.5 text-muted-foreground/60 transition-all hover:bg-accent",
                reaction === "dislike" && "text-red-500 bg-red-500/10"
              )}
              aria-label={reaction === "dislike" ? "Remove dislike" : "Dislike response"}
              aria-pressed={reaction === "dislike"}
            >
              <ThumbsDown className={cn("h-3.5 w-3.5", reaction === "dislike" && "fill-current")} strokeWidth={2.5} />
            </button>

            {onRegenerate && !isStreaming && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onRegenerate}
                className="rounded-md p-1.5 text-muted-foreground/60 transition-all hover:text-foreground hover:bg-accent"
                aria-label="Regenerate response"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </motion.button>
            )}

            <button
              onClick={handleCopy}
              className={cn(
                "rounded-md p-1.5 text-muted-foreground/60 transition-all hover:text-foreground hover:bg-accent",
                copied && "text-green-500"
              )}
              aria-label={copied ? "Copied" : "Copy response"}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={handleShare}
              className="rounded-md p-1.5 text-muted-foreground/60 transition-all hover:text-foreground hover:bg-accent"
              aria-label="Share response"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleFlag}
              className="rounded-md p-1.5 text-muted-foreground/60 transition-all hover:text-red-400 hover:bg-red-500/10"
              aria-label="Flag response"
            >
              <Flag className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ReactionSummaryProps {
  likes: number;
  dislikes: number;
  userReaction?: "like" | "dislike" | null;
  onLike?: () => void;
  onDislike?: () => void;
  className?: string;
}

export function ReactionSummary({
  likes,
  dislikes,
  userReaction,
  onLike,
  onDislike,
  className,
}: ReactionSummaryProps) {
  const total = likes + dislikes;
  const likePercent = total > 0 ? (likes / total) * 100 : 50;

  return (
    <motion.div
      className={cn("flex items-center gap-3 px-2 py-1.5 rounded-lg bg-card/50 border border-border/50", className)}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onLike}
        className={cn(
          "flex items-center gap-1 rounded px-2 py-1 text-sm font-medium transition-colors",
          userReaction === "like"
            ? "text-green-500 bg-green-500/10"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
        aria-label={`Like (${likes})`}
        aria-pressed={userReaction === "like"}
      >
        <Heart
          className={cn("h-3.5 w-3.5", userReaction === "like" && "fill-current")}
          strokeWidth={2.5}
        />
        <span className="font-mono">{likes}</span>
      </motion.button>

      <div className="relative h-1.5 flex-1 max-w-24 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={Math.round(likePercent)} aria-valuemin={0} aria-valuemax={100}>
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: likePercent / 100 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
          style={{ transformOrigin: "left" }}
        />
      </div>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onDislike}
        className={cn(
          "flex items-center gap-1 rounded px-2 py-1 text-sm font-medium transition-colors",
          userReaction === "dislike"
            ? "text-red-500 bg-red-500/10"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
        aria-label={`Dislike (${dislikes})`}
        aria-pressed={userReaction === "dislike"}
      >
        <ThumbsDown className={cn("h-3.5 w-3.5", userReaction === "dislike" && "fill-current")} strokeWidth={2.5} />
        <span className="font-mono">{dislikes}</span>
      </motion.button>
    </motion.div>
  );
}