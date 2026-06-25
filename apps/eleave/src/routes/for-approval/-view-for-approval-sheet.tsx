import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  getEmployeeAvatarUrl,
  getEmployeeDepartment,
  getEmployeeInitials,
} from "@/lib/employee-teacher-display"
import {
  getValidationErrorMessage,
  submitLeaveApplicationDecision,
  type LeaveApplicationDecisionPayload,
} from "@/lib/leave-applications-api"
import { type ForApprovalRow } from "@/lib/map-for-approval-row"
import { resolveViewerApprovalStatus } from "@/lib/resolve-viewer-approval-status"
import { SupportingDocumentsSection } from "@/components/shared/supporting-documents-section"
import { ForApprovalWorkflowTable } from "@/routes/for-approval/-for-approval-workflow-table"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet.js"

type PendingDecision = LeaveApplicationDecisionPayload["status"]

type ViewForApprovalSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeRequest: ForApprovalRow | null
  onActiveRequestChange: (row: ForApprovalRow | null) => void
  leaveTypeNames: Map<number, string>
  viewerEmpNo: string | null
}

export const ViewForApprovalSheet = ({
  open,
  onOpenChange,
  activeRequest,
  onActiveRequestChange,
  leaveTypeNames,
  viewerEmpNo,
}: ViewForApprovalSheetProps) => {
  const queryClient = useQueryClient()
  const [pendingDecision, setPendingDecision] =
    React.useState<PendingDecision | null>(null)
  const [remarks, setRemarks] = React.useState("")
  const [actionError, setActionError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setPendingDecision(null)
      setRemarks("")
      setActionError(null)
    }
  }, [open])

  React.useEffect(() => {
    setPendingDecision(null)
    setRemarks("")
    setActionError(null)
  }, [activeRequest?.id])

  const decisionMutation = useMutation({
    mutationFn: async ({
      leaveId,
      payload,
    }: {
      leaveId: string
      payload: LeaveApplicationDecisionPayload
    }) => submitLeaveApplicationDecision(leaveId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["for-approval-leave-applications"],
      })

      setPendingDecision(null)
      setRemarks("")
      setActionError(null)
      onActiveRequestChange(null)
      onOpenChange(false)
    },
    onError: (error) => {
      setActionError(
        getValidationErrorMessage(error) ??
          "Unable to update this leave request. Please try again.",
      )
    },
  })

  const requestDecision = (nextStatus: PendingDecision) => {
    if (nextStatus === "Disapproved" && remarks.trim() === "") {
      setActionError("Remarks is required when disapproving.")
      return
    }

    setPendingDecision(nextStatus)
    setActionError(null)
  }

  const isRemarksRequired = pendingDecision === "Disapproved"
  const canConfirm =
    !isRemarksRequired || remarks.trim() !== ""

  const confirmDecision = () => {
    if (!activeRequest || !pendingDecision) {
      return
    }

    if (pendingDecision === "Disapproved" && remarks.trim() === "") {
      setActionError("Remarks is required when disapproving.")
      return
    }

    decisionMutation.mutate({
      leaveId: activeRequest.id,
      payload: {
        status: pendingDecision,
        remarks: remarks.trim() || null,
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <SheetHeader className="shrink-0 border-b bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] pb-4">
          <SheetTitle className="text-lg">View For Approval</SheetTitle>
          <SheetDescription>
            Review leave details and update application status.
          </SheetDescription>
        </SheetHeader>

        {activeRequest ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-5 px-4 py-4 pb-6">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <Avatar className="size-10">
                    {getEmployeeAvatarUrl(activeRequest.record.employee_teacher) ? (
                      <AvatarImage
                        src={
                          getEmployeeAvatarUrl(
                            activeRequest.record.employee_teacher,
                          ) ?? undefined
                        }
                        alt={activeRequest.employeeName}
                      />
                    ) : null}
                    <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                      {getEmployeeInitials(activeRequest.record.employee_teacher)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">
                      {activeRequest.employeeName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                     {activeRequest.record.employee_no}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {getEmployeeDepartment(activeRequest.record.employee_teacher)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide">
                        Leave Type
                      </p>
                      <p className="font-medium">{activeRequest.leaveType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide">
                        Covered Dates
                      </p>
                      <p className="font-medium">
                        {activeRequest.dates}
                        <span className="text-muted-foreground text-xs">
                          {" "}
                          • {activeRequest.days} day
                          {activeRequest.days === 1 ? "" : "s"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">
                      Reason for Leave
                    </p>
                    <p className="font-medium whitespace-pre-wrap">
                      {activeRequest.record.reason?.trim() || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">
                      Address while on leave
                    </p>
                    <p className="font-medium whitespace-pre-wrap">
                      {activeRequest.record.address?.trim() || "—"}
                    </p>
                  </div>
                  </div>
                </div>

                <SupportingDocumentsSection
                  documents={activeRequest.record.supporting_documents}
                />

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <ForApprovalWorkflowTable record={activeRequest.record} />
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)]">
              <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
                Change Status
              </p>

              <Textarea
                value={remarks}
                onChange={(event) => {
                  setRemarks(event.target.value)
                  if (actionError) {
                    setActionError(null)
                  }
                }}
                placeholder={
                  pendingDecision === "Disapproved"
                    ? "Required remarks"
                    : "Optional remarks"
                }
                className="mb-3 min-h-20"
              />

              {actionError ? (
                <p className="text-destructive mb-3 text-sm">{actionError}</p>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  onClick={() => requestDecision("Approved")}
                  disabled={
                    resolveViewerApprovalStatus(
                      activeRequest.record,
                      viewerEmpNo,
                    ) === "approved" || decisionMutation.isPending
                  }
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => requestDecision("Disapproved")}
                  disabled={
                    resolveViewerApprovalStatus(
                      activeRequest.record,
                      viewerEmpNo,
                    ) === "disapproved" || decisionMutation.isPending
                  }
                >
                  Disapprove
                </Button>
              </div>

              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </div>

            {pendingDecision ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                  <h3 className="text-base font-semibold text-slate-900">
                    Confirm Status Change
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    Change this leave request to{" "}
                    <span className="font-semibold text-slate-900">
                      {pendingDecision}
                    </span>
                    ?
                  </p>

                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPendingDecision(null)}
                      disabled={decisionMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={confirmDecision}
                      disabled={decisionMutation.isPending || !canConfirm}
                    >
                      {decisionMutation.isPending ? "Saving..." : "Confirm"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
