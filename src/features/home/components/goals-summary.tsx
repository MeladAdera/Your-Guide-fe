import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Goal, Task } from "@/lib/api/types";
import { taskProgress } from "../next-step";

/** Home shows this many goals; the rest are one link away. */
const SHOWN = 5;

/** The active goals in Home's order, each with how far it has come (docs/features/04-home.md §3.3). */
export async function GoalsSummary({ goals, tasksByGoal }: { goals: Goal[]; tasksByGoal: Record<string, Task[]> }) {
  const t = await getTranslations("home.goals");
  if (goals.length === 0) return null;

  const progressLine = (tasks: Task[]) => {
    const { done, total } = taskProgress(tasks);
    if (total === 0) return t("noTasks");
    if (done === total) return t("allDone", { total });
    return t("progress", { done, total });
  };

  return (
    <section aria-labelledby="home-goals-title">
      <h2 id="home-goals-title" className="text-xl font-semibold tracking-tight">
        {t("title")}
      </h2>
      <ul className="mt-3 grid gap-2">
        {goals.slice(0, SHOWN).map((goal) => (
          <li key={goal.id}>
            <Link
              href={`/goals/${goal.id}`}
              className="flex items-center gap-4 rounded-[16px] bg-card px-4 py-3.5 ring-1 ring-border outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 lg:px-5"
            >
              <span className="grid min-w-0 flex-1 gap-0.5 sm:flex sm:items-baseline sm:justify-between sm:gap-4">
                <span dir="auto" className="truncate font-medium">
                  {goal.title}
                </span>
                <span className="shrink-0 text-sm text-muted-foreground">{progressLine(tasksByGoal[goal.id] ?? [])}</span>
              </span>
              <ChevronRight aria-hidden className="size-5 shrink-0 text-subtle rtl:rotate-180" />
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/goals" className="mt-3 inline-block rounded-[6px] text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
        {goals.length > SHOWN ? t("allCount", { count: goals.length }) : t("all")}
      </Link>
    </section>
  );
}
