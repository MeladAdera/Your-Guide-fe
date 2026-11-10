"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { clearDraft, readDraft, writeDraft, type Draft } from "./drafts";

/** Short enough that little is lost, long enough not to write on every key. */
const WRITE_MS = 400;

/**
 * Keeps a screen's unsaved answers on this device while the person types.
 * On open, a draft from an earlier visit fills the fields the server left
 * empty; this runs after the first render, since the server cannot see the
 * draft and the two renders must match. Call `discard` once the screen is
 * saved, so a pending write cannot bring the draft back.
 */
export function useDraft<T extends FieldValues>(screen: string, form: UseFormReturn<T>, withDraft: (draft: Draft) => T) {
  const [restored, setRestored] = useState<Draft | null>(null);
  const stopped = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const withDraftRef = useRef(withDraft);

  useEffect(() => {
    const draft = readDraft(screen);
    if (draft) {
      const values = withDraftRef.current(draft);
      if (JSON.stringify(values) !== JSON.stringify(form.getValues())) {
        // Keep the server's answers as the defaults, so the restored text counts as a change.
        form.reset(values, { keepDefaultValues: true });
        setRestored(draft);
      }
    }

    const write = () => {
      window.clearTimeout(timer.current);
      timer.current = undefined;
      if (!stopped.current) writeDraft(screen, form.getValues());
    };
    const flush = () => {
      if (timer.current !== undefined) write();
    };
    const sub = form.watch(() => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(write, WRITE_MS);
    });
    // Closing the tab or leaving by Back within the delay still keeps the last words.
    window.addEventListener("pagehide", flush);
    return () => {
      sub.unsubscribe();
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [screen, form]);

  const discard = useCallback(() => {
    stopped.current = true;
    window.clearTimeout(timer.current);
    timer.current = undefined;
    clearDraft(screen);
  }, [screen]);

  return { restored, discard };
}
