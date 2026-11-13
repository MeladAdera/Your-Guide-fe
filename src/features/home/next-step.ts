import type { EndedSession, Goal, Step, Task } from "@/lib/api/types";

/** What Home's main card shows (docs/features/04-home.md §3.2). */
export type NextStep =
  | { kind: "step"; goal: Goal; task: Task; step: Step }
  /** Goals exist, but none has an open step: point at the first one in order. */
  | { kind: "nothing-open"; goal: Goal }
  /** No active goals at all. */
  | { kind: "no-goals" };

/**
 * Active goals in the order Home looks at them: the goals worked on most
 * recently first (by their latest completed session, `recent` newest first as
 * the API returns it), then the rest in the API's order (oldest first).
 */
export function orderGoals(goals: readonly Goal[], recent: readonly Pick<EndedSession, "goal">[]): Goal[] {
  const rank = new Map<string, number>();
  recent.forEach((s, i) => {
    if (!rank.has(s.goal.id)) rank.set(s.goal.id, i);
  });
  // Array.prototype.sort is stable, so unworked goals keep their oldest-first order.
  return [...goals].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity));
}

/**
 * The first open step: goal by goal in the given order, task by task in order
 * (done tasks skipped), the first step not done. Steps are fetched through
 * `loadSteps` only as far as needed, so Home asks for one or two lists, not
 * every step of every goal.
 */
export async function findNextStep(
  goals: readonly Goal[],
  tasksByGoal: Readonly<Record<string, readonly Task[]>>,
  loadSteps: (taskId: string) => Promise<readonly Step[]>,
): Promise<NextStep> {
  if (goals.length === 0) return { kind: "no-goals" };
  for (const goal of goals) {
    for (const task of tasksByGoal[goal.id] ?? []) {
      if (task.status === "done") continue;
      const step = (await loadSteps(task.id)).find((s) => s.doneAt === null);
      if (step) return { kind: "step", goal, task, step };
    }
  }
  return { kind: "nothing-open", goal: goals[0] };
}

/** How far a goal has come, counted in tasks (§6.5): tasks are already loaded, steps are not. */
export function taskProgress(tasks: readonly Pick<Task, "status">[]): { done: number; total: number } {
  return { done: tasks.filter((t) => t.status === "done").length, total: tasks.length };
}
