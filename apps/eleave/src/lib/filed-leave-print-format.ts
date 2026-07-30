import { getDayPortionWeight } from "@/lib/day-portion"
import {
  formatEmployeeNameLastFirst,
  type EmployeeTeacherRecord,
} from "@/lib/employee-teacher-display"
import {
  getHrApprovalStatusMeta,
  type HrApprovalStatus,
} from "@/lib/hr-approval-status"
import type { LeaveTypeRecord } from "@/lib/leave-types-api"
import type { HrApprovalDayDecision } from "@/lib/map-hr-approval-row"
import type { FiledLeaveReportRow } from "@/lib/map-filed-leave-report-row"
import { formatDateShort } from "@/routes/my-leave/leave-form/utils"

type LeaveTypesById = Map<number, LeaveTypeRecord>

type DetailGroup = {
  status: HrApprovalStatus
  leaveTypeId: number | null
  leaveTypeName: string
  weight: number
}

function formatDayCount(weight: number): string {
  const normalized = Math.round(weight * 2) / 2
  // Half days read as "0.5 Day"; only totals above one day are plural.
  const isSingular = normalized > 0 && normalized <= 1

  return `${normalized} Day${isSingular ? "" : "s"}`
}

function resolveLeaveTypeCode(
  leaveTypeId: number | null,
  leaveTypesById: LeaveTypesById,
): string {
  if (leaveTypeId == null) {
    return ""
  }

  const code = leaveTypesById.get(leaveTypeId)?.leave_code?.trim()

  return code ? code.toUpperCase() : ""
}

function resolvePaySuffix(status: HrApprovalStatus): string {
  if (status === "approved_with_pay") {
    return "With Pay"
  }

  if (status === "approved_without_pay") {
    return "Without Pay"
  }

  return getHrApprovalStatusMeta(status).label
}

function formatDetailSegment(
  group: DetailGroup,
  leaveTypesById: LeaveTypesById,
): string {
  const code = resolveLeaveTypeCode(group.leaveTypeId, leaveTypesById)
  const codeLabel = code ? ` (${code})` : ""
  const paySuffix = resolvePaySuffix(group.status)

  return `${formatDayCount(group.weight)} ${group.leaveTypeName} ${paySuffix}`.trim()
}

function flattenPortions(decisions: HrApprovalDayDecision[]): DetailGroup[] {
  const portions: DetailGroup[] = []

  for (const day of decisions) {
    const portion1 = day.isSplit ? day.approvedDayPortion1 : day.requestedPortion

    if (portion1) {
      portions.push({
        status: day.status1,
        leaveTypeId: day.leaveTypeId1,
        leaveTypeName: day.leaveType1,
        weight: getDayPortionWeight(portion1),
      })
    }

    if (day.isSplit && day.approvedDayPortion2 && day.status2) {
      portions.push({
        status: day.status2,
        leaveTypeId: day.leaveTypeId2,
        leaveTypeName: day.leaveType2,
        weight: getDayPortionWeight(day.approvedDayPortion2),
      })
    }
  }

  return portions
}

function groupDetailPortions(portions: DetailGroup[]): DetailGroup[] {
  const grouped = new Map<string, DetailGroup>()

  for (const portion of portions) {
    const key = `${portion.status}|${portion.leaveTypeId ?? "none"}`
    const existing = grouped.get(key)

    if (existing) {
      existing.weight += portion.weight
      continue
    }

    grouped.set(key, { ...portion })
  }

  return [...grouped.values()]
}

function formatFallbackLeaveDetails(
  row: FiledLeaveReportRow,
  leaveTypesById: LeaveTypesById,
): string {
  const leaveTypeId = row.record.leave_type_id ?? null
  const code = resolveLeaveTypeCode(leaveTypeId, leaveTypesById)
  const codeLabel = code ? ` (${code})` : ""
  const dayLabel = formatDayCount(row.days)

  return `${dayLabel} ${row.leaveType}${codeLabel}`.trim()
}

export function formatPrintEmployeeName(
  teacher: EmployeeTeacherRecord | null | undefined,
  fallback: string,
): string {
  const lastName = teacher?.last_name?.trim()
  const firstName = teacher?.first_name?.trim()

  if (lastName && firstName) {
    return `${lastName}, ${firstName}`.toUpperCase()
  }

  const formattedFallback = formatEmployeeNameLastFirst(teacher, fallback)

  return formattedFallback.trim().toUpperCase() || "—"
}

export function getPrintLeaveDetailSegments(
  row: FiledLeaveReportRow,
  leaveTypesById: LeaveTypesById,
): string[] {
  const portions = flattenPortions(row.dailyDecisions)

  if (portions.length === 0) {
    return [formatFallbackLeaveDetails(row, leaveTypesById)]
  }

  return groupDetailPortions(portions).map((group) =>
    formatDetailSegment(group, leaveTypesById),
  )
}

export function formatPrintLeaveDetails(
  row: FiledLeaveReportRow,
  leaveTypesById: LeaveTypesById,
): string {
  return getPrintLeaveDetailSegments(row, leaveTypesById).join(" · ")
}

export function formatPrintLeaveDate(dateFrom: string, dateTo: string): string {
  const from = formatDateShort(dateFrom)
  const to = formatDateShort(dateTo)

  if (!to || from === to) {
    return from
  }

  return `${from}-to-${to}`
}

export function formatPrintHrRemarks(row: FiledLeaveReportRow): string {
  const remarks = row.hrRemarksLabel.trim()

  return remarks ? remarks.toUpperCase() : "—"
}

export function buildLeaveTypesById(
  leaveTypes: LeaveTypeRecord[],
): LeaveTypesById {
  return new Map(leaveTypes.map((type) => [type.id, type]))
}
