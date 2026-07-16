import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/beginning-balances")({
  component: BeginningBalancesLayout,
})

function BeginningBalancesLayout() {
  return <Outlet />
}
