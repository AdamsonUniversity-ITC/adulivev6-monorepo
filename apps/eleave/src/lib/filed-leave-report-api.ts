import { hrmdoSvc } from "@/lib/api"
import type {
  LeaveApplicationRecord,
  PaginatedLeaveApplicationsResponse,
} from "@/lib/leave-applications-api"

export type FiledLeaveReportDepartment = {
  id: number
  sec_name: string
}

export type FiledLeaveReportDepartmentParams = {
  search?: string
  date_from?: string
  date_to?: string
  status?: string
  classification?: string
  employment_type?: string
}

export type FiledLeaveReportListParams = FiledLeaveReportDepartmentParams & {
  page?: number
  per_page?: number
  section_id?: string | number
  all?: boolean
  exclude_printed?: boolean
  leave_application_ids?: number[]
}

export type FiledLeavePrintBatch = {
  printed_at: string
  printed_by: string
  count: number
  leave_application_ids: number[]
}

export type FiledLeavePrintStatus = {
  total_in_range: number
  printed_count: number
  remaining_count: number
  has_print_history: boolean
  printed_application_ids: number[]
  batches: FiledLeavePrintBatch[]
}

export type FiledLeavePrintStatusParams = {
  date_from: string
  date_to: string
  search?: string
  status?: string
  section_id?: string | number
  classification?: string
  employment_type?: string
}

export type RecordFiledLeavePrintParams = {
  date_from: string
  date_to: string
  leave_application_ids: number[]
}

export type FiledLeaveReportAllResponse = {
  data: LeaveApplicationRecord[]
  meta: {
    total: number
  }
}

export function isPaginatedFiledLeaveResponse(
  response: PaginatedLeaveApplicationsResponse | FiledLeaveReportAllResponse | undefined,
): response is PaginatedLeaveApplicationsResponse {
  return Boolean(response?.meta && "current_page" in response.meta)
}

export async function fetchFiledLeaveReport(
  params?: FiledLeaveReportListParams,
): Promise<PaginatedLeaveApplicationsResponse | FiledLeaveReportAllResponse> {
  const response = await hrmdoSvc.get<
    PaginatedLeaveApplicationsResponse | FiledLeaveReportAllResponse
  >("v1/reports/filed-leave", { params })

  return response.data
}

export async function fetchFiledLeaveReportDepartments(
  params?: FiledLeaveReportDepartmentParams,
): Promise<FiledLeaveReportDepartment[]> {
  const response = await hrmdoSvc.get<{ data: FiledLeaveReportDepartment[] }>(
    "v1/reports/filed-leave/departments",
    { params },
  )

  return response.data.data ?? []
}

export async function fetchFiledLeavePrintStatus(
  params: FiledLeavePrintStatusParams,
): Promise<FiledLeavePrintStatus> {
  const response = await hrmdoSvc.get<{ data: FiledLeavePrintStatus }>(
    "v1/reports/filed-leave/print-status",
    { params },
  )

  return response.data.data
}

export async function recordFiledLeavePrint(
  params: RecordFiledLeavePrintParams,
): Promise<FiledLeavePrintStatus> {
  const response = await hrmdoSvc.post<{ data: FiledLeavePrintStatus }>(
    "v1/reports/filed-leave/print-log",
    params,
  )

  return response.data.data
}
