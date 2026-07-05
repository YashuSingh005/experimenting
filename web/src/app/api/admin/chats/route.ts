import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { getSession } from "@/middleware/auth";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const { data, error } = await adminClient
    .from("chat_sessions")
    .select("*, profiles(name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = (data ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    user_id: c.user_id,
    created_at: c.created_at,
    user_name: (c as Record<string, unknown>).profiles
      ? ((c as Record<string, unknown>).profiles as Record<string, string>).name
      : undefined,
    user_email: (c as Record<string, unknown>).profiles
      ? ((c as Record<string, unknown>).profiles as Record<string, string>).email
      : undefined,
  }));

  return NextResponse.json(mapped);
}

export async function DELETE(request: NextRequest) {
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

  const chatId = request.nextUrl.searchParams.get("id");
  if (!chatId) {
    return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
  }

  const { error: msgErr } = await adminClient
    .from("messages")
    .delete()
    .eq("chat_id", chatId);

  if (msgErr) {
    return NextResponse.json({ error: msgErr.message }, { status: 500 });
  }

  const { error: chatErr } = await adminClient
    .from("chat_sessions")
    .delete()
    .eq("id", chatId);

  if (chatErr) {
    return NextResponse.json({ error: chatErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
