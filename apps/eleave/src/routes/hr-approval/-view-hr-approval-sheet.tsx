import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table"
import { Textarea } from "@/components/ui/textarea"
import {
  getDayPortionLabel,
  isWholeDayPortion,
  SPLIT_DAY_PORTION_OPTIONS,
} from "@/lib/day-portion"
import { mapSlugToApiHrStatus, type HrApprovalStatus, getHrApprovalStatusMeta } from "@/lib/hr-approval-status"
import {
  getValidationErrorMessage,
  getValidationFieldErrors,
  submitHrApproval,
  type HrApprovalPayload,
  type PaginatedLeaveApplicationsResponse,
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
  mapHrApprovalDayDecisionToPayloadItem,
  mapLeaveApplicationsToHrApprovalRows,
  type HrApprovalDayDecision,
  type HrApprovalRow,
} from "@/lib/map-hr-approval-row"
import {
  HR_REMARK_OPTIONS,
  HR_REMARK_OTHERS_CODE,
  isHrRemarkOthers,
  normalizeHrRemarkCode,
  resolveHrRemarkDisplayText,
} from "@/lib/hr-remark-options"
import {
  flattenHrStatusesFromDayDecision,
  resolveOverallStatusFromHrDayStatuses,
} from "@/lib/resolve-hr-overall-status"
import type { DayPortion } from "@/routes/my-leave/leave-form/schema"
import { formatDateShort, formatLeaveDayCount } from "@/routes/my-leave/leave-form/utils"
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
import { cn } from "@/lib/utils"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet.js"

const leaveTypeSelectTriggerClassName = "h-9 w-40 max-w-full"
const approvalStatusSelectTriggerClassName = "h-9 w-44 max-w-full"
const dayPortionSelectTriggerClassName = "h-9 w-28 max-w-full"

const APPROVAL_STATUS_OPTIONS: { value: HrApprovalStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved_with_pay", label: "Approved With Pay" },
  { value: "approved_without_pay", label: "Approved Without Pay" },
  { value: "disapproved", label: "Disapproved" },
  { value: "cancelled", label: "Cancelled" },
]

const tableHeadClassName =
  "h-auto border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
const tableCellClassName = "border-b border-slate-200 px-3 py-3 align-top"

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

function getCommonApprovalStatus(
  dailyDraft: HrApprovalDayDecision[],
): HrApprovalStatus | null {
  const statuses: HrApprovalStatus[] = []

  for (const entry of dailyDraft) {
    statuses.push(entry.status1)
    if (entry.isSplit) {
      if (entry.status2 == null) {
        return null
      }
      statuses.push(entry.status2)
    }
  }

  if (statuses.length === 0) return null

  const firstStatus = statuses[0]
  if (!firstStatus) return null

  return statuses.every((status) => status === firstStatus) ? firstStatus : null
}

type ViewHrApprovalSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeRequest: HrApprovalRow | null
  onActiveRequestChange: (row: HrApprovalRow | null) => void
  leaveTypeNames: Map<number, string>
  leaveTypes: LeaveTypeRecord[]
  readOnly?: boolean
}

function ApprovalStatusSelect({
  value,
  onChange,
  allowEmpty = false,
  emptyLabel = "Select status",
}: {
  value: HrApprovalStatus | null
  onChange: (value: HrApprovalStatus | null) => void
  allowEmpty?: boolean
  emptyLabel?: string
}) {
  return (
    <Select
      value={value ?? undefined}
      onValueChange={(nextValue) => onChange(nextValue as HrApprovalStatus)}
    >
      <SelectTrigger className={approvalStatusSelectTriggerClassName}>
        <SelectValue placeholder={allowEmpty ? emptyLabel : "Pending"} />
      </SelectTrigger>
      <SelectContent>
        {APPROVAL_STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function LeaveTypeSelect({
  value,
  leaveTypes,
  onChange,
  allowEmpty: _allowEmpty = false,
  isLeaveTypeDisabled,
}: {
  value: number | null
  leaveTypes: LeaveTypeRecord[]
  onChange: (value: number | null) => void
  allowEmpty?: boolean
  isLeaveTypeDisabled?: (leaveType: LeaveTypeRecord) => boolean
}) {
  return (
    <Select
      value={value != null ? String(value) : undefined}
      onValueChange={(nextValue) => onChange(Number(nextValue))}
    >
      <SelectTrigger className={leaveTypeSelectTriggerClassName}>
        <SelectValue placeholder="Select leave type" />
      </SelectTrigger>
      <SelectContent>
        {leaveTypes.map((option) => (
          <SelectItem
            key={option.id}
            value={String(option.id)}
            disabled={isLeaveTypeDisabled?.(option) ?? false}
          >
            {option.leave_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DayPortionSelect({
  value,
  onChange,
}: {
  value: DayPortion | null
  onChange: (value: DayPortion | null) => void
}) {
  return (
    <Select
      value={value ?? undefined}
      onValueChange={(nextValue) => onChange(nextValue as DayPortion)}
    >
      <SelectTrigger className={dayPortionSelectTriggerClassName}>
        <SelectValue placeholder="Select portion" />
      </SelectTrigger>
      <SelectContent>
        {SPLIT_DAY_PORTION_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export const ViewHrApprovalSheet = ({
  open,
  onOpenChange,
  activeRequest,
  onActiveRequestChange,
  leaveTypeNames,
  leaveTypes,
  readOnly = false,
}: ViewHrApprovalSheetProps) => {
  const queryClient = useQueryClient()
  const [isApplyConfirmOpen, setIsApplyConfirmOpen] = React.useState(false)
  const [dailyDraft, setDailyDraft] = React.useState<HrApprovalDayDecision[]>([])
  const [hrRemarksCode, setHrRemarksCode] = React.useState<string>("")
  const [hrRemarksCustom, setHrRemarksCustom] = React.useState("")
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
      setHrRemarksCode("")
      setHrRemarksCustom("")
      setActionError(null)
    }
  }, [open])

  React.useEffect(() => {
    // Depends on `open` too: reopening the same row keeps the identical
    // activeRequest reference, so the draft would otherwise stay cleared.
    if (open && activeRequest) {
      setDailyDraft(activeRequest.dailyDecisions.map((entry) => ({ ...entry })))
      const savedCode = normalizeHrRemarkCode(activeRequest.record.hr_remarks_code) ?? ""
      setHrRemarksCode(savedCode)
      setHrRemarksCustom(
        savedCode === HR_REMARK_OTHERS_CODE
          ? (activeRequest.record.hr_remarks?.trim() ?? "")
          : "",
      )
      setIsApplyConfirmOpen(false)
      setActionError(null)
    }
  }, [open, activeRequest])

  const hrApprovalMutation = useMutation({
    mutationFn: async (payload: HrApprovalPayload) => submitHrApproval(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["hr-approval-leave-applications"],
      })
      await queryClient.invalidateQueries({
        queryKey: ["hr-approval-pending-count"],
      })
      await queryClient.refetchQueries({
        queryKey: ["hr-approval-leave-applications"],
      })

      const cachedQueries = queryClient.getQueriesData<PaginatedLeaveApplicationsResponse>({
        queryKey: ["hr-approval-leave-applications"],
      })

      let updatedRecord: PaginatedLeaveApplicationsResponse["data"][number] | undefined
      for (const [, data] of cachedQueries) {
        updatedRecord = data?.data.find(
          (record) => String(record.id) === activeRequest?.id,
        )
        if (updatedRecord) {
          break
        }
      }

      if (updatedRecord) {
        const refreshedRows = mapLeaveApplicationsToHrApprovalRows(
          [updatedRecord],
          leaveTypeNames,
        )
        onActiveRequestChange(refreshedRows[0] ?? null)
      } else {
        onActiveRequestChange(null)
      }

      setIsApplyConfirmOpen(false)
      setActionError(null)
      onOpenChange(false)
    },
    onError: (error) => {
      const fieldErrors = getValidationFieldErrors(error)
      const itemError = fieldErrors
        ? Object.entries(fieldErrors).find(([field]) =>
            field.startsWith("items.") ||
            field === "hr_remarks" ||
            field === "hr_remarks_code",
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

  const applyApprovalStatusToAll = (status: HrApprovalStatus) => {
    setDailyDraft((current) =>
      current.map((entry) => ({
        ...entry,
        status1: status,
        status2: entry.isSplit ? status : entry.status2,
      })),
    )
    setActionError(null)
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

  const hasApplicationHrRemarksChanged = (): boolean => {
    const savedCode = normalizeHrRemarkCode(activeRequest?.record.hr_remarks_code)
    const draftCode = normalizeHrRemarkCode(hrRemarksCode)

    if (savedCode !== draftCode) {
      return true
    }

    if (!isHrRemarkOthers(draftCode)) {
      return false
    }

    const savedText = activeRequest?.record.hr_remarks?.trim() ?? ""
    const draftText = hrRemarksCustom.trim()

    return savedText !== draftText
  }

  const buildPayload = (): HrApprovalPayload | null => {
    const applicationDatesById = new Map(
      (activeRequest?.record.leave_application_dates ?? []).map((applicationDate) => [
        applicationDate.id,
        applicationDate,
      ]),
    )

    const remarksDirty = hasApplicationHrRemarksChanged()
    let items = dailyDraft
      .map((entry) => {
        const applicationDate = applicationDatesById.get(entry.leaveApplicationDateId)

        if (!applicationDate) {
          return null
        }

        return mapChangedHrApprovalDayDecisionToPayloadItem(entry, applicationDate)
      })
      .filter((item): item is NonNullable<typeof item> => item != null)

    // Backend requires at least one day item; when only application remarks changed,
    // resubmit every current day decision so the save can proceed.
    if (items.length === 0 && remarksDirty) {
      items = dailyDraft
        .map((entry) => mapHrApprovalDayDecisionToPayloadItem(entry))
        .filter((item): item is NonNullable<typeof item> => item != null)
    }

    if (items.length === 0) {
      return null
    }

    const code = normalizeHrRemarkCode(hrRemarksCode)
    const custom = isHrRemarkOthers(code) ? hrRemarksCustom : null

    return {
      hr_remarks_code: code,
      hr_remarks: resolveHrRemarkDisplayText(code, custom),
      items,
    }
  }

  const validateDraft = (): string | null => {
    const applicationDatesById = new Map(
      (activeRequest?.record.leave_application_dates ?? []).map((applicationDate) => [
        applicationDate.id,
        applicationDate,
      ]),
    )

    const hasChangedDecision = dailyDraft.some((entry) => {
      const applicationDate = applicationDatesById.get(entry.leaveApplicationDateId)

      return (
        applicationDate != null &&
        hasHrApprovalDayDecisionChanged(entry, applicationDate)
      )
    })

    const remarksDirty = hasApplicationHrRemarksChanged()

    if (!hasChangedDecision && !remarksDirty) {
      return "No changes to apply. Update at least one day or HR remarks before saving."
    }

    if (isHrRemarkOthers(hrRemarksCode) && hrRemarksCustom.trim() === "") {
      return "Enter custom HR remarks when Others is selected."
    }

    for (const entry of dailyDraft) {
      if (!entry.isSplit) {
        continue
      }

      const applicationDate = applicationDatesById.get(entry.leaveApplicationDateId)
      if (
        applicationDate == null ||
        !hasHrApprovalDayDecisionChanged(entry, applicationDate)
      ) {
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

      if (entry.status2 == null) {
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
      setActionError("No changes to apply. Update at least one day or HR remarks before saving.")
      setIsApplyConfirmOpen(false)
      return
    }

    hrApprovalMutation.mutate(payload)
  }

  const requestApplyDailyChanges = () => {
    if (!activeRequest) return
    setActionError(null)

    const validationError = validateDraft()
    if (validationError) {
      setActionError(validationError)
      return
    }

    setIsApplyConfirmOpen(true)
  }

  const applicationDatesById = React.useMemo(
    () =>
      new Map(
        (activeRequest?.record.leave_application_dates ?? []).map(
          (applicationDate) => [applicationDate.id, applicationDate],
        ),
      ),
    [activeRequest?.record.leave_application_dates],
  )

  const hasDirtyDayChanges = dailyDraft.some((entry) => {
    const applicationDate = applicationDatesById.get(entry.leaveApplicationDateId)

    return (
      applicationDate != null &&
      hasHrApprovalDayDecisionChanged(entry, applicationDate)
    )
  })
  const hasDirtyChanges = hasDirtyDayChanges || hasApplicationHrRemarksChanged()

  const draftStatus = resolveOverallStatusFromHrDayStatuses(resolveDraftStatuses(dailyDraft))
  const displayStatus = readOnly ? (activeRequest?.status ?? "pending") : draftStatus
  const displayDecisions = readOnly
    ? (activeRequest?.dailyDecisions ?? [])
    : dailyDraft
  const showBulkApprovalStatus = !readOnly && dailyDraft.length >= 2
  const bulkApprovalStatus = showBulkApprovalStatus
    ? getCommonApprovalStatus(dailyDraft)
    : null

  const formatStatusLabel = (status: HrApprovalStatus | null | undefined) => {
    if (!status) {
      return "—"
    }

    return getHrApprovalStatusMeta(status).label
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl lg:max-w-7xl"
      >
        <SheetHeader className="shrink-0 border-b bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] pb-4">
          <SheetTitle className="text-lg">
            {readOnly ? "View Leave Details" : "View HR Approval"}
          </SheetTitle>
          <SheetDescription>
            {readOnly
              ? "Review filed leave request details and approval history."
              : "Review request details and update HR approval status."}
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

            <div className="grid grid-cols-1 gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Covered Dates
                </p>
                <p className="font-medium">
                  {activeRequest.dates}
                  <span className="text-muted-foreground text-xs">
                    {" "}
                    • {formatLeaveDayCount(activeRequest.days)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Leave Type
                </p>
                <p className="font-medium">
                  {summarizeLeaveType(displayDecisions) || activeRequest.leaveType}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Date Filed
                </p>
                <p className="font-medium">
                  {formatDateShort(activeRequest.record.date_filed)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Overall Status
                </p>
                <div className="pt-1">
                  <OverallStatusBadge status={displayStatus} />
                </div>
              </div>

              <div className="sm:col-span-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Reason for Leave
                </p>
                <p className="font-medium whitespace-pre-wrap">
                  {activeRequest.record.reason?.trim() || "—"}
                </p>
              </div>
              <div className="sm:col-span-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Address while on leave
                </p>
                <p className="font-medium whitespace-pre-wrap">
                  {activeRequest.record.address?.trim() || "—"}
                </p>
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
                {!readOnly ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={requestApplyDailyChanges}
                    disabled={!hasDirtyChanges || hrApprovalMutation.isPending}
                  >
                    Apply Daily Changes
                  </Button>
                ) : null}
              </div>

              {!readOnly && actionError ? (
                <p className="text-destructive mb-3 text-sm">{actionError}</p>
              ) : null}

              <div className="rounded-lg border border-slate-200">
                <Table className="min-w-[1180px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className={tableHeadClassName}>Date</TableHead>
                      <TableHead className={tableHeadClassName}>Split</TableHead>
                      <TableHead className={cn(tableHeadClassName, "w-36")}>
                        Day Portion
                      </TableHead>
                      <TableHead className={cn(tableHeadClassName, "w-40")}>
                        Leave Type
                      </TableHead>
                      <TableHead className={cn(tableHeadClassName, "w-44")}>
                        {showBulkApprovalStatus ? (
                          <div className="space-y-2 normal-case tracking-normal">
                            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Approval Status
                            </span>
                            <ApprovalStatusSelect
                              value={
                                bulkApprovalStatus === "pending"
                                  ? null
                                  : bulkApprovalStatus
                              }
                              allowEmpty
                              emptyLabel="Apply to all"
                              onChange={(nextStatus) => {
                                if (nextStatus) {
                                  applyApprovalStatusToAll(nextStatus)
                                }
                              }}
                            />
                          </div>
                        ) : (
                          "Approval Status"
                        )}
                      </TableHead>
                      <TableHead className={tableHeadClassName}>
                        HR Remarks
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {readOnly
                      ? displayDecisions.map((entry) => {
                          const rowSpan = entry.isSplit ? 2 : 1

                          return (
                            <React.Fragment key={entry.dayNumber}>
                              <TableRow className="hover:bg-transparent">
                                <TableCell
                                  rowSpan={rowSpan}
                                  className={cn(
                                    tableCellClassName,
                                    "text-sm font-semibold text-slate-700",
                                  )}
                                >
                                  {entry.actualDate}
                                </TableCell>
                                <TableCell
                                  rowSpan={rowSpan}
                                  className={cn(tableCellClassName, "text-sm")}
                                >
                                  {entry.isSplit ? "Split day" : "—"}
                                </TableCell>
                                <TableCell
                                  className={cn(tableCellClassName, "w-36 text-sm")}
                                >
                                  {entry.isSplit
                                    ? getDayPortionLabel(entry.approvedDayPortion1 ?? entry.requestedPortion)
                                    : getDayPortionLabel(entry.requestedPortion)}
                                </TableCell>
                                <TableCell
                                  className={cn(tableCellClassName, "w-40 text-sm")}
                                >
                                  {entry.leaveType1}
                                </TableCell>
                                <TableCell
                                  className={cn(tableCellClassName, "w-44 text-sm")}
                                >
                                  {formatStatusLabel(entry.status1)}
                                </TableCell>
                                <TableCell
                                  rowSpan={rowSpan}
                                  className={cn(
                                    tableCellClassName,
                                    "whitespace-pre-wrap text-sm",
                                  )}
                                >
                                  {entry.hrRemarks?.trim() || "—"}
                                </TableCell>
                              </TableRow>
                              {entry.isSplit ? (
                                <TableRow className="hover:bg-transparent">
                                  <TableCell
                                    className={cn(tableCellClassName, "w-36 text-sm")}
                                  >
                                    {getDayPortionLabel(entry.approvedDayPortion2 ?? entry.requestedPortion)}
                                  </TableCell>
                                  <TableCell
                                    className={cn(tableCellClassName, "w-40 text-sm")}
                                  >
                                    {entry.leaveType2 || "—"}
                                  </TableCell>
                                  <TableCell
                                    className={cn(tableCellClassName, "w-44 text-sm")}
                                  >
                                    {formatStatusLabel(entry.status2)}
                                  </TableCell>
                                </TableRow>
                              ) : null}
                            </React.Fragment>
                          )
                        })
                      : dailyDraft.map((entry) => {
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
                              <DayPortionSelect
                                value={value}
                                onChange={(nextPortion) => {
                                  updateEntry(entry.dayNumber, (current) => ({
                                    ...current,
                                    [portionField]: nextPortion,
                                  }))
                                }}
                              />
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
                          <TableRow className="hover:bg-transparent">
                            <TableCell
                              rowSpan={rowSpan}
                              className={cn(
                                tableCellClassName,
                                "text-sm font-semibold text-slate-700",
                              )}
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
                            </TableCell>
                            <TableCell
                              rowSpan={rowSpan}
                              className={tableCellClassName}
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
                            </TableCell>
                            <TableCell className={cn(tableCellClassName, "w-36")}>
                              {renderPortionControls("approvedDayPortion1", "Portion 1")}
                            </TableCell>
                            <TableCell className={cn(tableCellClassName, "w-40")}>
                              {renderLeaveTypeControls(1, "Portion 1")}
                            </TableCell>
                            <TableCell className={cn(tableCellClassName, "w-44")}>
                              {renderStatusControls(1, "Portion 1")}
                            </TableCell>
                            <TableCell
                              rowSpan={rowSpan}
                              className={cn(tableCellClassName, "whitespace-normal")}
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
                            </TableCell>
                          </TableRow>

                          {entry.isSplit ? (
                            <TableRow className="hover:bg-transparent">
                              <TableCell className={cn(tableCellClassName, "w-36")}>
                                {renderPortionControls("approvedDayPortion2", "Portion 2")}
                              </TableCell>
                              <TableCell className={cn(tableCellClassName, "w-40")}>
                                {renderLeaveTypeControls(2, "Portion 2")}
                              </TableCell>
                              <TableCell className={cn(tableCellClassName, "w-44")}>
                                {renderStatusControls(2, "Portion 2")}
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </React.Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  HR Remarks
                </p>
                {readOnly ? (
                  <p className="text-sm font-medium whitespace-pre-wrap">
                    {activeRequest.record.hr_remarks?.trim() || "—"}
                  </p>
                ) : (
                  <>
                    <Select
                      value={hrRemarksCode || undefined}
                      onValueChange={(value) => {
                        setHrRemarksCode(value)
                        if (!isHrRemarkOthers(value)) {
                          setHrRemarksCustom("")
                        }
                        setActionError(null)
                      }}
                    >
                      <SelectTrigger className="h-9 w-full max-w-xl rounded-lg border-slate-300 bg-background shadow-sm">
                        <SelectValue placeholder="Select HR remarks" />
                      </SelectTrigger>
                      <SelectContent>
                        {HR_REMARK_OPTIONS.map((option) => (
                          <SelectItem key={option.code} value={option.code}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isHrRemarkOthers(hrRemarksCode) ? (
                      <Textarea
                        value={hrRemarksCustom}
                        onChange={(event) => {
                          setHrRemarksCustom(event.target.value)
                          setActionError(null)
                        }}
                        placeholder="Enter custom HR remarks"
                        rows={3}
                        className="max-w-xl resize-y bg-background"
                      />
                    ) : null}
                  </>
                )}
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

            {isApplyConfirmOpen && !readOnly ? (
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
