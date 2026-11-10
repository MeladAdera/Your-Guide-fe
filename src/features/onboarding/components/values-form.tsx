"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { FormError } from "@/components/shared/form-error";
import { Input } from "@/components/ui/input";
import { validationMessageKey } from "@/lib/api/errors";
import { LIFE_VALUES, type ValuesSection } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import type { TextValues } from "../text-screens";
import { useSectionSave } from "../use-section-save";
import { MAX_VALUES, VALUES_QUESTIONS, valuesDefaults, valuesPayload, valuesSchema, type ValuesValues } from "../values";
import { MoreQuestions } from "./more-questions";
import { TextQuestionField } from "./text-screen-form";
import { PrimaryAction, WizardFooter } from "./wizard-footer";

/**
 * Screen 7 · What matters to you. Ten value chips; a tapped one rises into
 * "Your values" with a short note of why it matters, and tapping it there puts
 * it back. Two to five, a set, not a ranking. Then the person to become, and
 * two optional questions under "Add more". Saving leads to the first goal.
 */
export function ValuesForm({ saved, back, next }: { saved: Partial<ValuesSection> | null; back: string; next: string }) {
  const t = useTranslations("onboarding");
  const tv = useTranslations("onboarding.values");
  const form = useForm<ValuesValues>({ resolver: zodResolver(valuesSchema), defaultValues: valuesDefaults(saved) });
  const picks = useFieldArray({ control: form.control, name: "values" });
  const { save, saving, formError } = useSectionSave<ValuesSection, ValuesValues>({ slug: "values", next, setError: form.setError });

  const chosen = picks.fields.map((f) => f.value);
  const full = chosen.length >= MAX_VALUES;
  const listError = form.formState.errors.values?.root?.message ?? form.formState.errors.values?.message;
  const [personToBecome, ...optional] = VALUES_QUESTIONS;
  const hasOptionalAnswer = Boolean(saved?.wouldRegretNotDoing || saved?.rememberedFor);
  // The question fields are shared with the text screens and only touch top-level text fields.
  const textForm = form as unknown as UseFormReturn<TextValues>;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => save(valuesPayload(values)))}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          e.currentTarget.requestSubmit();
        }
      }}
      className="grid gap-7"
    >
      <fieldset aria-describedby={listError ? "values-error" : undefined}>
        <div className="flex items-baseline justify-between gap-3">
          <legend className="text-[17px] font-medium">{tv("label")}</legend>
          <span aria-live="polite" className="text-sm whitespace-nowrap text-muted-foreground">
            {tv("chosen", { count: chosen.length, max: MAX_VALUES })}
          </span>
        </div>

        {chosen.length === 0 ? (
          <p className="mt-3 rounded-[18px] border border-dashed border-input px-5 py-6 text-center text-sm text-muted-foreground">{tv("empty")}</p>
        ) : (
          <ul className="mt-3 grid gap-2.5">
            {picks.fields.map((f, i) => {
              const name = tv(`names.${f.value}`);
              const noteError = form.formState.errors.values?.[i]?.note?.message;
              return (
                <li key={f.id} className="animate-in rounded-[18px] bg-accent p-4 duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
                  <button
                    type="button"
                    onClick={() => picks.remove(i)}
                    aria-label={tv("remove", { value: name })}
                    className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-medium text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Check className="size-4 group-hover:hidden" aria-hidden />
                    <X className="hidden size-4 group-hover:block" aria-hidden />
                    {name}
                  </button>
                  <Input
                    dir="auto"
                    maxLength={300}
                    aria-label={tv("noteLabel", { value: name })}
                    placeholder={tv("notePlaceholder")}
                    aria-invalid={Boolean(noteError)}
                    className="mt-3 h-11 rounded-[10px] bg-card px-3.5 text-[15px] md:text-[15px]"
                    {...form.register(`values.${i}.note`)}
                  />
                  {noteError && (
                    <p role="alert" className="mt-1.5 text-sm text-destructive">
                      <ValidationText rule={noteError} />
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-5 text-sm text-muted-foreground">{tv(full ? "full" : "hint")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {LIFE_VALUES.filter((v) => !chosen.includes(v)).map((v) => (
            <button
              key={v}
              type="button"
              disabled={full}
              onClick={() => {
                picks.append({ value: v, note: "" });
                form.clearErrors("values");
              }}
              className={cn(
                "inline-flex h-11 items-center rounded-full bg-card px-4 text-[15px] ring-1 ring-input transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50",
                "disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              {tv(`names.${v}`)}
            </button>
          ))}
        </div>
        {listError && (
          <p id="values-error" role="alert" className="mt-2 text-sm text-destructive">
            <ValidationText rule={listError} />
          </p>
        )}
      </fieldset>

      <TextQuestionField question={personToBecome} id="values-personToBecome" form={textForm} withStarter />
      <MoreQuestions count={optional.length} defaultOpen={hasOptionalAnswer}>
        {optional.map((q) => (
          <TextQuestionField key={q.name} question={q} id={`values-${q.name}`} form={textForm} />
        ))}
      </MoreQuestions>

      <FormError error={formError} />
      <WizardFooter
        secondary={{ href: back, label: t("back") }}
        primary={
          <PrimaryAction type="submit" disabled={saving}>
            {t("saveAndWriteGoal")}
          </PrimaryAction>
        }
      />
    </form>
  );
}

function ValidationText({ rule }: { rule: string }) {
  const t = useTranslations();
  return <>{t(validationMessageKey(rule))}</>;
}
