import { CONFIDENCE_STATEMENTS, type ConfidenceSection, type ConfidenceStatement } from "@/lib/api/types";

export type Score = 1 | 2 | 3 | 4 | 5;
export type Answers = Partial<Record<ConfidenceStatement, Score>>;

/** 1 = strongly disagree … 5 = strongly agree (docs/handoff.md §6). */
export const SCORES: Score[] = [1, 2, 3, 4, 5];

/** The saved answers, keeping only valid ones, or none. */
export function confidenceDefaults(saved: Record<string, unknown> | null): Answers {
  const out: Answers = {};
  for (const s of CONFIDENCE_STATEMENTS) {
    const v = saved?.[s];
    if (typeof v === "number" && SCORES.includes(v as Score)) out[s] = v as Score;
  }
  return out;
}

/** Index of the first statement without an answer, or -1 when all eight are answered. */
export function firstUnanswered(answers: Answers): number {
  return CONFIDENCE_STATEMENTS.findIndex((s) => answers[s] === undefined);
}

/** Where the screen opens: the first open statement, or the first one when all are answered. */
export function startIndex(answers: Answers): number {
  return Math.max(0, firstUnanswered(answers));
}

/** The PUT body, only when every statement has an answer. */
export function confidencePayload(answers: Answers): ConfidenceSection | null {
  if (firstUnanswered(answers) !== -1) return null;
  return Object.fromEntries(CONFIDENCE_STATEMENTS.map((s) => [s, answers[s]])) as ConfidenceSection;
}
