import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, type RequestOptions } from "./client";
import { ApiError, isApiError } from "./errors";
import type { User } from "./types";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

/**
 * Call the API from a Server Component or Route Handler. The rewrite does not
 * apply here, so the API is reached by API_URL and the incoming cookie is
 * forwarded by hand (docs/handoff.md §2).
 */
export async function serverApi<T>(path: string, options: Omit<RequestOptions, "base" | "headers"> = {}): Promise<T> {
  const cookieStore = await cookies();
  const cookie = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  return api<T>(path, { ...options, base: API_URL, headers: cookie ? { cookie } : {} });
}

/** Like serverApi, but a given error code resolves to `null` instead of throwing. */
export async function serverApiOrNull<T>(path: string, nullOn: string[], options?: Omit<RequestOptions, "base" | "headers">): Promise<T | null> {
  try {
    return await serverApi<T>(path, options);
  } catch (e) {
    if (isApiError(e) && (nullOn.includes(e.code) || nullOn.includes(String(e.status)))) return null;
    throw e;
  }
}

/**
 * The logged-in person, or a redirect to sign-in. The app learns whether someone
 * is logged in by asking the API (docs/handoff.md §4): 200 is a user, 401 is not.
 */
export async function requireUser(): Promise<User> {
  const user = await serverApiOrNull<User>("/api/auth/me", ["auth.not_logged_in", "401"]);
  if (!user) redirect("/sign-in");
  return user;
}

export { ApiError };
