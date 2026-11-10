import { z } from "zod";
import { LIFE_VALUES, type ValuesSection } from "@/lib/api/types";
import type { TextQuestion } from "./text-screens";

export const MIN_VALUES = 2;
export const MAX_VALUES = 5;

/** The written questions under the values; the first is required (docs/handoff.md §8). */
export const VALUES_QUESTIONS: TextQuestion[] = [
  { name: "personToBecome", required: true, max: 1000 },
  { name: "wouldRegretNotDoing", required: false, max: 1000 },
  { name: "rememberedFor", required: false, max: 1000 },
];

// Rule codes from the `validation` namespace; limits mirror the API.
export const valuesSchema = z.object({
  values: z
    .array(z.object({ value: z.enum(LIFE_VALUES), note: z.string().trim().max(300, "maxLength") }))
    .min(MIN_VALUES, "arrayMinSize")
    .max(MAX_VALUES, "arrayMaxSize")
    .refine((picks) => new Set(picks.map((p) => p.value)).size === picks.length, "arrayUnique"),
  personToBecome: z.string().trim().min(1, "required").max(1000, "maxLength"),
  wouldRegretNotDoing: z.string().trim().max(1000, "maxLength"),
  rememberedFor: z.string().trim().max(1000, "maxLength"),
});
export type ValuesValues = z.input<typeof valuesSchema>;

/** Form values from what the API returned, in the order they were picked, or an empty form. */
export function valuesDefaults(saved: Partial<ValuesSection> | null): ValuesValues {
  return {
    values: (saved?.values ?? []).map((p) => ({ value: p.value, note: p.note ?? "" })),
    personToBecome: saved?.personToBecome ?? "",
    wouldRegretNotDoing: saved?.wouldRegretNotDoing ?? "",
    rememberedFor: saved?.rememberedFor ?? "",
  };
}

/** The PUT body: every field, trimmed, empty notes and answers as null. A set, not a ranking. */
export function valuesPayload(values: ValuesValues): ValuesSection {
  const v = valuesSchema.parse(values);
  return {
    values: v.values.map((p) => ({ value: p.value, note: p.note || null })),
    personToBecome: v.personToBecome,
    wouldRegretNotDoing: v.wouldRegretNotDoing || null,
    rememberedFor: v.rememberedFor || null,
  };
}
