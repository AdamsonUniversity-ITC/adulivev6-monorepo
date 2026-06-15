import { useQuery } from "@tanstack/react-query"

import { fetchLeaveTypes } from "@/lib/leave-types-api"

export function useLeaveTypes() {
  const query = useQuery({
    queryKey: ["leave-types"],
    queryFn: fetchLeaveTypes,
  })

  return {
    ...query,
    data: query.data?.leaveTypes ?? [],
    vlCutoffMonth: query.data?.vlCutoffMonth ?? 1,
  }
}
