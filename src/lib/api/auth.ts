import { api } from "./client";
import type { Locale, User } from "./types";

export interface RegisterInput {
  email: string;
  password: string;
  /** IANA name from the browser; nobody types it. */
  timezone: string;
  /** The language the app is currently showing. */
  locale: Locale;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  register: (input: RegisterInput) => api<User>("/api/auth/register", { method: "POST", json: input }),
  login: (input: LoginInput) => api<User>("/api/auth/login", { method: "POST", json: input }),
  logout: () => api<void>("/api/auth/logout", { method: "POST" }),
  me: () => api<User>("/api/auth/me"),
  updateLocale: (locale: Locale) => api<User>("/api/auth/me", { method: "PATCH", json: { locale } }),
};

/** The browser's timezone, as the API expects it. */
export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
