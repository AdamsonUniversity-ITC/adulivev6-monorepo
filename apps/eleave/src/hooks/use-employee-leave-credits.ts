import { useQuery } from "@tanstack/react-query"

import {
  fetchEmployeeLeaveCredits,
  type EmployeeLeaveCreditsListParams,
} from "@/lib/employee-leave-credits-api"

export function useEmployeeLeaveCredits(params: EmployeeLeaveCreditsListParams) {
  return useQuery({
    queryKey: ["employee-leave-credits", params],
    queryFn: () => fetchEmployeeLeaveCredits(params),
  })
}
