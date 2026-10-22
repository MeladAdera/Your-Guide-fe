// Request and response shapes of the Your Guide API, as documented in docs/handoff.md.
// The frontend declares these itself; openapi.json is the source of truth.

export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export interface User {
  id: string;
  email: string;
  timezone: string;
  locale: Locale;
}

// ---- Fixed lists (codes; labels live in the message files) ----

export const EMPLOYMENT_STATUSES = [
  "student",
  "employed",
  "self_employed",
  "between_jobs",
  "caregiver",
  "retired",
  "other",
] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const AGE_RANGES = ["under_18", "18_24", "25_34", "35_44", "45_54", "55_plus"] as const;
export type AgeRange = (typeof AGE_RANGES)[number];

export const EDUCATION_LEVELS = ["secondary", "vocational", "bachelor", "master", "doctorate", "other"] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const YEARS_EXPERIENCE = ["none", "under_2", "2_5", "6_10", "over_10"] as const;
export type YearsExperience = (typeof YEARS_EXPERIENCE)[number];

export const LIFE_VALUES = [
  "family",
  "health",
  "career",
  "learning",
  "contribution",
  "financial_security",
  "creativity",
  "relationships",
  "spirituality",
  "independence",
] as const;
export type LifeValue = (typeof LIFE_VALUES)[number];

/** Screen keys as the API reports them in `screens` and `missing`. */
export const ONBOARDING_SCREENS = [
  "basics",
  "situation",
  "achievements",
  "patterns",
  "selfView",
  "confidence",
  "values",
] as const;
export type OnboardingScreen = (typeof ONBOARDING_SCREENS)[number];

/** The same screens as they appear in the URL path of /api/profile/sections/<screen>. */
export const ONBOARDING_SCREEN_PATHS: Record<OnboardingScreen, string> = {
  basics: "basics",
  situation: "situation",
  achievements: "achievements",
  patterns: "patterns",
  selfView: "self-view",
  confidence: "confidence",
  values: "values",
};

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const SESSION_OUTCOMES = ["done", "progress", "stuck", "distracted", "tired"] as const;
export type SessionOutcome = (typeof SESSION_OUTCOMES)[number];

export const STRUGGLE_SITUATIONS = ["stuck", "tired", "comparing", "negative_thought"] as const;
export type StruggleSituation = (typeof STRUGGLE_SITUATIONS)[number];

// ---- Onboarding ----

export interface OnboardingStatus {
  completed: boolean;
  screens: Record<OnboardingScreen, boolean>;
  missing: OnboardingScreen[];
}

export interface BasicsSection {
  employmentStatus: EmploymentStatus;
  ageRange?: AgeRange | null;
  country?: string | null;
  educationLevel?: EducationLevel | null;
  occupation?: string | null;
  yearsExperience?: YearsExperience | null;
}

export interface SituationSection {
  typicalDay: string;
  wantToChange: string;
  satisfiedWith?: string | null;
  wishMoreTimeFor?: string | null;
}

export interface AchievementsSection {
  proudOf: string;
  whatWasHard?: string | null;
  learnedAboutSelf?: string | null;
}

export interface PatternsSection {
  oftenPostpone: string;
  lessonFromMistake?: string | null;
  patternToChange?: string | null;
}

export interface SelfViewSection {
  whoIAm: string;
  goodAt?: string | null;
  othersComeToMeFor?: string | null;
  stillFiguringOut?: string | null;
}

export const CONFIDENCE_STATEMENTS = [
  "canLearnIfPersist",
  "canTryAgain",
  "followThrough",
  "focusWithoutMotivation",
  "actionsShapeFuture",
  "doubtDespiteEvidence",
  "avoidWhenAfraid",
  "compareTooMuch",
] as const;
export type ConfidenceStatement = (typeof CONFIDENCE_STATEMENTS)[number];

export type ConfidenceSection = Record<ConfidenceStatement, 1 | 2 | 3 | 4 | 5>;

export interface ValuePick {
  value: LifeValue;
  note?: string | null;
}

export interface ValuesSection {
  values: ValuePick[];
  personToBecome: string;
  wouldRegretNotDoing?: string | null;
  rememberedFor?: string | null;
}

export type Saved<T> = T & { updatedAt: string };

export interface Profile {
  basics: Saved<BasicsSection> | null;
  situation: Saved<SituationSection> | null;
  achievements: Saved<AchievementsSection> | null;
  patterns: Saved<PatternsSection> | null;
  selfView: Saved<SelfViewSection> | null;
  confidence: Saved<ConfidenceSection> | null;
  values: Saved<ValuesSection> | null;
}

// ---- Goals, tasks, steps ----

export interface Goal {
  id: string;
  title: string;
  whyItMatters: string;
  obstacle: string | null;
  firstOutcome: string | null;
  createdAt: string;
  archivedAt: string | null;
}

export interface GoalInput {
  title: string;
  whyItMatters: string;
  obstacle?: string | null;
  firstOutcome?: string | null;
}

export interface Task {
  id: string;
  goalId: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
}

export interface Step {
  id: string;
  taskId: string;
  title: string;
  doneAt: string | null;
  createdAt: string;
}

export interface Breakdown {
  steps: string[];
}

// ---- Sessions ----

export interface SessionRef {
  id: string;
  title: string;
}

export interface Session {
  id: string;
  startedAt: string;
  endedAt: string | null;
  step: SessionRef;
  task: SessionRef;
  goal: SessionRef;
}

export interface EndedSession extends Session {
  endedAt: string;
  outcome: SessionOutcome;
  rating: 1 | 2 | 3 | 4 | 5;
  note: string | null;
}

export interface SessionReview {
  outcome: SessionOutcome;
  rating: 1 | 2 | 3 | 4 | 5;
  note?: string;
}

// ---- Struggles ----

export interface Struggle {
  id: string;
  situation: StruggleSituation;
  description: string;
  advice: string;
  nextStep: string;
  continued: boolean | null;
  sessionId: string | null;
  createdAt: string;
}

// ---- Progress ----

export interface ProgressDay {
  /** YYYY-MM-DD in the user's timezone. Show as is; never parse into a Date. */
  date: string;
  focusMinutes: number;
  stepsDone: number;
  struggledAndContinued: number;
}

export interface Progress {
  days: ProgressDay[];
  totals: {
    focusMinutes: number;
    stepsDone: number;
    struggledAndContinued: number;
  };
}

// ---- Errors ----

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  code?: string;
  message?: string | string[];
  missing?: OnboardingScreen[];
  errors?: { field: string; code: string }[];
}
