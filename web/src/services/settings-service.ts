import { createAdminClient } from "@/lib/supabase/admin";
import type { AISettings } from "@/types";

const DEFAULT_SETTINGS: Omit<AISettings, "id" | "updated_at" | "updated_by"> = {
  system_prompt: "You are a helpful AI assistant.",
  temperature: 0.7,
  max_tokens: 4096,
  top_p: 0.9,
  context_length: 8192,
  model_name: process.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini",
};

export class SettingsService {
  async getSettings(): Promise<AISettings> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .single();

    if (error || !data) {
      return {
        id: "default",
        ...DEFAULT_SETTINGS,
        updated_at: new Date().toISOString(),
        updated_by: "system",
      };
    }

    return data;
  }

  async updateSettings(
    settings: Partial<AISettings>,
    userId: string,
  ): Promise<AISettings> {
    const supabase = createAdminClient();

    const existing = await this.getSettings();
    const merged = { ...existing, ...settings, updated_by: userId };

    const { data, error } = await supabase
      .from("settings")
      .upsert({
        id: existing.id === "default" ? undefined : existing.id,
        system_prompt: merged.system_prompt,
        temperature: merged.temperature,
        max_tokens: merged.max_tokens,
        top_p: merged.top_p,
        context_length: merged.context_length,
        model_name: merged.model_name,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const settingsService = new SettingsService();
