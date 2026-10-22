import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, UNAUTHORIZED_EVENT } from "./client";
import { ApiError } from "./errors";

function jsonResponse(status: number, body: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
  });
}

describe("api()", () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sends JSON and returns the parsed body", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: "1", title: "Ship it" }));
    const out = await api<{ id: string }>("/api/goals", { method: "POST", json: { title: "Ship it" } });
    expect(out).toEqual({ id: "1", title: "Ship it" });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/goals");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    expect(init?.body).toBe(JSON.stringify({ title: "Ship it" }));
  });

  it("serialises query values as strings", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []));
    await api("/api/goals", { query: { archived: true, days: 7, skip: undefined } });
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/goals?archived=true&days=7");
  });

  it("resolves to undefined on 204", async () => {
    fetchMock.mockResolvedValue(jsonResponse(204, undefined));
    await expect(api("/api/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  it("throws ApiError with the API's code", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, { statusCode: 409, error: "Conflict", code: "goal.has_work_history", message: "Archive instead." }),
    );
    const err = (await api("/api/goals/x", { method: "DELETE" }).catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(409);
    expect(err.code).toBe("goal.has_work_history");
    expect(err.is("goal.has_work_history")).toBe(true);
  });

  it("carries field errors and missing screens", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, {
        statusCode: 400,
        error: "Bad Request",
        code: "validation.failed",
        message: ["values.0.note must be shorter"],
        errors: [{ field: "values.0.note", code: "maxLength" }, { field: "values.0.note", code: "isString" }],
      }),
    );
    const v = (await api("/api/x").catch((e) => e)) as ApiError;
    expect(v.fieldErrors()).toEqual({ "values.0.note": "maxLength" });
    expect(v.message).toContain("values.0.note");

    fetchMock.mockResolvedValueOnce(
      jsonResponse(409, { statusCode: 409, error: "Conflict", code: "goal.onboarding_required", message: "x", missing: ["situation", "values"] }),
    );
    const m = (await api("/api/goals", { method: "POST", json: {} }).catch((e) => e)) as ApiError;
    expect(m.missing).toEqual(["situation", "values"]);
  });

  it("maps unknown codes and 500s to 'unknown'", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { statusCode: 500, error: "Internal Server Error", message: "boom" }));
    const a = (await api("/api/x").catch((e) => e)) as ApiError;
    expect(a.code).toBe("unknown");

    fetchMock.mockResolvedValueOnce(jsonResponse(418, { statusCode: 418, error: "Teapot", code: "future.code", message: "x" }));
    const b = (await api("/api/x").catch((e) => e)) as ApiError;
    expect(b.code).toBe("unknown");

    fetchMock.mockResolvedValueOnce(new Response("<html>bad gateway</html>", { status: 502 }));
    const c = (await api("/api/x").catch((e) => e)) as ApiError;
    expect(c.code).toBe("unknown");
    expect(c.status).toBe(502);
  });

  it("maps a failed fetch to 'network'", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const err = (await api("/api/x").catch((e) => e)) as ApiError;
    expect(err.code).toBe("network");
    expect(err.status).toBe(0);
  });

  it("announces a 401 on the window", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { statusCode: 401, error: "Unauthorized", code: "auth.not_logged_in", message: "x" }));
    const heard = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, heard);
    await api("/api/auth/me").catch(() => undefined);
    expect(heard).toHaveBeenCalledTimes(1);
    window.removeEventListener(UNAUTHORIZED_EVENT, heard);
  });

  it("uses the base origin when given one and forwards headers", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
    await api("/api/auth/me", { base: "http://localhost:3001", headers: { cookie: "your_guide_session=abc" } });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://localhost:3001/api/auth/me");
    expect((init?.headers as Record<string, string>).cookie).toBe("your_guide_session=abc");
  });
});
