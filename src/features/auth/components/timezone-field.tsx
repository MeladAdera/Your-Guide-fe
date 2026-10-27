"use client";

import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import { listTimezones, timezoneCity, timezoneOffset } from "@/features/auth/timezone";

/**
 * "Your days follow Dubai time. Change": the detected zone in one quiet line;
 * Change opens a list of every zone. The account keeps it for good.
 */
export function TimezoneField({ value, onChange }: { value: string; onChange: (zone: string) => void }) {
  const t = useTranslations("auth.register");
  const locale = useLocale();
  const id = useId();
  const [open, setOpen] = useState(false);
  const zones = useMemo(() => (open ? listTimezones(value) : []), [open, value]);

  if (!open) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <Clock aria-hidden className="size-4 shrink-0" />
        <span>{t("timezone", { zone: timezoneCity(value) })}</span>
        <button type="button" onClick={() => setOpen(true)} className="font-medium text-primary underline-offset-4 hover:underline">
          {t("timezoneChange")}
        </button>
      </p>
    );
  }

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {t("timezoneLabel")}
      </label>
      <p id={`${id}-why`} className="text-sm text-muted-foreground">
        {t("timezoneWhy")}
      </p>
      <select
        id={id}
        value={value}
        aria-describedby={`${id}-why`}
        onChange={(e) => onChange(e.target.value)}
        dir="ltr"
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring md:text-sm"
      >
        {zones.map((zone) => (
          <option key={zone} value={zone}>
            {zone.replace(/_/g, " ")} {timezoneOffset(zone, locale) ? `· ${timezoneOffset(zone, locale)}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
