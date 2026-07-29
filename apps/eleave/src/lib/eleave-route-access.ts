import type { EmployeeHrProfile } from "@/lib/employee-hr-profile-api"
import {
  canAccessAdminFeatures,
  canAccessDeveloperFeatures,
  canAccessForApproval,
  canAccessHrApproval,
} from "@/lib/eleave-access"
import type { AuthUser } from "@/lib/fetch-auth-user"

// Single registry for restricted frontend routes.
// Change a route's tier here to promote/demote access (e.g. dev -> admin).
export const ELEAVE_ROUTE_ACCESS = {
  "/beginning-balances": "admin",
  "/employee-leave-credits": "admin",
  "/settings/fl-cutoff": "admin",
  "/reports/filed-leave": "admin",
  "/reports/filed-leave-after-cutoff": "admin",
  "/hr-approval": "hrApproval",
  "/for-approval": "forApproval",
} as const

export type EleaveRoutePath = keyof typeof ELEAVE_ROUTE_ACCESS
export type EleaveRouteAccessTier =
  (typeof ELEAVE_ROUTE_ACCESS)[EleaveRoutePath]

export const ELEAVE_DEV_ROUTES = (
  Object.entries(ELEAVE_ROUTE_ACCESS) as [EleaveRoutePath, EleaveRouteAccessTier][]
)
  .filter(([, tier]) => tier === "dev")
  .map(([route]) => route)

type RouteAccessContext = {
  user: AuthUser | undefined
  profile?: Pick<EmployeeHrProfile, "is_supervisor" | "is_manager"> | undefined
}

export function getEleaveRouteAccessTier(
  pathname: string,
): EleaveRouteAccessTier | null {
  for (const route of Object.keys(ELEAVE_ROUTE_ACCESS) as EleaveRoutePath[]) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return ELEAVE_ROUTE_ACCESS[route]
    }
  }

  return null
}

export function matchesEleaveRestrictedRoute(pathname: string): boolean {
  return getEleaveRouteAccessTier(pathname) !== null
}

export function matchesEleaveDevRoute(pathname: string): boolean {
  return getEleaveRouteAccessTier(pathname) === "dev"
}

export function routeRequiresHrProfile(pathname: string): boolean {
  return getEleaveRouteAccessTier(pathname) === "forApproval"
}

export function canAccessEleaveRoute(
  pathname: string,
  { user, profile }: RouteAccessContext,
): boolean {
  const tier = getEleaveRouteAccessTier(pathname)

  if (tier === null) {
    return true
  }

  switch (tier) {
    case "admin":
      return canAccessAdminFeatures(user)
    case "dev":
      return canAccessDeveloperFeatures(user)
    case "hrApproval":
      return canAccessHrApproval(user)
    case "forApproval":
      return canAccessForApproval(profile, user)
    default:
      return true
  }
}
