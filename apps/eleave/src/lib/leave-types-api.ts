import { hrmdoSvc } from "@/lib/api"

export type LeaveTypeRecord = {
  id: number
  leave_code: string
  leave_name: string
  description: string | null
  required_lead_days: number
  filing_timing: string | null
  display_order: number
  is_active: boolean
}

export async function fetchLeaveTypes(): Promise<LeaveTypeRecord[]> {
  const response = await hrmdoSvc.get<{ data: LeaveTypeRecord[] }>("v1/leave-types")

  return response.data.data
}
