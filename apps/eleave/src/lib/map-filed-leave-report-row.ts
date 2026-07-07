import type { LeaveApplicationRecord } from "@/lib/leave-applications-api"
import {
  mapLeaveApplicationToHrApprovalRow,
  type HrApprovalRow,
} from "@/lib/map-hr-approval-row"
import { resolveHrApprovalSummary } from "@/lib/resolve-hr-approval-summary"

export type FiledLeaveReportRow = HrApprovalRow & {
  employeeNo: string
  approvalsLabel: string
  hrRemarksLabel: string
}

function buildApprovalsLabel(record: LeaveApplicationRecord): string {
  const supervisor = record.approver1_status?.trim() || "—"
  const manager = record.approver2_status?.trim() || "—"
  const hr = resolveHrApprovalSummary(record).status

  return `Supervisor: ${supervisor} | Manager: ${manager} | HR: ${hr}`
}

function buildHrRemarksLabel(record: LeaveApplicationRecord): string {
  const remarks = (record.leave_application_dates ?? [])
    .map((day) => day.hr_remarks?.trim() ?? "")
    .filter((remark) => remark !== "")

  return remarks.join(" | ")
}

export function mapLeaveApplicationToFiledLeaveReportRow(
  record: LeaveApplicationRecord,
  leaveTypeNames: Map<number, string>,
): FiledLeaveReportRow {
  const base = mapLeaveApplicationToHrApprovalRow(record, leaveTypeNames)

  return {
    ...base,
    employeeNo: record.employee_no,
    approvalsLabel: buildApprovalsLabel(record),
    hrRemarksLabel: buildHrRemarksLabel(record),
  }
}

export function mapLeaveApplicationsToFiledLeaveReportRows(
  records: LeaveApplicationRecord[],
  leaveTypeNames: Map<number, string>,
): FiledLeaveReportRow[] {
  return records.map((record) =>
    mapLeaveApplicationToFiledLeaveReportRow(record, leaveTypeNames),
  )
}
