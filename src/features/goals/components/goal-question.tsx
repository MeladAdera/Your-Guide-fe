"use client";

import { useTranslations } from "next-intl";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { Field } from "@/components/shared/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { GOAL_FIELDS, type GoalField, type GoalValues } from "../goal-form";

/**
 * One goal question: label, a growing text area, a starter phrase while it is
 * empty, the count near the limit. The same look as the onboarding questions.
 */
export function GoalQuestion({
  form,
  name,
  id,
  starter,
  why,
  large,
}: {
  form: UseFormReturn<GoalValues>;
  name: GoalField;
  id: string;
  /** Put into the empty field on tap, cursor after it. */
  starter?: string;
  /** A line under the label, e.g. their own earlier answer. */
  why?: string;
  /** The first-goal page uses the onboarding sizes; the dialog is smaller. */
  large?: boolean;
}) {
  const t = useTranslations("goals");
  const { max, required } = GOAL_FIELDS.find((f) => f.name === name)!;
  const value = useWatch({ control: form.control, name }) ?? "";
  const showCount = value.length > max * 0.8;
  const error = form.formState.errors[name]?.message;

  const start = () => {
    if (!starter) return;
    const phrase = `${starter} `;
    form.setValue(name, phrase, { shouldDirty: true });
    requestAnimationFrame(() => {
      const el = document.getElementById(id) as HTMLTextAreaElement | null;
      el?.focus();
      el?.setSelectionRange(phrase.length, phrase.length);
    });
  };

  return (
    <Field id={id} label={t(`questions.${name}`)} why={why} optional={!required} error={error} className={cn(large && "gap-3 [&>label]:text-[17px] [&>label]:leading-snug")}>
      <Textarea
        id={id}
        dir="auto"
        maxLength={max}
        aria-invalid={Boolean(error)}
        aria-describedby={cn(why && `${id}-why`, error && `${id}-error`) || undefined}
        className={cn("rounded-[12px] bg-card px-4 py-3 text-base md:text-base", name === "title" ? "min-h-16" : large ? "min-h-28" : "min-h-20")}
        {...form.register(name)}
      />
      {(showCount || (starter && !value)) && (
        <div className="flex items-start justify-between gap-3">
          {starter && !value ? (
            <button
              type="button"
              onClick={start}
              className="rounded-full bg-accent px-3.5 py-1.5 text-start text-sm text-accent-foreground outline-none hover:bg-accent/70 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {t("startWith", { phrase: starter })}
            </button>
          ) : (
            <span />
          )}
          {showCount && (
            <span className={cn("text-xs tabular-nums text-muted-foreground", value.length >= max && "text-destructive")}>
              {t("charCount", { count: value.length, max })}
            </span>
          )}
        </div>
      )}
    </Field>
  );
}
