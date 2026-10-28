"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { FormError } from "@/components/shared/form-error";
import { CONFIDENCE_STATEMENTS, type ConfidenceSection } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { confidenceDefaults, confidencePayload, firstUnanswered, SCORES, startIndex, type Answers, type Score } from "../confidence";
import { useSectionSave } from "../use-section-save";
import { PrimaryAction, WizardFooter } from "./wizard-footer";

/** Long enough to see the choice land, short enough to feel quick. */
const ADVANCE_MS = 350;

/**
 * Screen 6 · Quick check-in, one statement at a time (owner's choice,
 * docs/features/01-onboarding.md). Five worded answers as a radio group; a tap
 * marks one and moves on. Keyboard users move with the arrow keys and go on
 * with Enter, so arrows never jump ahead. Back steps through the statements
 * before it leaves the screen. Nothing is computed from the answers.
 */
export function ConfidenceForm({ saved, back, next }: { saved: Record<string, unknown> | null; back: string; next: string }) {
  const t = useTranslations("onboarding");
  const [answers, setAnswers] = useState<Answers>(() => confidenceDefaults(saved));
  const [index, setIndex] = useState(() => startIndex(confidenceDefaults(saved)));
  const [askAll, setAskAll] = useState(false);
  const { save, saving, formError } = useSectionSave<ConfidenceSection, Record<string, never>>({ slug: "confidence", next });

  const statementRef = useRef<HTMLParagraphElement>(null);
  const byPointer = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const moved = useRef(false);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // After moving to another statement, put focus on it so a screen reader reads it out.
  useEffect(() => {
    if (moved.current) statementRef.current?.focus({ preventScroll: true });
  }, [index]);

  const statement = CONFIDENCE_STATEMENTS[index];
  const total = CONFIDENCE_STATEMENTS.length;
  const done = firstUnanswered(answers) === -1;

  const go = (i: number) => {
    window.clearTimeout(timer.current);
    moved.current = true;
    setIndex(i);
  };

  const choose = (score: Score) => {
    setAnswers((a) => ({ ...a, [statement]: score }));
    setAskAll(false);
    if (byPointer.current && index < total - 1) {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => go(index + 1), ADVANCE_MS);
    }
    byPointer.current = false;
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const body = confidencePayload(answers);
        if (body) return save(body);
        // Enter after answering moves on quietly; otherwise point at the first open statement.
        const after = CONFIDENCE_STATEMENTS.findIndex((s, i) => i > index && !answers[s]);
        if (answers[statement] !== undefined && after !== -1) return go(after);
        setAskAll(true);
        go(firstUnanswered(answers));
      }}
      className="grid gap-6"
    >
      {/* No second progress bar: the wizard's step line is the only one. A way back sits where the eyes are, for a quick mis-tap. */}
      <div className="flex min-h-10 items-center justify-between gap-3">
        {/* Always in place so it is easy to find; inactive on the first statement. */}
        <button
          type="button"
          disabled={index === 0}
          onClick={() => go(index - 1)}
          className="-ms-2 flex h-10 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-primary outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40"
        >
          <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
          {t("checkin.previous")}
        </button>
        <span className="text-sm whitespace-nowrap text-muted-foreground">{t("checkin.position", { current: index + 1, total })}</span>
      </div>

      <fieldset key={statement} aria-labelledby={`checkin-${statement}`} className="animate-in duration-300 fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
        <p
          id={`checkin-${statement}`}
          ref={statementRef}
          tabIndex={-1}
          className="text-2xl leading-snug font-semibold tracking-tight text-balance outline-none lg:text-3xl"
        >
          {t(`checkin.statements.${statement}`)}
        </p>
        <div className="mt-6 grid gap-2.5">
          {SCORES.map((score) => {
            const on = answers[statement] === score;
            return (
              <label key={score} className="cursor-pointer" onPointerDown={() => (byPointer.current = true)}>
                <input
                  type="radio"
                  name={statement}
                  value={score}
                  checked={on}
                  onChange={() => choose(score)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "flex min-h-13 items-center justify-between rounded-[14px] bg-card px-5 py-3 text-base ring-1 ring-input transition-colors hover:bg-accent",
                    "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                    on && "bg-primary text-primary-foreground ring-primary hover:bg-primary",
                  )}
                >
                  {t(`checkin.scale.${score}`)}
                  {on && <Check className="size-5" aria-hidden />}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <p aria-live="polite" className={cn("text-sm", askAll ? "text-destructive" : "text-muted-foreground")}>
        {askAll ? t("checkin.answerAll") : done ? t("checkin.allAnswered") : t("checkin.hint")}
      </p>

      <FormError error={formError} />
      <WizardFooter
        secondary={index > 0 ? { onClick: () => go(index - 1), label: t("back") } : { href: back, label: t("back") }}
        primary={
          <PrimaryAction type="submit" disabled={saving}>
            {t("saveAndContinue")}
          </PrimaryAction>
        }
      />
    </form>
  );
}
