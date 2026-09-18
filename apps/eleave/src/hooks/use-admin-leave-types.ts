import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createLeaveType,
  fetchAdminLeaveTypes,
  restoreLeaveType,
  softDeleteLeaveType,
  updateLeaveType,
  type LeaveTypePayload,
  type UpdateLeaveTypePayload,
} from "@/lib/leave-types-api"

const ADMIN_LEAVE_TYPES_KEY = ["leave-types", "admin"] as const

export function useAdminLeaveTypes(options?: { trashed?: boolean }) {
  const trashed = options?.trashed ?? false

  return useQuery({
    queryKey: [...ADMIN_LEAVE_TYPES_KEY, { trashed }],
    queryFn: () => fetchAdminLeaveTypes({ trashed }),
  })
}

async function invalidateLeaveTypeQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["leave-types"] }),
    queryClient.invalidateQueries({ queryKey: ["leave-type-names"] }),
    queryClient.invalidateQueries({ queryKey: ADMIN_LEAVE_TYPES_KEY }),
  ])
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LeaveTypePayload) => createLeaveType(payload),
    onSuccess: async () => {
      await invalidateLeaveTypeQueries(queryClient)
    },
  })
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: UpdateLeaveTypePayload
    }) => updateLeaveType(id, payload),
    onSuccess: async () => {
      await invalidateLeaveTypeQueries(queryClient)
    },
  })
}

export function useSoftDeleteLeaveType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => softDeleteLeaveType(id),
    onSuccess: async () => {
      await invalidateLeaveTypeQueries(queryClient)
    },
  })
}

export function useRestoreLeaveType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => restoreLeaveType(id),
    onSuccess: async () => {
      await invalidateLeaveTypeQueries(queryClient)
    },
  })
}
