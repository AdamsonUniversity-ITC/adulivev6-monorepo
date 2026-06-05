import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/reports/filed-leave')({
  component: FiledLeavePage,
})

function FiledLeavePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Filed Leave</h1>
      <p className="text-muted-foreground mt-2">Report of filed leave requests.</p>
    </div>
  )
}
