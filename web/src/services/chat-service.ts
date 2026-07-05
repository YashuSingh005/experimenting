import { createAdminClient } from "@/lib/supabase/admin";
import type { ChatSession, Message } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type DBClient = SupabaseClient;

export class ChatService {
  private resolveClient(supabase?: DBClient): DBClient {
    return supabase ?? createAdminClient();
  }

  async createSession(id: string, userId: string, title: string, supabase?: DBClient): Promise<ChatSession> {
    const s = this.resolveClient(supabase);
    const { data, error } = await s
      .from("chat_sessions")
      .insert({ id, user_id: userId, title })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSessions(userId: string, supabase?: DBClient): Promise<ChatSession[]> {
    const s = this.resolveClient(supabase);
    const { data, error } = await s
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async getSession(sessionId: string, supabase?: DBClient): Promise<ChatSession | null> {
    const s = this.resolveClient(supabase);
    const { data, error } = await s
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error) return null;
    return data;
  }

  async deleteSession(sessionId: string, userId?: string, supabase?: DBClient): Promise<void> {
    const s = this.resolveClient(supabase);
    let query = s.from("chat_sessions").delete().eq("id", sessionId);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { error } = await query;
    if (error) throw error;
  }

  async getMessages(chatId: string, supabase?: DBClient): Promise<Message[]> {
    const s = this.resolveClient(supabase);
    const { data, error } = await s
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async saveMessage(message: Omit<Message, "created_at">, supabase?: DBClient): Promise<Message> {
    const s = this.resolveClient(supabase);
    const { data, error } = await s
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

  async updateSessionTitle(sessionId: string, title: string, supabase?: DBClient): Promise<void> {
    const s = this.resolveClient(supabase);
    const { error } = await s
      .from("chat_sessions")
      .update({ title })
      .eq("id", sessionId);

    if (error) throw error;
  }
}

export const chatService = new ChatService();
