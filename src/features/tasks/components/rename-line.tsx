"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessageKey, isApiError, validationMessageKey } from "@/lib/api/errors";
import { TITLE_MAX } from "./add-line";

/**
 * A title turned into a field in place: Enter or Save keeps the new name,
 * Escape or Cancel puts the old one back. Focus starts in the field with the
 * text selected.
 */
export function RenameLine({ title, label, onSave, onDone }: { title: string; label: string; onSave: (title: string) => Promise<unknown>; onDone: () => void }) {
  const t = useTranslations();
  const [value, setValue] = useState(title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.select(), []);

  const save = async () => {
    const next = value.trim();
    if (!next || next === title) return onDone();
    setBusy(true);
    setError(null);
    try {
      await onSave(next);
      onDone();
    } catch (e) {
      const rule = isApiError(e) && e.code === "validation.failed" ? Object.values(e.fieldErrors())[0] : undefined;
      setError(rule ? t(validationMessageKey(rule)) : t(errorMessageKey(e)));
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onDone();
        }
      }}
      className="grid flex-1 gap-1.5"
    >
      <div className="flex flex-wrap gap-2">
        <Input
          ref={input}
          dir="auto"
          value={value}
          maxLength={TITLE_MAX}
          onChange={(e) => setValue(e.target.value)}
          aria-label={label}
          aria-invalid={Boolean(error)}
          className="h-11 min-w-0 flex-1 basis-48 rounded-[10px] bg-card px-3.5 text-base md:text-base"
        />
        <div className="flex gap-1">
          <Button type="submit" disabled={busy} className="h-11 rounded-[10px] px-4 text-[15px]">
            {t("tasks.save")}
          </Button>
          <Button type="button" variant="ghost" onClick={onDone} className="h-11 px-3 text-[15px]">
            {t("common.cancel")}
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
