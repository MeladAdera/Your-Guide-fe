"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isAiLimitReached, markAiLimitReached } from "./ai-limit";

const EVENT = "yg:ai-limit";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Whether the AI buttons rest today (see ai-limit.ts), shared by every button
 * on the page and across tabs. The server render says "not reached"; the
 * browser corrects it after hydration without a mismatch.
 */
export function useAiLimit(timeZone: string) {
  const reached = useSyncExternalStore(
    subscribe,
    () => isAiLimitReached(timeZone),
    () => false,
  );
  const mark = useCallback(() => {
    markAiLimitReached(timeZone);
    window.dispatchEvent(new Event(EVENT));
  }, [timeZone]);
  return { reached, mark };
}
