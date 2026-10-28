import { z } from "zod";
import { AGE_RANGES, EDUCATION_LEVELS, EMPLOYMENT_STATUSES, YEARS_EXPERIENCE, type BasicsSection } from "@/lib/api/types";

// Messages are rule codes from the `validation` namespace; limits mirror the API (docs/handoff.md §8).
export const basicsSchema = z.object({
  // Starts empty; picking one is the only requirement of the screen.
  employmentStatus: z.enum(EMPLOYMENT_STATUSES).nullable().refine((v) => v !== null, "isIn"),
  occupation: z.string().trim().max(120, "maxLength"),
  ageRange: z.enum(AGE_RANGES).nullable(),
  educationLevel: z.enum(EDUCATION_LEVELS).nullable(),
  yearsExperience: z.enum(YEARS_EXPERIENCE).nullable(),
  country: z.string().length(2).nullable(),
});
export type BasicsValues = z.input<typeof basicsSchema>;

/** Form values from what the API returned, or an empty form. */
export function basicsDefaults(saved: BasicsSection | null): BasicsValues {
  return {
    employmentStatus: saved?.employmentStatus ?? null,
    occupation: saved?.occupation ?? "",
    ageRange: saved?.ageRange ?? null,
    educationLevel: saved?.educationLevel ?? null,
    yearsExperience: saved?.yearsExperience ?? null,
    country: saved?.country ?? null,
  };
}

/** The PUT body: every field, empty answers as null, because the API replaces the whole screen. */
export function basicsPayload(values: BasicsValues): BasicsSection {
  const v = basicsSchema.parse(values);
  return {
    employmentStatus: v.employmentStatus!,
    occupation: v.occupation || null,
    ageRange: v.ageRange,
    educationLevel: v.educationLevel,
    yearsExperience: v.yearsExperience,
    country: v.country,
  };
}
