import { getMonth, parseISO, startOfDay } from "date-fns"

import { parseHrDate } from "@/lib/format-hr-date"

export const BIRTHDAY_LEAVE_CODE = "bl"

export type BirthdayLeaveValidationParams = {
  leaveCode: string | null | undefined
  birthdate: string | null | undefined
  dateFiled: string
  dateFrom: string
  dateTo: string
}

export type BirthdayLeaveFieldError = {
  field: "leave_type_id" | "date_filed" | "date_from" | "date_to"
  message: string
}

function toDay(date: string): Date | null {
  const normalized = date.trim()

  if (normalized === "") {
    return null
  }

  const parsed = startOfDay(parseISO(normalized))

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

function resolveBirthMonth(birthdate: string | null | undefined): number | null {
  if (birthdate == null) {
    return null
  }

  const trimmed = birthdate.trim()

  if (trimmed === "") {
    return null
  }

  // HR `bdate` may be MySQL datetime / local formats; Key Dates uses the same parser.
  const parsed = parseHrDate(trimmed)

  if (parsed == null) {
    return null
  }

  return getMonth(startOfDay(parsed)) + 1
}

/**
 * Birthday Leave must be filed and taken entirely within the employee's birth month.
 * Returns the first field-level error, or null when valid / not Birthday Leave.
 */
export function getBirthdayLeaveValidationError(
  params: BirthdayLeaveValidationParams,
): BirthdayLeaveFieldError | null {
  const leaveCode = params.leaveCode?.trim().toLowerCase() ?? ""

  if (leaveCode !== BIRTHDAY_LEAVE_CODE) {
    return null
  }

  const birthMonth = resolveBirthMonth(params.birthdate)

  if (birthMonth == null) {
    return {
      field: "leave_type_id",
      message:
        "Your birthdate is not on file. Please contact HRMDO before applying for Birthday Leave.",
    }
  }

  const filed = toDay(params.dateFiled)
  if (filed == null || getMonth(filed) + 1 !== birthMonth) {
    return {
      field: "date_filed",
      message: "Birthday Leave must be filed within your birth month.",
    }
  }

  const from = toDay(params.dateFrom)
  if (from == null || getMonth(from) + 1 !== birthMonth) {
    return {
      field: "date_from",
      message: "Birthday Leave start date must fall within your birth month.",
    }
  }

  const to = toDay(params.dateTo)
  if (to == null || getMonth(to) + 1 !== birthMonth) {
    return {
      field: "date_to",
      message: "Birthday Leave end date must fall within your birth month.",
    }
  }

  return null
}
