import { useQuery } from "@tanstack/react-query"

import { fetchLeaveTypes } from "@/lib/leave-types-api"

export function useLeaveTypes() {
  return useQuery({
    queryKey: ["leave-types"],
    queryFn: fetchLeaveTypes,
  })
}
