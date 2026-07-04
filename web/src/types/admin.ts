export interface SystemStats {
  totalUsers: number;
  todayMessages: number;
  totalChats: number;
  aiStatus: "online" | "offline" | "error";
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  projectStatus: "healthy" | "warning" | "error";
}

export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  modifiedAt?: string;
  children?: FileEntry[];
}

export interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  exitCode: number | null;
  timestamp: string;
  user: string;
  workingDirectory: string;
}

export interface DashboardCard {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  trend?: "up" | "down" | "neutral";
}
