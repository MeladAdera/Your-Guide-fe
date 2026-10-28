import { afterEach, describe, expect, it, vi } from "vitest";
import { weekdayName } from "./week-days";

describe("weekdayName", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("names the day the string says, in the given language", () => {
    expect(weekdayName("2026-10-28", "en", "long")).toBe("Wednesday");
    expect(weekdayName("2026-10-28", "en", "narrow")).toBe("W");
    expect(weekdayName("2026-10-28", "ar", "long")).toBe("الأربعاء");
  });

  it("does not shift the day in a timezone behind UTC", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    expect(weekdayName("2026-10-28", "en", "long")).toBe("Wednesday");
  });
});
