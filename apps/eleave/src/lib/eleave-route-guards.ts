import { redirect } from "@tanstack/react-router"

import {
  canAccessAdminFeatures,
  canAccessForApproval,
  canAccessHrApproval,
} from "@/lib/eleave-access"
import { ensureAuthenticated, redirectToLoginIfUnauthorized } from "@/lib/ensure-authenticated"
import { fetchMyEmployeeHrProfile } from "@/lib/employee-hr-profile-api"
import { fetchAuthUser } from "@/lib/fetch-auth-user"

export async function requireHrApprovalAccess(): Promise<void> {
  await ensureAuthenticated()

  const authUser = (await fetchAuthUser()).data

  if (!canAccessHrApproval(authUser)) {
    throw redirect({ to: "/forbidden" })
  }
}

export async function requireAdminFeaturesAccess(): Promise<void> {
  await ensureAuthenticated()

  const authUser = (await fetchAuthUser()).data

  if (!canAccessAdminFeatures(authUser)) {
    throw redirect({ to: "/forbidden" })
  }
}

export async function requireForApprovalAccess(): Promise<void> {
  await ensureAuthenticated()

  try {
    const profile = await fetchMyEmployeeHrProfile()

    if (!canAccessForApproval(profile)) {
      throw redirect({ to: "/forbidden" })
    }
  } catch (error) {
    if (redirectToLoginIfUnauthorized(error)) {
      await new Promise<void>(() => {})
    }

    throw error
  }
}
