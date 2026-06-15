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

export type LeaveTypesQueryResult = {
  leaveTypes: LeaveTypeRecord[]
  vlCutoffMonth: number
}

export async function fetchLeaveTypes(): Promise<LeaveTypesQueryResult> {
  const response = await hrmdoSvc.get<{
    data: LeaveTypeRecord[]
    meta?: { vl_cutoff_month?: number }
  }>("v1/leave-types")

  return {
    leaveTypes: response.data.data,
    vlCutoffMonth: response.data.meta?.vl_cutoff_month ?? 1,
  }
}
