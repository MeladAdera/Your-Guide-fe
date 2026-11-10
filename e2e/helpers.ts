import type { Page } from "@playwright/test";

export const API_URL = process.env.API_URL ?? "http://localhost:3001";

export async function apiIsUp(): Promise<boolean> {
  try {
    return (await fetch(`${API_URL}/api/health`)).ok;
  } catch {
    return false;
  }
}

/** Answers for screens 2 to 7, the minimum the API accepts, so goal tests start where onboarding ends. */
const SECTIONS: Record<string, unknown> = {
  situation: { typicalDay: "Most days I work and study.", wantToChange: "I'd like to start my work earlier.", satisfiedWith: null, wishMoreTimeFor: null },
  achievements: { proudOf: "Once, I finished a course while working.", whatWasHard: null, learnedAboutSelf: null },
  patterns: { oftenPostpone: "I keep putting off calling the bank.", lessonFromMistake: null, patternToChange: null },
  "self-view": { whoIAm: "Someone learning to be patient.", goodAt: null, othersComeToMeFor: null, stillFiguringOut: null },
  confidence: {
    canLearnIfPersist: 4,
    canTryAgain: 4,
    followThrough: 3,
    focusWithoutMotivation: 3,
    actionsShapeFuture: 4,
    doubtDespiteEvidence: 3,
    avoidWhenAfraid: 3,
    compareTooMuch: 3,
  },
  values: {
    values: [
      { value: "family", note: "They are why I keep going." },
      { value: "health", note: null },
    ],
    personToBecome: "Someone who finishes what they start.",
    wouldRegretNotDoing: null,
    rememberedFor: null,
  },
};

/**
 * A new account, signed in in this page's browser context. The request goes
 * through the app's own /api rewrite, so the session cookie lands where the
 * pages expect it.
 */
export async function signUp(page: Page, prefix = "e2e"): Promise<string> {
  await page.context().clearCookies();
  const email = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  const data = { email, password: "correct horse battery", timezone: "UTC", locale: "en" };
  let res = await page.request.post("/api/auth/register", { data });
  // The API allows 5 sign-ups or logins a minute per IP (docs/handoff.md §4); a full run needs more, so wait the minute out.
  for (let tries = 0; res.status() === 429 && tries < 2; tries++) {
    await page.waitForTimeout(61_000);
    res = await page.request.post("/api/auth/register", { data });
  }
  if (!res.ok()) throw new Error(`register failed: ${res.status()} ${await res.text()}`);
  return email;
}

/** A new account with onboarding 2–7 saved, so goal tests start where onboarding ends. */
export async function signUpWithOnboarding(page: Page, prefix = "e2e"): Promise<string> {
  const email = await signUp(page, prefix);
  for (const [slug, body] of Object.entries(SECTIONS)) {
    const put = await page.request.put(`/api/profile/sections/${slug}`, { data: body });
    if (!put.ok()) throw new Error(`saving ${slug} failed: ${put.status()} ${await put.text()}`);
  }
  return email;
}
