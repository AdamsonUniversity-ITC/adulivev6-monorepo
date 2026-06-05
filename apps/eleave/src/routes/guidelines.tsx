import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/guidelines')({
  component: GuidelinesPage,
})

function GuidelinesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Guidelines</h1>
      <p className="text-muted-foreground mt-2">Leave policies and guidelines.</p>
    </div>
  )
}
