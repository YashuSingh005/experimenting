import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { getSession } from "@/middleware/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { execSync } from "node:child_process";
import { cpus, freemem, totalmem } from "node:os";

export async function GET(request: NextRequest) {
  const { user } = await getSession(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { count: totalUsers },
      { count: todayMessages },
      { count: totalChats },
    ] = await Promise.all([
      adminClient
        .from("profiles")
        .select("*", { count: "exact", head: true }),
      adminClient
        .from("messages")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString()),
      adminClient
        .from("chat_sessions")
        .select("*", { count: "exact", head: true }),
    ]);

    const totalMem = totalmem();
    const freeMem = freemem();
    const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);
    const cpuUsage = Math.min(
      100,
      Math.round(cpus().reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total) * 100;
      }, 0) / cpus().length),
    );

    let diskUsage = 0;
    let projectStatus: "healthy" | "warning" | "error" = "healthy";

    try {
      const df = execSync("df / | tail -1", { encoding: "utf-8" });
      const parts = df.trim().split(/\s+/);
      const pct = parts[4];
      if (pct) {
        diskUsage = parseInt(pct.replace("%", ""), 10);
      }
    } catch {
      diskUsage = 0;
    }

    if (cpuUsage > 80 || memoryUsage > 80 || diskUsage > 90) {
      projectStatus = "warning";
    }
    if (cpuUsage > 95 || memoryUsage > 95) {
      projectStatus = "error";
    }

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      todayMessages: todayMessages ?? 0,
      totalChats: totalChats ?? 0,
      aiStatus: "online",
      memoryUsage,
      cpuUsage,
      diskUsage,
      projectStatus,
    });
  } catch (error) {
    return NextResponse.json(
      {
        totalUsers: 0,
        todayMessages: 0,
        totalChats: 0,
        aiStatus: "error",
        memoryUsage: 0,
        cpuUsage: 0,
        diskUsage: 0,
        projectStatus: "error",
      },
      { status: 500 },
    );
  }
}
