import { createFileRoute } from "@tanstack/react-router"

import { useAuthUser } from "@/hooks/use-auth-user"
import { canAccessAdminFeatures } from "@/lib/eleave-access"

import { ApplicantFollowUpRemarksCard } from "./-applicant-followup-remarks-card"

export const Route = createFileRoute("/settings/follow-up-remarks")({
  component: FollowUpRemarksPage,
})

function FollowUpRemarksPage() {
  const { data: authUser } = useAuthUser()
  const canEditFollowUpRemarks = canAccessAdminFeatures(authUser)

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-indigo-200/80 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_55%),linear-gradient(90deg,_#eef2ff_0%,_#ffffff_100%)] p-4 sm:p-5">
        <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-900 shadow-sm">
          Settings
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Follow-up Remarks
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
          Remarks HR can choose when emailing a leave applicant from HR Approval. HR previews
          the full email before sending and can adjust the remark for that one email.
        </p>
      </div>

      <ApplicantFollowUpRemarksCard canEdit={canEditFollowUpRemarks} />
    </div>
  )
}
