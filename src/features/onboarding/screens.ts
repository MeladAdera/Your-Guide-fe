import { ONBOARDING_SCREEN_PATHS, ONBOARDING_SCREENS, type OnboardingScreen, type OnboardingStatus } from "@/lib/api/types";

/** The seven screens in order, as URL slugs (`/onboarding/<slug>`). The goal page follows the last one. */
export const SCREEN_ORDER = ONBOARDING_SCREENS.map((s) => ONBOARDING_SCREEN_PATHS[s]);
export const GOAL_PATH = "/onboarding/goal";

const SCREEN_BY_SLUG = Object.fromEntries(ONBOARDING_SCREENS.map((s) => [ONBOARDING_SCREEN_PATHS[s], s])) as Record<string, OnboardingScreen>;

/** The API key for a URL slug, or null when the slug is not a screen. */
export function screenOf(slug: string): OnboardingScreen | null {
  return SCREEN_BY_SLUG[slug] ?? null;
}

/** 1-based position of a screen, for "Step n of 7". */
export function stepOf(screen: OnboardingScreen): number {
  return ONBOARDING_SCREENS.indexOf(screen) + 1;
}

/** Where Save and continue leads: the next screen, or the first goal after the last one. */
export function nextHref(screen: OnboardingScreen): string {
  const i = ONBOARDING_SCREENS.indexOf(screen);
  const next = ONBOARDING_SCREENS[i + 1];
  return next ? `/onboarding/${ONBOARDING_SCREEN_PATHS[next]}` : GOAL_PATH;
}

/** Where Back leads, or null on the first screen. */
export function prevHref(screen: OnboardingScreen): string | null {
  const i = ONBOARDING_SCREENS.indexOf(screen);
  const prev = ONBOARDING_SCREENS[i - 1];
  return prev ? `/onboarding/${ONBOARDING_SCREEN_PATHS[prev]}` : null;
}

/** Which of the seven screens are saved, in order, for the path and the step line. */
export function savedFlags(status: OnboardingStatus): boolean[] {
  return ONBOARDING_SCREENS.map((s) => status.screens[s]);
}
