import { describe, expect, it } from "vitest"

import type { LeaveFormValues } from "./schema"
import {
  getLeaveTypeBusinessError,
  getResolvedErrorPaths,
  type LeaveFormRules,
} from "./validation"

const today = new Date("2026-07-01T00:00:00")

const baseValues: LeaveFormValues = {
  date_from: "2026-07-10",
  date_to: "2026-07-10",
  exclude_sundays: true,
  exclude_saturdays: false,
  leave_type_id: "1",
  leave_days: [{ date: "2026-07-10", day_portion: "wholeday" }],
  reason: "Family matters",
  supporting_documents: [],
  address: "123 Sample Street",
}

const baseRules: LeaveFormRules = {
  canSelectEvening: false,
  leaveTypes: [
    { id: 1, leave_code: "vl", filing_timing: "ANYTIME", required_lead_days: 0 },
    { id: 2, leave_code: "bl", filing_timing: "ANYTIME", required_lead_days: 0 },
  ],
  leaveBalances: [
    { leave_code: "vl", credits: 10, pending_filed_leave: 0 },
    { leave_code: "bl", credits: 1, pending_filed_leave: 1 },
  ],
  birthdate: "1990-07-15",
}

describe("getResolvedErrorPaths", () => {
  it("resolves every related path once the whole form is valid", () => {
    const resolved = getResolvedErrorPaths(
      "date_to",
      baseValues,
      baseRules,
      today,
    )

    expect(resolved).toEqual(
      expect.arrayContaining([
        "date_from",
        "date_to",
        "leave_days.0.day_portion",
        "leave_days",
        "leave_type_id",
      ]),
    )
  })

  it("keeps the error on a field that is still empty", () => {
    const resolved = getResolvedErrorPaths(
      "date_to",
      { ...baseValues, date_to: "" },
      baseRules,
      today,
    )

    expect(resolved).not.toContain("date_to")
    expect(resolved).toContain("date_from")
  })

  it("resolves only the leave days that already have a day portion", () => {
    const values: LeaveFormValues = {
      ...baseValues,
      date_to: "2026-07-13",
      leave_days: [
        { date: "2026-07-10", day_portion: "wholeday" },
        { date: "2026-07-13", day_portion: "" },
      ] as LeaveFormValues["leave_days"],
    }

    const resolved = getResolvedErrorPaths(
      "leave_days.1.day_portion",
      values,
      baseRules,
      today,
    )

    expect(resolved).toContain("leave_days.0.day_portion")
    expect(resolved).not.toContain("leave_days.1.day_portion")
    expect(resolved).not.toContain("leave_days")
  })

  it("keeps the leave type error while credits are still insufficient", () => {
    const resolved = getResolvedErrorPaths(
      "leave_days.0.day_portion",
      { ...baseValues, leave_type_id: "2" },
      baseRules,
      today,
    )

    expect(resolved).not.toContain("leave_type_id")
  })

  it("does not touch paths unrelated to the changed field", () => {
    const resolved = getResolvedErrorPaths(
      "reason",
      { ...baseValues, date_to: "" },
      baseRules,
      today,
    )

    expect(resolved).toEqual(["reason"])
  })

  it("ignores fields that carry no validation of their own", () => {
    expect(getResolvedErrorPaths("unknown_field", baseValues, baseRules, today)).toEqual(
      [],
    )
  })
})

describe("getLeaveTypeBusinessError", () => {
  it("returns no error when the selected type passes every rule", () => {
    expect(getLeaveTypeBusinessError(baseValues, baseRules, today)).toBeNull()
  })

  it("reports birthday leave taken outside the birth month on the start date", () => {
    const values: LeaveFormValues = {
      ...baseValues,
      leave_type_id: "2",
      date_from: "2026-08-10",
      date_to: "2026-08-10",
      leave_days: [{ date: "2026-08-10", day_portion: "wholeday" }],
    }
    const rules: LeaveFormRules = {
      ...baseRules,
      leaveBalances: [{ leave_code: "bl", credits: 1, pending_filed_leave: 0 }],
    }

    expect(getLeaveTypeBusinessError(values, rules, today)).toEqual({
      field: "date_from",
      message: "Birthday Leave start date must fall within your birth month.",
    })
  })

  it("reports insufficient credits on the leave type", () => {
    expect(
      getLeaveTypeBusinessError(
        { ...baseValues, leave_type_id: "2" },
        baseRules,
        today,
      ),
    ).toEqual({
      field: "leave_type_id",
      message: "Insufficient Birthday Leave credits for the selected dates.",
    })
  })

  it("skips rules until a leave type and both dates are selected", () => {
    expect(
      getLeaveTypeBusinessError(
        { ...baseValues, leave_type_id: "" },
        baseRules,
        today,
      ),
    ).toBeNull()
  })
})
