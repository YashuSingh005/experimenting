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
  const { data, error } = await adminClient
    .from("settings")
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({
      system_prompt: "You are a helpful AI assistant.",
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 0.9,
      context_length: 8192,
      model_name: process.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini",
    });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
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

    const { data: existing } = await adminClient
      .from("settings")
      .select("id")
      .single();

    const payload = {
      ...body,
      updated_by: user.id,
    };

    if (existing) {
      const { data, error } = await adminClient
        .from("settings")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await adminClient
      .from("settings")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
