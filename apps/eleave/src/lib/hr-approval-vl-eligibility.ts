import type { LeaveBalanceRecord } from "@/lib/leave-balances-api"
import { getDayPortionWeight, isWholeDayPortion } from "@/lib/day-portion"
import type { HrApprovalDayDecision } from "@/lib/map-hr-approval-row"
import type { LeaveTypeRecord } from "@/lib/leave-types-api"
import type { HrApprovalStatus } from "@/lib/hr-approval-status"

export function getVlCredits(balances: LeaveBalanceRecord[]): number {
  const vlBalance = balances.find((balance) => balance.leave_code === "vl")

  return vlBalance?.credits ?? 0
}

export function requiredPortionWeight(
  entry: HrApprovalDayDecision,
  portion: 1 | 2,
): number {
  if (entry.isSplit) {
    const portionValue =
      portion === 1 ? entry.approvedDayPortion1 : entry.approvedDayPortion2

    return getDayPortionWeight(portionValue ?? "")
  }

  return getDayPortionWeight(
    isWholeDayPortion(entry.requestedPortion)
      ? entry.requestedPortion
      : (entry.approvedDayPortion1 ?? entry.requestedPortion),
  )
}

export function canApproveVlWithPay(
  vlCredits: number,
  portionWeight: number,
): boolean {
  if (portionWeight <= 0) {
    return false
  }

  return vlCredits + 0.001 >= portionWeight
}

export function isVlLeaveTypeId(
  leaveTypeId: number | null,
  leaveTypes: LeaveTypeRecord[],
): boolean {
  if (leaveTypeId == null) {
    return false
  }

  return leaveTypes.find((leaveType) => leaveType.id === leaveTypeId)?.leave_code === "vl"
}

export function shouldWarnInsufficientVlCredits(
  status: HrApprovalStatus,
  leaveTypeId: number | null,
  leaveTypes: LeaveTypeRecord[],
  vlCredits: number,
  portionWeight: number,
): boolean {
  if (status !== "approved_with_pay") {
    return false
  }

  if (!isVlLeaveTypeId(leaveTypeId, leaveTypes)) {
    return false
  }

  return !canApproveVlWithPay(vlCredits, portionWeight)
}
