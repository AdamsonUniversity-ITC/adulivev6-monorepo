import { useQuery } from "@tanstack/react-query"

import {
  fetchEmployeeHrProfile,
  fetchMyEmployeeHrProfile,
} from "@/lib/employee-hr-profile-api"

export function useMyEmployeeHrProfile(enabled = true) {
  return useQuery({
    queryKey: ["employee-hr-profile", "me"],
    queryFn: fetchMyEmployeeHrProfile,
    enabled,
  })
}

export function useEmployeeHrProfile(employeeNo?: string | null) {
  const normalizedEmployeeNo = employeeNo?.trim() || null

  return useQuery({
    queryKey: ["employee-hr-profile", normalizedEmployeeNo],
    queryFn: () => {
      if (!normalizedEmployeeNo) {
        throw new Error("Employee number is required.")
      }

      return fetchEmployeeHrProfile(normalizedEmployeeNo)
    },
    enabled: Boolean(normalizedEmployeeNo),
  })
}
