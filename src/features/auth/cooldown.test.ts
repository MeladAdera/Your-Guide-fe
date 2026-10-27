import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatCountdown, useCooldown } from "./cooldown";

describe("formatCountdown", () => {
  it("writes minutes and two-digit seconds", () => {
    expect(formatCountdown(60)).toBe("1:00");
    expect(formatCountdown(42)).toBe("0:42");
    expect(formatCountdown(5)).toBe("0:05");
    expect(formatCountdown(0)).toBe("0:00");
    expect(formatCountdown(-3)).toBe("0:00");
    expect(formatCountdown(41.2)).toBe("0:42");
  });
});

describe("useCooldown", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts down and ends at zero", () => {
    const { result } = renderHook(() => useCooldown());
    expect(result.current.secondsLeft).toBe(0);

    act(() => result.current.start(60));
    expect(result.current.secondsLeft).toBe(60);

    act(() => vi.advanceTimersByTime(18_000));
    expect(result.current.secondsLeft).toBe(42);

    act(() => vi.advanceTimersByTime(43_000));
    expect(result.current.secondsLeft).toBe(0);
  });
});
