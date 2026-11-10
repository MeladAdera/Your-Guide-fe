"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessageKey, isApiError, validationMessageKey } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

/** Titles of tasks and steps: 1 to 200 characters (docs/handoff.md §10). */
export const TITLE_MAX = 200;

/**
 * A one-line field that adds an item on Enter or Add, then empties and stays
 * ready for the next one, so a list can be typed out in one go.
 */
export function AddLine({
  label,
  placeholder,
  onAdd,
  className,
}: {
  /** The field's accessible name (e.g. "Add a step to …"). */
  label: string;
  placeholder: string;
  onAdd: (title: string) => Promise<unknown>;
  className?: string;
}) {
  const t = useTranslations();
  const id = useId();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const title = value.trim();

  const submit = async () => {
    if (!title || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onAdd(title);
      setValue("");
    } catch (e) {
      const rule = isApiError(e) && e.code === "validation.failed" ? Object.values(e.fieldErrors())[0] : undefined;
      setError(rule ? t(validationMessageKey(rule)) : t(errorMessageKey(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("grid gap-1.5", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="flex gap-2"
      >
        <Input
          id={id}
          dir="auto"
          value={value}
          maxLength={TITLE_MAX}
          onChange={(e) => setValue(e.target.value)}
          aria-label={label}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder={placeholder}
          className="h-11 flex-1 rounded-[10px] bg-card px-3.5 text-base md:text-base"
        />
        <Button type="submit" variant="outline" disabled={!title || busy} className="h-11 rounded-[10px] px-4 text-[15px]">
          <Plus aria-hidden /> {t("tasks.add")}
        </Button>
      </form>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
