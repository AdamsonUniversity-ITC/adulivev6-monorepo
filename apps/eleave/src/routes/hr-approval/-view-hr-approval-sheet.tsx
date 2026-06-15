import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  getDayPortionLabel,
  isWholeDayPortion,
  SPLIT_DAY_PORTION_OPTIONS,
} from "@/lib/day-portion"
import { mapSlugToApiHrStatus, type HrApprovalStatus } from "@/lib/hr-approval-status"
import {
  fetchHrApprovalLeaveApplications,
  getValidationErrorMessage,
  getValidationFieldErrors,
  submitHrApproval,
  type HrApprovalPayload,
} from "@/lib/leave-applications-api"
import {
  getEmployeeAvatarUrl,
  getEmployeeInitials,
} from "@/lib/employee-teacher-display"
import type { LeaveTypeRecord } from "@/lib/leave-types-api"
import {
  canSplitLeaveDayDecision,
  hasHrApprovalDayDecisionChanged,
  mapChangedHrApprovalDayDecisionToPayloadItem,
  mapLeaveApplicationsToHrApprovalRows,
  type HrApprovalDayDecision,
  type HrApprovalRow,
} from "@/lib/map-hr-approval-row"
import {
  flattenHrStatusesFromDayDecision,
  resolveOverallStatusFromHrDayStatuses,
} from "@/lib/resolve-hr-overall-status"
import type { DayPortion } from "@/routes/my-leave/leave-form/schema"
import { OverallStatusBadge } from "@/routes/my-leave/-leave-status-badge"
import { ForApprovalWorkflowTable } from "@/routes/for-approval/-for-approval-workflow-table"
import { OtherInformationSection } from "@/components/shared/other-information-section"
import { SupportingDocumentsSection } from "@/components/shared/supporting-documents-section"
import { useLeaveBalances } from "@/hooks/use-leave-balances"
import {
  canApproveVlWithPay,
  getVlCredits,
  requiredPortionWeight,
  shouldWarnInsufficientVlCredits,
} from "@/lib/hr-approval-vl-eligibility"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet.js"

const leaveTypeSelectClassName =
  "h-9 w-40 max-w-full rounded-lg border border-slate-300 bg-background px-2.5 text-sm shadow-sm transition-colors focus:border-primary"

const approvalStatusSelectClassName =
  "h-9 w-44 max-w-full rounded-lg border border-slate-300 bg-background px-2.5 text-sm shadow-sm transition-colors focus:border-primary"

const dayPortionSelectClassName =
  "h-9 w-28 max-w-full rounded-lg border border-slate-300 bg-background px-2.5 text-sm shadow-sm transition-colors focus:border-primary"

function summarizeLeaveType(decisions: HrApprovalDayDecision[]): string {
  const labels = decisions.flatMap((entry) => {
    const types = [entry.leaveType1]
    if (entry.isSplit) {
      types.push(entry.leaveType2)
    }
    return types
  })

  if (labels.length === 0) return "-"

  const unique = [...new Set(labels)]
  return unique.length === 1 ? unique[0]! : "Multiple Leave Types"
}

function resolveDraftStatuses(dailyDraft: HrApprovalDayDecision[]): string[] {
  return dailyDraft.flatMap((entry) =>
    flattenHrStatusesFromDayDecision(entry, (status) =>
      mapSlugToApiHrStatus(status as HrApprovalStatus),
    ),
  )
}

type ViewHrApprovalSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeRequest: HrApprovalRow | null
  onActiveRequestChange: (row: HrApprovalRow | null) => void
  leaveTypeNames: Map<number, string>
  leaveTypes: LeaveTypeRecord[]
}

function ApprovalStatusSelect({
  value,
  onChange,
  allowEmpty = false,
}: {
  value: HrApprovalStatus | null
  onChange: (value: HrApprovalStatus | null) => void
  allowEmpty?: boolean
}) {
  return (
    <select
      value={value ?? (allowEmpty ? "" : "pending")}
      onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextValue = event.target.value
        onChange(
          nextValue === ""
            ? null
            : (nextValue as HrApprovalStatus),
        )
      }}
      className={approvalStatusSelectClassName}
    >
      {allowEmpty ? (
        <option value="" disabled>
          Select status
        </option>
      ) : null}
      <option value="pending">Pending</option>
      <option value="approved_with_pay">Approved With Pay</option>
      <option value="approved_without_pay">Approved Without Pay</option>
      <option value="disapproved">Disapproved</option>
      <option value="cancelled">Cancelled</option>
    </select>
  )
}

function LeaveTypeSelect({
  value,
  leaveTypes,
  onChange,
  allowEmpty = false,
  isLeaveTypeDisabled,
}: {
  value: number | null
  leaveTypes: LeaveTypeRecord[]
  onChange: (value: number | null) => void
  allowEmpty?: boolean
  isLeaveTypeDisabled?: (leaveType: LeaveTypeRecord) => boolean
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextValue = event.target.value
        onChange(nextValue ? Number(nextValue) : null)
      }}
      className={leaveTypeSelectClassName}
    >
      {allowEmpty ? (
        <option value="" disabled>
          Select leave type
        </option>
      ) : null}
      {leaveTypes.map((option) => (
        <option
          key={option.id}
          value={option.id}
          disabled={isLeaveTypeDisabled?.(option) ?? false}
        >
          {option.leave_name}
        </option>
      ))}
    </select>
  )
}

export const ViewHrApprovalSheet = ({
  open,
  onOpenChange,
  activeRequest,
  onActiveRequestChange,
  leaveTypeNames,
  leaveTypes,
}: ViewHrApprovalSheetProps) => {
  const queryClient = useQueryClient()
  const [isApplyConfirmOpen, setIsApplyConfirmOpen] = React.useState(false)
  const [dailyDraft, setDailyDraft] = React.useState<HrApprovalDayDecision[]>([])
  const [actionError, setActionError] = React.useState<string | null>(null)
  const {
    data: leaveBalances = [],
    isLoading: isLeaveBalancesLoading,
    isError: isLeaveBalancesError,
  } = useLeaveBalances(activeRequest?.record.employee_no ?? null)

  const leaveBalanceRows = React.useMemo(
    () =>
      leaveBalances.map((balance) => ({
        leave_code: balance.leave_code,
        leave_type: balance.leave_type,
        credits: balance.credits,
        pending_filed_leave: balance.pending_filed_leave,
      })),
    [leaveBalances],
  )

  const vlCredits = React.useMemo(() => getVlCredits(leaveBalances), [leaveBalances])

  React.useEffect(() => {
    if (!open) {
      setIsApplyConfirmOpen(false)
      setDailyDraft([])
      setActionError(null)
    }
  }, [open])

  React.useEffect(() => {
    if (activeRequest) {
      setDailyDraft(activeRequest.dailyDecisions.map((entry) => ({ ...entry })))
      setIsApplyConfirmOpen(false)
      setActionError(null)
    }
  }, [activeRequest])

  const hrApprovalMutation = useMutation({
    mutationFn: async (payload: HrApprovalPayload) => submitHrApproval(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["hr-approval-leave-applications"],
      })

      const refreshed = await queryClient.fetchQuery({
        queryKey: ["hr-approval-leave-applications", 100],
        queryFn: () =>
          fetchHrApprovalLeaveApplications({ per_page: 100, page: 1 }),
      })
      const refreshedRows = mapLeaveApplicationsToHrApprovalRows(
        refreshed.data ?? [],
        leaveTypeNames,
      )
      const updatedRow =
        refreshedRows.find((row) => row.id === activeRequest?.id) ?? null

      onActiveRequestChange(updatedRow)
      setIsApplyConfirmOpen(false)
      setActionError(null)
    },
    onError: (error) => {
      const fieldErrors = getValidationFieldErrors(error)
      const itemError = fieldErrors
        ? Object.entries(fieldErrors).find(([field]) =>
            field.startsWith("items."),
          )?.[1]
        : null

      setActionError(
        itemError ??
          getValidationErrorMessage(error) ??
          "Unable to apply HR approval changes. Please try again.",
      )
      setIsApplyConfirmOpen(false)
    },
  })

  const updateEntry = (
    dayNumber: number,
    updater: (entry: HrApprovalDayDecision) => HrApprovalDayDecision,
  ) => {
    setDailyDraft((current) =>
      current.map((entry) =>
        entry.dayNumber === dayNumber ? updater(entry) : entry,
      ),
    )
  }

  const toggleSplit = (dayNumber: number, checked: boolean) => {
    updateEntry(dayNumber, (entry) => {
      if (!isWholeDayPortion(entry.requestedPortion)) {
        return entry
      }

      if (!checked) {
        return {
          ...entry,
          isSplit: false,
          approvedDayPortion1: entry.requestedPortion,
          approvedDayPortion2: null,
          leaveTypeId2: null,
          leaveType2: entry.leaveType1,
          status2: null,
        }
      }

      return {
        ...entry,
        isSplit: true,
        approvedDayPortion1: isWholeDayPortion(entry.approvedDayPortion1 ?? entry.requestedPortion)
          ? null
          : entry.approvedDayPortion1,
        approvedDayPortion2: null,
        leaveTypeId2: null,
        leaveType2: "",
        status2: null,
      }
    })
  }

  const buildPayload = (): HrApprovalPayload | null => {
    const applicationDatesById = new Map(
      (activeRequest?.record.leave_application_dates ?? []).map((applicationDate) => [
        applicationDate.id,
        applicationDate,
      ]),
    )

    const items = dailyDraft
      .map((entry) => {
        const applicationDate = applicationDatesById.get(entry.leaveApplicationDateId)

        if (!applicationDate) {
          return null
        }

        return mapChangedHrApprovalDayDecisionToPayloadItem(entry, applicationDate)
      })
      .filter((item): item is NonNullable<typeof item> => item != null)

    if (items.length === 0) {
      return null
    }

    return { items }
  }

  const hasSubmittingDecision = (entry: HrApprovalDayDecision): boolean => {
    if (entry.isSplit) {
      return (
        entry.status1 !== "pending" ||
        (entry.status2 != null && entry.status2 !== "pending")
      )
    }

    return entry.status1 !== "pending"
  }

  const validateDraft = (): string | null => {
    const applicationDatesById = new Map(
      (activeRequest?.record.leave_application_dates ?? []).map((applicationDate) => [
        applicationDate.id,
        applicationDate,
      ]),
    )
    const hasDecision = dailyDraft.some(hasSubmittingDecision)

    if (!hasDecision) {
      return "Set an approval status for at least one day before applying changes."
    }

    const hasChangedDecision = dailyDraft.some((entry) => {
      const applicationDate = applicationDatesById.get(entry.leaveApplicationDateId)

      return (
        applicationDate != null &&
        hasHrApprovalDayDecisionChanged(entry, applicationDate)
      )
    })

    if (!hasChangedDecision) {
      return "No changes to apply. Update at least one day before saving."
    }

    for (const entry of dailyDraft) {
      if (!entry.isSplit || !hasSubmittingDecision(entry)) {
        continue
      }

      if (
        !entry.approvedDayPortion1 ||
        !entry.approvedDayPortion2 ||
        entry.approvedDayPortion1 === entry.approvedDayPortion2 ||
        isWholeDayPortion(entry.approvedDayPortion1) ||
        isWholeDayPortion(entry.approvedDayPortion2)
      ) {
        return `Select different half-day portions for ${entry.actualDate}.`
      }

      if (
        entry.status1 === "pending" ||
        entry.status2 == null ||
        entry.status2 === "pending"
      ) {
        return `Set approval status for both split portions on ${entry.actualDate}.`
      }

      if (!entry.leaveTypeId1 || !entry.leaveTypeId2) {
        return `Select leave types for both split portions on ${entry.actualDate}.`
      }
    }

    return null
  }

  const applyDailyChanges = () => {
    const validationError = validateDraft()
    if (validationError) {
      setActionError(validationError)
      setIsApplyConfirmOpen(false)
      return
    }

    const payload = buildPayload()
    if (!payload) {
      setActionError("No changes to apply. Update at least one day before saving.")
      setIsApplyConfirmOpen(false)
      return
    }

    hrApprovalMutation.mutate(payload)
  }

  const requestApplyDailyChanges = () => {
    if (!activeRequest) return
    setActionError(null)
    setIsApplyConfirmOpen(true)
  }

  const draftStatus = resolveOverallStatusFromHrDayStatuses(resolveDraftStatuses(dailyDraft))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl lg:max-w-7xl"
      >
        <SheetHeader className="shrink-0 border-b bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] pb-4">
          <SheetTitle className="text-lg">View HR Approval</SheetTitle>
          <SheetDescription>
            Review request details and update HR approval status.
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
                      getEmployeeAvatarUrl(activeRequest.record.employee_teacher) ??
                      undefined
                    }
                    alt={activeRequest.employee}
                  />
                ) : null}
                <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                  {getEmployeeInitials(activeRequest.record.employee_teacher)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{activeRequest.employee}</p>
                <p className="text-muted-foreground text-xs">
                  {/* Request #{activeRequest.id} */}
                  {activeRequest.record.employee_no}
                </p>
              <p className="text-muted-foreground text-xs">{activeRequest.department}</p>
              </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
              <div className="grid grid-cols-3 gap-3">
              <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Covered Dates
                  </p>
                  <p className="font-medium">{activeRequest.dates}<span className="text-muted-foreground text-xs"> • {activeRequest.days} day{activeRequest.days === 1 ? "" : "s"}</span></p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Leave Type
                  </p>
                  <p className="font-medium">
                    {summarizeLeaveType(dailyDraft) || activeRequest.leaveType}
                  </p>
                </div>
                <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Overall Status
                </p>
                <div className="pt-1">
                  <OverallStatusBadge status={draftStatus} />
                </div>
              </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
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

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  Daily Decisions
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={requestApplyDailyChanges}
                  disabled={hrApprovalMutation.isPending}
                >
                  Apply Daily Changes
                </Button>
              </div>

              {actionError ? (
                <p className="text-destructive mb-3 text-sm">{actionError}</p>
              ) : null}

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-[1180px] w-full border-separate border-spacing-0">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border-b border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Date
                      </th>
                      <th className="border-b border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Split
                      </th>
                      <th className="w-36 border-b border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Day Portion
                      </th>
                      <th className="w-40 border-b border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Leave Type
                      </th>
                      <th className="w-44 border-b border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Approval Status
                      </th>
                      <th className="border-b border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        HR Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyDraft.map((entry) => {
                      const canSplit = canSplitLeaveDayDecision(entry)
                      const rowSpan = entry.isSplit ? 2 : 1

                      const renderPortionControls = (
                        portionField: "approvedDayPortion1" | "approvedDayPortion2",
                        portionLabel: string,
                      ) => {
                        if (entry.isSplit) {
                          const value = entry[portionField] as DayPortion | null
                          return (
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                {portionLabel}
                              </p>
                              <select
                                value={value ?? ""}
                                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                                  const nextPortion = event.target.value
                                  updateEntry(entry.dayNumber, (current) => ({
                                    ...current,
                                    [portionField]:
                                      nextPortion === ""
                                        ? null
                                        : (nextPortion as DayPortion),
                                  }))
                                }}
                                className={dayPortionSelectClassName}
                              >
                                <option value="" disabled>
                                  Select portion
                                </option>
                                {SPLIT_DAY_PORTION_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )
                        }

                        return (
                          <p className="text-sm font-medium text-slate-700">
                            {getDayPortionLabel(entry.requestedPortion)}
                          </p>
                        )
                      }

                      const renderLeaveTypeControls = (
                        portion: 1 | 2,
                        portionLabel: string,
                      ) => {
                        const leaveTypeId =
                          portion === 1 ? entry.leaveTypeId1 : entry.leaveTypeId2
                        const status = portion === 1 ? entry.status1 : entry.status2
                        const disableVl =
                          status === "approved_with_pay" &&
                          !canApproveVlWithPay(
                            vlCredits,
                            requiredPortionWeight(entry, portion),
                          )

                        return (
                          <div className="space-y-1">
                            {entry.isSplit ? (
                              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                {portionLabel}
                              </p>
                            ) : null}
                            <LeaveTypeSelect
                              value={leaveTypeId}
                              leaveTypes={leaveTypes}
                              allowEmpty={entry.isSplit && portion === 2}
                              isLeaveTypeDisabled={(leaveType) =>
                                leaveType.leave_code === "vl" && disableVl
                              }
                              onChange={(nextValue) => {
                                updateEntry(entry.dayNumber, (current) => {
                                  if (portion === 1) {
                                    return {
                                      ...current,
                                      leaveTypeId1: nextValue,
                                      leaveType1:
                                        nextValue != null
                                          ? (leaveTypeNames.get(nextValue) ??
                                            current.leaveType1)
                                          : current.leaveType1,
                                    }
                                  }

                                  return {
                                    ...current,
                                    leaveTypeId2: nextValue,
                                    leaveType2:
                                      nextValue != null
                                        ? (leaveTypeNames.get(nextValue) ??
                                          current.leaveType2)
                                        : current.leaveType2,
                                  }
                                })
                              }}
                            />
                          </div>
                        )
                      }

                      const renderStatusControls = (
                        portion: 1 | 2,
                        portionLabel: string,
                      ) => {
                        const status = portion === 1 ? entry.status1 : entry.status2

                        return (
                          <div className="space-y-1">
                            {entry.isSplit ? (
                              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                {portionLabel}
                              </p>
                            ) : null}
                            <ApprovalStatusSelect
                              value={status}
                              allowEmpty={entry.isSplit && portion === 2}
                              onChange={(nextStatus) => {
                                updateEntry(entry.dayNumber, (current) =>
                                  portion === 1
                                    ? {
                                        ...current,
                                        status1: nextStatus ?? "pending",
                                      }
                                    : { ...current, status2: nextStatus },
                                )
                              }}
                            />
                          </div>
                        )
                      }

                      return (
                        <React.Fragment key={entry.dayNumber}>
                          <tr className="align-top">
                            <td
                              rowSpan={rowSpan}
                              className="border-b border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700"
                            >
                              {entry.actualDate}
                              {shouldWarnInsufficientVlCredits(
                                entry.status1,
                                entry.leaveTypeId1,
                                leaveTypes,
                                vlCredits,
                                requiredPortionWeight(entry, 1),
                              ) ||
                              (entry.isSplit &&
                                shouldWarnInsufficientVlCredits(
                                  entry.status2,
                                  entry.leaveTypeId2,
                                  leaveTypes,
                                  vlCredits,
                                  requiredPortionWeight(entry, 2),
                                )) ? (
                                <p className="mt-1 text-xs font-normal text-amber-700">
                                  Insufficient VL credits.
                                </p>
                              ) : null}
                            </td>
                            <td
                              rowSpan={rowSpan}
                              className="border-b border-slate-200 px-3 py-3"
                            >
                              {canSplit ? (
                                <label className="inline-flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={entry.isSplit}
                                    onChange={(event) =>
                                      toggleSplit(entry.dayNumber, event.target.checked)
                                    }
                                    className="size-4 rounded border-slate-300"
                                  />
                                  Split day
                                </label>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                            <td className="w-36 border-b border-slate-200 px-3 py-3">
                              {renderPortionControls("approvedDayPortion1", "Portion 1")}
                            </td>
                            <td className="w-40 border-b border-slate-200 px-3 py-3">
                              {renderLeaveTypeControls(1, "Portion 1")}
                            </td>
                            <td className="w-44 border-b border-slate-200 px-3 py-3">
                              {renderStatusControls(1, "Portion 1")}
                            </td>
                            <td
                              rowSpan={rowSpan}
                              className="border-b border-slate-200 px-3 py-3"
                            >
                              <textarea
                                value={entry.hrRemarks}
                                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                                  updateEntry(entry.dayNumber, (current) => ({
                                    ...current,
                                    hrRemarks: event.target.value,
                                  }))
                                }
                                placeholder="Add HR remarks for this day"
                                rows={entry.isSplit ? 4 : 1}
                                className="min-h-9 w-full resize-none rounded-lg border border-slate-300 bg-background px-2.5 py-2 text-sm shadow-sm transition-colors focus:border-primary"
                              />
                            </td>
                          </tr>

                          {entry.isSplit ? (
                            <tr className="align-top">
                              <td className="w-36 border-b border-slate-200 px-3 py-3">
                                {renderPortionControls("approvedDayPortion2", "Portion 2")}
                              </td>
                              <td className="w-40 border-b border-slate-200 px-3 py-3">
                                {renderLeaveTypeControls(2, "Portion 2")}
                              </td>
                              <td className="w-44 border-b border-slate-200 px-3 py-3">
                                {renderStatusControls(2, "Portion 2")}
                              </td>
                            </tr>
                          ) : null}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <OtherInformationSection
              employeeNo={activeRequest.record.employee_no}
              leaveBalanceRows={leaveBalanceRows}
              isLeaveBalancesLoading={isLeaveBalancesLoading}
              isLeaveBalancesError={isLeaveBalancesError}
            />

              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)]">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsApplyConfirmOpen(false)
                    onOpenChange(false)
                  }}
                >
                  Close
                </Button>
              </div>
            </div>

            {isApplyConfirmOpen ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                  <h3 className="text-base font-semibold text-slate-900">
                    Confirm Apply Changes
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    Apply all per-day leave type and approval status updates for
                    this request?
                  </p>

                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsApplyConfirmOpen(false)}
                      disabled={hrApprovalMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={applyDailyChanges}
                      disabled={hrApprovalMutation.isPending}
                    >
                      {hrApprovalMutation.isPending ? "Applying..." : "Confirm"}
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
