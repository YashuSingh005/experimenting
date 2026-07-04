import { createAdminClient } from "@/lib/supabase/admin";
import type { ChatSession, Message } from "@/types";
import { generateId } from "@/lib/utils";

export class ChatService {
  async createSession(userId: string, title: string): Promise<ChatSession> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: userId, title })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSessions(userId: string): Promise<ChatSession[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error) return null;
    return data;
  }

  async deleteSession(sessionId: string, userId?: string): Promise<void> {
    const supabase = createAdminClient();
    let query = supabase.from("chat_sessions").delete().eq("id", sessionId);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { error } = await query;
    if (error) throw error;
  }

  async getMessages(chatId: string): Promise<Message[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async saveMessage(message: Omit<Message, "created_at">): Promise<Message> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        id: message.id,
        chat_id: message.chat_id,
        role: message.role,
        content: message.content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("chat_sessions")
      .update({ title })
      .eq("id", sessionId);

    if (error) throw error;
  }
}

export const chatService = new ChatService();
