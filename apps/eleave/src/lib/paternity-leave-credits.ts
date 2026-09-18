import { getDayPortionWeight } from "@/lib/day-portion"
import type { LeaveBalanceRecord } from "@/lib/leave-balances-api"
import type { DayPortion } from "@/routes/my-leave/leave-form/schema"

export const PATERNITY_LEAVE_CODE = "pl"
export const MATERNITY_LEAVE_CODE = "ml"
export const BIRTHDAY_LEAVE_CODE = "bl"

const DEFAULT_CREDIT_ERROR_MESSAGE =
  "Insufficient leave credits for the selected dates."

export type LeaveDayWeightInput = {
  day_portion: DayPortion | string
}

export type LeaveCreditCheckLeaveType = {
  leave_code: string
  requires_apply_credit_check?: boolean | null
  apply_credit_error_message?: string | null
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
  leaveType?: LeaveCreditCheckLeaveType | null
  /** @deprecated Prefer leaveType.requires_apply_credit_check */
  leaveCode?: string | null
  leaveDays: LeaveDayWeightInput[]
  balances: Array<
    Pick<LeaveBalanceRecord, "leave_code" | "credits" | "pending_filed_leave">
  >
}): string | null {
  const leaveType = params.leaveType
  const leaveCode =
    leaveType?.leave_code?.trim().toLowerCase() ||
    params.leaveCode?.trim().toLowerCase() ||
    ""

  if (!leaveCode) {
    return null
  }

  const requiresCheck =
    leaveType != null
      ? Boolean(leaveType.requires_apply_credit_check)
      : leaveCode === PATERNITY_LEAVE_CODE || leaveCode === BIRTHDAY_LEAVE_CODE

  if (!requiresCheck) {
    return null
  }

  const requested = getRequestedLeaveDaysWeight(params.leaveDays)
  const available = getAvailableCreditsForLeaveCode(leaveCode, params.balances)

  if (requested > available + 0.001) {
    const configured = leaveType?.apply_credit_error_message?.trim()
    if (configured) {
      return configured
    }

    if (leaveCode === PATERNITY_LEAVE_CODE) {
      return "Insufficient Paternity Leave credits for the selected dates."
    }

    if (leaveCode === BIRTHDAY_LEAVE_CODE) {
      return "Insufficient Birthday Leave credits for the selected dates."
    }

    return DEFAULT_CREDIT_ERROR_MESSAGE
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
