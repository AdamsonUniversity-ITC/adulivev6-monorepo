import type { AxiosError } from "axios"

import { hrmdoSvc } from "@/lib/api"

type ValidationErrorResponse = {
  message?: string
  errors?: Record<string, string[]>
}

export type FlCutoffPreferenceRecord = {
  id: number
  school_year: string
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export type FlCutoffPreferenceResponse = {
  data: FlCutoffPreferenceRecord | null
  meta: {
    system_school_year: string | null
  }
}

export type UpdateFlCutoffPreferencePayload = {
  school_year: string
  start_date: string
  end_date: string
}

export async function fetchFlCutoffPreferences(): Promise<FlCutoffPreferenceResponse> {
  const response = await hrmdoSvc.get<FlCutoffPreferenceResponse>(
    "v1/fl-cutoff-preferences",
  )

  return response.data
}

export async function updateFlCutoffPreferences(
  payload: UpdateFlCutoffPreferencePayload,
): Promise<FlCutoffPreferenceResponse> {
  try {
    const response = await hrmdoSvc.put<FlCutoffPreferenceResponse>(
      "v1/fl-cutoff-preferences",
      payload,
    )

    return response.data
  } catch (error) {
    const axiosError = error as AxiosError<ValidationErrorResponse>
    const message =
      axiosError.response?.data?.message ??
      axiosError.response?.data?.errors?.school_year?.[0] ??
      "Failed to save FL cutoff preferences."

    throw new Error(message)
  }
}
