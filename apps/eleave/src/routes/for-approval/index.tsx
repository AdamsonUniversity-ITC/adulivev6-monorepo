import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/for-approval/')({
  component: ForApprovalPage,
})

function ForApprovalPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">For Approval</h1>
      <p className="text-muted-foreground mt-2">
        Leave requests pending your approval.
      </p>
    </div>
  )
}
