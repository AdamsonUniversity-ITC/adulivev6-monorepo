import { useQuery } from "@tanstack/react-query"

import { fetchElDependentCareUsage } from "@/lib/leave-applications-api"

export function useElDependentCareUsage(enabled = true) {
  return useQuery({
    queryKey: ["el-dependent-care-usage"],
    queryFn: fetchElDependentCareUsage,
    enabled,
  })
}
