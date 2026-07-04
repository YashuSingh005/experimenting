import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { getSession } from "@/middleware/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { streamAIResponse } from "@/lib/ai/bridge";
import { chatService } from "@/services/chat-service";
import { generateId } from "@/lib/utils";

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

  const role = profile?.role ?? "user";

  try {
    const body = await request.json();
    const { message, chatId: existingChatId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const chatId = existingChatId || generateId();
    let title = message.slice(0, 100);

    if (!existingChatId) {
      await chatService.createSession(user.id, title);
    }

    const userMessage = await chatService.saveMessage({
      id: generateId(),
      chat_id: chatId,
      role: "user",
      content: message,
    });

    const history = await chatService.getMessages(chatId);
    const aiMessages = history.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";

        try {
          await streamAIResponse(aiMessages, role, {
            onText: (chunk) => {
              fullResponse += chunk;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "text", content: chunk })}\n\n`),
              );
            },
            onToolCall: (toolName, input) => {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "tool_call", toolName, input })}\n\n`,
                ),
              );
            },
            onFinish: async () => {
              if (fullResponse.trim()) {
                await chatService.saveMessage({
                  id: generateId(),
                  chat_id: chatId,
                  role: "assistant",
                  content: fullResponse,
                });

                if (fullResponse.length > 10 && !existingChatId) {
                  const newTitle = fullResponse.slice(0, 100).replace(/\n/g, " ").trim();
                  await chatService.updateSessionTitle(chatId, newTitle).catch(() => {});
                }
              }

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "done", chatId })}\n\n`),
              );
              controller.close();
            },
            onError: (error) => {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "error", content: error.message })}\n\n`,
                ),
              );
              controller.close();
            },
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", content: msg })}\n\n`),
          );
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
