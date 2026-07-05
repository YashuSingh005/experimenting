"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  icon,
  className,
  loading,
}: StatsCardProps) {
  if (loading) {
    return (
      <div className="rounded-md border border-border bg-card p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-6 w-28 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-md border border-border bg-card p-4 transition-all hover:border-muted-foreground/20",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground">{title}</p>
          <div className="font-mono text-xl font-semibold text-foreground">
            {value}
          </div>
        </div>
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
