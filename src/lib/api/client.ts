import { ApiError } from "./errors";
import type { ApiErrorBody } from "./types";

/** Fired on `window` whenever any route answers 401, so the app can go to login. */
export const UNAUTHORIZED_EVENT = "your-guide:unauthorized";

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON body. Send only the fields the route knows; unknown fields are a 400. */
  json?: unknown;
  /** Query values are strings on the API side. */
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  /**
   * Server-side only: the API origin (`process.env.API_URL`) and the incoming
   * Cookie header. In the browser the rewrite carries the cookie by itself.
   */
  base?: string;
  headers?: Record<string, string>;
}

function buildUrl(path: string, options: RequestOptions): string {
  const base = options.base ?? "";
  const url = new URL(base ? `${base}${path}` : path, base ? undefined : "http://relative.local");
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return base ? url.toString() : url.pathname + url.search;
}

/**
 * Call the API. Resolves with the parsed JSON body (or `undefined` for 204) and
 * throws `ApiError` for every non-2xx answer and for network failures.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", ...options.headers };
  const init: RequestInit = { method: options.method ?? "GET", headers, signal: options.signal, credentials: "same-origin" };
  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.json);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, options), init);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(0, "network", e instanceof Error ? e.message : "Network error");
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const err = ApiError.fromBody(res.status, body as Partial<ApiErrorBody> | null);
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    throw err;
  }

  return body as T;
}
