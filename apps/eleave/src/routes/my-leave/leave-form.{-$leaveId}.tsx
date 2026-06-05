import { createFileRoute } from '@tanstack/react-router'

import { LeaveForm } from './-leave-form'

export const Route = createFileRoute('/my-leave/leave-form/{-$leaveId}')({
  component: LeaveFormPage,
})

function LeaveFormPage() {
  const { leaveId } = Route.useParams()

  return (
    <LeaveForm mode={leaveId ? 'edit' : 'create'} leaveId={leaveId} />
  )
}
