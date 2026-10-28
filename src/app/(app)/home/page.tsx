import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { WeekRhythm } from "@/features/progress/components/week-rhythm";
import { SignedInAs } from "./signed-in-as";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  return { title: t("title") };
}

export default async function HomePage() {
  const t = await getTranslations("home");
  return (
    <div className="grid gap-6 lg:gap-8">
      {/* Phones have no tile beside the card, so the week sits at the top of Home. */}
      <div className="lg:hidden">
        <WeekRhythm variant="compact" />
      </div>
      <PageHeader title={t("title")} intro={t("placeholder")} />
      <SignedInAs />
      <div>
        <Button asChild variant="outline" className="h-12 rounded-[10px] px-5 text-base">
          <Link href="/styleguide">{t("styleguide")}</Link>
        </Button>
      </div>
    </div>
  );
}
