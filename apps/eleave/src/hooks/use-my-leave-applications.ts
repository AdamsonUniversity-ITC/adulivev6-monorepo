import { useQuery } from "@tanstack/react-query"

import { fetchMyLeaveApplications } from "@/lib/leave-applications-api"

export function useMyLeaveApplications(perPage = 100) {
  return useQuery({
    queryKey: ["my-leave-applications", perPage],
    queryFn: () => fetchMyLeaveApplications({ per_page: perPage, page: 1 }),
  })
}
