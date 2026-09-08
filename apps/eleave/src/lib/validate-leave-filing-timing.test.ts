import { describe, expect, it } from "vitest"

import { validateLeaveFilingTiming } from "./validate-leave-filing-timing"

const today = new Date("2026-09-09T08:00:00")

describe("validateLeaveFilingTiming AFTER_START", () => {
  it("blocks filing on the first leave day", () => {
    expect(
      validateLeaveFilingTiming(
        { filing_timing: "AFTER_START", required_lead_days: 0 },
        "2026-09-09",
        "2026-09-10",
        today,
      ),
    ).toBe("This leave type must be filed after the first leave day.")
  })

  it("allows filing after the first leave day while the range is still ongoing", () => {
    expect(
      validateLeaveFilingTiming(
        { filing_timing: "AFTER_START", required_lead_days: 0 },
        "2026-09-08",
        "2026-09-10",
        today,
      ),
    ).toBeNull()
  })

  it("blocks filing past the lead-day deadline counted from the start date", () => {
    expect(
      validateLeaveFilingTiming(
        { filing_timing: "AFTER_START", required_lead_days: 3 },
        "2026-09-08",
        "2026-09-10",
        new Date("2026-09-12T08:00:00"),
      ),
    ).toBe("This leave type must be filed within 3 day(s) after the first leave day.")
  })
})
