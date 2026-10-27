import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { ClearOnMount } from "@/features/auth/components/clear-on-mount";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signedOut");
  return { title: t("title") };
}

/** After logging out: what is kept, what left the device, one way back in. */
export default async function SignedOutPage() {
  const t = await getTranslations("auth.signedOut");
  return (
    <div className="grid gap-6">
      <ClearOnMount />
      <div className="grid gap-2">
        <h1 className="text-3xl font-medium tracking-tight text-balance">{t("title")}</h1>
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
      <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
        {t("again")}
      </Link>
    </div>
  );
}
