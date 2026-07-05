import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { getSession } from "@/middleware/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { runOrchestrator } from "@/lib/ai/orchestrator";
import { chatService } from "@/services/chat-service";
import { generateId } from "@/lib/utils";

export async function POST(request: NextRequest) {
  let user;
  try {
    const session = await getSession(request);
    user = session.user;
  } catch (error) {
    console.error("[/api/chat] getSession error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = createAdminClient();

  let role: "user" | "admin" = "user";
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    await adminSupabase.from("profiles").insert({
      id: user.id,
      name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
      email: user.email ?? "unknown@unknown.com",
      role: "user",
    });
  } else {
    role = (profile.role as "user" | "admin") ?? "user";
  }

  try {
    const body = await request.json();
    const { message, chatId: existingChatId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const chatId = existingChatId || generateId();
    const title = message.slice(0, 100);

    if (!existingChatId) {
      await chatService.createSession(chatId, user.id, title, adminSupabase);
    }

    await chatService.saveMessage({
      id: generateId(),
      chat_id: chatId,
      role: "user",
      content: message,
    }, adminSupabase);

    const history = await chatService.getMessages(chatId, adminSupabase);
    const aiMessages = history.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";

        const enqueue = (data: unknown) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        };

        try {
          await runOrchestrator(aiMessages, role, {
            onText: (chunk) => {
              fullResponse += chunk;
              enqueue({ type: "text", content: chunk });
            },
            onToolCall: (toolName, input) => {
              enqueue({ type: "tool_call", toolName, input });
            },
            onAgentStatus: (status) => {
              enqueue({ type: "agent_status", ...status });
            },
            onAgentComms: (comms) => {
              enqueue({ type: "agent_comms", from: comms.from, to: comms.to, message: comms.message });
            },
            onDecomposition: (task, subtasks) => {
              enqueue({ type: "decomposition", task, subtasks });
            },
            onAgentResult: (agentId, result) => {
              enqueue({ type: "agent_result", agentId, result });
            },
            onFinish: async () => {
              if (fullResponse.trim()) {
                await chatService.saveMessage({
                  id: generateId(),
                  chat_id: chatId,
                  role: "assistant",
                  content: fullResponse,
                }, adminSupabase);

                if (fullResponse.length > 10 && !existingChatId) {
                  const newTitle = fullResponse.slice(0, 100).replace(/\n/g, " ").trim();
                  await chatService.updateSessionTitle(chatId, newTitle, adminSupabase).catch(() => {});
                }
              }

              enqueue({ type: "done", chatId });
              controller.close();
            },
            onError: (error) => {
              enqueue({ type: "error", content: error.message });
              controller.close();
            },
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          enqueue({ type: "error", content: msg });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[/api/chat] handler error:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as Record<string, unknown>).message)
          : JSON.stringify(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
