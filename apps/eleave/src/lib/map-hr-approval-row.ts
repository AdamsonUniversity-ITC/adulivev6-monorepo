import {
  formatEmployeeName,
  getEmployeeDepartment,
} from "@/lib/employee-teacher-display"
import { mapApiDayPortion, mapDayPortionToApiLabel, isWholeDayPortion } from "@/lib/day-portion"
import { mapApiHrStatusToSlug, mapSlugToApiHrStatus, type HrApprovalStatus } from "@/lib/hr-approval-status"
import type { HrApprovalItemPayload, LeaveApplicationRecord } from "@/lib/leave-applications-api"
import { resolveHrOverallStatus } from "@/lib/resolve-hr-overall-status"
import type { DayPortion } from "@/routes/my-leave/leave-form/schema"
import type { LeaveOverallStatus } from "@/routes/my-leave/-leave-status"
import { formatDateRange, formatLeaveDay } from "@/routes/my-leave/leave-form/utils"

export type HrApprovalDayDecision = {
  leaveApplicationDateId: number
  dayNumber: number
  actualDate: string
  requestedPortion: DayPortion
  isSplit: boolean
  approvedDayPortion1: DayPortion | null
  approvedDayPortion2: DayPortion | null
  leaveTypeId1: number | null
  leaveTypeId2: number | null
  leaveType1: string
  leaveType2: string
  status1: HrApprovalStatus
  status2: HrApprovalStatus | null
  hrRemarks: string
}

export type HrApprovalRow = {
  id: string
  record: LeaveApplicationRecord
  employee: string
  department: string
  leaveType: string
  dates: string
  days: number
  year: number
  status: LeaveOverallStatus
  dailyDecisions: HrApprovalDayDecision[]
}

function summarizeLeaveType(decisions: HrApprovalDayDecision[]): string {
  const labels = decisions.flatMap((entry) => {
    const types = [entry.leaveType1]
    if (entry.isSplit && entry.leaveType2) {
      types.push(entry.leaveType2)
    }
    return types
  })

  if (labels.length === 0) return "-"

  const unique = [...new Set(labels)]
  return unique.length === 1 ? unique[0]! : "Multiple Leave Types"
}

function resolveLeaveTypeName(
  leaveTypeId: number | null | undefined,
  leaveTypeNames: Map<number, string>,
  fallback: string,
): string {
  if (leaveTypeId == null) {
    return fallback
  }

  return leaveTypeNames.get(leaveTypeId) ?? fallback
}

function resolveIsSplitDay(applicationDate: {
  approved_day_portion_2: string | null
}): boolean {
  const portionTwo = applicationDate.approved_day_portion_2

  return portionTwo != null && portionTwo.trim() !== ""
}

function resolveRequestedPortion(
  applicationDate: {
    approved_day_portion_1: string
    approved_day_portion_2: string | null
  },
  isSplit: boolean,
): DayPortion {
  if (isSplit) {
    return "wholeday"
  }

  return mapApiDayPortion(applicationDate.approved_day_portion_1)
}

export function canSplitLeaveDayDecision(entry: Pick<
  HrApprovalDayDecision,
  "isSplit" | "requestedPortion"
>): boolean {
  return entry.isSplit || isWholeDayPortion(entry.requestedPortion)
}

export function hasPendingHrDayDecision(entry: HrApprovalDayDecision): boolean {
  if (entry.status1 === "pending") {
    return true
  }

  if (entry.isSplit) {
    return entry.status2 == null || entry.status2 === "pending"
  }

  return false
}

export function mapLeaveApplicationToHrApprovalRow(
  record: LeaveApplicationRecord,
  leaveTypeNames: Map<number, string>,
): HrApprovalRow {
  const defaultLeaveTypeName =
    leaveTypeNames.get(record.leave_type_id) ?? "Unknown leave type"
  const applicationDates = [...(record.leave_application_dates ?? [])].sort(
    (a, b) => a.leave_date.localeCompare(b.leave_date),
  )

  const dailyDecisions: HrApprovalDayDecision[] = applicationDates.map(
    (applicationDate, index) => {
      const isSplit = resolveIsSplitDay(applicationDate)
      const requestedPortion = resolveRequestedPortion(applicationDate, isSplit)
      const leaveTypeId1 =
        applicationDate.approved_leave_type_id_1 ?? record.leave_type_id ?? null
      const leaveTypeId2 = applicationDate.approved_leave_type_id_2 ?? null

      return {
        leaveApplicationDateId: applicationDate.id,
        dayNumber: index + 1,
        actualDate: formatLeaveDay(applicationDate.leave_date),
        requestedPortion,
        isSplit,
        approvedDayPortion1: isSplit
          ? mapApiDayPortion(applicationDate.approved_day_portion_1)
          : requestedPortion,
        approvedDayPortion2: isSplit
          ? mapApiDayPortion(applicationDate.approved_day_portion_2 ?? "")
          : null,
        leaveTypeId1,
        leaveTypeId2,
        leaveType1: resolveLeaveTypeName(
          leaveTypeId1,
          leaveTypeNames,
          defaultLeaveTypeName,
        ),
        leaveType2: resolveLeaveTypeName(
          leaveTypeId2,
          leaveTypeNames,
          defaultLeaveTypeName,
        ),
        status1: mapApiHrStatusToSlug(applicationDate.hr_status_1),
        status2: isSplit
          ? mapApiHrStatusToSlug(applicationDate.hr_status_2)
          : null,
        hrRemarks: applicationDate.hr_remarks ?? "",
      }
    },
  )

  const year = Number(record.date_from?.slice(0, 4))

  return {
    id: String(record.id),
    record,
    employee: formatEmployeeName(
      record.employee_teacher,
      record.employee_no || "Unknown employee",
    ),
    department: getEmployeeDepartment(record.employee_teacher),
    leaveType: summarizeLeaveType(dailyDecisions),
    dates: formatDateRange(record.date_from, record.date_to),
    days: dailyDecisions.length,
    year: Number.isFinite(year) ? year : new Date().getFullYear(),
    status: resolveHrOverallStatus(record),
    dailyDecisions,
  }
}

export function mapLeaveApplicationsToHrApprovalRows(
  records: LeaveApplicationRecord[],
  leaveTypeNames: Map<number, string>,
): HrApprovalRow[] {
  return records.map((record) =>
    mapLeaveApplicationToHrApprovalRow(record, leaveTypeNames),
  )
}

type LeaveApplicationDateRecord = NonNullable<
  LeaveApplicationRecord["leave_application_dates"]
>[number]

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value == null) {
    return null
  }

  const trimmed = value.trim()

  return trimmed === "" ? null : trimmed
}

export function hasHrApprovalDayDecisionChanged(
  entry: HrApprovalDayDecision,
  applicationDate: LeaveApplicationDateRecord,
): boolean {
  const item = mapHrApprovalDayDecisionToPayloadItem(entry)

  if (!item) {
    return false
  }

  const dbStatus1 = applicationDate.hr_status_1 ?? "Pending"
  const dbStatus2 = applicationDate.hr_status_2 ?? null
  const dbRemarks = normalizeOptionalString(applicationDate.hr_remarks) ?? ""

  if (item.hr_status_1 !== dbStatus1) {
    return true
  }

  if ((item.hr_status_2 ?? null) !== dbStatus2) {
    return true
  }

  if (item.approved_day_portion_1 !== applicationDate.approved_day_portion_1) {
    return true
  }

  if (
    normalizeOptionalString(item.approved_day_portion_2) !==
    normalizeOptionalString(applicationDate.approved_day_portion_2)
  ) {
    return true
  }

  if (
    (item.approved_leave_type_id_1 ?? null) !==
    (applicationDate.approved_leave_type_id_1 ?? null)
  ) {
    return true
  }

  if (
    (item.approved_leave_type_id_2 ?? null) !==
    (applicationDate.approved_leave_type_id_2 ?? null)
  ) {
    return true
  }

  if ((item.hr_remarks ?? "") !== dbRemarks) {
    return true
  }

  return false
}

export function mapChangedHrApprovalDayDecisionToPayloadItem(
  entry: HrApprovalDayDecision,
  applicationDate: LeaveApplicationDateRecord,
): HrApprovalItemPayload | null {
  if (!hasHrApprovalDayDecisionChanged(entry, applicationDate)) {
    return null
  }

  return mapHrApprovalDayDecisionToPayloadItem(entry)
}

export function mapHrApprovalDayDecisionToPayloadItem(
  entry: HrApprovalDayDecision,
): HrApprovalItemPayload | null {
  if (entry.leaveApplicationDateId <= 0) {
    return null
  }

  if (entry.isSplit) {
    const hrStatus1 = mapSlugToApiHrStatus(entry.status1)
    const hrStatus2 = entry.status2 ? mapSlugToApiHrStatus(entry.status2) : null

    if (!hrStatus1 || !hrStatus2 || !entry.approvedDayPortion1 || !entry.approvedDayPortion2) {
      return null
    }

    if (
      entry.approvedDayPortion1 === entry.approvedDayPortion2 ||
      isWholeDayPortion(entry.approvedDayPortion1) ||
      isWholeDayPortion(entry.approvedDayPortion2)
    ) {
      return null
    }

    return {
      leave_application_date_id: entry.leaveApplicationDateId,
      approved_day_portion_1: mapDayPortionToApiLabel(entry.approvedDayPortion1),
      approved_day_portion_2: mapDayPortionToApiLabel(entry.approvedDayPortion2),
      approved_leave_type_id_1: entry.leaveTypeId1,
      approved_leave_type_id_2: entry.leaveTypeId2,
      hr_status_1: hrStatus1,
      hr_status_2: hrStatus2,
      hr_remarks: entry.hrRemarks.trim() || null,
    }
  }

  const hrStatus1 = mapSlugToApiHrStatus(entry.status1)
  if (!hrStatus1) {
    return null
  }

  return {
    leave_application_date_id: entry.leaveApplicationDateId,
    approved_day_portion_1: mapDayPortionToApiLabel(
      isWholeDayPortion(entry.requestedPortion)
        ? entry.requestedPortion
        : (entry.approvedDayPortion1 ?? entry.requestedPortion),
    ),
    approved_day_portion_2: null,
    approved_leave_type_id_1: entry.leaveTypeId1,
    approved_leave_type_id_2: null,
    hr_status_1: hrStatus1,
    hr_status_2: null,
    hr_remarks: entry.hrRemarks.trim() || null,
  }
}
