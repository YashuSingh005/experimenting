import { createClient } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";

export function getAccessToken(request: NextRequest): string | null {
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1];
  if (!projectRef) return null;

  const cookieName = `sb-${projectRef}-auth-token`;
  const cookie = request.cookies.get(cookieName);
  if (!cookie) return null;

  try {
    const raw = cookie.value;
    // @supabase/ssr encodes tokens as base64-<base64-encoded JSON>
    const jsonStr = raw.startsWith("base64-")
      ? Buffer.from(raw.slice(7), "base64").toString("utf-8")
      : decodeURIComponent(raw);
    const parsed = JSON.parse(jsonStr);
    return parsed.access_token ?? null;
  } catch {
    return null;
  }
}

export function createUserClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
