"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat, type AgentActivity } from "./chat-store";
import { cn } from "@/lib/utils";
import { Network, CheckCircle2, Loader2, XCircle, GripHorizontal, X } from "lucide-react";

const statusIcons: Record<string, React.ReactNode> = {
  thinking: <Loader2 className="h-2.5 w-2.5 animate-spin text-yellow-400" />,
  working: <Loader2 className="h-2.5 w-2.5 animate-spin text-blue-400" />,
  done: <CheckCircle2 className="h-2.5 w-2.5 text-green-400" />,
  error: <XCircle className="h-2.5 w-2.5 text-red-400" />,
};

const statusDots: Record<string, string> = {
  thinking: "bg-yellow-400",
  working: "bg-blue-400",
  done: "bg-green-400",
  error: "bg-red-400",
};

function MiniAgentRow({
  name,
  status,
}: {
  name: string;
  status: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDots[status] ?? "bg-muted-foreground/30")} />
      <span className="truncate text-[10px] font-mono text-muted-foreground/80">{name}</span>
      <span className="ml-auto">{statusIcons[status]}</span>
    </div>
  );
}

export function AgentVisualizer() {
  const { agentActivities, streaming } = useChat();
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [agentActivities]);

  useEffect(() => {
    if (!streaming && !collapsed) {
      const timer = setTimeout(() => setCollapsed(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [streaming, collapsed]);

  useEffect(() => {
    if (agentActivities.length > 0 && streaming) {
      setDismissed(false);
      setCollapsed(false);
    }
  }, [agentActivities.length, streaming]);

  if (agentActivities.length === 0 || dismissed) return null;

  const agentStatuses = agentActivities
    .filter((a) => a.type === "agent_status" && a.status)
    .reduce(
      (acc, a) => {
        const s = a.status!;
        acc[s.agentId] = s;
        return acc;
      },
      {} as Record<string, NonNullable<AgentActivity["status"]>>,
    );
  const comms = agentActivities.filter((a) => a.type === "agent_comms" && a.comms).length;
  const doneCount = Object.values(agentStatuses).filter((s) => s.status === "done").length;
  const totalCount = Object.keys(agentStatuses).length;

  return (
    <div className="sticky top-3 z-30 flex justify-end px-2 sm:px-4">
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        className="w-64"
      >
      <div className="overflow-hidden rounded-lg border border-border/80 bg-card/80 shadow-lg shadow-black/30 backdrop-blur-md">
        {/* Header bar */}
        <div className="flex items-center gap-1.5 border-b border-border/50 px-2.5 py-1.5">
          <GripHorizontal className="h-3 w-3 text-primary/60" />
          <span className="text-[10px] font-mono font-medium text-foreground/70">
            agents {doneCount}/{totalCount}
          </span>
          {comms > 0 && (
            <span className="text-[9px] text-muted-foreground/50">
              · {comms} msg
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground"
            >
              <Network className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              ref={scrollRef}
              initial={{ height: 0 }}
              animate={{ height: "auto", maxHeight: 200 }}
              exit={{ height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-y-auto overscroll-contain"
            >
              <div className="space-y-1 p-2">
                {Object.entries(agentStatuses).map(([id, s]) => (
                  <MiniAgentRow key={id} name={s.agentName} status={s.status} />
                ))}

                {streaming && totalCount > 0 && (
                  <div className="pt-1 text-center">
                    <span className="animate-pulse text-[9px] font-mono text-muted-foreground/40">
                      {streaming ? "processing..." : "\u00a0"}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </motion.div>
    </div>
  );
}
