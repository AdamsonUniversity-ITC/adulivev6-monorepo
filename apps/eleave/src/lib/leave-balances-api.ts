import { hrmdoSvc } from "@/lib/api"

export type LeaveBalanceRecord = {
  leave_type_id: number
  leave_code: string
  leave_type: string
  credits: number
  pending_filed_leave: number
}

export async function fetchMyLeaveBalances(): Promise<LeaveBalanceRecord[]> {
  const response = await hrmdoSvc.get<{ data: LeaveBalanceRecord[] }>(
    "v1/leave-balances/me",
  )
  return response.data.data
}

export async function fetchEmployeeLeaveBalances(
  employeeNo: string,
): Promise<LeaveBalanceRecord[]> {
  const response = await hrmdoSvc.get<{ data: LeaveBalanceRecord[] }>(
    `v1/leave-balances/employee/${encodeURIComponent(employeeNo)}`,
  )
  return response.data.data
}
