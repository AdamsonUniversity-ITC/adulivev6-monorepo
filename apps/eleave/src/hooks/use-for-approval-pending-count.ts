import { useQuery } from "@tanstack/react-query"

import { fetchForApprovalPendingCount } from "@/lib/leave-applications-api"

export const FOR_APPROVAL_PENDING_COUNT_QUERY_KEY = [
  "for-approval-pending-count",
] as const

export function useForApprovalPendingCount(enabled = true) {
  return useQuery({
    queryKey: FOR_APPROVAL_PENDING_COUNT_QUERY_KEY,
    queryFn: fetchForApprovalPendingCount,
    enabled,
    refetchInterval: 60_000,
  })
}
