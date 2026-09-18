import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog"
import { Button } from "@repo/ui/components/button"
import { Printer } from "lucide-react"
import * as React from "react"

type ConfirmReportPrintedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending?: boolean
  onConfirm: () => void
}

export function ConfirmReportPrintedDialog({
  open,
  onOpenChange,
  isPending = false,
  onConfirm,
}: ConfirmReportPrintedDialogProps) {
  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (isPending && !nextOpen) {
        return
      }

      onOpenChange(nextOpen)
    },
    [isPending, onOpenChange],
  )

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="print:hidden">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Printer aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>Did you print this report?</AlertDialogTitle>
          <AlertDialogDescription>
            Choose Yes only if you sent it to the printer. If you only previewed
            or cancelled, choose No so this range is not marked printed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            No, just previewed
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={isPending}
            className="focus-visible:ring-2"
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
          >
            {isPending ? "Saving…" : "Yes, mark as printed"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
