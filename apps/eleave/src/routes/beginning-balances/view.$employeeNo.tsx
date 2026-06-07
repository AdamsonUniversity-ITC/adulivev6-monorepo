import { createFileRoute } from "@tanstack/react-router"

import { BeginningBalanceDetailView } from "./-beginning-balance-detail-view"

export const Route = createFileRoute("/beginning-balances/view/$employeeNo")({
  component: ViewBeginningBalancePage,
})

function ViewBeginningBalancePage() {
  const { employeeNo } = Route.useParams()

  return <BeginningBalanceDetailView employeeNo={employeeNo} />
}
