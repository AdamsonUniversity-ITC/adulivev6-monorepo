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
import { createFileRoute } from "@tanstack/react-router"
import {
  ListOrdered,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react"
import * as React from "react"

import {
  useAdminLeaveTypes,
  useRestoreLeaveType,
  useSoftDeleteLeaveType,
} from "@/hooks/use-admin-leave-types"
import {
  getFilingTimingLabel,
  getLeaveTypeValidationErrorMessage,
  type LeaveTypeRecord,
} from "@/lib/leave-types-api"

import { LeaveTypeFormDialog } from "./-leave-type-form-dialog"

export const Route = createFileRoute("/settings/leave-types")({
  component: LeaveTypesSettingsPage,
})

function LeaveTypesSettingsPage() {
  const [showTrashed, setShowTrashed] = React.useState(false)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<LeaveTypeRecord | null>(null)
  const [deleting, setDeleting] = React.useState<LeaveTypeRecord | null>(null)

  const { data: leaveTypes = [], isLoading, isError } = useAdminLeaveTypes({
    trashed: showTrashed,
  })
  const softDeleteMutation = useSoftDeleteLeaveType()
  const restoreMutation = useRestoreLeaveType()

  const openCreate = React.useCallback(() => {
    setEditing(null)
    setFormOpen(true)
  }, [])

  const openEdit = React.useCallback((record: LeaveTypeRecord) => {
    setEditing(record)
    setFormOpen(true)
  }, [])

  const handleSoftDelete = React.useCallback(async () => {
    if (!deleting) {
      return
    }

    try {
      await softDeleteMutation.mutateAsync(deleting.id)
      toast.success("Leave type removed from the list.")
      setDeleting(null)
    } catch (error) {
      toast.error(
        getLeaveTypeValidationErrorMessage(error) ??
          "Could not remove this leave type.",
      )
    }
  }, [deleting, softDeleteMutation])

  const handleRestore = React.useCallback(
    async (record: LeaveTypeRecord) => {
      try {
        await restoreMutation.mutateAsync(record.id)
        toast.success("Leave type restored.")
      } catch (error) {
        toast.error(
          getLeaveTypeValidationErrorMessage(error) ??
            "Could not restore this leave type.",
        )
      }
    },
    [restoreMutation],
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-indigo-200/80 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_55%),linear-gradient(90deg,_#eef2ff_0%,_#ffffff_100%)] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-900 shadow-sm">
            Settings
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Leave Types
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
            Set up leave names, when employees may file, list order, and limits.
            Removing a leave type hides it from new applications but keeps past
            records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={showTrashed ? "default" : "outline"}
            onClick={() => setShowTrashed((value) => !value)}
          >
            {showTrashed ? "Showing removed" : "Show removed"}
          </Button>
          {!showTrashed ? (
            <Button type="button" size="lg" className="shadow-sm" onClick={openCreate}>
              <Plus className="size-4" />
              Add leave type
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
              <ListOrdered className="size-4" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {showTrashed ? "Removed leave types" : "Leave types"}
              </CardTitle>
              <CardDescription>
                {showTrashed
                  ? "Restore a leave type to make it available again."
                  : "Turn off “Available for filing” to hide a type temporarily. Remove it to hide it fully while keeping history."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {isLoading ? (
            <p className="text-muted-foreground p-6 text-sm">Loading leave types…</p>
          ) : isError ? (
            <p className="text-destructive p-6 text-sm">
              Could not load leave types.
            </p>
          ) : leaveTypes.length === 0 ? (
            <p className="text-muted-foreground p-6 text-sm">
              {showTrashed
                ? "No removed leave types."
                : "No leave types yet. Add one to get started."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>When to file</TableHead>
                  <TableHead className="text-right">Days in advance</TableHead>
                  <TableHead className="text-right">List order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Balance check</TableHead>
                  <TableHead>Dependent care</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveTypes.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs uppercase">
                      {row.leave_code}
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{row.leave_name}</p>
                        {row.description ? (
                          <p className="text-muted-foreground line-clamp-1 text-xs">
                            {row.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {getFilingTimingLabel(row.filing_timing)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {row.required_lead_days}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {row.display_order}
                    </TableCell>
                    <TableCell>
                      {showTrashed ? (
                        <Badge variant="secondary">Removed</Badge>
                      ) : row.is_active ? (
                        <Badge>Available</Badge>
                      ) : (
                        <Badge variant="outline">Hidden</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.requires_apply_credit_check ? (
                        <Badge variant="secondary">On</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Off</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.enforces_dependent_care_limit ? (
                        <Badge variant="secondary">
                          {row.dependent_care_yearly_limit ?? "—"}/year
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Off</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {showTrashed ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={restoreMutation.isPending}
                            onClick={() => void handleRestore(row)}
                          >
                            <RotateCcw className="size-3.5" />
                            Restore
                          </Button>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(row)}
                              aria-label={`Edit ${row.leave_name}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleting(row)}
                              aria-label={`Remove ${row.leave_name}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LeaveTypeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
      />

      <AlertDialog
        open={deleting != null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this leave type?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `${deleting.leave_name} (${deleting.leave_code}) will no longer appear when employees apply. Past applications are kept, and you can restore this leave type later.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={softDeleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={softDeleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                void handleSoftDelete()
              }}
            >
              {softDeleteMutation.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
