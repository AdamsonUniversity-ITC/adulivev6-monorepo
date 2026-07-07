import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/for-approval")({
  component: ForApprovalLayout,
})

function ForApprovalLayout() {
  return <Outlet />
}
