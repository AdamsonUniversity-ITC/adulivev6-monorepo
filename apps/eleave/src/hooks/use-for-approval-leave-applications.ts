import { useQuery } from "@tanstack/react-query"

import { fetchForApprovalLeaveApplications } from "@/lib/leave-applications-api"

export function useForApprovalLeaveApplications(perPage = 100) {
  return useQuery({
    queryKey: ["for-approval-leave-applications", perPage],
    queryFn: () =>
      fetchForApprovalLeaveApplications({ per_page: perPage, page: 1 }),
  })
}
