import { describe, expect, it } from "vitest";
import { goalDefaults, goalPayload, goalSchema, isGoalField } from "./goal-form";

const filled = { title: "Start work by nine", whyItMatters: "My evenings are mine again.", obstacle: "", firstOutcome: "" };

describe("goal form", () => {
  it("needs a title and a why", () => {
    const r = goalSchema.safeParse(goalDefaults(null));
    expect(r.error?.issues.map((i) => [i.path.join("."), i.message])).toEqual([
      ["title", "required"],
      ["whyItMatters", "required"],
    ]);
    expect(goalSchema.safeParse(filled).success).toBe(true);
  });

  it("keeps the API limits", () => {
    const r = goalSchema.safeParse({ ...filled, title: "a".repeat(201), obstacle: "b".repeat(1001) });
    expect(r.error?.issues.map((i) => i.path.join("."))).toEqual(["title", "obstacle"]);
  });

  it("sends every field trimmed, empty optional answers as null", () => {
    expect(goalPayload({ ...filled, title: "  Start work by nine ", obstacle: "  ", firstOutcome: " At my desk at nine. " })).toEqual({
      title: "Start work by nine",
      whyItMatters: "My evenings are mine again.",
      obstacle: null,
      firstOutcome: "At my desk at nine.",
    });
  });

  it("fills the form from a goal, with null as empty", () => {
    expect(goalDefaults({ title: "T", whyItMatters: "W", obstacle: null, firstOutcome: "F" })).toEqual({ title: "T", whyItMatters: "W", obstacle: "", firstOutcome: "F" });
  });

  it("knows its own fields", () => {
    expect(isGoalField("obstacle")).toBe(true);
    expect(isGoalField("updatedAt")).toBe(false);
  });
});
