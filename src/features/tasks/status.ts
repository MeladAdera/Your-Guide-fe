import type { Step, TaskStatus } from "@/lib/api/types";

/**
 * A task's status, derived from its steps by the API's own rule
 * (docs/handoff.md §10): to do while no step is done (or there are none), in
 * progress once one is, done when all are. Computed here too so the chip
 * changes the moment a step is ticked; the API's answer follows.
 */
export function deriveStatus(steps: readonly Pick<Step, "doneAt">[]): TaskStatus {
  const done = steps.filter((s) => s.doneAt !== null).length;
  if (steps.length === 0 || done === 0) return "todo";
  return done === steps.length ? "done" : "in_progress";
}
