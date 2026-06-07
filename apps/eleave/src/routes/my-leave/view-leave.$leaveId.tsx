import { createFileRoute } from "@tanstack/react-router"

import { LeaveDetailView } from "./-leave-detail-view"

export const Route = createFileRoute("/my-leave/view-leave/$leaveId")({
  component: ViewLeavePage,
})

function ViewLeavePage() {
  const { leaveId } = Route.useParams()

  return <LeaveDetailView leaveId={leaveId} />
}
