import { createAdminClient } from "@/lib/supabase/admin";
import type { LogEntry } from "@/types";

export class LogService {
  async log(params: {
    userId?: string;
    action: string;
    details?: string;
    ip?: string;
  }): Promise<void> {
    const supabase = createAdminClient();
    await supabase.from("logs").insert({
      user_id: params.userId,
      action: params.action,
      details: params.details,
      ip: params.ip,
    });
  }

  async getLogs(limit = 100, offset = 0): Promise<LogEntry[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data ?? [];
  }
}

export const logService = new LogService();
