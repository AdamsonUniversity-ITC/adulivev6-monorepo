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
}

export type FiledLeaveReportListParams = FiledLeaveReportDepartmentParams & {
  page?: number
  per_page?: number
  section_id?: string | number
  all?: boolean
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
