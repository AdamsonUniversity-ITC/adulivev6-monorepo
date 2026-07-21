import { keepPreviousData, useQuery } from "@tanstack/react-query"

import {
  fetchHrApprovalLeaveApplications,
  type HrApprovalListParams,
} from "@/lib/leave-applications-api"

export function useHrApprovalLeaveApplications(params: HrApprovalListParams) {
  return useQuery({
    queryKey: ["hr-approval-leave-applications", params],
    queryFn: () => fetchHrApprovalLeaveApplications(params),
    placeholderData: keepPreviousData,
  })
}
