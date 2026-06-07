import type { AxiosError } from "axios"

import { hrmdoSvc } from "@/lib/api"
import type { EmployeeTeacherRecord } from "@/lib/employee-teacher-display"
import type { LeaveTypeRecord } from "@/lib/leave-types-api"

type ValidationErrorResponse = {
  message?: string
  errors?: Record<string, string[]>
}

export type BeginningBalanceRecord = {
  id: number
  employee_no: string
  leave_type_id: number
  leave_year: number
  beginning_balance: string
  created_by: string | null
  created_at: string
  updated_at: string
  leave_type?: LeaveTypeRecord | null
  employee?: EmployeeTeacherRecord | null
  created_by_employee?: EmployeeTeacherRecord | null
}

export type PaginatedBeginningBalancesResponse = {
  data: BeginningBalanceRecord[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export type BeginningBalancePayload = {
  employee_no: string
  leave_type_id: number
  leave_year: number
  beginning_balance: number
}

export type UpdateBeginningBalancePayload = {
  leave_type_id?: number
  leave_year?: number
  beginning_balance?: number
}

export type BeginningBalanceListParams = {
  page?: number
  per_page?: number
  employee_no?: string
  leave_type_id?: number
  leave_year?: number
  search?: string
}

export async function fetchBeginningBalances(
  params?: BeginningBalanceListParams,
): Promise<PaginatedBeginningBalancesResponse> {
  const response = await hrmdoSvc.get<PaginatedBeginningBalancesResponse>(
    "v1/leave-beginning-balances",
    { params },
  )

  return response.data
}

export async function createBeginningBalance(payload: BeginningBalancePayload) {
  const response = await hrmdoSvc.post<{ data: BeginningBalanceRecord }>(
    "v1/leave-beginning-balances",
    payload,
  )

  return response.data.data
}

export async function updateBeginningBalance(
  id: number,
  payload: UpdateBeginningBalancePayload,
) {
  const response = await hrmdoSvc.patch<{ data: BeginningBalanceRecord }>(
    `v1/leave-beginning-balances/${id}`,
    payload,
  )

  return response.data.data
}

export async function deleteBeginningBalance(id: number) {
  await hrmdoSvc.delete(`v1/leave-beginning-balances/${id}`)
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
