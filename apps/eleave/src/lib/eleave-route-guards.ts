import { redirect } from "@tanstack/react-router"

import {
  authUserQueryOptions,
  myHrProfileQueryOptions,
} from "@/lib/auth-queries"
import {
  canAccessAdminFeatures,
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

export async function requireForApprovalAccess({
  context,
}: GuardContext): Promise<void> {
  try {
    const profile = await context.queryClient.ensureQueryData(
      myHrProfileQueryOptions,
    )

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
