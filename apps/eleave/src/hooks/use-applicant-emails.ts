import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createApplicantFollowUpRemark,
  deleteApplicantFollowUpRemark,
  fetchApplicantFollowUpRemarks,
  fetchApplicantFollowUps,
  previewApplicantFollowUp,
  previewApplicantFollowUpRemark,
  sendApplicantFollowUp,
  updateApplicantFollowUpRemark,
  type ApplicantFollowUpPayload,
  type ApplicantFollowUpRemarkPayload,
} from "@/lib/applicant-emails-api"

const FOLLOW_UPS_KEY = ["applicant-followups"] as const
const FOLLOW_UP_REMARKS_KEY = ["applicant-followup-remarks"] as const

export function useApplicantFollowUpRemarks(options?: { active?: boolean; enabled?: boolean }) {
  const active = options?.active ?? false

  return useQuery({
    queryKey: [...FOLLOW_UP_REMARKS_KEY, { active }],
    queryFn: () => fetchApplicantFollowUpRemarks({ active }),
    enabled: options?.enabled ?? true,
  })
}

export function useCreateApplicantFollowUpRemark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ApplicantFollowUpRemarkPayload) => createApplicantFollowUpRemark(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FOLLOW_UP_REMARKS_KEY })
    },
  })
}

export function useUpdateApplicantFollowUpRemark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ApplicantFollowUpRemarkPayload }) =>
      updateApplicantFollowUpRemark(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FOLLOW_UP_REMARKS_KEY })
    },
  })
}

export function useDeleteApplicantFollowUpRemark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteApplicantFollowUpRemark(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FOLLOW_UP_REMARKS_KEY })
    },
  })
}

export function useApplicantFollowUps(
  leaveApplicationId: number | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...FOLLOW_UPS_KEY, leaveApplicationId],
    queryFn: () => fetchApplicantFollowUps(leaveApplicationId!),
    enabled: leaveApplicationId != null && (options?.enabled ?? true),
  })
}

/**
 * Keeps the last rendered email on screen while the next one loads, so the preview does not
 * flash empty on every pause in typing.
 */
export function useApplicantFollowUpPreview(
  leaveApplicationId: number | null,
  payload: ApplicantFollowUpPayload | null,
) {
  return useQuery({
    queryKey: ["applicant-followup-preview", leaveApplicationId, payload],
    queryFn: () => previewApplicantFollowUp(leaveApplicationId!, payload!),
    enabled: leaveApplicationId != null && payload != null,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useApplicantFollowUpRemarkPreview(text: string | null) {
  return useQuery({
    queryKey: ["applicant-followup-remark-preview", text],
    queryFn: () => previewApplicantFollowUpRemark(text!),
    enabled: text != null,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useSendApplicantFollowUp(leaveApplicationId: number | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ApplicantFollowUpPayload) =>
      sendApplicantFollowUp(leaveApplicationId!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...FOLLOW_UPS_KEY, leaveApplicationId],
      })
    },
  })
}
