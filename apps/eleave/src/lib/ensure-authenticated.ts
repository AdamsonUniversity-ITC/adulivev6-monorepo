import axios from "axios"
import type { QueryClient } from "@tanstack/react-query"
import { buildLoginUrl } from "@repo/axios-config"

import { authUserQueryOptions } from "@/lib/auth-queries"

export function redirectToLoginIfUnauthorized(error: unknown): boolean {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    window.location.assign(buildLoginUrl({ returnTo: window.location.href }))
    return true
  }

  return false
}

export async function ensureAuthenticated(queryClient: QueryClient): Promise<void> {
  try {
    await queryClient.ensureQueryData(authUserQueryOptions)
  } catch (error) {
    if (redirectToLoginIfUnauthorized(error)) {
      await new Promise<void>(() => {})
    }

    throw error
  }
}
