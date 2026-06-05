import { eachDayOfInterval, format, isValid, parseISO } from "date-fns"

import { LEAVE_TYPE_OPTIONS } from "../-leave-types"
import type { LeaveRequestRow } from "../-leave-mock-data"
import {
  DAY_PORTION_OPTIONS,
  type DayPortion,
  type LeaveDay,
  type LeaveFormValues,
} from "./schema"

export function getDaysInRange(dateFrom: string, dateTo: string): string[] {
  const from = parseISO(dateFrom)
  const to = parseISO(dateTo)

  if (!isValid(from) || !isValid(to) || to < from) {
    return []
  }

  return eachDayOfInterval({ start: from, end: to }).map((date) =>
    format(date, "yyyy-MM-dd"),
  )
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
): LeaveDay[] {
  const dates = getDaysInRange(dateFrom, dateTo)
  const portionByDate = new Map(existing.map((day) => [day.date, day.day_portion]))

  return dates.map((date) => ({
    date,
    day_portion: portionByDate.get(date) ?? "wholeday",
  }))
}

export function getDayPortionLabel(portion: DayPortion): string {
  return (
    DAY_PORTION_OPTIONS.find((option) => option.value === portion)?.label ??
    portion
  )
}

export function getLeaveTypeLabel(leaveTypeId: string): string {
  const id = Number(leaveTypeId)
  return LEAVE_TYPE_OPTIONS.find((type) => type.id === id)?.name ?? "—"
}

export function mapMockRowToFormValues(row: LeaveRequestRow): LeaveFormValues {
  const leaveType = LEAVE_TYPE_OPTIONS.find((type) => type.name === row.leave_type)

  return {
    date_from: row.date_from,
    date_to: row.date_to,
    leave_type_id: leaveType ? String(leaveType.id) : "",
    leave_days: syncLeaveDays(row.date_from, row.date_to, []),
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
