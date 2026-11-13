import { describe, expect, it, vi } from "vitest";
import type { Goal, Step, Task, TaskStatus } from "@/lib/api/types";
import { findNextStep, orderGoals, taskProgress } from "./next-step";

const goal = (id: string): Goal => ({ id, title: `Goal ${id}`, whyItMatters: "", obstacle: null, firstOutcome: null, createdAt: "", archivedAt: null });
const task = (id: string, goalId: string, status: TaskStatus = "todo"): Task => ({ id, goalId, title: `Task ${id}`, status, createdAt: "" });
const step = (id: string, taskId: string, done = false): Step => ({ id, taskId, title: `Step ${id}`, doneAt: done ? "2026-11-13T10:00:00Z" : null, createdAt: "" });
const session = (goalId: string) => ({ goal: { id: goalId, title: "" } });

describe("orderGoals", () => {
  const goals = [goal("a"), goal("b"), goal("c")];

  it("keeps the oldest-first order when nothing was worked on", () => {
    expect(orderGoals(goals, []).map((g) => g.id)).toEqual(["a", "b", "c"]);
  });

  it("puts the goals worked on most recently first, the rest after in their order", () => {
    // Sessions come newest first: c most recently, then b.
    expect(orderGoals(goals, [session("c"), session("b"), session("c")]).map((g) => g.id)).toEqual(["c", "b", "a"]);
  });

  it("ignores sessions of goals that are no longer active", () => {
    expect(orderGoals(goals, [session("archived"), session("b")]).map((g) => g.id)).toEqual(["b", "a", "c"]);
  });
});

describe("findNextStep", () => {
  const steps: Record<string, Step[]> = {
    t1: [step("s1", "t1", true), step("s2", "t1", true)],
    t2: [step("s3", "t2", true), step("s4", "t2"), step("s5", "t2")],
    t3: [],
    t4: [step("s6", "t4")],
  };
  const load = (id: string) => Promise.resolve(steps[id] ?? []);

  it("says there are no goals", async () => {
    expect(await findNextStep([], {}, load)).toEqual({ kind: "no-goals" });
  });

  it("gives the first open step of the first task that has one, skipping done tasks", async () => {
    const loadSteps = vi.fn(load);
    const next = await findNextStep([goal("a")], { a: [task("t1", "a", "done"), task("t2", "a", "in_progress"), task("t4", "a")] }, loadSteps);
    expect(next.kind === "step" && [next.task.id, next.step.id]).toEqual(["t2", "s4"]);
    // The done task is never fetched, and the search stops at the first open step.
    expect(loadSteps.mock.calls.map(([id]) => id)).toEqual(["t2"]);
  });

  it("moves to the next goal when a goal has no open step", async () => {
    const next = await findNextStep([goal("a"), goal("b")], { a: [task("t3", "a")], b: [task("t4", "b")] }, load);
    expect(next.kind === "step" && [next.goal.id, next.step.id]).toEqual(["b", "s6"]);
  });

  it("points at the first goal when nothing is open anywhere", async () => {
    const next = await findNextStep([goal("a"), goal("b")], { a: [task("t1", "a", "done")], b: [] }, load);
    expect(next).toEqual({ kind: "nothing-open", goal: goal("a") });
  });
});

describe("taskProgress", () => {
  it("counts done tasks out of all", () => {
    expect(taskProgress([])).toEqual({ done: 0, total: 0 });
    expect(taskProgress([{ status: "done" }, { status: "in_progress" }, { status: "todo" }])).toEqual({ done: 1, total: 3 });
  });
});
