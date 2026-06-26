import { Outlet, createFileRoute } from "@tanstack/react-router"

import { requireAdminFeaturesAccess } from "@/lib/eleave-route-guards"

export const Route = createFileRoute("/beginning-balances")({
  beforeLoad: ({ context }) => requireAdminFeaturesAccess({ context }),
  component: BeginningBalancesLayout,
})

function BeginningBalancesLayout() {
  return <Outlet />
}
