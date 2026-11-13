import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { NextStep } from "../next-step";

/**
 * Home's one primary action (docs/features/04-home.md §3.2): the next step as
 * the page heading, where it sits, and the way to it. Start session joins the
 * button with feature 5. `quiet` turns the button to outline while an open
 * session's banner holds the page's one primary action.
 */
export async function NextStepCard({ next, quiet = false }: { next: NextStep; quiet?: boolean }) {
  const t = await getTranslations("home.next");

  const href = next.kind === "no-goals" ? "/goals" : `/goals/${next.goal.id}`;
  const action = next.kind === "no-goals" ? t("toGoals") : t("open");

  return (
    <section aria-labelledby="next-step-title" className="rounded-[22px] bg-card p-6 ring-1 ring-border lg:p-8">
      <p className="text-sm font-medium text-primary">{t("eyebrow")}</p>

      {next.kind === "step" && (
        <>
          <h1 id="next-step-title" dir="auto" className="mt-2 text-3xl font-semibold tracking-tight text-balance lg:text-5xl lg:leading-tight">
            {next.step.title}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground lg:text-lg">
            <span className="sr-only">{t("goal")}:</span>
            <span dir="auto">{next.goal.title}</span>
            <ChevronRight aria-hidden className="size-4 shrink-0 rtl:rotate-180" />
            <span className="sr-only">{t("task")}:</span>
            <span dir="auto">{next.task.title}</span>
          </p>
        </>
      )}

      {next.kind === "nothing-open" && (
        <>
          <h1 id="next-step-title" className="mt-2 text-3xl font-semibold tracking-tight text-balance lg:text-5xl lg:leading-tight">
            {t("nothingOpenTitle")}
          </h1>
          <p className="mt-3 text-muted-foreground lg:text-lg">
            <span className="sr-only">{t("goal")}: </span>
            <span dir="auto" className="font-medium text-foreground">
              {next.goal.title}
            </span>
          </p>
          <p className="mt-1 max-w-[60ch] text-muted-foreground lg:text-lg">{t("nothingOpenBody")}</p>
        </>
      )}

      {next.kind === "no-goals" && (
        <>
          <h1 id="next-step-title" className="mt-2 text-3xl font-semibold tracking-tight text-balance lg:text-5xl lg:leading-tight">
            {t("noGoalsTitle")}
          </h1>
          <p className="mt-3 max-w-[60ch] text-muted-foreground lg:text-lg">{t("noGoalsBody")}</p>
        </>
      )}

      <Button asChild variant={quiet ? "outline" : "default"} className="mt-6 h-12 w-full rounded-[10px] px-5 text-base sm:w-auto">
        <Link href={href}>
          {action} <ArrowRight aria-hidden className="rtl:rotate-180" />
        </Link>
      </Button>
    </section>
  );
}
