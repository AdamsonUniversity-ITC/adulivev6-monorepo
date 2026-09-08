import { keepPreviousData, useQuery } from "@tanstack/react-query"

import {
  fetchFiledLeavePrintStatus,
  fetchFiledLeaveReport,
  fetchFiledLeaveReportDepartments,
  type FiledLeavePrintStatusParams,
  type FiledLeaveReportDepartmentParams,
  type FiledLeaveReportListParams,
} from "@/lib/filed-leave-report-api"

export function useFiledLeaveReport(
  params: FiledLeaveReportListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["filed-leave-report", params],
    queryFn: () => fetchFiledLeaveReport(params),
    enabled: (options?.enabled ?? true) && !params.all,
    placeholderData: keepPreviousData,
  })
}

export function useFiledLeaveReportDepartments(
  params: FiledLeaveReportDepartmentParams,
) {
  return useQuery({
    queryKey: ["filed-leave-report-departments", params],
    queryFn: () => fetchFiledLeaveReportDepartments(params),
    placeholderData: keepPreviousData,
  })
}

export function useFiledLeavePrintStatus(params: FiledLeavePrintStatusParams | null) {
  return useQuery({
    queryKey: ["filed-leave-print-status", params],
    queryFn: () => fetchFiledLeavePrintStatus(params!),
    enabled: Boolean(params?.date_from && params?.date_to),
  })
}
