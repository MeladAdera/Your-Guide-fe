import { describe, expect, it } from "vitest";
import { GOAL_PATH, nextHref, prevHref, savedFlags, screenOf, SCREEN_ORDER, stepOf } from "./screens";

describe("onboarding screen order", () => {
  it("lists the seven slugs in order, self-view with its hyphen", () => {
    expect(SCREEN_ORDER).toEqual(["basics", "situation", "achievements", "patterns", "self-view", "confidence", "values"]);
  });

  it("maps slugs to API keys and rejects anything else", () => {
    expect(screenOf("self-view")).toBe("selfView");
    expect(screenOf("selfView")).toBeNull();
    expect(screenOf("goal")).toBeNull();
  });

  it("counts steps from 1", () => {
    expect(stepOf("basics")).toBe(1);
    expect(stepOf("values")).toBe(7);
  });

  it("goes forward to the next screen and from the last one to the first goal", () => {
    expect(nextHref("patterns")).toBe("/onboarding/self-view");
    expect(nextHref("values")).toBe(GOAL_PATH);
  });

  it("goes back to the previous screen, and nowhere from the first", () => {
    expect(prevHref("situation")).toBe("/onboarding/basics");
    expect(prevHref("basics")).toBeNull();
  });

  it("reads the saved screens in order", () => {
    const screens = { basics: false, situation: true, achievements: true, patterns: false, selfView: false, confidence: false, values: false };
    expect(savedFlags({ completed: false, screens, missing: [] })).toEqual([false, true, true, false, false, false, false]);
  });
});
