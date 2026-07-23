import { describe, expect, it } from "vitest"

import type { LeaveApplicationRecord } from "@/lib/leave-applications-api"
import { isLeaveApplicationPendingOnly } from "@/lib/is-leave-application-pending-only"

function baseApplication(
  overrides: Partial<LeaveApplicationRecord> = {},
): Pick<
  LeaveApplicationRecord,
  | "overall_status"
  | "approver1_status"
  | "approver2_status"
  | "leave_application_dates"
> {
  return {
    overall_status: "Pending",
    approver1_status: "Pending",
    approver2_status: "Pending",
    leave_application_dates: [
      {
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
      },
    ],
    ...overrides,
  }
}

describe("isLeaveApplicationPendingOnly", () => {
  it("returns true for fully pending applications", () => {
    expect(isLeaveApplicationPendingOnly(baseApplication())).toBe(true)
  })

  it("allows null approver statuses", () => {
    expect(
      isLeaveApplicationPendingOnly(
        baseApplication({
          approver1_status: null,
          approver2_status: null,
        }),
      ),
    ).toBe(true)
  })

  it("rejects non-pending overall status", () => {
    expect(
      isLeaveApplicationPendingOnly(
        baseApplication({ overall_status: "Cancelled" }),
      ),
    ).toBe(false)
    expect(
      isLeaveApplicationPendingOnly(
        baseApplication({ overall_status: "Disapproved" }),
      ),
    ).toBe(false)
  })

  it("rejects approved or disapproved approvers", () => {
    expect(
      isLeaveApplicationPendingOnly(
        baseApplication({ approver1_status: "Approved" }),
      ),
    ).toBe(false)
    expect(
      isLeaveApplicationPendingOnly(
        baseApplication({ approver2_status: "Disapproved" }),
      ),
    ).toBe(false)
  })

  it("rejects non-pending HR day statuses", () => {
    expect(
      isLeaveApplicationPendingOnly(
        baseApplication({
          leave_application_dates: [
            {
              id: 1,
              leave_date: "2026-07-22",
              approved_day_portion_1: "Whole Day",
              approved_day_portion_2: null,
              approved_leave_type_id_1: 1,
              approved_leave_type_id_2: null,
              hr_status_1: "Approved With Pay",
              hr_status_2: null,
              hr_remarks: null,
              hr_approved_by: null,
              hr_approved_date: null,
            },
          ],
        }),
      ),
    ).toBe(false)
  })
})
