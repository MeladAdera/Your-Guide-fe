"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { validationMessageKey } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

/**
 * A single choice as large tap chips (docs/features/01-onboarding.md, screen 1).
 * Real radio buttons under the chips, so arrow keys, focus and screen readers
 * work as for any radio group. Tapping the chosen chip again clears an optional
 * question.
 */
export function ChoiceChips<T extends string>({
  legend,
  optional,
  options,
  value,
  onChange,
  error,
}: {
  legend: string;
  optional?: boolean;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T | null) => void;
  /** A validation rule code; translated here. */
  error?: string;
}) {
  const t = useTranslations();
  const name = useId();
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="text-[17px] font-medium">
        {legend}
        {optional && <span className="ms-1.5 text-xs font-normal text-muted-foreground">({t("common.optional")})</span>}
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <label key={o.value} className="cursor-pointer">
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={on}
                onChange={() => onChange(o.value)}
                onClick={() => {
                  if (on && optional) onChange(null);
                }}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "inline-flex h-11 items-center gap-1.5 rounded-full bg-card px-4 text-[15px] ring-1 ring-input transition-colors",
                  "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:bg-accent",
                  on && "bg-primary text-primary-foreground ring-primary hover:bg-primary",
                )}
              >
                {on && <Check className="size-4" aria-hidden />}
                {o.label}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-2 text-sm text-destructive">
          {t(validationMessageKey(error))}
        </p>
      )}
    </fieldset>
  );
}
