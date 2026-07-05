import { NextResponse } from "next/server";
import { getSession } from "@/middleware/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { user } = await getSession(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
      email: user.email ?? "unknown@unknown.com",
      role: "user",
    });
    profile = { id: user.id, name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User", email: user.email ?? "unknown@unknown.com", role: "user" };
  }

  return NextResponse.json({ user, profile });
}
