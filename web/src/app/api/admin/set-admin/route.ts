import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: profile, error: findError } = await adminClient
      .from("profiles")
      .select("id, email, role")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json(
        { error: `No user found with email: ${email}` },
        { status: 404 },
      );
    }

    if (profile.role === "admin") {
      return NextResponse.json({ message: `${email} is already an admin` });
    }

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", profile.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `${email} is now an admin. Go to /admin to access the dashboard.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
