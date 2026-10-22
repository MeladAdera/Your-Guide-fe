import { redirect } from "next/navigation";
import { serverApi, serverApiOrNull } from "@/lib/api/server";
import { ONBOARDING_SCREEN_PATHS, ONBOARDING_SCREENS, type Goal, type OnboardingStatus, type Session, type User } from "@/lib/api/types";

/**
 * Where a returning person lands (docs/handoff.md §7). Three cheap calls, in order:
 * who are you → is onboarding done → is there a goal, plus "is a session open".
 */
export default async function StartPage() {
  const user = await serverApiOrNull<User>("/api/auth/me", ["auth.not_logged_in", "401"]);
  if (!user) redirect("/login");

  const onboarding = await serverApi<OnboardingStatus>("/api/profile/onboarding");
  if (!onboarding.completed) {
    // Basics is optional and never in `missing`: offer it only when starting fresh.
    const startedFresh = ONBOARDING_SCREENS.every((s) => !onboarding.screens[s]);
    const first = startedFresh ? "basics" : (onboarding.missing[0] ?? "situation");
    redirect(`/onboarding/${ONBOARDING_SCREEN_PATHS[first]}`);
  }

  const goals = await serverApi<Goal[]>("/api/goals");
  if (goals.length === 0) redirect("/onboarding/goal");

  const active = await serverApiOrNull<Session>("/api/sessions/active", ["session.none_active"]);
  if (active) redirect("/session");

  redirect("/home");
}
