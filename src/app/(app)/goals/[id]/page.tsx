import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GoalDetail } from "@/features/goals/components/goal-detail";
import { serverApi } from "@/lib/api/server";
import type { Goal, Step, Task } from "@/lib/api/types";

/** There is no GET /api/goals/:id: the goal comes from the active and archived lists. */
async function loadGoal(id: string): Promise<Goal | undefined> {
  const [active, archived] = await Promise.all([serverApi<Goal[]>("/api/goals"), serverApi<Goal[]>("/api/goals", { query: { archived: true } })]);
  return [...active, ...archived].find((g) => g.id === id);
}

export async function generateMetadata({ params }: PageProps<"/goals/[id]">): Promise<Metadata> {
  const goal = await loadGoal((await params).id);
  return goal ? { title: goal.title } : {};
}

/**
 * One goal with its tasks and every task's steps, loaded in parallel: a goal
 * has a handful of small lists, and the page opens complete
 * (docs/features/03-goal-detail.md §2).
 */
export default async function GoalPage({ params }: PageProps<"/goals/[id]">) {
  const goal = await loadGoal((await params).id);
  if (!goal) notFound();
  const tasks = await serverApi<Task[]>(`/api/goals/${goal.id}/tasks`);
  const steps = Object.fromEntries(await Promise.all(tasks.map(async (task) => [task.id, await serverApi<Step[]>(`/api/tasks/${task.id}/steps`)] as const)));
  return <GoalDetail goal={goal} tasks={tasks} steps={steps} />;
}
