import { createAdminClient } from "@/lib/supabase/admin";
import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "./auth";

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export function withAdmin(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return async (request: NextRequest) => {
    const { user } = await getSession(request);

    if (!user?.email) {
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

    const authenticatedReq = request as AuthenticatedRequest;
    authenticatedReq.user = {
      id: user.id,
      email: user.email!,
      role: "admin",
    };

    return handler(authenticatedReq);
  };
}

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return async (request: NextRequest) => {
    const { user } = await getSession(request);

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const authenticatedReq = request as AuthenticatedRequest;
    authenticatedReq.user = {
      id: user.id,
      email: user.email!,
      role: profile?.role ?? "user",
    };

    return handler(authenticatedReq);
  };
}
