import { describe, expect, it } from "vitest"

import type { LeaveApplicationRecord } from "@/lib/leave-applications-api"
import { mapLeaveApplicationToForApprovalRow } from "@/lib/map-for-approval-row"

function applicationDate(
  overrides: Partial<
    NonNullable<LeaveApplicationRecord["leave_application_dates"]>[number]
  > = {},
) {
  return {
    id: 1,
    leave_date: "2026-07-22",
    approved_day_portion_1: "Whole Day",
    approved_day_portion_2: null,
    approved_leave_type_id_1: 1,
    approved_leave_type_id_2: null,
    hr_status_1: "Pending",
    hr_status_2: null,
    hr_remarks: null,
    hr_approved_by: null,
    hr_approved_date: null,
    ...overrides,
  }
}

function baseRecord(
  overrides: Partial<LeaveApplicationRecord> = {},
): LeaveApplicationRecord {
  return {
    id: 10,
    employee_no: "E001",
    leave_type_id: 1,
    date_from: "2026-07-22",
    date_to: "2026-07-22",
    date_filed: "2026-07-20",
    reason: "Personal",
    address: "Home",
    overall_status: "Pending",
    cancel_status: null,
    cancelled_at: null,
    approver1_idno: null,
    approver1_status: "Pending",
    approver1_remarks: null,
    approver1_date: null,
    approver2_idno: null,
    approver2_status: "Pending",
    approver2_remarks: null,
    approver2_date: null,
    leave_application_dates: [applicationDate()],
    created_at: "2026-07-20T00:00:00.000Z",
    updated_at: "2026-07-20T00:00:00.000Z",
    ...overrides,
  }
}

describe("mapLeaveApplicationToForApprovalRow", () => {
  it("maps AM-only filing to 0.5 days", () => {
    const row = mapLeaveApplicationToForApprovalRow(
      baseRecord({
        leave_application_dates: [
          applicationDate({ approved_day_portion_1: "AM" }),
        ],
      }),
      "Vacation Leave",
    )

    expect(row.days).toBe(0.5)
  })

  it("maps two AM days to 1 day", () => {
    const row = mapLeaveApplicationToForApprovalRow(
      baseRecord({
        date_to: "2026-07-23",
        leave_application_dates: [
          applicationDate({
            id: 1,
            leave_date: "2026-07-22",
            approved_day_portion_1: "AM",
          }),
          applicationDate({
            id: 2,
            leave_date: "2026-07-23",
            approved_day_portion_1: "AM",
          }),
        ],
      }),
      "Vacation Leave",
    )

    expect(row.days).toBe(1)
  })

  it("maps whole day filing to 1 day", () => {
    const row = mapLeaveApplicationToForApprovalRow(
      baseRecord(),
      "Vacation Leave",
    )

    expect(row.days).toBe(1)
  })

  it("falls back to date count when leave_application_dates is missing", () => {
    const row = mapLeaveApplicationToForApprovalRow(
      baseRecord({
        leave_application_dates: undefined,
        leave_days: undefined,
        date_from: "2026-07-22",
        date_to: "2026-07-23",
      }),
      "Vacation Leave",
    )

    // syncLeaveDays produces empty portions (weight 0); fall back to date count.
    expect(row.days).toBe(2)
  })

  it("uses leave_days portions when application dates are absent", () => {
    const row = mapLeaveApplicationToForApprovalRow(
      baseRecord({
        leave_application_dates: undefined,
        leave_days: [{ date: "2026-07-22", day_portion: "AM" }],
      }),
      "Vacation Leave",
    )

    expect(row.days).toBe(0.5)
  })
})
