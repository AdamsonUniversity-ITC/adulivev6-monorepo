import type {
  LeaveCancelStatus,
  LeaveOverallStatus,
} from "@/routes/my-leave/-leave-status"
import { collectLeavePeriodYears } from "@/lib/leave-date-year"

export type LeaveRequestRow = {
  id: string
  leave_type: string
  date_from: string
  date_to: string
  reason: string
  address: string
  overall_status: LeaveOverallStatus
  cancel_status: LeaveCancelStatus
  filed_at: string
}

export function getLeavePeriodYearsFromRows(
  rows: Pick<LeaveRequestRow, "date_from" | "date_to">[],
): number[] {
  return collectLeavePeriodYears(rows)
}
