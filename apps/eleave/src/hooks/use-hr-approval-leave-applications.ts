import { useQuery } from "@tanstack/react-query"

import { fetchHrApprovalLeaveApplications } from "@/lib/leave-applications-api"

export function useHrApprovalLeaveApplications(perPage = 100) {
  return useQuery({
    queryKey: ["hr-approval-leave-applications", perPage],
    queryFn: () =>
      fetchHrApprovalLeaveApplications({ per_page: perPage, page: 1 }),
  })
}
