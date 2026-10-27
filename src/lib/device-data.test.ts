import { beforeEach, describe, expect, it } from "vitest";
import { clearDeviceData } from "./device-data";

describe("clearDeviceData", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("removes every yg: key from both stores and leaves other keys", () => {
    localStorage.setItem("yg:draft:situation", "my long answer");
    localStorage.setItem("yg:struggles", "[1,2]");
    localStorage.setItem("theme", "dark");
    sessionStorage.setItem("yg:session", "x");
    sessionStorage.setItem("other", "y");

    clearDeviceData();

    expect(localStorage.getItem("yg:draft:situation")).toBeNull();
    expect(localStorage.getItem("yg:struggles")).toBeNull();
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(sessionStorage.getItem("yg:session")).toBeNull();
    expect(sessionStorage.getItem("other")).toBe("y");
  });

  it("does nothing when there is nothing to clear", () => {
    expect(() => clearDeviceData()).not.toThrow();
  });
});
