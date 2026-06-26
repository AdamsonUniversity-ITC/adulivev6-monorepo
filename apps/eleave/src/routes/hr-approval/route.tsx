import { Outlet, createFileRoute } from "@tanstack/react-router"

import { requireHrApprovalAccess } from "@/lib/eleave-route-guards"

export const Route = createFileRoute("/hr-approval")({
  beforeLoad: ({ context }) => requireHrApprovalAccess({ context }),
  component: HrApprovalLayout,
})

function HrApprovalLayout() {
  return <Outlet />
}
