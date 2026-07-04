import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types";

export class UserService {
  async getAllUsers(): Promise<Profile[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async getUserById(id: string): Promise<Profile | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  }

  async getUserByEmail(email: string): Promise<Profile | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (error) return null;
    return data;
  }

  async updateUser(
    id: string,
    updates: Partial<Profile>,
  ): Promise<Profile | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteUser(id: string): Promise<void> {
    const supabase = createAdminClient();

    const { error: sessionError } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("user_id", id);

    if (sessionError) throw sessionError;

    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileError) throw profileError;

    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw authError;
  }

  async getTotalUsers(): Promise<number> {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count ?? 0;
  }
}

export const userService = new UserService();
