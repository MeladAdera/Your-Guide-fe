"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useCallback, useState } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { setLocaleCookie } from "@/i18n/locale-cookie";
import { isApiError } from "@/lib/api/errors";
import type { Locale, User } from "@/lib/api/types";
import { useCooldown } from "@/features/auth/cooldown";

/** The API allows 5 attempts a minute and sends no wait time (docs/handoff.md §4). */
const RATE_LIMIT_SECONDS = 60;

/** Only same-origin paths are safe return targets. */
export function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

/**
 * Shared behaviour of the login and register forms: where to go after success,
 * how to put API errors on the right field, and the current UI language.
 */
export function useAuthForm<T extends FieldValues>(setError: UseFormSetError<T>) {
  const router = useRouter();
  const search = useSearchParams();
  const locale = useLocale() as Locale;
  const [formError, setFormError] = useState<unknown>(null);
  const cooldown = useCooldown();
  const { start: startCooldown } = cooldown;

  const onSuccess = useCallback(
    (user: User) => {
      // The language follows the account from now on.
      setLocaleCookie(user.locale);
      router.replace(safeNext(search.get("next")));
      router.refresh();
    },
    [router, search],
  );

  const onError = useCallback(
    (e: unknown, fieldCodes: Partial<Record<string, Path<T>>> = {}) => {
      if (isApiError(e)) {
        if (e.code === "rate_limited") {
          // A calm pause with a countdown instead of an error (docs/features/00-auth.md).
          setFormError(null);
          startCooldown(RATE_LIMIT_SECONDS);
          return;
        }
        if (e.code === "validation.failed") {
          const errors = e.fieldErrors();
          let placed = false;
          for (const [field, rule] of Object.entries(errors)) {
            const path = (field as Path<T>) ?? null;
            if (path) {
              setError(path, { type: "server", message: rule });
              placed = true;
            }
          }
          if (placed) return;
        }
        const target = fieldCodes[e.code];
        if (target) {
          setError(target, { type: "server", message: e.code });
          return;
        }
      }
      setFormError(e);
    },
    [setError, startCooldown],
  );

  return { locale, formError, setFormError, onSuccess, onError, cooldownSeconds: cooldown.secondsLeft };
}
