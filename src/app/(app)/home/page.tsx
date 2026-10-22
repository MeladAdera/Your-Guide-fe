import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { SignedInAs } from "./signed-in-as";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  return { title: t("title") };
}

export default async function HomePage() {
  const t = await getTranslations("home");
  return (
    <div className="grid max-w-2xl gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("placeholder")}</p>
      <SignedInAs />
      <div>
        <Button asChild variant="outline">
          <Link href="/styleguide">{t("styleguide")}</Link>
        </Button>
      </div>
    </div>
  );
}
