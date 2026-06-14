import { Outlet, createFileRoute } from "@tanstack/react-router"

import { requireHrApprovalAccess } from "@/lib/eleave-route-guards"

export const Route = createFileRoute("/hr-approval")({
  beforeLoad: () => requireHrApprovalAccess(),
  component: HrApprovalLayout,
})

function HrApprovalLayout() {
  return <Outlet />
}
