import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/settings/applicant-emails")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/follow-up-remarks", replace: true })
  },
})
