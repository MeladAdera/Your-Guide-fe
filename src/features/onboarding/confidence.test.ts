import { describe, expect, it } from "vitest";
import { CONFIDENCE_STATEMENTS } from "@/lib/api/types";
import { confidenceDefaults, confidencePayload, firstUnanswered, startIndex } from "./confidence";

const all = Object.fromEntries(CONFIDENCE_STATEMENTS.map((s, i) => [s, ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5]));

describe("check-in", () => {
  it("keeps only valid saved answers", () => {
    expect(confidenceDefaults(null)).toEqual({});
    expect(confidenceDefaults({ canTryAgain: 4, followThrough: 9, compareTooMuch: "3", updatedAt: "x" })).toEqual({ canTryAgain: 4 });
  });

  it("opens at the first open statement, or the first when all are answered", () => {
    expect(startIndex({})).toBe(0);
    expect(startIndex({ canLearnIfPersist: 3, canTryAgain: 2 })).toBe(2);
    expect(firstUnanswered(all)).toBe(-1);
    expect(startIndex(all)).toBe(0);
  });

  it("sends all eight or nothing", () => {
    expect(confidencePayload({ canLearnIfPersist: 3 })).toBeNull();
    expect(confidencePayload(all)).toEqual(all);
  });
});
