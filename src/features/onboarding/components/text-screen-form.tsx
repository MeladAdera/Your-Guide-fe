"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm, type UseFormReturn } from "react-hook-form";
import { Field } from "@/components/shared/field";
import { FormError } from "@/components/shared/form-error";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { fillFromDraft } from "../drafts";
import { hasText, TEXT_SCREENS, textDefaults, textPayload, textSchema, type TextQuestion, type TextScreen, type TextValues } from "../text-screens";
import { useDraft } from "../use-draft";
import { useSectionSave } from "../use-section-save";
import { MoreQuestions } from "./more-questions";
import { PrimaryAction, WizardFooter } from "./wizard-footer";

/**
 * Screens 2 to 5: written answers only. The required questions show at once,
 * each with a starter phrase for a blank page; the optional ones wait under
 * "Add more". Ctrl/Cmd+Enter saves from inside a text area; Enter alone is a
 * new line.
 */
export function TextScreenForm({
  screen,
  slug,
  saved,
  back,
  next,
}: {
  screen: TextScreen;
  slug: string;
  saved: Record<string, unknown> | null;
  back: string;
  next: string;
}) {
  const t = useTranslations("onboarding");
  const form = useForm<TextValues>({ resolver: zodResolver(textSchema(screen)), defaultValues: textDefaults(screen, saved) });
  const { restored, discard } = useDraft(screen, form, (draft) => textDefaults(screen, fillFromDraft(saved, draft)));
  const questions = TEXT_SCREENS[screen];
  const { save, saving, formError } = useSectionSave<Record<string, string | null>, TextValues>({
    slug,
    next,
    fieldErrors: { form, shows: (f) => questions.some((q) => q.name === f) },
    onSaved: discard,
  });

  const required = questions.filter((q) => q.required);
  const optional = questions.filter((q) => !q.required);
  const { errors } = form.formState;
  const revealOptional = optional.some((q) => hasText(saved?.[q.name]) || hasText(restored?.[q.name]) || errors[q.name]);

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => save(textPayload(screen, values)))}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          e.currentTarget.requestSubmit();
        }
      }}
      className="grid gap-7"
    >
      {required.map((q) => (
        <TextQuestionField key={q.name} question={q} id={`${slug}-${q.name}`} form={form} withStarter />
      ))}
      {optional.length > 0 && (
        <MoreQuestions count={optional.length} reveal={revealOptional}>
          {optional.map((q) => (
            <TextQuestionField key={q.name} question={q} id={`${slug}-${q.name}`} form={form} />
          ))}
        </MoreQuestions>
      )}

      <FormError error={formError} />
      <WizardFooter
        secondary={{ href: back, label: t("back") }}
        primary={
          <PrimaryAction type="submit" disabled={saving}>
            {t("saveAndContinue")}
          </PrimaryAction>
        }
      />
    </form>
  );
}

/** One written question: label, growing text area, starter phrase when empty, count near the limit. Also used on the values screen. */
export function TextQuestionField({
  question,
  id,
  form,
  withStarter,
}: {
  question: TextQuestion;
  id: string;
  form: UseFormReturn<TextValues>;
  withStarter?: boolean;
}) {
  const t = useTranslations("onboarding");
  const { name, max, required } = question;
  const value = form.watch(name) ?? "";
  // The count appears near the limit only, so it never nags.
  const showCount = value.length > max * 0.8;
  const field = form.register(name);

  const start = () => {
    const phrase = `${t(`starters.${name}` as Parameters<typeof t>[0])} `;
    form.setValue(name, phrase, { shouldDirty: true });
    // After React has written the value: focus and put the cursor after the phrase.
    requestAnimationFrame(() => {
      const el = document.getElementById(id) as HTMLTextAreaElement | null;
      el?.focus();
      el?.setSelectionRange(phrase.length, phrase.length);
    });
  };

  return (
    <Field
      id={id}
      label={t(`questions.${name}` as Parameters<typeof t>[0])}
      optional={!required}
      error={form.formState.errors[name]?.message}
      className="gap-3 [&>label]:text-[17px] [&>label]:leading-snug"
    >
      <Textarea
        id={id}
        dir="auto"
        maxLength={max}
        aria-invalid={Boolean(form.formState.errors[name])}
        aria-describedby={form.formState.errors[name] ? `${id}-error` : undefined}
        className={cn("rounded-[12px] bg-card px-4 py-3 text-base md:text-base", required ? "min-h-28" : "min-h-24")}
        {...field}
      />
      {(showCount || (withStarter && !value)) && (
        <div className="flex items-start justify-between gap-3">
          {withStarter && !value ? (
            <button
              type="button"
              onClick={start}
              className="rounded-full bg-accent px-3.5 py-1.5 text-start text-sm text-accent-foreground outline-none hover:bg-accent/70 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {t("startWith", { phrase: t(`starters.${name}` as Parameters<typeof t>[0]) })}
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
