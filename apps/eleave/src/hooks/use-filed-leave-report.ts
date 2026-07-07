import { useQuery } from "@tanstack/react-query"

import {
  fetchFiledLeaveReport,
  fetchFiledLeaveReportDepartments,
  type FiledLeaveReportDepartmentParams,
  type FiledLeaveReportListParams,
} from "@/lib/filed-leave-report-api"

export function useFiledLeaveReport(params: FiledLeaveReportListParams) {
  return useQuery({
    queryKey: ["filed-leave-report", params],
    queryFn: () => fetchFiledLeaveReport(params),
    enabled: !params.all,
  })
}

export function useFiledLeaveReportDepartments(
  params: FiledLeaveReportDepartmentParams,
) {
  return useQuery({
    queryKey: ["filed-leave-report-departments", params],
    queryFn: () => fetchFiledLeaveReportDepartments(params),
  })
}
