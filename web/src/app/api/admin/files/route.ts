import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { getSession } from "@/middleware/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fileService } from "@/services/file-service";

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

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") ?? ".";

  try {
    const entries = await fileService.listTree(path);
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list files" },
      { status: 500 },
    );
  }
}

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
    const { action, path, content, newPath } = body;

    switch (action) {
      case "read": {
        const data = await fileService.readTextFile(path);
        return NextResponse.json({ content: data });
      }
      case "write": {
        await fileService.writeTextFile(path, content);
        return NextResponse.json({ success: true });
      }
      case "create": {
        await fileService.createFile(path);
        return NextResponse.json({ success: true });
      }
      case "delete": {
        await fileService.deleteFile(path);
        return NextResponse.json({ success: true });
      }
      case "rename": {
        await fileService.renameFile(path, newPath);
        return NextResponse.json({ success: true });
      }
      case "mkdir": {
        await fileService.createDirectory(path);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Operation failed" },
      { status: 500 },
    );
  }
}
