import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/shared/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { ClearOnMount } from "@/features/auth/components/clear-on-mount";
import { LocaleSwitch } from "@/features/settings/components/locale-switch";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signedOut");
  return { title: t("title") };
}

/**
 * After logging out: what is kept, what left the device, one way back in.
 * Outside the (auth) group because the sign-in shell only serves /sign-in and
 * /sign-up.
 */
export default async function SignedOutPage() {
  const t = await getTranslations("auth.signedOut");
  const tApp = await getTranslations("app");
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-5 py-5 lg:px-8 lg:py-6">
        <BrandMark name={tApp("name")} />
        <LocaleSwitch compact />
      </header>
      <main id="content" className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center gap-6 px-5 py-10">
        <ClearOnMount />
        <div className="grid gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{t("title")}</h1>
          <p className="text-muted-foreground">{t("body")}</p>
        </div>
        <ul className="divide-y divide-border border-y border-border">
          {[t("drafts"), t("browser")].map((line) => (
            <li key={line} className="flex items-center gap-3 py-3 text-sm">
              <Check aria-hidden className="size-4 shrink-0 text-success-ink" strokeWidth={2.5} />
              {line}
            </li>
          ))}
        </ul>
        <Link href="/sign-in" className={cn(buttonVariants({ size: "lg" }), "h-12 text-base")}>
          {t("again")}
        </Link>
      </main>
      <footer className="px-5 pb-6 text-sm text-muted-foreground lg:px-8">
        © {new Date().getFullYear()} {tApp("name")}
      </footer>
    </div>
  );
}
