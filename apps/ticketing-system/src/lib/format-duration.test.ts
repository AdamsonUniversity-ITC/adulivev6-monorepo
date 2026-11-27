import { describe, expect, it } from "vitest";

import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
  it("shows a dash when there is no value", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(undefined)).toBe("—");
    expect(formatDuration(Number.NaN)).toBe("—");
  });

  it("reads 42.96 hours as days and hours, not as 42 hours", () => {
    expect(formatDuration(42.96)).toBe("1d 18h");
  });

  it("shows sub-minute and zero durations plainly", () => {
    expect(formatDuration(0)).toBe("less than 1m");
    expect(formatDuration(0.001)).toBe("less than 1m");
  });

  it("shows minutes under an hour", () => {
    expect(formatDuration(0.75)).toBe("45m");
  });

  it("shows hours and minutes under a day, dropping zero minutes", () => {
    expect(formatDuration(5.2)).toBe("5h 12m");
    expect(formatDuration(5)).toBe("5h");
  });

  it("drops minutes once a full day is reached", () => {
    expect(formatDuration(48)).toBe("2d");
    expect(formatDuration(49.5)).toBe("2d 1h");
  });

  it("rounds to the nearest minute before splitting units", () => {
    // 59.99 minutes rounds up to a full hour, so it must not read "60m".
    expect(formatDuration(0.9999)).toBe("1h");
    expect(formatDuration(59.999 / 60)).toBe("1h");
  });

  it("treats negative input as zero", () => {
    expect(formatDuration(-3)).toBe("less than 1m");
  });
});
