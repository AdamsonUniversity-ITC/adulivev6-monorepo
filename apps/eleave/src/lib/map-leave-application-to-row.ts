import type { LeaveApplicationRecord } from "@/lib/leave-applications-api"
import type { LeaveRequestRow } from "@/lib/leave-request-row"
import {
  coerceCancelStatus,
  coerceOverallStatus,
} from "@/routes/my-leave/-leave-status"

export function mapLeaveApplicationToRow(
  record: LeaveApplicationRecord,
  leaveTypeName: string,
): LeaveRequestRow {
  return {
    id: String(record.id),
    leave_type: leaveTypeName,
    date_from: record.date_from,
    date_to: record.date_to,
    reason: record.reason,
    address: record.address ?? "",
    overall_status: coerceOverallStatus(record.overall_status),
    cancel_status: coerceCancelStatus(record.cancel_status),
    filed_at: record.created_at ?? `${record.date_filed}T00:00:00.000Z`,
    approver1_status: record.approver1_status,
    approver2_status: record.approver2_status,
    leave_application_dates: (record.leave_application_dates ?? []).map(
      (day) => ({
        hr_status_1: day.hr_status_1,
        hr_status_2: day.hr_status_2,
      }),
    ),
  }
}

export function mapLeaveApplicationsToRows(
  records: LeaveApplicationRecord[],
  leaveTypeNames: Map<number, string>,
): LeaveRequestRow[] {
  return records.map((record) =>
    mapLeaveApplicationToRow(
      record,
      leaveTypeNames.get(record.leave_type_id) ?? "Unknown leave type",
    ),
  )
}
