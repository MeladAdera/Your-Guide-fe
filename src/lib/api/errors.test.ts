import { describe, expect, it } from "vitest";
import { API_ERROR_CODES, ApiError, VALIDATION_RULES, errorMessageKey, validationMessageKey } from "./errors";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";

describe("error message keys", () => {
  it("maps ApiError codes and anything else to the errors namespace", () => {
    expect(errorMessageKey(new ApiError(429, "ai.daily_limit", "x"))).toBe("errors.ai.daily_limit");
    expect(errorMessageKey(new Error("plain"))).toBe("errors.unknown");
    expect(errorMessageKey(undefined)).toBe("errors.unknown");
  });

  it("maps validation rules and falls back for unknown rules", () => {
    expect(validationMessageKey("maxLength")).toBe("validation.maxLength");
    expect(validationMessageKey("somethingNew")).toBe("validation.default");
  });
});

describe("message files", () => {
  const codes = [...API_ERROR_CODES, "unknown", "network"];
  // Error codes use dots, which next-intl reads as nesting: "goal.archived" lives at errors.goal.archived.
  const lookup = (obj: unknown, path: string) =>
    path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
  it.each([
    ["en", en],
    ["ar", ar],
  ])("%s has a sentence for every error code and validation rule", (_name, messages) => {
    for (const code of codes) expect(lookup(messages.errors, code), `errors.${code}`).toEqual(expect.any(String));
    for (const rule of VALIDATION_RULES) expect(messages.validation, `validation.${rule}`).toHaveProperty(rule);
  });

  it("en and ar have the same keys", () => {
    const flatten = (obj: Record<string, unknown>, prefix = ""): string[] =>
      Object.entries(obj).flatMap(([k, v]) =>
        v && typeof v === "object" ? flatten(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
      );
    expect(flatten(ar).sort()).toEqual(flatten(en).sort());
  });
});
