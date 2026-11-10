import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { BasicsForm } from "@/features/onboarding/components/basics-form";
import { ConfidenceForm } from "@/features/onboarding/components/confidence-form";
import { TextScreenForm } from "@/features/onboarding/components/text-screen-form";
import { ValuesForm } from "@/features/onboarding/components/values-form";
import { WizardFrame } from "@/features/onboarding/components/wizard-frame";
import { countryOptions } from "@/features/onboarding/countries";
import { nextHref, prevHref, savedFlags, screenOf, stepOf } from "@/features/onboarding/screens";
import { serverApi, serverApiOrNull } from "@/lib/api/server";
import type { BasicsSection, OnboardingStatus } from "@/lib/api/types";

export async function generateMetadata({ params }: PageProps<"/onboarding/[screen]">): Promise<Metadata> {
  const { screen } = await params;
  const t = await getTranslations("onboarding.screens");
  const key = screenOf(screen);
  return key ? { title: t(key) } : {};
}

/** The seven screens. The first goal after them has its own route, `/onboarding/goal`. */
export default async function OnboardingScreenPage({ params }: PageProps<"/onboarding/[screen]">) {
  const { screen: slug } = await params;
  const t = await getTranslations("onboarding");

  const screen = screenOf(slug);
  if (!screen) notFound();
  const [status, saved] = await Promise.all([
    serverApi<OnboardingStatus>("/api/profile/onboarding"),
    // 404 profile.screen_not_saved means "start empty".
    serverApiOrNull<unknown>(`/api/profile/sections/${slug}`, ["profile.screen_not_saved"]),
  ]);
  const next = nextHref(screen);
  // Only the first screen has no previous one, and it shows Skip for now instead of Back.
  const back = prevHref(screen) ?? next;

  return (
    <WizardFrame step={stepOf(screen)} saved={savedFlags(status)} title={t(`screens.${screen}`)} why={t(`why.${screen}`)}>
      {screen === "basics" ? (
        <BasicsForm saved={saved as BasicsSection | null} next={next} countries={countryOptions(await getLocale())} />
      ) : screen === "confidence" ? (
        <ConfidenceForm saved={saved as Record<string, unknown> | null} back={back} next={next} />
      ) : screen === "values" ? (
        <ValuesForm saved={saved as Record<string, unknown> | null} back={back} next={next} />
      ) : (
        <TextScreenForm screen={screen} slug={slug} saved={saved as Record<string, unknown> | null} back={back} next={next} />
      )}
    </WizardFrame>
  );
}
