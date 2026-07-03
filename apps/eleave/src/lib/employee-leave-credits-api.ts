import { hrmdoSvc } from "@/lib/api"
import type { EmployeeTeacherRecord } from "@/lib/employee-teacher-display"
import type { LeaveBalanceRecord } from "@/lib/leave-balances-api"

export type EmployeeLeaveCreditsRow = {
  employee_no: string
  employee: EmployeeTeacherRecord | null
  leave_credits: LeaveBalanceRecord[]
}

export type PaginatedEmployeeLeaveCreditsResponse = {
  data: EmployeeLeaveCreditsRow[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from?: number | null
    to?: number | null
  }
}

export type EmployeeLeaveCreditsListParams = {
  page?: number
  per_page?: number
  search?: string
}

export async function fetchEmployeeLeaveCredits(
  params?: EmployeeLeaveCreditsListParams,
): Promise<PaginatedEmployeeLeaveCreditsResponse> {
  const response = await hrmdoSvc.get<PaginatedEmployeeLeaveCreditsResponse>(
    "v1/employee-leave-credits",
    { params },
  )

  return response.data
}
