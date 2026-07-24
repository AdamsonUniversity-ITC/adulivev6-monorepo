import { useQuery } from "@tanstack/react-query"

import { fetchHrApprovalPendingCount } from "@/lib/leave-applications-api"

export const HR_APPROVAL_PENDING_COUNT_QUERY_KEY = [
  "hr-approval-pending-count",
] as const

export function useHrApprovalPendingCount(enabled = true) {
  return useQuery({
    queryKey: HR_APPROVAL_PENDING_COUNT_QUERY_KEY,
    queryFn: fetchHrApprovalPendingCount,
    enabled,
    refetchInterval: 60_000,
  })
}
