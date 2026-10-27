import { describe, expect, it } from "vitest";
import { listTimezones, timezoneCity, timezoneOffset } from "./timezone";

describe("timezoneCity", () => {
  it("takes the last part and restores spaces", () => {
    expect(timezoneCity("Asia/Dubai")).toBe("Dubai");
    expect(timezoneCity("America/New_York")).toBe("New York");
    expect(timezoneCity("America/Argentina/Buenos_Aires")).toBe("Buenos Aires");
    expect(timezoneCity("UTC")).toBe("UTC");
  });
});

describe("timezoneOffset", () => {
  it("writes the offset for a fixed zone", () => {
    expect(timezoneOffset("Asia/Dubai", "en", new Date("2026-01-15T12:00:00Z"))).toBe("GMT+4");
  });
  it("returns an empty string for an unknown zone", () => {
    expect(timezoneOffset("Not/AZone", "en")).toBe("");
  });
});

describe("listTimezones", () => {
  it("always includes the current zone and UTC, sorted, without duplicates", () => {
    const zones = listTimezones("Asia/Dubai");
    expect(zones).toContain("Asia/Dubai");
    expect(zones).toContain("UTC");
    expect(new Set(zones).size).toBe(zones.length);
    expect([...zones].sort((a, b) => a.localeCompare(b))).toEqual(zones);
  });
});
