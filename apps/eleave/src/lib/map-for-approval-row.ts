import type { LeaveApplicationRecord } from "@/lib/leave-applications-api"
import { formatEmployeeName } from "@/lib/employee-teacher-display"
import { resolveLeaveDaysFromRecord } from "@/lib/resolve-leave-days-from-record"
import {
  coerceOverallStatus,
  type LeaveOverallStatus,
} from "@/routes/my-leave/-leave-status"
import {
  formatDateRange,
  sumLeaveDayCredits,
} from "@/routes/my-leave/leave-form/utils"

export type ForApprovalRow = {
  id: string
  record: LeaveApplicationRecord
  employeeName: string
  leaveType: string
  dates: string
  days: number
  year: number
  overallStatus: LeaveOverallStatus
}

export function mapLeaveApplicationToForApprovalRow(
  record: LeaveApplicationRecord,
  leaveTypeName: string,
): ForApprovalRow {
  const leaveDays = resolveLeaveDaysFromRecord(record)
  const creditDays = sumLeaveDayCredits(leaveDays)
  const year = Number(record.date_from?.slice(0, 4))

  return {
    id: String(record.id),
    record,
    employeeName: formatEmployeeName(
      record.employee_teacher,
      record.employee_no || "Unknown employee",
    ),
    leaveType: leaveTypeName,
    dates: formatDateRange(record.date_from, record.date_to),
    // syncLeaveDays fallback may leave empty portions (weight 0); fall back to date count.
    days: creditDays > 0 ? creditDays : leaveDays.length,
    year: Number.isFinite(year) ? year : new Date().getFullYear(),
    overallStatus: coerceOverallStatus(record.overall_status),
  }
}

export function mapLeaveApplicationsToForApprovalRows(
  records: LeaveApplicationRecord[],
  leaveTypeNames: Map<number, string>,
): ForApprovalRow[] {
  return records.map((record) =>
    mapLeaveApplicationToForApprovalRow(
      record,
      leaveTypeNames.get(record.leave_type_id) ?? "Unknown leave type",
    ),
  )
}
