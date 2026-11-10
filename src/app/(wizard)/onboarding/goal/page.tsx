import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FirstGoal, type OwnWords } from "@/features/goals/components/first-goal";
import { serverApi } from "@/lib/api/server";
import { ONBOARDING_SCREEN_PATHS, type Goal, type OnboardingStatus, type Profile } from "@/lib/api/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("goals.first");
  return { title: t("title") };
}

/**
 * The wizard's last step. Only for someone who has finished the seven screens
 * and has no goal yet: anyone else goes to the first missing screen, or to
 * their goals.
 */
export default async function FirstGoalPage() {
  const status = await serverApi<OnboardingStatus>("/api/profile/onboarding");
  if (!status.completed) redirect(`/onboarding/${ONBOARDING_SCREEN_PATHS[status.missing[0] ?? "situation"]}`);

  const [goals, profile] = await Promise.all([serverApi<Goal[]>("/api/goals"), serverApi<Profile>("/api/profile")]);
  if (goals.length > 0) redirect("/goals");

  const words: OwnWords = {
    values: profile.values?.values.map((p) => p.value) ?? [],
    becoming: profile.values?.personToBecome ?? null,
    change: profile.situation?.wantToChange ?? null,
    postpone: profile.patterns?.oftenPostpone ?? null,
  };
  return <FirstGoal words={words} back={`/onboarding/${ONBOARDING_SCREEN_PATHS.values}`} />;
}
