"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatCountdown } from "@/features/auth/cooldown";

/**
 * The form's one primary action. During a rate-limit pause it shows a calm
 * note above it and counts down instead of failing again.
 */
export function SubmitButton({ label, pending, cooldownSeconds }: { label: string; pending: boolean; cooldownSeconds: number }) {
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
      <Button type="submit" size="lg" disabled={pending || waiting} className="num">
        {waiting ? t("tryAgainIn", { time: formatCountdown(cooldownSeconds) }) : label}
      </Button>
    </div>
  );
}
