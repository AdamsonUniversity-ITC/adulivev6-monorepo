import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@repo/ui/exports"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  cancelLeaveApplication,
  getValidationErrorMessage,
} from "@/lib/leave-applications-api"

type CancelLeaveDialogProps = {
  leaveId: string | null
  leaveLabel?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancelled?: () => void
}

export function CancelLeaveDialog({
  leaveId,
  leaveLabel,
  open,
  onOpenChange,
  onCancelled,
}: CancelLeaveDialogProps) {
  const queryClient = useQueryClient()
  const [reason, setReason] = React.useState("")

  React.useEffect(() => {
    if (!open) {
      setReason("")
    }
  }, [open])

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!leaveId) {
        throw new Error("Missing leave application id.")
      }

      const trimmed = reason.trim()
      return cancelLeaveApplication(leaveId, {
        cancellation_reason: trimmed !== "" ? trimmed : null,
      })
    },
    onSuccess: async () => {
      toast.success("Leave request cancelled.")
      await queryClient.invalidateQueries({ queryKey: ["my-leave-applications"] })
      await queryClient.invalidateQueries({ queryKey: ["leave-balances"] })
      onOpenChange(false)
      onCancelled?.()
    },
    onError: (error) => {
      toast.error(
        getValidationErrorMessage(error) ??
          "Unable to cancel this leave request. Please try again.",
      )
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel leave request?</AlertDialogTitle>
          <AlertDialogDescription>
            This will immediately cancel
            {leaveLabel ? ` ${leaveLabel}` : " this leave request"}. You can only
            cancel while Approver 1, Approver 2, and HR are still Pending.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-1">
          <Label htmlFor="cancellation-reason">
            Reason <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="cancellation-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why are you cancelling?"
            rows={3}
            disabled={cancelMutation.isPending}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelMutation.isPending}>
            Keep request
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={cancelMutation.isPending || !leaveId}
            onClick={(event) => {
              event.preventDefault()
              cancelMutation.mutate()
            }}
          >
            {cancelMutation.isPending ? "Cancelling…" : "Cancel request"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
