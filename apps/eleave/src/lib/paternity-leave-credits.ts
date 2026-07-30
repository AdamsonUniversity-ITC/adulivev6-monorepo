import { getDayPortionWeight } from "@/lib/day-portion"
import type { LeaveBalanceRecord } from "@/lib/leave-balances-api"
import type { DayPortion } from "@/routes/my-leave/leave-form/schema"

export const PATERNITY_LEAVE_CODE = "pl"
export const MATERNITY_LEAVE_CODE = "ml"
export const BIRTHDAY_LEAVE_CODE = "bl"

const CREDIT_ERROR_MESSAGES: Record<string, string> = {
  [PATERNITY_LEAVE_CODE]:
    "Insufficient Paternity Leave credits for the selected dates.",
  [BIRTHDAY_LEAVE_CODE]:
    "Insufficient Birthday Leave credits for the selected dates.",
}

export type LeaveDayWeightInput = {
  day_portion: DayPortion | string
}

export function getRequestedLeaveDaysWeight(
  leaveDays: LeaveDayWeightInput[],
): number {
  return leaveDays.reduce(
    (total, day) =>
      total + getDayPortionWeight(normalizePortion(day.day_portion)),
    0,
  )
}

export function getAvailableCreditsForLeaveCode(
  leaveCode: string,
  balances: Array<
    Pick<LeaveBalanceRecord, "leave_code" | "credits" | "pending_filed_leave">
  >,
): number {
  const normalized = leaveCode.trim().toLowerCase()
  const balance = balances.find(
    (row) => row.leave_code.trim().toLowerCase() === normalized,
  )

  if (!balance) {
    return 0
  }

  return Math.max(0, balance.credits - balance.pending_filed_leave)
}

export function getAvailablePaternityCredits(
  balances: Array<
    Pick<LeaveBalanceRecord, "leave_code" | "credits" | "pending_filed_leave">
  >,
): number {
  return getAvailableCreditsForLeaveCode(PATERNITY_LEAVE_CODE, balances)
}

export function getAvailableBirthdayCredits(
  balances: Array<
    Pick<LeaveBalanceRecord, "leave_code" | "credits" | "pending_filed_leave">
  >,
): number {
  return getAvailableCreditsForLeaveCode(BIRTHDAY_LEAVE_CODE, balances)
}

export function getLeaveCreditValidationMessage(params: {
  leaveCode: string | null | undefined
  leaveDays: LeaveDayWeightInput[]
  balances: Array<
    Pick<LeaveBalanceRecord, "leave_code" | "credits" | "pending_filed_leave">
  >
}): string | null {
  const leaveCode = params.leaveCode?.trim().toLowerCase() ?? ""
  const message = CREDIT_ERROR_MESSAGES[leaveCode]

  if (!message) {
    return null
  }

  const requested = getRequestedLeaveDaysWeight(params.leaveDays)
  const available = getAvailableCreditsForLeaveCode(leaveCode, params.balances)

  if (requested > available + 0.001) {
    return message
  }

  return null
}

/** @deprecated Prefer getLeaveCreditValidationMessage */
export function getPaternityCreditValidationMessage(params: {
  leaveCode: string | null | undefined
  leaveDays: LeaveDayWeightInput[]
  balances: Array<
    Pick<LeaveBalanceRecord, "leave_code" | "credits" | "pending_filed_leave">
  >
}): string | null {
  return getLeaveCreditValidationMessage(params)
}

function normalizePortion(portion: DayPortion | string): DayPortion | "" {
  const normalized = portion.trim().toLowerCase()

  if (normalized === "whole day" || normalized === "wholeday") {
    return "wholeday"
  }

  if (
    normalized === "am" ||
    normalized === "pm" ||
    normalized === "evening"
  ) {
    return normalized
  }

  return ""
}
