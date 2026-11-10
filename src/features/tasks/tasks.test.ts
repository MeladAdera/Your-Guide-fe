import { beforeEach, describe, expect, it } from "vitest";
import { dayIn, isAiLimitReached, markAiLimitReached } from "@/lib/ai-limit";
import { moveBy } from "./order";
import { deriveStatus } from "./status";

describe("moveBy", () => {
  it("swaps a step with its neighbour", () => {
    expect(moveBy(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
    expect(moveBy(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]);
  });

  it("leaves the list as it is at either end, and never changes the input", () => {
    const list = ["a", "b"];
    expect(moveBy(list, 0, -1)).toEqual(["a", "b"]);
    expect(moveBy(list, 1, 1)).toEqual(["a", "b"]);
    expect(moveBy(list, 5, 1)).toEqual(["a", "b"]);
    expect(list).toEqual(["a", "b"]);
  });
});

describe("AI daily limit", () => {
  beforeEach(() => localStorage.clear());

  it("counts the day in the account's time zone", () => {
    const lateUtc = new Date("2026-11-10T22:30:00Z");
    expect(dayIn("UTC", lateUtc)).toBe("2026-11-10");
    expect(dayIn("Asia/Dubai", lateUtc)).toBe("2026-11-11");
  });

  it("rests the AI buttons for the rest of that day only", () => {
    const evening = new Date("2026-11-10T18:00:00Z");
    expect(isAiLimitReached("UTC", evening)).toBe(false);
    markAiLimitReached("UTC", evening);
    expect(isAiLimitReached("UTC", new Date("2026-11-10T23:59:00Z"))).toBe(true);
    expect(isAiLimitReached("UTC", new Date("2026-11-11T00:01:00Z"))).toBe(false);
    expect(localStorage.getItem("yg:ai-limit")).toBe("2026-11-10");
  });
});

describe("deriveStatus", () => {
  const open = { doneAt: null };
  const done = { doneAt: "2026-11-10T09:00:00.000Z" };
  it("follows the API's rule", () => {
    expect(deriveStatus([])).toBe("todo");
    expect(deriveStatus([open, open])).toBe("todo");
    expect(deriveStatus([done, open])).toBe("in_progress");
    expect(deriveStatus([done, done])).toBe("done");
  });
});
