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

/**
 * Every leave type, unfiltered by viewer visibility, for labelling applications
 * filed by other employees. Use fetchLeaveTypes for filing options instead.
 */
export async function fetchLeaveTypeNames(): Promise<LeaveTypeRecord[]> {
  const response = await hrmdoSvc.get<{ data: LeaveTypeRecord[] }>(
    "v1/leave-types/names",
  )

  return response.data.data
}

export async function fetchAdminLeaveTypes(): Promise<LeaveTypeRecord[]> {
  const response = await hrmdoSvc.get<{ data: LeaveTypeRecord[] }>(
    "v1/leave-types/admin",
  )

  return response.data.data
}
