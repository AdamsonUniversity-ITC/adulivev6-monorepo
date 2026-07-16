import { env } from "@repo/axios-config/env"

function normalizeBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "")

  return trimmed ? trimmed : null
}

export function resolveHrmdoPortalUrl(): string | null {
  const base =
    normalizeBaseUrl(import.meta.env.VITE_ADU_LIVE_URL) ??
    normalizeBaseUrl(env.aduLive)

  if (!base) {
    return null
  }

  return `${base}/hrmdo`
}
