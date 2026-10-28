"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatCountdown } from "@/features/auth/cooldown";

/**
 * The form's one primary action. During a rate-limit pause it shows a calm
 * note above it and counts down instead of failing again.
 */
export function SubmitButton({ label, pending, cooldownSeconds, arrow }: { label: string; pending: boolean; cooldownSeconds: number; arrow?: boolean }) {
  const t = useTranslations("auth");
  const waiting = cooldownSeconds > 0;
  return (
    <div className="grid gap-3">
      {waiting ? (
        <div role="status" className="grid gap-1 rounded-lg bg-muted px-4 py-3">
          <p className="text-sm font-medium">{t("cooldownTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("cooldownBody")}</p>
        </div>
      ) : null}
      <Button type="submit" size="lg" disabled={pending || waiting} className="num h-12 text-base">
        {waiting ? t("tryAgainIn", { time: formatCountdown(cooldownSeconds) }) : label}
        {arrow && !waiting ? <ArrowRight aria-hidden className="size-4.5 rtl:-scale-x-100" /> : null}
      </Button>
    </div>
  );
}
