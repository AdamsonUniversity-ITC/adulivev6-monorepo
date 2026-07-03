import { Outlet, createFileRoute } from "@tanstack/react-router"

import { requireDeveloperFeaturesAccess } from "@/lib/eleave-route-guards"

export const Route = createFileRoute("/employee-leave-credits")({
  beforeLoad: ({ context }) => requireDeveloperFeaturesAccess({ context }),
  component: EmployeeLeaveCreditsLayout,
})

function EmployeeLeaveCreditsLayout() {
  return <Outlet />
}
