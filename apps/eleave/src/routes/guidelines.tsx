import { createFileRoute } from "@tanstack/react-router"

import { useMyEmployeeHrProfile } from "@/hooks/use-employee-hr-profile"

import { GeneralGuidelines } from "./guidelines/-general-guidelines"
import { GuidelinesLoadingSkeleton } from "./guidelines/-guidelines-layout"
import { SilGuidelines } from "./guidelines/-sil-guidelines"

export const Route = createFileRoute("/guidelines")({
  component: GuidelinesPage,
})

function GuidelinesPage() {
  const { data: hrProfile, isLoading } = useMyEmployeeHrProfile()

  if (isLoading) {
    return <GuidelinesLoadingSkeleton />
  }

  if (hrProfile?.is_academic_contractual) {
    return <SilGuidelines />
  }

  return <GeneralGuidelines />
}
