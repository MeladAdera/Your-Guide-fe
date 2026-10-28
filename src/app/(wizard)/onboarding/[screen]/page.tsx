import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { WizardFooter, PrimaryAction } from "@/features/onboarding/components/wizard-footer";
import { WizardFrame } from "@/features/onboarding/components/wizard-frame";
import { nextHref, prevHref, savedFlags, screenOf, stepOf } from "@/features/onboarding/screens";
import { serverApi } from "@/lib/api/server";
import type { OnboardingStatus } from "@/lib/api/types";

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
  const status = await serverApi<OnboardingStatus>("/api/profile/onboarding");
  const back = prevHref(screen);
  const isFirst = back === null;

  return (
    <WizardFrame step={stepOf(screen)} saved={savedFlags(status)} title={t(`screens.${screen}`)} why={t(`why.${screen}`)}>
      {/* The questions of each screen arrive in build steps 2 to 5. */}
      <p className="rounded-[18px] p-5 text-muted-foreground ring-1 ring-border">{t("questionsNext")}</p>
      <WizardFooter
        secondary={isFirst ? { href: nextHref(screen), label: t("skipForNow") } : { href: back, label: t("back") }}
        primary={<PrimaryAction href={nextHref(screen)}>{screen === "values" ? t("saveAndWriteGoal") : t("saveAndContinue")}</PrimaryAction>}
      />
    </WizardFrame>
  );
}
