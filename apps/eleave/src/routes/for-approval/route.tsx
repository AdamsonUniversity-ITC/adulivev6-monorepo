import { Outlet, createFileRoute } from "@tanstack/react-router"

import { requireForApprovalAccess } from "@/lib/eleave-route-guards"

export const Route = createFileRoute("/for-approval")({
  beforeLoad: ({ context }) => requireForApprovalAccess({ context }),
  component: ForApprovalLayout,
})

function ForApprovalLayout() {
  return <Outlet />
}
