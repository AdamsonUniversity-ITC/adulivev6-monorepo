import type { AxiosError } from "axios"

import { hrmdoSvc } from "@/lib/api"

type ValidationErrorResponse = {
  message?: string
  errors?: Record<string, string[]>
}

export type LeaveTypeRecord = {
  id: number
  leave_code: string
  leave_name: string
  description: string | null
  required_lead_days: number
  filing_timing: string | null
  display_order: number
  is_active: boolean
  hide_leave_credits: boolean
  old_leave_type: string | null
  requires_apply_credit_check: boolean
  apply_credit_error_message: string | null
  enforces_dependent_care_limit: boolean
  dependent_care_yearly_limit: number | null
  deleted_at: string | null
}

export type LeaveTypePayload = {
  leave_code: string
  leave_name: string
  description?: string | null
  required_lead_days?: number
  filing_timing?: string | null
  display_order?: number
  is_active?: boolean
  hide_leave_credits?: boolean
  old_leave_type?: string | null
  requires_apply_credit_check?: boolean
  apply_credit_error_message?: string | null
  enforces_dependent_care_limit?: boolean
  dependent_care_yearly_limit?: number | null
}

export type UpdateLeaveTypePayload = Omit<LeaveTypePayload, "leave_code">

export const FILING_TIMING_OPTIONS = [
  "ANYTIME",
  "ON",
  "BEFORE",
  "BEFORE_OR_ON",
  "AFTER",
  "AFTER_OR_ON",
  "AFTER_START",
  "WITHIN_MONTH",
] as const

export const FILING_TIMING_LABELS: Record<
  (typeof FILING_TIMING_OPTIONS)[number],
  string
> = {
  ANYTIME: "Anytime",
  ON: "On the leave date only",
  BEFORE: "Before the leave starts",
  BEFORE_OR_ON: "On or before the leave starts",
  AFTER: "After the leave ends",
  AFTER_OR_ON: "On or after the leave ends",
  AFTER_START: "After the first leave day",
  WITHIN_MONTH: "Within the same calendar month",
}

export function getFilingTimingLabel(value: string | null | undefined): string {
  if (!value) {
    return "—"
  }

  return (
    FILING_TIMING_LABELS[value as (typeof FILING_TIMING_OPTIONS)[number]] ?? value
  )
}

export async function fetchLeaveTypes(): Promise<LeaveTypeRecord[]> {
  const response = await hrmdoSvc.get<{ data: LeaveTypeRecord[] }>("v1/leave-types")

  return normalizeLeaveTypes(response.data.data)
}

/**
 * Every leave type, unfiltered by viewer visibility, for labelling applications
 * filed by other employees. Use fetchLeaveTypes for filing options instead.
 */
export async function fetchLeaveTypeNames(): Promise<LeaveTypeRecord[]> {
  const response = await hrmdoSvc.get<{ data: LeaveTypeRecord[] }>(
    "v1/leave-types/names",
  )

  return normalizeLeaveTypes(response.data.data)
}

export async function fetchAdminLeaveTypes(options?: {
  trashed?: boolean
}): Promise<LeaveTypeRecord[]> {
  const response = await hrmdoSvc.get<{ data: LeaveTypeRecord[] }>(
    "v1/leave-types/admin",
    {
      params: options?.trashed ? { trashed: 1 } : undefined,
    },
  )

  return normalizeLeaveTypes(response.data.data)
}

export async function createLeaveType(
  payload: LeaveTypePayload,
): Promise<LeaveTypeRecord> {
  const response = await hrmdoSvc.post<{ data: LeaveTypeRecord }>(
    "v1/leave-types",
    payload,
  )

  return normalizeLeaveType(response.data.data)
}

export async function updateLeaveType(
  id: number,
  payload: UpdateLeaveTypePayload,
): Promise<LeaveTypeRecord> {
  const response = await hrmdoSvc.patch<{ data: LeaveTypeRecord }>(
    `v1/leave-types/${id}`,
    payload,
  )

  return normalizeLeaveType(response.data.data)
}

export async function softDeleteLeaveType(id: number): Promise<void> {
  await hrmdoSvc.delete(`v1/leave-types/${id}`)
}

export async function restoreLeaveType(id: number): Promise<LeaveTypeRecord> {
  const response = await hrmdoSvc.post<{ data: LeaveTypeRecord }>(
    `v1/leave-types/${id}/restore`,
  )

  return normalizeLeaveType(response.data.data)
}

export function getLeaveTypeValidationErrorMessage(
  error: unknown,
): string | null {
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

export function getLeaveTypeValidationFieldErrors(
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

function normalizeLeaveTypes(rows: LeaveTypeRecord[]): LeaveTypeRecord[] {
  return rows.map(normalizeLeaveType)
}

function normalizeLeaveType(row: LeaveTypeRecord): LeaveTypeRecord {
  return {
    ...row,
    hide_leave_credits: Boolean(row.hide_leave_credits),
    requires_apply_credit_check: Boolean(row.requires_apply_credit_check),
    apply_credit_error_message: row.apply_credit_error_message ?? null,
    enforces_dependent_care_limit: Boolean(row.enforces_dependent_care_limit),
    dependent_care_yearly_limit:
      row.dependent_care_yearly_limit == null
        ? null
        : Number(row.dependent_care_yearly_limit),
    old_leave_type: row.old_leave_type ?? null,
    deleted_at: row.deleted_at ?? null,
  }
}
