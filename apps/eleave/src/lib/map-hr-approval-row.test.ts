import { describe, expect, it } from "vitest"

import type { LeaveApplicationRecord } from "@/lib/leave-applications-api"
import {
  mapLeaveApplicationToHrApprovalRow,
  sumHrApprovalDayCredits,
  type HrApprovalDayDecision,
} from "@/lib/map-hr-approval-row"

const leaveTypeNames = new Map([[1, "Vacation Leave"]])

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

function decision(
  overrides: Partial<HrApprovalDayDecision> = {},
): HrApprovalDayDecision {
  return {
    leaveApplicationDateId: 1,
    dayNumber: 1,
    actualDate: "Wed, Jul 22, 2026",
    requestedPortion: "wholeday",
    isSplit: false,
    approvedDayPortion1: "wholeday",
    approvedDayPortion2: null,
    leaveTypeId1: 1,
    leaveTypeId2: null,
    leaveType1: "Vacation Leave",
    leaveType2: "Vacation Leave",
    status1: "pending",
    status2: null,
    hrRemarks: "",
    ...overrides,
  }
}

describe("sumHrApprovalDayCredits", () => {
  it("counts AM-only as 0.5", () => {
    expect(
      sumHrApprovalDayCredits([decision({ requestedPortion: "am" })]),
    ).toBe(0.5)
  })

  it("counts two AM days as 1", () => {
    expect(
      sumHrApprovalDayCredits([
        decision({ requestedPortion: "am" }),
        decision({
          leaveApplicationDateId: 2,
          dayNumber: 2,
          requestedPortion: "am",
        }),
      ]),
    ).toBe(1)
  })

  it("counts whole day as 1", () => {
    expect(sumHrApprovalDayCredits([decision()])).toBe(1)
  })

  it("counts an HR-split day as both half portions (1 total)", () => {
    expect(
      sumHrApprovalDayCredits([
        decision({
          isSplit: true,
          requestedPortion: "wholeday",
          approvedDayPortion1: "am",
          approvedDayPortion2: "pm",
        }),
      ]),
    ).toBe(1)
  })
})

describe("mapLeaveApplicationToHrApprovalRow", () => {
  it("maps AM-only filing to 0.5 days", () => {
    const row = mapLeaveApplicationToHrApprovalRow(
      baseRecord({
        leave_application_dates: [
          applicationDate({ approved_day_portion_1: "AM" }),
        ],
      }),
      leaveTypeNames,
    )

    expect(row.days).toBe(0.5)
  })

  it("maps whole day filing to 1 day", () => {
    const row = mapLeaveApplicationToHrApprovalRow(baseRecord(), leaveTypeNames)

    expect(row.days).toBe(1)
  })

  it("maps an HR-split day to 1 day", () => {
    const row = mapLeaveApplicationToHrApprovalRow(
      baseRecord({
        leave_application_dates: [
          applicationDate({
            approved_day_portion_1: "AM",
            approved_day_portion_2: "PM",
            approved_leave_type_id_2: 1,
            hr_status_2: "Pending",
          }),
        ],
      }),
      leaveTypeNames,
    )

    expect(row.days).toBe(1)
  })

  it("sums multiple AM days across the range", () => {
    const row = mapLeaveApplicationToHrApprovalRow(
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
      leaveTypeNames,
    )

    expect(row.days).toBe(1)
  })
})
