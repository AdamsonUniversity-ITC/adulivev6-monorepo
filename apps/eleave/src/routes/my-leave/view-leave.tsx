import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/my-leave/view-leave')({
  component: ShowLeavePage,
})

function ShowLeavePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Show Leave</h1>
      <p className="text-muted-foreground mt-2">View leave request details.</p>
    </div>
  )
}
