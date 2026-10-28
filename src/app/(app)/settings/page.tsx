import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { LocaleSwitch } from "@/features/settings/components/locale-switch";
import { ThemeToggle } from "@/features/settings/components/theme-toggle";
import { PageHeader } from "@/components/shared/page-header";
import { Separator } from "@/components/ui/separator";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("settings") };
}

export default async function SettingsPage() {
  const t = await getTranslations();
  return (
    <div className="grid max-w-xl gap-8">
      <PageHeader title={t("nav.settings")} />
      <div className="grid gap-5 rounded-[22px] bg-card p-6 ring-1 ring-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-medium">{t("common.language")}</span>
          <LocaleSwitch />
        </div>
        <Separator />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-medium">{t("common.theme")}</span>
          <ThemeToggle />
        </div>
        <Separator />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-medium">{t("common.logout")}</span>
          <LogoutButton variant="outline" />
        </div>
      </div>
    </div>
  );
}
