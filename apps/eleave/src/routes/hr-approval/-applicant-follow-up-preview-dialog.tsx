import { Button } from "@repo/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { Label } from "@repo/ui/components/label"
import { Textarea } from "@repo/ui/components/textarea"
import { toast } from "@repo/ui/exports"
import { AlertTriangle, Mail, RotateCcw } from "lucide-react"
import * as React from "react"

import { EmailPreviewFrame } from "@/components/email-preview-frame"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useApplicantFollowUpPreview, useSendApplicantFollowUp } from "@/hooks/use-applicant-emails"
import {
  FOLLOW_UP_REMARK_TEXT_MAX_LENGTH,
  type ApplicantFollowUpRemarkRecord,
} from "@/lib/applicant-emails-api"
import { getValidationErrorMessage, getValidationFieldErrors } from "@/lib/leave-applications-api"

const PREVIEW_DEBOUNCE_MS = 400

type ApplicantFollowUpPreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  leaveApplicationId: number
  applicantName: string
  remark: ApplicantFollowUpRemarkRecord | null
  onSent: () => void
}

export function ApplicantFollowUpPreviewDialog({
  open,
  onOpenChange,
  leaveApplicationId,
  applicantName,
  remark,
  onSent,
}: ApplicantFollowUpPreviewDialogProps) {
  const [remarkText, setRemarkText] = React.useState("")
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})

  const remarkId = remark?.id ?? null
  const savedRemarkText = remark?.text ?? ""

  React.useEffect(() => {
    if (open && remarkId != null) {
      setRemarkText(savedRemarkText)
      setFieldErrors({})
    }
  }, [open, remarkId, savedRemarkText])

  const trimmedText = remarkText.trim()
  const textTooLong = trimmedText.length > FOLLOW_UP_REMARK_TEXT_MAX_LENGTH
  const debouncedText = useDebouncedValue(trimmedText, PREVIEW_DEBOUNCE_MS)
  const isEdited = remark != null && trimmedText !== savedRemarkText.trim()

  const previewPayload =
    open &&
    remark &&
    debouncedText !== "" &&
    debouncedText.length <= FOLLOW_UP_REMARK_TEXT_MAX_LENGTH
      ? { remark_id: remark.id, remark_text: debouncedText }
      : null

  const previewQuery = useApplicantFollowUpPreview(open ? leaveApplicationId : null, previewPayload)
  const sendMutation = useSendApplicantFollowUp(leaveApplicationId)

  const preview = previewQuery.data
  const recipientEmail = preview?.recipient_email ?? null
  const previewIsCurrent =
    previewPayload != null &&
    debouncedText === trimmedText &&
    !previewQuery.isFetching &&
    !previewQuery.isError &&
    preview != null

  const previewUpdating =
    previewPayload != null && (previewQuery.isFetching || debouncedText !== trimmedText)

  const remarkError =
    trimmedText === ""
      ? "Enter the remark to send."
      : textTooLong
        ? `The remark may not be longer than ${FOLLOW_UP_REMARK_TEXT_MAX_LENGTH} characters.`
        : (fieldErrors.remark_text ?? fieldErrors.remark_id ?? fieldErrors.email ?? null)

  const sendBlockedReason = sendMutation.isPending
    ? null
    : remarkError != null
      ? "Fix the remark above before sending."
      : previewQuery.isError
        ? "The preview could not load, so the email cannot be sent yet."
        : !previewIsCurrent
          ? "Waiting for the preview to finish updating."
          : recipientEmail == null
            ? "This applicant has no email address on file."
            : null

  const canSend = remark != null && sendBlockedReason == null && !sendMutation.isPending

  const handleSend = async () => {
    if (!canSend || remark == null) {
      return
    }

    setFieldErrors({})

    try {
      await sendMutation.mutateAsync({
        remark_id: remark.id,
        remark_text: trimmedText,
      })
      toast.success(`Follow-up email queued for ${applicantName}.`)
      onSent()
      onOpenChange(false)
    } catch (error) {
      setFieldErrors(getValidationFieldErrors(error) ?? {})
      toast.error(getValidationErrorMessage(error) ?? "Could not send the follow-up email.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!sendMutation.isPending) {
          onOpenChange(nextOpen)
        }
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-4" />
            Preview follow-up email
          </DialogTitle>
          <DialogDescription>
            Check the email {applicantName} will receive. You can adjust the remark for this email
            only; the saved remark in Settings stays the same.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-1 text-sm sm:grid-cols-[5rem_1fr]">
            <span className="text-muted-foreground">To</span>
            <span className="font-medium break-all">
              {preview ? (recipientEmail ?? "No email address on file") : "…"}
            </span>
            <span className="text-muted-foreground">Subject</span>
            <span className="font-medium">{preview?.subject ?? "…"}</span>
          </div>
          {preview && recipientEmail == null ? (
            <p className="flex items-center gap-1.5 text-xs text-amber-700">
              <AlertTriangle className="size-3.5" />
              This applicant has no valid email address on file, so the email cannot be sent.
            </p>
          ) : null}
          {fieldErrors.recipient ? (
            <p className="text-destructive text-xs">{fieldErrors.recipient}</p>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="applicant-follow-up-remark-text">
                HR Remarks{remark ? ` · ${remark.label}` : ""}
              </Label>
              {isEdited ? (
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  className="h-7 px-1"
                  disabled={sendMutation.isPending}
                  onClick={() => setRemarkText(savedRemarkText)}
                >
                  <RotateCcw />
                  Reset to saved remark
                </Button>
              ) : null}
            </div>
            <Textarea
              id="applicant-follow-up-remark-text"
              rows={4}
              value={remarkText}
              disabled={sendMutation.isPending}
              aria-invalid={remarkError != null}
              aria-describedby="applicant-follow-up-remark-hint"
              onChange={(event) => setRemarkText(event.target.value)}
            />
            <p
              id="applicant-follow-up-remark-hint"
              className={remarkError ? "text-destructive text-xs" : "text-muted-foreground text-xs"}
            >
              {remarkError ??
                `${isEdited ? "Edited for this email only." : "Using the saved remark."} ${trimmedText.length}/${FOLLOW_UP_REMARK_TEXT_MAX_LENGTH} characters.`}
            </p>
          </div>

          <EmailPreviewFrame
            title="Follow-up email preview"
            html={preview?.html}
            isCurrent={previewIsCurrent}
            isUpdating={previewUpdating}
            errorMessage={
              previewQuery.isError
                ? (getValidationErrorMessage(previewQuery.error) ??
                  "Could not load the email preview.")
                : null
            }
          />
        </div>

        <DialogFooter className="sm:items-center">
          {sendBlockedReason ? (
            <p
              id="applicant-follow-up-send-blocked"
              className="text-muted-foreground text-xs sm:mr-auto"
            >
              {sendBlockedReason}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={sendMutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSend}
            aria-describedby={sendBlockedReason ? "applicant-follow-up-send-blocked" : undefined}
            onClick={() => void handleSend()}
          >
            {sendMutation.isPending ? "Sending…" : "Send email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
