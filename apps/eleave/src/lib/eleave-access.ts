import type { EmployeeHrProfile } from "@/lib/employee-hr-profile-api"
import type { AuthUser } from "@/lib/fetch-auth-user"

export const ELEAVE_PERMISSIONS = {
  adminApproval: "eleave-admin-approval-access",
  rankAndFileApproval: "eleave-rank-and-file-approval-access",
  hrAdmin: "eleave-hr-admin-access",
  dev: "eleave-dev-access",
} as const

export function hasAnyPermission(
  user: AuthUser | undefined,
  ...names: string[]
): boolean {
  const permissions = user?.permissions ?? []

  return names.some((name) => permissions.includes(name))
}

export function canAccessHrApproval(user: AuthUser | undefined): boolean {
  return hasAnyPermission(
    user,
    ELEAVE_PERMISSIONS.adminApproval,
    ELEAVE_PERMISSIONS.rankAndFileApproval,
    ELEAVE_PERMISSIONS.dev,
  )
}

export function canAccessAdminFeatures(user: AuthUser | undefined): boolean {
  return hasAnyPermission(
    user,
    ELEAVE_PERMISSIONS.hrAdmin,
    ELEAVE_PERMISSIONS.dev,
  )
}

export function canAccessForApproval(
  profile: Pick<EmployeeHrProfile, "is_supervisor" | "is_manager"> | undefined,
): boolean {
  return Boolean(profile?.is_supervisor || profile?.is_manager)
}
