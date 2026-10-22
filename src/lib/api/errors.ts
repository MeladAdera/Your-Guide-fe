import type { ApiErrorBody, OnboardingScreen } from "./types";

/** Every error code the API answers with on purpose (docs/handoff.md §5). */
export const API_ERROR_CODES = [
  "auth.not_logged_in",
  "auth.invalid_credentials",
  "auth.email_taken",
  "rate_limited",
  "validation.failed",
  "bad_request",
  "not_found",
  "profile.onboarding_not_done",
  "profile.screen_not_saved",
  "goal.onboarding_required",
  "goal.not_found",
  "task.not_found",
  "step.not_found",
  "session.not_found",
  "struggle.not_found",
  "goal.has_work_history",
  "task.has_work_history",
  "step.has_work_history",
  "goal.archived",
  "goal.session_running",
  "step.order_mismatch",
  "session.already_active",
  "session.step_done",
  "session.none_active",
  "session.not_running",
  "struggle.onboarding_required",
  "struggle.already_answered",
  "ai.daily_limit",
  "ai.unavailable",
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** Codes the frontend adds for answers the API did not give on purpose. */
export type ClientErrorCode = "unknown" | "network";

export type ErrorCode = ApiErrorCode | ClientErrorCode;

/** Validation rule codes in use, each with a sentence in the message files. */
export const VALIDATION_RULES = [
  "isEmail",
  "isString",
  "minLength",
  "maxLength",
  "isIn",
  "isInt",
  "min",
  "max",
  "isBoolean",
  "isUuid",
  "isTimeZone",
  "isArray",
  "arrayMinSize",
  "arrayMaxSize",
  "arrayUnique",
  "matches",
  "whitelistValidation",
] as const;
export type ValidationRule = (typeof VALIDATION_RULES)[number];

export interface FieldError {
  field: string;
  code: string;
}

const known = new Set<string>(API_ERROR_CODES);

export function isApiErrorCode(code: string): code is ApiErrorCode {
  return known.has(code);
}

/**
 * One error type for everything the API client throws. `code` is what the UI
 * translates; `message` is the API's English sentence, for developers only.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly errors: FieldError[];
  readonly missing: OnboardingScreen[];

  constructor(status: number, code: ErrorCode, message: string, extra?: { errors?: FieldError[]; missing?: OnboardingScreen[] }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = extra?.errors ?? [];
    this.missing = extra?.missing ?? [];
  }

  /** Build from an API error body. Unknown codes and 500s become "unknown". */
  static fromBody(status: number, body: Partial<ApiErrorBody> | null | undefined): ApiError {
    const code = body?.code && isApiErrorCode(body.code) ? body.code : "unknown";
    const message = Array.isArray(body?.message) ? body.message.join("; ") : (body?.message ?? `HTTP ${status}`);
    return new ApiError(status, code, message, { errors: body?.errors, missing: body?.missing });
  }

  is(code: ErrorCode): boolean {
    return this.code === code;
  }

  /** Field errors as a map, first rule per field, for forms. */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const e of this.errors) if (!(e.field in out)) out[e.field] = e.code;
    return out;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

/** The message key for an error, in the `errors` namespace of the message files. */
export function errorMessageKey(e: unknown): `errors.${ErrorCode}` {
  if (isApiError(e)) return `errors.${e.code}`;
  return "errors.unknown";
}

/** The message key for a validation rule, in the `validation` namespace. */
export function validationMessageKey(rule: string): `validation.${ValidationRule | "default"}` {
  return (VALIDATION_RULES as readonly string[]).includes(rule)
    ? (`validation.${rule}` as `validation.${ValidationRule}`)
    : "validation.default";
}
