import { format, parseISO } from "date-fns"

import type { LeaveApplicationRecord } from "@/lib/leave-applications-api"
import {
  mapLeaveApplicationToHrApprovalRow,
  type HrApprovalRow,
} from "@/lib/map-hr-approval-row"
import { resolveApproverOrHrWorkflowStatus } from "@/lib/resolve-approver-or-hr-workflow-status"
import { resolveHrApprovalSummary } from "@/lib/resolve-hr-approval-summary"

export type FiledLeaveReportRow = HrApprovalRow & {
  employeeNo: string
  approvalsLabel: string
  hrRemarksLabel: string
}

function buildApprovalsLabel(record: LeaveApplicationRecord): string {
  const overall = record.overall_status
  const supervisor = resolveApproverOrHrWorkflowStatus(
    overall,
    record.approver1_status,
  )
  const manager = resolveApproverOrHrWorkflowStatus(
    overall,
    record.approver2_status,
  )
  const hr = resolveApproverOrHrWorkflowStatus(
    overall,
    resolveHrApprovalSummary(record).status,
  )

  return `Supervisor: ${supervisor} | Manager: ${manager} | HR: ${hr}`
}

function formatDayPortionLabel(
  portion1: string | null | undefined,
  portion2: string | null | undefined,
): string {
  const parts = [portion1, portion2]
    .map((portion) => (typeof portion === "string" ? portion.trim() : ""))
    .filter((portion) => portion !== "")

  if (parts.length === 0) {
    return "Whole Day"
  }

  return parts.join("/")
}

function formatDayRemarkDate(leaveDate: string): string {
  try {
    return format(parseISO(leaveDate), "MMM d")
  } catch {
    return leaveDate
  }
}

/**
 * Combines application-level HR remarks with per-day remarks.
 * Single-day leave omits the date/portion prefix:
 * `Approved – SIL credits not yet earned`
 * Multi-day leave keeps dated prefixes:
 * `Approved – Jul 30 (AM/PM): day note | Jul 31 (Whole Day): other note`
 */
export function buildHrRemarksLabel(record: LeaveApplicationRecord): string {
  const applicationRemarks = record.hr_remarks?.trim() ?? ""
  const leaveDates = record.leave_application_dates ?? []
  const isSingleDay = leaveDates.length <= 1

  const dayParts = leaveDates
    .map((day) => {
      const remark = day.hr_remarks?.trim() ?? ""

      if (remark === "") {
        return null
      }

      if (isSingleDay) {
        return remark
      }

      const dateLabel = formatDayRemarkDate(day.leave_date)
      const portionLabel = formatDayPortionLabel(
        day.approved_day_portion_1,
        day.approved_day_portion_2,
      )

      return `${dateLabel} (${portionLabel}): ${remark}`
    })
    .filter((part): part is string => part != null)

  if (applicationRemarks !== "" && dayParts.length > 0) {
    return `${applicationRemarks} – ${dayParts.join(" | ")}`
  }

  if (applicationRemarks !== "") {
    return applicationRemarks
  }

  return dayParts.join(" | ")
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
