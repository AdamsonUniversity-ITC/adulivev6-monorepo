import { useQuery } from "@tanstack/react-query"

import {
  fetchEmployeeLeaveBalances,
  fetchMyLeaveBalances,
} from "@/lib/leave-balances-api"

export function useLeaveBalances(employeeNo?: string | null) {
  const isEmployeeScoped = employeeNo !== undefined
  const normalizedEmployeeNo = employeeNo?.trim() || null

  return useQuery({
    queryKey: isEmployeeScoped
      ? ["leave-balances", "employee", normalizedEmployeeNo]
      : ["leave-balances", "me"],
    queryFn: () =>
      isEmployeeScoped
        ? fetchEmployeeLeaveBalances(normalizedEmployeeNo!)
        : fetchMyLeaveBalances(),
    enabled: isEmployeeScoped ? Boolean(normalizedEmployeeNo) : true,
  })
}
