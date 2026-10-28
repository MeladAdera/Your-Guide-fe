"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { Field } from "@/components/shared/field";
import { FormError } from "@/components/shared/form-error";
import { Input } from "@/components/ui/input";
import { AGE_RANGES, EDUCATION_LEVELS, EMPLOYMENT_STATUSES, YEARS_EXPERIENCE, type BasicsSection } from "@/lib/api/types";
import { basicsDefaults, basicsPayload, basicsSchema, type BasicsValues } from "../basics";
import { useSectionSave } from "../use-section-save";
import { ChoiceChips } from "./choice-chips";
import { MoreQuestions } from "./more-questions";
import { PrimaryAction, WizardFooter } from "./wizard-footer";

/**
 * Screen 1 · A little about you. The only screen that can be skipped; when
 * saved, the situation is required and everything else is optional. Large tap
 * chips; education, experience and country sit under "Add more".
 */
export function BasicsForm({
  saved,
  next,
  countries,
}: {
  saved: BasicsSection | null;
  next: string;
  /** Named on the server: Node and the browser name some countries differently, which would break hydration. */
  countries: { value: string; label: string }[];
}) {
  const t = useTranslations("onboarding");
  const form = useForm<BasicsValues>({ resolver: zodResolver(basicsSchema), defaultValues: basicsDefaults(saved) });
  const { save, saving, formError } = useSectionSave<BasicsSection, BasicsValues>({ slug: "basics", next, setError: form.setError });
  const { errors } = form.formState;

  const tb = useTranslations("onboarding.basics");
  const employment = EMPLOYMENT_STATUSES.map((value) => ({ value, label: tb(`employment.${value}`) }));
  const ages = AGE_RANGES.map((value) => ({ value, label: tb(`ages.${value}`) }));
  const educations = EDUCATION_LEVELS.map((value) => ({ value, label: tb(`educations.${value}`) }));
  const years = YEARS_EXPERIENCE.map((value) => ({ value, label: tb(`years.${value}`) }));
  const hasMore = Boolean(saved?.educationLevel || saved?.yearsExperience || saved?.country);

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => save(basicsPayload(values)))} className="grid gap-7">
      <Controller
        control={form.control}
        name="employmentStatus"
        render={({ field }) => (
          <ChoiceChips
            legend={t("basics.situation")}
            options={employment}
            value={field.value}
            onChange={field.onChange}
            error={errors.employmentStatus?.message}
          />
        )}
      />

      <Field id="basics-occupation" label={t("basics.occupation")} optional error={errors.occupation?.message} className="gap-3 [&>label]:text-[17px]">
        <Input
          id="basics-occupation"
          dir="auto"
          maxLength={120}
          autoComplete="organization-title"
          className="h-12 rounded-[10px] bg-card px-4 text-base md:text-base"
          {...form.register("occupation")}
        />
      </Field>

      <Controller
        control={form.control}
        name="ageRange"
        render={({ field }) => (
          <ChoiceChips legend={t("basics.age")} optional options={ages} value={field.value} onChange={field.onChange} />
        )}
      />

      <MoreQuestions count={3} defaultOpen={hasMore}>
        <Controller
          control={form.control}
          name="educationLevel"
          render={({ field }) => (
            <ChoiceChips legend={t("basics.education")} optional options={educations} value={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          control={form.control}
          name="yearsExperience"
          render={({ field }) => (
            <ChoiceChips legend={t("basics.experience")} optional options={years} value={field.value} onChange={field.onChange} />
          )}
        />
        <Field id="basics-country" label={t("basics.country")} optional className="gap-3 [&>label]:text-[17px]">
          <select
            id="basics-country"
            className="h-12 w-full rounded-[10px] border border-input bg-card px-3.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            {...form.register("country", { setValueAs: (v: string) => v || null })}
          >
            <option value="">{t("basics.countryNone")}</option>
            {countries.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </MoreQuestions>

      <FormError error={formError} />
      <WizardFooter
        secondary={{ href: next, label: t("skipForNow") }}
        primary={
          <PrimaryAction type="submit" disabled={saving}>
            {t("saveAndContinue")}
          </PrimaryAction>
        }
      />
    </form>
  );
}
