import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { getSession } from "@/middleware/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeCommand } from "@/services/terminal-service";

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { command } = body;

    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Command is required" }, { status: 400 });
    }

    // Block dangerous commands
    const blocked = ["rm -rf /", "sudo", "chmod 777", ":(){ :|:& };:"];
    if (blocked.some((b) => command.includes(b))) {
      return NextResponse.json({ error: "Command blocked for security" }, { status: 403 });
    }

    const output = await executeCommand(command);

    // Log the command
    await adminClient.from("logs").insert({
      user_id: user.id,
      action: "terminal_command",
      details: command,
    });

    return NextResponse.json({ output });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Command failed" },
      { status: 500 },
    );
  }
}
