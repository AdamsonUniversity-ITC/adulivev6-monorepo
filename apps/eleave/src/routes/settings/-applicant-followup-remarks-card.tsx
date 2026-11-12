import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog"
import { Badge } from "@repo/ui/components/badge"
import { Button } from "@repo/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table"
import { toast } from "@repo/ui/exports"
import { MessageSquareText, Pencil, Plus, Trash2 } from "lucide-react"
import * as React from "react"

import {
  useApplicantFollowUpRemarks,
  useDeleteApplicantFollowUpRemark,
  useUpdateApplicantFollowUpRemark,
} from "@/hooks/use-applicant-emails"
import type { ApplicantFollowUpRemarkRecord } from "@/lib/applicant-emails-api"
import { getValidationErrorMessage } from "@/lib/leave-applications-api"

import { ApplicantFollowUpRemarkFormDialog } from "./-applicant-followup-remark-form-dialog"

type ApplicantFollowUpRemarksCardProps = {
  canEdit: boolean
}

export function ApplicantFollowUpRemarksCard({ canEdit }: ApplicantFollowUpRemarksCardProps) {
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ApplicantFollowUpRemarkRecord | null>(null)
  const [deleting, setDeleting] = React.useState<ApplicantFollowUpRemarkRecord | null>(null)

  const { data, isLoading, isError } = useApplicantFollowUpRemarks()
  const deleteMutation = useDeleteApplicantFollowUpRemark()
  const updateMutation = useUpdateApplicantFollowUpRemark()
  const remarks = data ?? []
  const nextDisplayOrder =
    remarks.reduce((highest, remark) => Math.max(highest, remark.display_order), 0) + 1

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (record: ApplicantFollowUpRemarkRecord) => {
    setEditing(record)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleting) {
      return
    }

    try {
      await deleteMutation.mutateAsync(deleting.id)
      toast.success("Follow-up remark deleted.")
      setDeleting(null)
    } catch (error) {
      toast.error(getValidationErrorMessage(error) ?? "Could not delete this remark.")
    }
  }

  const handleDeactivate = async () => {
    if (!deleting) {
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: deleting.id,
        payload: {
          label: deleting.label,
          text: deleting.text,
          display_order: deleting.display_order,
          is_active: false,
        },
      })
      toast.success("Follow-up remark deactivated.")
      setDeleting(null)
    } catch (error) {
      toast.error(getValidationErrorMessage(error) ?? "Could not deactivate this remark.")
    }
  }

  const dialogPending = deleteMutation.isPending || updateMutation.isPending

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
              <MessageSquareText className="size-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Follow-up remarks</CardTitle>
              <CardDescription>
                The choices in “Follow-up email to applicant” on the HR Approval sheet. The
                selected remark is emailed with the leave details and payroll schedule.
                {canEdit ? null : " Only HR Admin can change these."}
              </CardDescription>
            </div>
          </div>
          {canEdit ? (
            <Button type="button" className="shrink-0" onClick={openCreate}>
              <Plus className="size-4" />
              New remark
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-0 py-0">
        {isLoading ? (
          <p className="text-muted-foreground p-6 text-sm">Loading remarks…</p>
        ) : isError ? (
          <p className="text-destructive p-6 text-sm">Could not load follow-up remarks.</p>
        ) : remarks.length === 0 ? (
          <p className="text-muted-foreground p-6 text-sm">
            No follow-up remarks yet.
            {canEdit ? " Create one so HR can send follow-ups." : ""}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Order</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Remark</TableHead>
                <TableHead>Status</TableHead>
                {canEdit ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {remarks.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {row.display_order}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{row.label}</TableCell>
                  <TableCell
                    className="text-muted-foreground max-w-md truncate text-sm"
                    title={row.text}
                  >
                    {row.text}
                  </TableCell>
                  <TableCell>
                    {row.is_active ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  {canEdit ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(row)}
                          aria-label={`Edit ${row.label}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleting(row)}
                          aria-label={`Delete ${row.label}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {canEdit ? (
        <>
          <ApplicantFollowUpRemarkFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            record={editing}
            nextDisplayOrder={nextDisplayOrder}
          />

          <AlertDialog
            open={deleting != null}
            onOpenChange={(open) => {
              if (!open && !dialogPending) {
                setDeleting(null)
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this follow-up remark?</AlertDialogTitle>
                <AlertDialogDescription>
                  {deleting
                    ? `“${deleting.label}” will be removed from the dropdown. Follow-ups already sent keep their copy of the text.${
                        deleting.is_active
                          ? " To hide it but keep it for later, deactivate it instead."
                          : ""
                      }`
                    : null}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={dialogPending}>Cancel</AlertDialogCancel>
                {deleting?.is_active ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={dialogPending}
                    onClick={() => void handleDeactivate()}
                  >
                    Deactivate
                  </Button>
                ) : null}
                <AlertDialogAction
                  disabled={dialogPending}
                  onClick={(event) => {
                    event.preventDefault()
                    void handleDelete()
                  }}
                >
                  {deleteMutation.isPending ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </Card>
  )
}
