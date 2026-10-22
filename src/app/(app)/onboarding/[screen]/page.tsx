import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ComingNext } from "@/components/coming-next";
import { ONBOARDING_SCREEN_PATHS, type OnboardingScreen } from "@/lib/api/types";

const SCREEN_BY_PATH = Object.fromEntries(
  Object.entries(ONBOARDING_SCREEN_PATHS).map(([screen, path]) => [path, screen as OnboardingScreen]),
) as Record<string, OnboardingScreen>;

/** The onboarding wizard comes with the next slice; for now each screen is a named placeholder. */
export default async function OnboardingScreenPage({ params }: PageProps<"/onboarding/[screen]">) {
  const { screen } = await params;
  const t = await getTranslations("onboarding.screens");
  if (screen === "goal") return <ComingNext title={t("goal")} />;
  const key = SCREEN_BY_PATH[screen];
  if (!key) notFound();
  return <ComingNext title={t(key)} />;
}
