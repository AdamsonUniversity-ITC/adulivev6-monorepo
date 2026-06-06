import { eachDayOfInterval, format, isValid, parseISO } from "date-fns"

import type { LeaveTypeOption } from "../-leave-types"
import type { LeaveRequestRow } from "@/lib/leave-request-row"
import {
  DAY_PORTION_OPTIONS,
  type DayPortion,
  type LeaveDay,
  type LeaveFormValues,
} from "./schema"

export type LeaveDayExclusions = {
  excludeSundays?: boolean
  excludeSaturdays?: boolean
}

export function getDaysInRange(
  dateFrom: string,
  dateTo: string,
  exclusions: LeaveDayExclusions = {},
): string[] {
  const from = parseISO(dateFrom)
  const to = parseISO(dateTo)

  if (!isValid(from) || !isValid(to) || to < from) {
    return []
  }

  return eachDayOfInterval({ start: from, end: to })
    .filter((date) => !isWeekendExcludedDate(date, exclusions))
    .map((date) => format(date, "yyyy-MM-dd"))
}

export function getLeaveDayExclusionsFromForm(values: {
  exclude_sundays: boolean
  exclude_saturdays: boolean
}): LeaveDayExclusions {
  return {
    excludeSundays: values.exclude_sundays,
    excludeSaturdays: values.exclude_saturdays,
  }
}

export function isWeekendExcludedDate(
  date: Date,
  exclusions: LeaveDayExclusions = {},
): boolean {
  const dayOfWeek = date.getDay()

  if (exclusions.excludeSundays && dayOfWeek === 0) {
    return true
  }

  if (exclusions.excludeSaturdays && dayOfWeek === 6) {
    return true
  }

  return false
}

export function formatLeaveDay(date: string): string {
  try {
    return format(parseISO(date), "EEE, MMM d, yyyy")
  } catch {
    return date
  }
}

export function formatDateShort(date: string): string {
  try {
    return format(parseISO(date), "MMM d, yyyy")
  } catch {
    return date
  }
}

export function formatDateRange(dateFrom: string, dateTo: string): string {
  return `${formatDateShort(dateFrom)} – ${formatDateShort(dateTo)}`
}

export function syncLeaveDays(
  dateFrom: string,
  dateTo: string,
  existing: LeaveDay[],
  exclusions: LeaveDayExclusions = {},
): LeaveDay[] {
  const dates = getDaysInRange(dateFrom, dateTo, exclusions)
  const portionByDate = new Map(existing.map((day) => [day.date, day.day_portion]))

  return dates.map((date) => ({
    date,
    day_portion: portionByDate.get(date) ?? "",
  }))
}

export function getDayPortionLabel(portion: DayPortion): string {
  return (
    DAY_PORTION_OPTIONS.find((option) => option.value === portion)?.label ??
    portion
  )
}

export function getLeaveTypeLabel(
  leaveTypeId: string,
  leaveTypes: LeaveTypeOption[] = [],
): string {
  const id = Number(leaveTypeId)
  return leaveTypes.find((type) => type.id === id)?.leave_name ?? "—"
}

export function mapLeaveRowToFormValues(
  row: LeaveRequestRow,
  leaveTypes: LeaveTypeOption[] = [],
): LeaveFormValues {
  const leaveType = leaveTypes.find((type) => type.leave_name === row.leave_type)

  return {
    date_from: row.date_from,
    date_to: row.date_to,
    exclude_sundays: true,
    exclude_saturdays: false,
    leave_type_id: leaveType ? String(leaveType.id) : "",
    leave_days: syncLeaveDays(row.date_from, row.date_to, [], {
      excludeSundays: true,
      excludeSaturdays: false,
    }),
    reason: row.reason,
    address: row.address,
  }
}

export function leaveDaysChanged(
  current: LeaveDay[],
  initial: LeaveDay[],
): boolean {
  if (current.length !== initial.length) return true

  return current.some((day, index) => {
    const original = initial[index]
    return (
      day.date !== original?.date || day.day_portion !== original?.day_portion
    )
  })
}
