import { hrmdoSvc } from "@/lib/api"
import type {
  LeaveApplicationRecord,
  PaginatedLeaveApplicationsResponse,
} from "@/lib/leave-applications-api"

export type FiledLeaveAfterCutoffReportListParams = {
  page?: number
  per_page?: number
  search?: string
  date_from?: string
  date_to?: string
  classification?: string
  employment_type?: string
  all?: boolean
  exclude_printed?: boolean
}

export type FiledLeaveAfterCutoffReportAllResponse = {
  data: LeaveApplicationRecord[]
  meta: {
    total: number
  }
}

export type AfterCutoffPrintStatus = {
  total_in_range: number
  printed_count: number
  remaining_count: number
  has_print_history: boolean
  printed_application_ids: number[]
}

export type AfterCutoffPrintStatusParams = {
  date_from: string
  date_to: string
  classification?: string
  employment_type?: string
}

export type RecordAfterCutoffPrintParams = {
  date_from: string
  date_to: string
  leave_application_ids: number[]
}

export function isPaginatedFiledLeaveAfterCutoffResponse(
  response:
    | PaginatedLeaveApplicationsResponse
    | FiledLeaveAfterCutoffReportAllResponse
    | undefined,
): response is PaginatedLeaveApplicationsResponse {
  return Boolean(response?.meta && "current_page" in response.meta)
}

export async function fetchFiledLeaveAfterCutoffReport(
  params?: FiledLeaveAfterCutoffReportListParams,
): Promise<
  PaginatedLeaveApplicationsResponse | FiledLeaveAfterCutoffReportAllResponse
> {
  const response = await hrmdoSvc.get<
    PaginatedLeaveApplicationsResponse | FiledLeaveAfterCutoffReportAllResponse
  >("v1/reports/filed-leave-after-cutoff", { params })

  return response.data
}

export async function fetchAfterCutoffPrintStatus(
  params: AfterCutoffPrintStatusParams,
): Promise<AfterCutoffPrintStatus> {
  const response = await hrmdoSvc.get<{ data: AfterCutoffPrintStatus }>(
    "v1/reports/filed-leave-after-cutoff/print-status",
    { params },
  )

  return response.data.data
}

export async function recordAfterCutoffPrint(
  params: RecordAfterCutoffPrintParams,
): Promise<AfterCutoffPrintStatus> {
  const response = await hrmdoSvc.post<{ data: AfterCutoffPrintStatus }>(
    "v1/reports/filed-leave-after-cutoff/print-log",
    params,
  )

  return response.data.data
}
