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

function compareFiledLeaveReportRowsByEmployeeName(
  a: FiledLeaveReportRow,
  b: FiledLeaveReportRow,
): number {
  const aTeacher = a.record.employee_teacher
  const bTeacher = b.record.employee_teacher

  const lastNameCompare = (aTeacher?.last_name?.trim() ?? "").localeCompare(
    bTeacher?.last_name?.trim() ?? "",
    undefined,
    { sensitivity: "base" },
  )

  if (lastNameCompare !== 0) {
    return lastNameCompare
  }

  const firstNameCompare = (aTeacher?.first_name?.trim() ?? "").localeCompare(
    bTeacher?.first_name?.trim() ?? "",
    undefined,
    { sensitivity: "base" },
  )

  if (firstNameCompare !== 0) {
    return firstNameCompare
  }

  const employeeNoCompare = a.employeeNo.localeCompare(b.employeeNo, undefined, {
    sensitivity: "base",
  })

  if (employeeNoCompare !== 0) {
    return employeeNoCompare
  }

  const dateFromCompare = a.record.date_from.localeCompare(b.record.date_from)

  if (dateFromCompare !== 0) {
    return dateFromCompare
  }

  return Number(a.id) - Number(b.id)
}

export function sortFiledLeaveReportRowsByEmployeeName(
  rows: FiledLeaveReportRow[],
): FiledLeaveReportRow[] {
  return [...rows].sort(compareFiledLeaveReportRowsByEmployeeName)
}
