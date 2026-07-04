export type Role = "admin" | "user";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface AISettings {
  id: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  context_length: number;
  model_name: string;
  updated_at: string;
  updated_by: string;
}

export interface LogEntry {
  id: string;
  user_id?: string;
  action: string;
  details?: string;
  ip?: string;
  created_at: string;
}

export type UserStatus = "active" | "banned" | "suspended";
