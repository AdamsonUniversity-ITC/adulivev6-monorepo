import type { AxiosError } from "axios"

import { hrmdoSvc } from "@/lib/api"
import type { EmployeeTeacherRecord } from "@/lib/employee-teacher-display"

export type { EmployeeTeacherRecord }

type ValidationErrorResponse = {
  message?: string
  errors?: Record<string, string[]>
}

export type LeaveApplicationMediaRecord = {
  id: number
  uuid: string
  name: string
  file_name: string
  mime_type: string | null
  size: number
  url: string
}

export type LeaveApplicationRecord = {
  id: number
  employee_no: string
  leave_type_id: number
  date_from: string
  date_to: string
  date_filed: string
  reason: string
  address: string | null
  supporting_documents?: LeaveApplicationMediaRecord[]
  overall_status: string | null
  cancel_status: string | null
  cancelled_at: string | null
  cancellation_reason?: string | null
  cancelled_by?: string | null
  cancelled_by_teacher?: EmployeeTeacherRecord | null
  approver1_idno: string | null
  approver1_status: string | null
  approver1_remarks: string | null
  approver1_date: string | null
  approver2_idno: string | null
  approver2_status: string | null
  approver2_remarks: string | null
  approver2_date: string | null
  employee_teacher?: EmployeeTeacherRecord | null
  leave_days?: Array<{
    date: string
    day_portion: string
  }>
  leave_application_dates?: Array<{
    id: number
    leave_date: string
    approved_day_portion_1: string
    approved_day_portion_2: string | null
    approved_leave_type_id_1: number | null
    approved_leave_type_id_2: number | null
    hr_status_1: string | null
    hr_status_2: string | null
    hr_remarks: string | null
    hr_approved_by: string | null
    hr_approved_date: string | null
    hr_approver?: EmployeeTeacherRecord | null
  }>
  created_at: string
  updated_at: string
}

export type PaginatedLeaveApplicationsResponse = {
  data: LeaveApplicationRecord[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export type ElDependentCareUsage = {
  used: number
  limit: number
  remaining: number
  year: number
}

export async function fetchElDependentCareUsage(): Promise<ElDependentCareUsage> {
  const response = await hrmdoSvc.get<{ data: ElDependentCareUsage }>(
    "v1/leave-applications/me/el-dependent-care-usage",
  )

  return response.data.data
}

export async function fetchMyLeaveApplications(params?: {
  page?: number
  per_page?: number
}) {
  const response = await hrmdoSvc.get<PaginatedLeaveApplicationsResponse>(
    "v1/leave-applications/me",
    { params },
  )

  return response.data
}

export async function applyLeaveApplication(formData: FormData) {
  const response = await hrmdoSvc.post<{ data: LeaveApplicationRecord }>(
    "v1/leave-applications/apply",
    formData,
    {
      timeout: 120_000,
      headers: { "Content-Type": "multipart/form-data" },
    },
  )

  return response.data
}

export type CancelLeaveApplicationPayload = {
  cancellation_reason?: string | null
}

export async function cancelLeaveApplication(
  leaveApplicationId: number | string,
  payload: CancelLeaveApplicationPayload = {},
) {
  const response = await hrmdoSvc.patch<{ data: LeaveApplicationRecord }>(
    `v1/leave-applications/${leaveApplicationId}/cancel`,
    payload,
  )

  return response.data
}

export async function fetchForApprovalLeaveApplications(params?: {
  page?: number
  per_page?: number
}) {
  const response = await hrmdoSvc.get<PaginatedLeaveApplicationsResponse>(
    "v1/leave-applications/for-approval",
    { params },
  )

  return response.data
}

export type LeaveApplicationDecisionPayload = {
  status: "Approved" | "Disapproved"
  remarks?: string | null
}

export async function submitLeaveApplicationDecision(
  leaveApplicationId: number | string,
  payload: LeaveApplicationDecisionPayload,
) {
  const response = await hrmdoSvc.patch<{ data: LeaveApplicationRecord }>(
    `v1/leave-applications/${leaveApplicationId}/decision`,
    payload,
  )

  return response.data
}

export type HrApprovalListParams = {
  page?: number
  per_page?: number
  search?: string
  year?: string | number
  status?: string
  classification?: string
}

export async function fetchHrApprovalLeaveApplications(params?: HrApprovalListParams) {
  const response = await hrmdoSvc.get<PaginatedLeaveApplicationsResponse>(
    "v1/leave-applications/for-hr-approval",
    { params },
  )

  return response.data
}

export type HrApprovalItemPayload = {
  leave_application_date_id: number
  hr_status_1:
    | "Pending"
    | "Approved With Pay"
    | "Approved Without Pay"
    | "Disapproved"
    | "Cancelled"
  hr_status_2?:
    | "Pending"
    | "Approved With Pay"
    | "Approved Without Pay"
    | "Disapproved"
    | "Cancelled"
    | null
  hr_remarks?: string | null
  approved_leave_type_id_1?: number | null
  approved_leave_type_id_2?: number | null
  approved_day_portion_1: string
  approved_day_portion_2?: string | null
}

export type HrApprovalPayload = {
  items: HrApprovalItemPayload[]
}

export async function submitHrApproval(payload: HrApprovalPayload) {
  const response = await hrmdoSvc.patch<{
    data: LeaveApplicationRecord["leave_application_dates"]
  }>("v1/leave-application-dates/hr-approval", payload)

  return response.data
}

export function getValidationErrorMessage(error: unknown): string | null {
  const axiosError = error as AxiosError<ValidationErrorResponse>
  const data = axiosError.response?.data

  if (!data) {
    return null
  }

  if (data.errors) {
    const firstField = Object.values(data.errors)[0]
    if (firstField?.[0]) {
      return firstField[0]
    }
  }

  return data.message ?? null
}

export function getValidationFieldErrors(
  error: unknown,
): Record<string, string> | null {
  const axiosError = error as AxiosError<ValidationErrorResponse>
  const errors = axiosError.response?.data?.errors

  if (!errors) {
    return null
  }

  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, messages[0] ?? ""]),
  )
}
