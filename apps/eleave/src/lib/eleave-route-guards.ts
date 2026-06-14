import { redirect } from "@tanstack/react-router"

import {
  canAccessAdminFeatures,
  canAccessForApproval,
  canAccessHrApproval,
} from "@/lib/eleave-access"
import { fetchMyEmployeeHrProfile } from "@/lib/employee-hr-profile-api"
import { fetchAuthUser } from "@/lib/fetch-auth-user"

export async function requireHrApprovalAccess(): Promise<void> {
  const authUser = (await fetchAuthUser()).data

  if (!canAccessHrApproval(authUser)) {
    throw redirect({ to: "/forbidden" })
  }
}

export async function requireAdminFeaturesAccess(): Promise<void> {
  const authUser = (await fetchAuthUser()).data

  if (!canAccessAdminFeatures(authUser)) {
    throw redirect({ to: "/forbidden" })
  }
}

export async function requireForApprovalAccess(): Promise<void> {
  const profile = await fetchMyEmployeeHrProfile()

  if (!canAccessForApproval(profile)) {
    throw redirect({ to: "/forbidden" })
  }
}
