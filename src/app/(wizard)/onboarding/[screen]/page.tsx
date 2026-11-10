import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
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
  const key = screen === "goal" ? "goal" : screenOf(screen);
  return key ? { title: t(key) } : {};
}

export default async function OnboardingScreenPage({ params }: PageProps<"/onboarding/[screen]">) {
  const { screen: slug } = await params;
  const t = await getTranslations("onboarding");

  // The first goal belongs to feature 2; until then it is a named placeholder in the plain card.
  if (slug === "goal") {
    const tc = await getTranslations("common");
    return (
      <main id="content" className="flex-1 px-5 lg:mx-8 lg:mb-6 lg:rounded-[28px] lg:bg-background lg:px-16 lg:py-14 lg:shadow-[0_30px_80px_-30px_rgb(15_61_53/0.35)]">
        <PageHeader title={t("screens.goal")} intro={tc("comingNext")} />
      </main>
    );
  }

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
