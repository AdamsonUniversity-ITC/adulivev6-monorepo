import { Outlet, createFileRoute } from "@tanstack/react-router"

import { requireAdminFeaturesAccess } from "@/lib/eleave-route-guards"

export const Route = createFileRoute("/beginning-balances")({
  beforeLoad: () => requireAdminFeaturesAccess(),
  component: BeginningBalancesLayout,
})

function BeginningBalancesLayout() {
  return <Outlet />
}
