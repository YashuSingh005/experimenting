"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StatsCard } from "@/components/admin/stats-card";
import {
  Users,
  MessageSquare,
  Bot,
  Activity,
  HardDrive,
  Cpu,
  Database,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface DashboardData {
  totalUsers: number;
  todayMessages: number;
  totalChats: number;
  aiStatus: "online" | "offline" | "error";
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  projectStatus: "healthy" | "warning" | "error";
}

const defaultData: DashboardData = {
  totalUsers: 0,
  todayMessages: 0,
  totalChats: 0,
  aiStatus: "online",
  memoryUsage: 0,
  cpuUsage: 0,
  diskUsage: 0,
  projectStatus: "healthy",
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>(defaultData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColor: Record<string, string> = {
    online: "text-green-400",
    offline: "text-red-400",
    error: "text-red-500",
  };

  const projectStatusIcon: Record<string, React.ReactNode> = {
    healthy: (
      <span className="flex items-center gap-2 text-green-400">
        <CheckCircle2 className="h-5 w-5" />
        Healthy
      </span>
    ),
    warning: (
      <span className="flex items-center gap-2 text-yellow-400">
        <AlertCircle className="h-5 w-5" />
        Warning
      </span>
    ),
    error: (
      <span className="flex items-center gap-2 text-red-500">
        <AlertCircle className="h-5 w-5" />
        Error
      </span>
    ),
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your AI platform
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={data.totalUsers}
          icon={<Users className="h-5 w-5" />}
          loading={loading}
        />
        <StatsCard
          title="Today's Messages"
          value={data.todayMessages}
          icon={<MessageSquare className="h-5 w-5" />}
          loading={loading}
        />
        <StatsCard
          title="Total Chats"
          value={data.totalChats}
          icon={<Bot className="h-5 w-5" />}
          loading={loading}
        />
        <StatsCard
          title="AI Status"
          value={
            <span className={statusColor[data.aiStatus]}>
              {data.aiStatus.charAt(0).toUpperCase() + data.aiStatus.slice(1)}
            </span>
          }
          icon={<Activity className="h-5 w-5" />}
          loading={loading}
        />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">
          System Status
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Memory Usage"
            value={`${data.memoryUsage}%`}
            icon={<Database className="h-5 w-5" />}
            loading={loading}
          />
          <StatsCard
            title="CPU Usage"
            value={`${data.cpuUsage}%`}
            icon={<Cpu className="h-5 w-5" />}
            loading={loading}
          />
          <StatsCard
            title="Disk Usage"
            value={`${data.diskUsage}%`}
            icon={<HardDrive className="h-5 w-5" />}
            loading={loading}
          />
          <StatsCard
            title="Project Status"
            value={projectStatusIcon[data.projectStatus] ?? "Unknown"}
            icon={<Activity className="h-5 w-5" />}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
