import { Button } from "@repo/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import { Eye } from "lucide-react"
import * as React from "react"

import {
  useApplicantFollowUpRemarks,
  useApplicantFollowUps,
} from "@/hooks/use-applicant-emails"

import { ApplicantFollowUpPreviewDialog } from "./-applicant-follow-up-preview-dialog"

type ApplicantFollowUpSectionProps = {
  leaveApplicationId: number
  applicantName: string
}

function formatSentAt(value: string | null): string {
  if (!value) {
    return "—"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function ApplicantFollowUpSection({
  leaveApplicationId,
  applicantName,
}: ApplicantFollowUpSectionProps) {
  const [selectedRemarkId, setSelectedRemarkId] = React.useState("")
  const [previewOpen, setPreviewOpen] = React.useState(false)

  const remarksQuery = useApplicantFollowUpRemarks({ active: true })
  const followUpsQuery = useApplicantFollowUps(leaveApplicationId)
  const remarks = remarksQuery.data ?? []
  const selectedRemark = remarks.find((remark) => String(remark.id) === selectedRemarkId) ?? null
  const followUps = followUpsQuery.data ?? []

  React.useEffect(() => {
    setSelectedRemarkId("")
    setPreviewOpen(false)
  }, [leaveApplicationId])

  return (
    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
        Follow-up email to applicant
      </p>
      <p className="text-muted-foreground text-xs">
        Sends the selected remark to the applicant by email. This does not change the
        leave's status or the HR Remarks above.
      </p>

      {remarksQuery.isLoading ? (
        <p className="text-muted-foreground text-xs">Loading follow-up remarks…</p>
      ) : remarksQuery.isError ? (
        <p className="text-destructive text-xs">Could not load follow-up remarks.</p>
      ) : remarks.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          No active follow-up remarks. An HR Admin can add them in Settings → Applicant
          Emails.
        </p>
      ) : null}

      <div className="flex max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          value={selectedRemarkId || undefined}
          onValueChange={setSelectedRemarkId}
          disabled={remarks.length === 0}
        >
          <SelectTrigger
            aria-label="Follow-up remark"
            className="h-9 w-full rounded-lg border-slate-300 bg-background shadow-sm"
          >
            <SelectValue placeholder="Select a follow-up remark" />
          </SelectTrigger>
          <SelectContent>
            {remarks.map((remark) => (
              <SelectItem key={remark.id} value={String(remark.id)}>
                {remark.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          disabled={!selectedRemark}
          onClick={() => setPreviewOpen(true)}
        >
          <Eye className="size-4" />
          Preview and send
        </Button>
      </div>

      {selectedRemark ? (
        <p className="max-w-xl rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm">
          {selectedRemark.text}
        </p>
      ) : null}

      {followUps.length > 0 ? (
        <ul className="max-w-xl space-y-1.5 pt-1">
          {followUps.map((send) => (
            <li key={send.id} className="text-muted-foreground text-xs">
              <span className="font-medium text-slate-700" title={send.remark_text}>
                {send.remark_label}
              </span>
              {" · "}
              {formatSentAt(send.created_at)}
              {" · to "}
              {send.recipient_email}
              {send.sent_by_name || send.sent_by
                ? ` · by ${send.sent_by_name ?? send.sent_by}`
                : ""}
            </li>
          ))}
        </ul>
      ) : null}

      <ApplicantFollowUpPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        leaveApplicationId={leaveApplicationId}
        applicantName={applicantName}
        remark={selectedRemark}
        onSent={() => setSelectedRemarkId("")}
      />
    </div>
  )
}
