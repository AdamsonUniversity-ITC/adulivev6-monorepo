import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  fetchFlCutoffPreferences,
  updateFlCutoffPreferences,
  type UpdateFlCutoffPreferencePayload,
} from "@/lib/fl-cutoff-preferences-api"

export function useFlCutoffPreferences() {
  return useQuery({
    queryKey: ["fl-cutoff-preferences"],
    queryFn: fetchFlCutoffPreferences,
  })
}

export function useUpdateFlCutoffPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateFlCutoffPreferencePayload) =>
      updateFlCutoffPreferences(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["fl-cutoff-preferences"] })
    },
  })
}
