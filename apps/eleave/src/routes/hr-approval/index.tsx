import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/hr-approval/')({
  component: HrApprovalPage,
})

function HrApprovalPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">HR Approval</h1>
      <p className="text-muted-foreground mt-2">HR review and approval queue.</p>
    </div>
  )
}
