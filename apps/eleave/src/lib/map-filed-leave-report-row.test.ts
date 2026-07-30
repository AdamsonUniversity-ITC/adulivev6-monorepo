import { describe, expect, it } from "vitest"

import type { LeaveApplicationRecord } from "@/lib/leave-applications-api"
import { buildHrRemarksLabel } from "@/lib/map-filed-leave-report-row"

function applicationDate(
  overrides: Partial<
    NonNullable<LeaveApplicationRecord["leave_application_dates"]>[number]
  > = {},
) {
  return {
    id: 1,
    leave_date: "2026-07-30",
    approved_day_portion_1: "Whole Day",
    approved_day_portion_2: null,
    approved_leave_type_id_1: 1,
    approved_leave_type_id_2: null,
    hr_status_1: "Approved With Pay",
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
    date_from: "2026-07-30",
    date_to: "2026-07-31",
    date_filed: "2026-07-20",
    reason: "Personal",
    address: "Home",
    overall_status: "Approved",
    cancel_status: null,
    cancelled_at: null,
    hr_remarks_code: null,
    hr_remarks: null,
    approver1_idno: null,
    approver1_status: "Approved",
    approver1_remarks: null,
    approver1_date: null,
    approver2_idno: null,
    approver2_status: "Approved",
    approver2_remarks: null,
    approver2_date: null,
    leave_application_dates: [applicationDate()],
    created_at: "2026-07-20T00:00:00.000Z",
    updated_at: "2026-07-20T00:00:00.000Z",
    ...overrides,
  }
}

describe("buildHrRemarksLabel", () => {
  it("shows application remarks alone when there are no day remarks", () => {
    expect(
      buildHrRemarksLabel(
        baseRecord({
          hr_remarks_code: "approved",
          hr_remarks: "Approved",
        }),
      ),
    ).toBe("Approved")
  })

  it("shows day remarks alone without date prefix for single-day leave", () => {
    expect(
      buildHrRemarksLabel(
        baseRecord({
          date_from: "2026-07-30",
          date_to: "2026-07-30",
          leave_application_dates: [
            applicationDate({
              leave_date: "2026-07-30",
              approved_day_portion_1: "AM",
              approved_day_portion_2: "PM",
              hr_remarks: "SIL credits not yet earned",
            }),
          ],
        }),
      ),
    ).toBe("SIL credits not yet earned")
  })

  it("combines application and day remarks without date prefix for single-day leave", () => {
    expect(
      buildHrRemarksLabel(
        baseRecord({
          date_from: "2026-07-30",
          date_to: "2026-07-30",
          hr_remarks_code: "approved",
          hr_remarks: "Approved",
          leave_application_dates: [
            applicationDate({
              leave_date: "2026-07-30",
              approved_day_portion_1: "AM",
              approved_day_portion_2: "PM",
              hr_remarks: "SIL credits not yet earned",
            }),
          ],
        }),
      ),
    ).toBe("Approved – SIL credits not yet earned")
  })

  it("combines application and day remarks with date prefixes for multi-day leave", () => {
    expect(
      buildHrRemarksLabel(
        baseRecord({
          hr_remarks_code: "approved",
          hr_remarks: "Approved",
          leave_application_dates: [
            applicationDate({
              id: 1,
              leave_date: "2026-07-30",
              approved_day_portion_1: "AM",
              approved_day_portion_2: "PM",
              hr_remarks: "SIL credits not yet earned",
            }),
            applicationDate({
              id: 2,
              leave_date: "2026-07-31",
              approved_day_portion_1: "Whole Day",
              approved_day_portion_2: null,
              hr_remarks: "Medical certificate attached",
            }),
          ],
        }),
      ),
    ).toBe(
      "Approved – Jul 30 (AM/PM): SIL credits not yet earned | Jul 31 (Whole Day): Medical certificate attached",
    )
  })

  it("returns empty string when neither is present", () => {
    expect(buildHrRemarksLabel(baseRecord())).toBe("")
  })
})
