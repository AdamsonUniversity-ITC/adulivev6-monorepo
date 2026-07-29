import { useQuery } from "@tanstack/react-query"

import { fetchLeaveTypeNames, fetchLeaveTypes } from "@/lib/leave-types-api"

export function useLeaveTypes() {
  return useQuery({
    queryKey: ["leave-types"],
    queryFn: fetchLeaveTypes,
  })
}

/**
 * All leave types for display labels, including ones the viewer cannot file.
 * Required by approval and report screens that show other employees' applications.
 */
export function useLeaveTypeNames() {
  return useQuery({
    queryKey: ["leave-type-names"],
    queryFn: fetchLeaveTypeNames,
  })
}
