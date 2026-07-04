import type { Profile, UserStatus } from "./index";

export interface UserProfile extends Profile {
  status: UserStatus;
  last_login?: string;
  message_count?: number;
  chat_count?: number;
}

export interface UserUpdatePayload {
  name?: string;
  role?: "admin" | "user";
  status?: UserStatus;
}
