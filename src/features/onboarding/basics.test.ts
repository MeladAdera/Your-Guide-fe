import { describe, expect, it } from "vitest";
import { basicsDefaults, basicsPayload, basicsSchema } from "./basics";

describe("basics", () => {
  it("starts empty when nothing was saved", () => {
    expect(basicsDefaults(null)).toEqual({
      employmentStatus: null,
      occupation: "",
      ageRange: null,
      educationLevel: null,
      yearsExperience: null,
      country: null,
    });
  });

  it("requires the situation and nothing else", () => {
    const empty = basicsSchema.safeParse(basicsDefaults(null));
    expect(empty.success).toBe(false);
    expect(empty.error?.issues.map((i) => [i.path.join("."), i.message])).toEqual([["employmentStatus", "isIn"]]);
    expect(basicsSchema.safeParse({ ...basicsDefaults(null), employmentStatus: "student" }).success).toBe(true);
  });

  it("limits the occupation to 120 characters after trimming", () => {
    const base = { ...basicsDefaults(null), employmentStatus: "employed" as const };
    expect(basicsSchema.safeParse({ ...base, occupation: `  ${"a".repeat(120)}  ` }).success).toBe(true);
    expect(basicsSchema.safeParse({ ...base, occupation: "a".repeat(121) }).success).toBe(false);
  });

  it("sends every field, empty answers as null and text trimmed", () => {
    expect(basicsPayload({ ...basicsDefaults(null), employmentStatus: "caregiver", occupation: "  Nurse  ", country: "SY" })).toEqual({
      employmentStatus: "caregiver",
      occupation: "Nurse",
      ageRange: null,
      educationLevel: null,
      yearsExperience: null,
      country: "SY",
    });
    expect(basicsPayload({ ...basicsDefaults(null), employmentStatus: "retired", occupation: "   " }).occupation).toBeNull();
  });
});
