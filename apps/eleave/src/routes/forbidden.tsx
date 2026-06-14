import { Button } from "@repo/ui/components/button"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ShieldX } from "lucide-react"

export const Route = createFileRoute("/forbidden")({
  component: ForbiddenPage,
})

function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="bg-muted text-muted-foreground mb-6 flex size-16 items-center justify-center rounded-2xl">
        <ShieldX className="size-8" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Access denied
      </h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm sm:text-base">
        You do not have permission to view this page. Contact HRMDO if you
        believe this is an error.
      </p>
      <Button asChild className="mt-8">
        <Link to="/my-leave">Back to My Leave</Link>
      </Button>
    </div>
  )
}
