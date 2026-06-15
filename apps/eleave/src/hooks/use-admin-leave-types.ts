import { useQuery } from "@tanstack/react-query"

import { fetchAdminLeaveTypes } from "@/lib/leave-types-api"

export function useAdminLeaveTypes() {
  return useQuery({
    queryKey: ["leave-types", "admin"],
    queryFn: fetchAdminLeaveTypes,
  })
}
