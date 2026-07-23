import { getDayPortionWeight } from "@/lib/day-portion"
import type { LeaveBalanceRecord } from "@/lib/leave-balances-api"
import type { DayPortion } from "@/routes/my-leave/leave-form/schema"

export const PATERNITY_LEAVE_CODE = "pl"
export const MATERNITY_LEAVE_CODE = "ml"

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

export function getAvailablePaternityCredits(
  balances: Array<
    Pick<LeaveBalanceRecord, "leave_code" | "credits" | "pending_filed_leave">
  >,
): number {
  const plBalance = balances.find(
    (row) => row.leave_code.trim().toLowerCase() === PATERNITY_LEAVE_CODE,
  )

  if (!plBalance) {
    return 0
  }

  return Math.max(0, plBalance.credits - plBalance.pending_filed_leave)
}

export function getPaternityCreditValidationMessage(params: {
  leaveCode: string | null | undefined
  leaveDays: LeaveDayWeightInput[]
  balances: Array<
    Pick<LeaveBalanceRecord, "leave_code" | "credits" | "pending_filed_leave">
  >
}): string | null {
  const leaveCode = params.leaveCode?.trim().toLowerCase() ?? ""

  if (leaveCode !== PATERNITY_LEAVE_CODE) {
    return null
  }

  const requested = getRequestedLeaveDaysWeight(params.leaveDays)
  const available = getAvailablePaternityCredits(params.balances)

  if (requested > available + 0.001) {
    return "Insufficient Paternity Leave credits for the selected dates."
  }

  return null
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
