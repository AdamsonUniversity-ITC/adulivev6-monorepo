import { redirect } from "@tanstack/react-router"

import {
  authUserQueryOptions,
  myHrProfileQueryOptions,
} from "@/lib/auth-queries"
import {
  canAccessAdminFeatures,
  canAccessDeveloperFeatures,
  canAccessForApproval,
  canAccessHrApproval,
} from "@/lib/eleave-access"
import { redirectToLoginIfUnauthorized } from "@/lib/ensure-authenticated"
import type { RouterContext } from "@/routes/__root"

type GuardContext = {
  context: RouterContext
}

export async function requireHrApprovalAccess({
  context,
}: GuardContext): Promise<void> {
  const authUser = await context.queryClient.ensureQueryData(authUserQueryOptions)

  if (!canAccessHrApproval(authUser)) {
    throw redirect({ to: "/forbidden" })
  }
}

export async function requireAdminFeaturesAccess({
  context,
}: GuardContext): Promise<void> {
  const authUser = await context.queryClient.ensureQueryData(authUserQueryOptions)

  if (!canAccessAdminFeatures(authUser)) {
    throw redirect({ to: "/forbidden" })
  }
}

export async function requireDeveloperFeaturesAccess({
  context,
}: GuardContext): Promise<void> {
  const authUser = await context.queryClient.ensureQueryData(authUserQueryOptions)

  if (!canAccessDeveloperFeatures(authUser)) {
    throw redirect({ to: "/forbidden" })
  }
}

export async function requireForApprovalAccess({
  context,
}: GuardContext): Promise<void> {
  try {
    const [authUser, profile] = await Promise.all([
      context.queryClient.ensureQueryData(authUserQueryOptions),
      context.queryClient.ensureQueryData(myHrProfileQueryOptions),
    ])

    if (!canAccessForApproval(profile, authUser)) {
      throw redirect({ to: "/forbidden" })
    }
  } catch (error) {
    if (redirectToLoginIfUnauthorized(error)) {
      await new Promise<void>(() => {})
    }

    throw error
  }
}
