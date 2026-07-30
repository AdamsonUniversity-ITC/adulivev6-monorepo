import { describe, expect, it } from "vitest"

import { getBirthdayLeaveValidationError } from "./birthday-leave-validation"

describe("birthday-leave-validation", () => {
  it("returns null for non-birthday leave types", () => {
    expect(
      getBirthdayLeaveValidationError({
        leaveCode: "vl",
        birthdate: "1990-07-15",
        dateFiled: "2026-01-01",
        dateFrom: "2026-01-02",
        dateTo: "2026-01-03",
      }),
    ).toBeNull()
  })

  it("passes when filing and leave dates are in the birth month", () => {
    expect(
      getBirthdayLeaveValidationError({
        leaveCode: "bl",
        birthdate: "1990-07-15",
        dateFiled: "2026-07-01",
        dateFrom: "2026-07-10",
        dateTo: "2026-07-12",
      }),
    ).toBeNull()
  })

  it("fails when birthdate is missing", () => {
    expect(
      getBirthdayLeaveValidationError({
        leaveCode: "bl",
        birthdate: null,
        dateFiled: "2026-07-01",
        dateFrom: "2026-07-10",
        dateTo: "2026-07-12",
      }),
    ).toEqual({
      field: "leave_type_id",
      message:
        "Your birthdate is not on file. Please contact HRMDO before applying for Birthday Leave.",
    })
  })

  it("fails when filing date is outside the birth month", () => {
    expect(
      getBirthdayLeaveValidationError({
        leaveCode: "bl",
        birthdate: "1990-07-15",
        dateFiled: "2026-06-30",
        dateFrom: "2026-07-10",
        dateTo: "2026-07-12",
      }),
    ).toEqual({
      field: "date_filed",
      message: "Birthday Leave must be filed within your birth month.",
    })
  })

  it("fails when start date is outside the birth month", () => {
    expect(
      getBirthdayLeaveValidationError({
        leaveCode: "bl",
        birthdate: "1990-07-15",
        dateFiled: "2026-07-01",
        dateFrom: "2026-06-30",
        dateTo: "2026-07-02",
      }),
    ).toEqual({
      field: "date_from",
      message: "Birthday Leave start date must fall within your birth month.",
    })
  })

  it("fails when end date is outside the birth month", () => {
    expect(
      getBirthdayLeaveValidationError({
        leaveCode: "bl",
        birthdate: "1990-07-15",
        dateFiled: "2026-07-01",
        dateFrom: "2026-07-30",
        dateTo: "2026-08-01",
      }),
    ).toEqual({
      field: "date_to",
      message: "Birthday Leave end date must fall within your birth month.",
    })
  })
})
