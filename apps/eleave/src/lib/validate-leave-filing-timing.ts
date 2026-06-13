import { differenceInCalendarDays, isSameMonth, parseISO, startOfDay } from "date-fns"

import type { LeaveTypeRecord } from "@/lib/leave-types-api"

type LeaveTypeTiming = Pick<LeaveTypeRecord, "filing_timing" | "required_lead_days">

function normalizeTiming(timing: string | null | undefined): string | null {
  if (typeof timing !== "string") {
    return null
  }

  const normalized = timing.trim().toUpperCase()

  if (normalized === "") {
    return null
  }

  if (normalized === "BERFORE_OR_ON") {
    return "BEFORE_OR_ON"
  }

  return normalized
}

function toDay(date: string): Date {
  return startOfDay(parseISO(date))
}

function assertOn(today: Date, start: Date): string | null {
  if (differenceInCalendarDays(start, today) !== 0) {
    return "This leave type must be filed on the leave date itself."
  }

  return null
}

function assertBeforeOrOn(today: Date, start: Date, leadDays: number): string | null {
  const daysBefore = differenceInCalendarDays(start, today)

  if (daysBefore < leadDays) {
    return leadDays > 0
      ? `This leave type must be filed at least ${leadDays} day(s) before the leave start date.`
      : "This leave type must be filed on or before the leave start date."
  }

  return null
}

function assertBefore(today: Date, start: Date, leadDays: number): string | null {
  const daysBefore = differenceInCalendarDays(start, today)

  if (daysBefore <= 0 || daysBefore < leadDays) {
    return leadDays > 0
      ? `This leave type must be filed at least ${leadDays} day(s) before the leave start date.`
      : "This leave type must be filed before the leave start date."
  }

  return null
}

function assertAfter(today: Date, end: Date, leadDays: number): string | null {
  const daysAfter = differenceInCalendarDays(today, end)

  if (daysAfter <= 0) {
    return "This leave type must be filed after the leave end date."
  }

  if (leadDays > 0 && daysAfter > leadDays) {
    return `This leave type must be filed within ${leadDays} day(s) after the leave end date.`
  }

  return null
}

function assertAfterOrOn(today: Date, end: Date, leadDays: number): string | null {
  const daysAfter = differenceInCalendarDays(today, end)

  if (daysAfter < 0) {
    return "This leave type must be filed on or after the leave end date."
  }

  if (leadDays > 0 && daysAfter > leadDays) {
    return `This leave type must be filed within ${leadDays} day(s) on or after the leave end date.`
  }

  return null
}

function assertWithinMonth(today: Date, start: Date): string | null {
  if (differenceInCalendarDays(start, today) <= 0 || !isSameMonth(today, start)) {
    return "This leave type must be filed before the leave date, within the same month."
  }

  return null
}

export function validateLeaveFilingTiming(
  leaveType: LeaveTypeTiming,
  dateFrom: string,
  dateTo: string,
  today: Date = startOfDay(new Date()),
): string | null {
  const timing = normalizeTiming(leaveType.filing_timing)

  if (timing === null || timing === "ANYTIME") {
    return null
  }

  const start = toDay(dateFrom)
  const end = toDay(dateTo)
  const leadDays = Math.max(0, leaveType.required_lead_days)

  switch (timing) {
    case "ON":
      return assertOn(today, start)
    case "BEFORE_OR_ON":
      return assertBeforeOrOn(today, start, leadDays)
    case "BEFORE":
      return assertBefore(today, start, leadDays)
    case "AFTER":
      return assertAfter(today, end, leadDays)
    case "AFTER_OR_ON":
      return assertAfterOrOn(today, end, leadDays)
    case "WITHIN_MONTH":
      return assertWithinMonth(today, start)
    default:
      return null
  }
}
