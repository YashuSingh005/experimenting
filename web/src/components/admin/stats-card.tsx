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
      <div className="glass rounded-xl border border-white/5 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="h-8 w-32 rounded bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass rounded-xl border border-white/5 p-6 transition-all duration-300 hover:border-white/10",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="text-3xl font-bold text-white">{value}</div>
        </div>
        <div className="rounded-lg bg-primary/10 p-3 text-primary">{icon}</div>
      </div>
    </motion.div>
  );
}
