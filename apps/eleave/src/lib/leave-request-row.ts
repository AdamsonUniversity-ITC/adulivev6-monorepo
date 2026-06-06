import type {
  LeaveCancelStatus,
  LeaveOverallStatus,
} from "@/routes/my-leave/-leave-status"

export type LeaveRequestRow = {
  id: string
  leave_type: string
  date_from: string
  date_to: string
  reason: string
  address: string
  overall_status: LeaveOverallStatus
  cancel_status: LeaveCancelStatus
  filed_at: string
}

export function getLeaveFiledYears(rows: LeaveRequestRow[]): number[] {
  const years = new Set<number>()

  for (const row of rows) {
    const year = new Date(row.filed_at).getFullYear()
    if (!Number.isNaN(year)) {
      years.add(year)
    }
  }

  return [...years].sort((a, b) => b - a)
}
