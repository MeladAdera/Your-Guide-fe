"use client";

import { useLocale, useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProgressDay } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useProgress } from "../api";
import { weekdayName } from "../week-days";

/** A day column holds this many marks before it would overflow; more still count in the totals. */
const MAX_STEPS = 4;
const MAX_KEPT = 2;

type Variant = "tile" | "compact";

/**
 * The week at a glance: how often the person struggled and kept going (the
 * number that matters most), then a strip of the last seven days, today
 * outlined. A dot is a step done, a ring a time they kept going. A week with
 * nothing in it shows a kind line, never a zero.
 *
 * `tile` fills the mint tile beside the card on a laptop; `compact` is the
 * card at the top of Home on a phone.
 */
export function WeekRhythm({ variant }: { variant: Variant }) {
  const t = useTranslations("rhythm");
  const { data, isPending, isError } = useProgress(7);
  const compact = variant === "compact";

  if (isPending) return <RhythmSkeleton variant={variant} />;

  const { totals, days } = data ?? { totals: { struggledAndContinued: 0, stepsDone: 0, focusMinutes: 0 }, days: [] };
  // An error reads like an empty week: the tile is encouragement, not a place for an error message.
  const empty = isError || (totals.struggledAndContinued === 0 && totals.stepsDone === 0 && totals.focusMinutes === 0);

  return (
    <section
      aria-label={t("title")}
      className={cn(
        "flex bg-illustration",
        compact ? "items-end justify-between gap-4 rounded-[22px] p-5" : "h-full flex-col rounded-[22px] px-10 pt-12 pb-10",
      )}
    >
      <div className={cn(compact && "min-w-0")}>
        <p className="text-sm text-muted-foreground">{t("title")}</p>
        {empty ? (
          <>
            <p className={cn("font-semibold tracking-tight text-balance", compact ? "mt-1 text-xl leading-snug" : "mt-2 text-3xl leading-tight")}>
              {t("emptyTitle")}
            </p>
            {!compact && <p className="mt-3 text-muted-foreground">{t("emptyBody")}</p>}
          </>
        ) : (
          <>
            <p className={cn("leading-none font-semibold tracking-tight tabular-nums", compact ? "mt-2 text-5xl" : "mt-6 text-8xl")}>
              {totals.struggledAndContinued}
            </p>
            <p className={cn("font-medium", compact ? "mt-2 text-sm" : "mt-3 max-w-[18ch] text-xl")}>
              {t("kept", { count: totals.struggledAndContinued })}
            </p>
          </>
        )}
      </div>

      <div className={cn(compact ? "w-[52%] shrink-0" : "mt-auto pt-8")}>
        <DayStrip days={days} compact={compact} />
        {!empty && !compact && (
          <p className="mt-5 text-sm text-muted-foreground">
            {t("totals", { steps: totals.stepsDone, minutes: totals.focusMinutes })}
          </p>
        )}
      </div>
    </section>
  );
}

function DayStrip({ days, compact }: { days: ProgressDay[]; compact: boolean }) {
  const t = useTranslations("rhythm");
  const locale = useLocale();
  // Without data (error or empty account) there are no dates; seven plain columns keep the shape.
  const columns: (ProgressDay | null)[] = days.length ? days : Array.from({ length: 7 }, () => null);

  return (
    <ol className={cn("grid grid-cols-7 text-center", compact ? "gap-1.5" : "gap-2")}>
      {columns.map((day, i) => {
        const isToday = i === columns.length - 1;
        const steps = day?.stepsDone ?? 0;
        const kept = day?.struggledAndContinued ?? 0;
        const label = day
          ? t("dayLabel", { day: weekdayName(day.date, locale, "long"), steps, kept }) + (isToday ? ` (${t("today")})` : "")
          : undefined;
        return (
          <li key={day?.date ?? i} aria-label={label} className="grid justify-items-center gap-2">
            <div
              aria-hidden
              className={cn(
                "flex w-full flex-col-reverse items-center gap-1 rounded-full",
                compact ? "h-14 py-1.5" : "h-24 py-2",
                isToday ? "bg-background ring-2 ring-primary" : "bg-background/60",
              )}
            >
              {Array.from({ length: Math.min(steps, MAX_STEPS) }, (_, k) => (
                <span key={`s${k}`} className={cn("rounded-full bg-primary", compact ? "size-2" : "size-2.5")} />
              ))}
              {Array.from({ length: Math.min(kept, MAX_KEPT) }, (_, k) => (
                <span key={`k${k}`} className={cn("rounded-full border-primary", compact ? "size-2.5 border-2" : "size-3 border-[3px]")} />
              ))}
            </div>
            {day && !compact && (
              <span aria-hidden className={cn("text-xs text-muted-foreground", isToday && "font-semibold text-foreground")}>
                {weekdayName(day.date, locale, "narrow")}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function RhythmSkeleton({ variant }: { variant: Variant }) {
  const compact = variant === "compact";
  return (
    <div aria-hidden className={cn("flex bg-illustration", compact ? "h-[104px] rounded-[22px] p-5" : "h-full flex-col rounded-[22px] px-10 pt-12 pb-10")}>
      <Skeleton className="h-4 w-20 bg-background/60" />
      {!compact && (
        <>
          <Skeleton className="mt-6 h-20 w-16 bg-background/60" />
          <Skeleton className="mt-auto h-24 w-full rounded-full bg-background/60" />
        </>
      )}
    </div>
  );
}
