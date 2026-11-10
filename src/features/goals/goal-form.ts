import { z } from "zod";
import type { Goal, GoalInput } from "@/lib/api/types";

/** The four goal questions in the API's (WOOP) order; limits mirror docs/handoff.md §9. */
export const GOAL_FIELDS = [
  { name: "title", required: true, max: 200 },
  { name: "whyItMatters", required: true, max: 1000 },
  { name: "obstacle", required: false, max: 1000 },
  { name: "firstOutcome", required: false, max: 1000 },
] as const;
export type GoalField = (typeof GOAL_FIELDS)[number]["name"];

// Rule codes from the `validation` namespace.
export const goalSchema = z.object({
  title: z.string().trim().min(1, "required").max(200, "maxLength"),
  whyItMatters: z.string().trim().min(1, "required").max(1000, "maxLength"),
  obstacle: z.string().trim().max(1000, "maxLength"),
  firstOutcome: z.string().trim().max(1000, "maxLength"),
});
export type GoalValues = z.input<typeof goalSchema>;

const text = (v: unknown) => (typeof v === "string" ? v : "");

/** Form values from a goal (editing), a draft, or nothing. */
export function goalDefaults(goal: Partial<Goal> | Record<string, unknown> | null): GoalValues {
  return { title: text(goal?.title), whyItMatters: text(goal?.whyItMatters), obstacle: text(goal?.obstacle), firstOutcome: text(goal?.firstOutcome) };
}

/** The body for POST and PATCH: every field, trimmed; an empty optional answer is `null`, which clears it on PATCH. */
export function goalPayload(values: GoalValues): GoalInput {
  const v = goalSchema.parse(values);
  return { title: v.title, whyItMatters: v.whyItMatters, obstacle: v.obstacle || null, firstOutcome: v.firstOutcome || null };
}

export const isGoalField = (field: string): field is GoalField => GOAL_FIELDS.some((f) => f.name === field);
