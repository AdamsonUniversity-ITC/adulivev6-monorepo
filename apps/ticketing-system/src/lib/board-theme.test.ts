import { describe, expect, it } from "vitest";
import {
  accentForeground,
  normalizeAccentColor,
  normalizeThemePreset,
} from "./board-theme.ts";

describe("board-theme", () => {
  it("normalizes known and unknown presets", () => {
    expect(normalizeThemePreset("aurora")).toBe("aurora");
    expect(normalizeThemePreset("unknown")).toBe("graphite");
    expect(normalizeThemePreset(null)).toBe("graphite");
  });

  it("accepts only 6-digit hex accents", () => {
    expect(normalizeAccentColor("#38BDF8")).toBe("#38bdf8");
    expect(normalizeAccentColor("#fff")).toBeNull();
    expect(normalizeAccentColor("blue")).toBeNull();
  });

  it("picks readable accent foreground", () => {
    expect(accentForeground("#f8fafc")).toBe("#0f172a");
    expect(accentForeground("#0f172a")).toBe("#f8fafc");
  });
});
