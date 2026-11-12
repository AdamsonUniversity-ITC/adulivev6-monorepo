import { keepPreviousData, useQuery } from "@tanstack/react-query"

import {
  fetchForApprovalLeaveApplications,
  type ForApprovalListParams,
} from "@/lib/leave-applications-api"

export function useForApprovalLeaveApplications(params: ForApprovalListParams) {
  return useQuery({
    queryKey: ["for-approval-leave-applications", params],
    queryFn: () => fetchForApprovalLeaveApplications(params),
    placeholderData: keepPreviousData,
  })
}
