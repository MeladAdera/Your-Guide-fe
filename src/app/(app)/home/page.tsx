import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GoalsSummary } from "@/features/home/components/goals-summary";
import { NextStepCard } from "@/features/home/components/next-step-card";
import { findNextStep, orderGoals } from "@/features/home/next-step";
import { WeekRhythm } from "@/features/progress/components/week-rhythm";
import { SessionBanner } from "@/features/home/components/session-banner";
import { serverApi, serverApiOrNull } from "@/lib/api/server";
import type { EndedSession, Goal, Progress, Session, Step, Task } from "@/lib/api/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  return { title: t("title") };
}

/**
 * Home (docs/features/04-home.md): the next step and the goals, loaded on the
 * server so the page opens complete. Goals and the week's sessions first, then
 * every goal's tasks, then steps only until the first open one is found.
 */
export default async function HomePage() {
  const [session, goals, recent, week] = await Promise.all([
    serverApiOrNull<Session>("/api/sessions/active", ["session.none_active"]),
    serverApi<Goal[]>("/api/goals"),
    serverApi<EndedSession[]>("/api/sessions", { query: { days: 7 } }),
    serverApi<Progress>("/api/progress", { query: { days: 7 } }),
  ]);
  const ordered = orderGoals(goals, recent);
  const tasksByGoal: Record<string, Task[]> = Object.fromEntries(
    await Promise.all(ordered.map(async (goal) => [goal.id, await serverApi<Task[]>(`/api/goals/${goal.id}/tasks`)] as const)),
  );
  const next = await findNextStep(ordered, tasksByGoal, (taskId) => serverApi<Step[]>(`/api/tasks/${taskId}/steps`));

  return (
    <div className="grid gap-6 lg:gap-8">
      {/* An owed review comes before everything, even the week. */}
      {session && <SessionBanner session={session} />}
      {/* Phones have no tile beside the card, so the week sits at the top of Home. */}
      <div className="lg:hidden">
        <WeekRhythm variant="compact" initial={week} />
      </div>
      <NextStepCard next={next} quiet={session !== null} />
      <GoalsSummary goals={ordered} tasksByGoal={tasksByGoal} />
    </div>
  );
}
