import { useQuery } from "@tanstack/react-query"

import {
  fetchAfterCutoffPrintStatus,
  fetchFiledLeaveAfterCutoffReport,
  type AfterCutoffPrintStatusParams,
  type FiledLeaveAfterCutoffReportListParams,
} from "@/lib/filed-leave-after-cutoff-report-api"

export function useFiledLeaveAfterCutoffReport(
  params: FiledLeaveAfterCutoffReportListParams,
) {
  return useQuery({
    queryKey: ["filed-leave-after-cutoff-report", params],
    queryFn: () => fetchFiledLeaveAfterCutoffReport(params),
    enabled: !params.all,
  })
}

export function useAfterCutoffPrintStatus(params: AfterCutoffPrintStatusParams | null) {
  return useQuery({
    queryKey: ["filed-leave-after-cutoff-print-status", params],
    queryFn: () => fetchAfterCutoffPrintStatus(params!),
    enabled: Boolean(params?.date_from && params?.date_to),
  })
}
