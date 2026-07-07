import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/hr-approval")({
  component: HrApprovalLayout,
})

function HrApprovalLayout() {
  return <Outlet />
}
