import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/employee-leave-credits")({
  component: EmployeeLeaveCreditsLayout,
})

function EmployeeLeaveCreditsLayout() {
  return <Outlet />
}
