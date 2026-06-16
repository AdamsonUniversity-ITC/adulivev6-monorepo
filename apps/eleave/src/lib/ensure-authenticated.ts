import axios from "axios"
import { authSvc, buildLoginUrl } from "@repo/axios-config"

export function redirectToLoginIfUnauthorized(error: unknown): boolean {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    window.location.assign(buildLoginUrl({ returnTo: window.location.href }))
    return true
  }

  return false
}

export async function ensureAuthenticated(): Promise<void> {
  try {
    await authSvc.get("user")
  } catch (error) {
    if (redirectToLoginIfUnauthorized(error)) {
      await new Promise<void>(() => {})
    }

    throw error
  }
}
