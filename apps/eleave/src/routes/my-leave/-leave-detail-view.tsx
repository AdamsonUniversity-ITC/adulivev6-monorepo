import { Link } from "@tanstack/react-router"
import { format, parseISO } from "date-fns"
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  Clock,
  FileText,
  Hash,
  MapPin,
  Pencil,
  Sun,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { useState, type ReactNode } from "react"

import { SupportingDocumentsSection } from "@/components/shared/supporting-documents-section"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLeaveApplication } from "@/hooks/use-leave-application"
import { useLeaveTypes } from "@/hooks/use-leave-types"
import {
  mapApiDayPortion,
  mapDayPortionToApiLabel,
  resolveDisplayDayPortion,
} from "@/lib/day-portion"
import { isLeaveApplicationPendingOnly } from "@/lib/is-leave-application-pending-only"
import type { LeaveApplicationRecord } from "@/lib/leave-applications-api"
import { resolveApproverOrHrWorkflowStatus } from "@/lib/resolve-approver-or-hr-workflow-status"
import { resolveHrApprovalSummary } from "@/lib/resolve-hr-approval-summary"
import { resolveLeaveDaysFromRecord } from "@/lib/resolve-leave-days-from-record"
import { cn } from "@/lib/utils"

import { CancelLeaveDialog } from "./-cancel-leave-dialog"
import { LeaveApprovalStep } from "./-leave-approval-step"
import {
  CancelStatusBadge,
  HrApprovalStatusBadge,
  OverallStatusBadge,
  PendingStatusBadge,
} from "./-leave-status-badge"
import {
  coerceCancelStatus,
  coerceOverallStatus,
} from "./-leave-status"
import type { DayPortion } from "./leave-form/schema"
import {
  formatDateRange,
  formatLeaveDay,
  getDayPortionLabel,
} from "./leave-form/utils"

const PORTION_STYLES: Record<DayPortion, string> = {
  wholeday:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200",
  am: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200",
  pm: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100",
  evening:
    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-200",
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "—"

  try {
    return dateTimeFormatter.format(parseISO(value))
  } catch {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date)
  }
}

function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "—"

  try {
    return format(parseISO(value), "MMM d, yyyy")
  } catch {
    return value
  }
}

function PortionBadge({ portion }: { portion: DayPortion }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        PORTION_STYLES[portion],
      )}
    >
      {getDayPortionLabel(portion)}
    </span>
  )
}

type ScheduleDateRow = NonNullable<
  LeaveApplicationRecord["leave_application_dates"]
>[number]

function resolveLeaveTypeName(
  leaveTypeId: number | null | undefined,
  leaveTypeNames: Map<number, string>,
  fallback: string,
): string {
  if (leaveTypeId == null) {
    return fallback
  }

  return leaveTypeNames.get(leaveTypeId) ?? fallback
}

function LeaveTypeChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/80 bg-background px-2.5 py-0.5 text-xs font-medium text-foreground/90">
      {name}
    </span>
  )
}

function SchedulePortionLine({
  portionLabel,
  portion,
  leaveTypeName,
  hrStatus,
  applicationCancelled = false,
}: {
  portionLabel?: string
  portion: DayPortion
  leaveTypeName: string
  hrStatus: string | null
  applicationCancelled?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {portionLabel ? (
        <span className="text-muted-foreground w-16 shrink-0 text-xs font-medium">
          {portionLabel}
        </span>
      ) : null}
      <PortionBadge portion={portion} />
      <LeaveTypeChip name={leaveTypeName} />
      {applicationCancelled ? (
        <span className="text-muted-foreground text-xs">—</span>
      ) : (
        <HrApprovalStatusBadge status={hrStatus} />
      )}
    </div>
  )
}

function ScheduleDayRow({
  day,
  index,
  leaveTypeNames,
  fallbackLeaveTypeName,
  applicationCancelled = false,
}: {
  day: ScheduleDateRow
  index: number
  leaveTypeNames: Map<number, string>
  fallbackLeaveTypeName: string
  applicationCancelled?: boolean
}) {
  const displayPortion = resolveDisplayDayPortion(
    day.approved_day_portion_1,
    day.approved_day_portion_2,
  )
  const isSplit =
    day.approved_day_portion_2 != null &&
    day.approved_day_portion_2.trim() !== ""

  return (
    <div className="relative flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between">
      <div className="absolute top-3 bottom-3 left-0 w-0.5 rounded-full bg-amber-400/80" />
      <div className="flex items-center gap-3 pl-2">
        <span className="bg-background text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
          {index + 1}
        </span>
        <span className="text-sm font-medium">{formatLeaveDay(day.leave_date)}</span>
      </div>
      <div className="flex flex-col gap-1.5 pl-2 sm:items-end sm:pl-0">
        <SchedulePortionLine
          portion={displayPortion}
          leaveTypeName={resolveLeaveTypeName(
            day.approved_leave_type_id_1,
            leaveTypeNames,
            fallbackLeaveTypeName,
          )}
          hrStatus={day.hr_status_1}
          applicationCancelled={applicationCancelled}
        />
        {isSplit && day.hr_status_2 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground w-16 shrink-0 text-xs font-medium">
              Portion 2
            </span>
            {applicationCancelled ? (
              <span className="text-muted-foreground text-xs">—</span>
            ) : (
              <HrApprovalStatusBadge status={day.hr_status_2} />
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 shadow-sm">
      <Icon className="size-3.5 text-amber-700" />
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm font-semibold text-amber-950">{value}</span>
    </div>
  )
}

function DetailCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
        <div className="bg-background text-muted-foreground flex size-8 items-center justify-center rounded-lg">
          <Icon className="size-4" />
        </div>
        <h3 className="flex-1 text-sm font-semibold">{title}</h3>
      </div>
      <div className="px-4 py-3 text-sm">{children}</div>
    </div>
  )
}

function LeaveDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Skeleton className="h-9 w-36" />
      <Skeleton className="h-52 w-full rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    </div>
  )
}

type LeaveDetailViewProps = {
  leaveId: string
}

export function LeaveDetailView({ leaveId }: LeaveDetailViewProps) {
  const { application, isLoading, isError, isNotFound } =
    useLeaveApplication(leaveId)
  const { data: leaveTypes = [] } = useLeaveTypes()
  const [cancelOpen, setCancelOpen] = useState(false)

  if (isLoading) {
    return <LeaveDetailSkeleton />
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1" asChild>
          <Link to="/my-leave">
            <ChevronLeft className="size-4" />
            Back to My Leave
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive text-sm">
              Unable to load this leave request. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isNotFound || !application) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1" asChild>
          <Link to="/my-leave">
            <ChevronLeft className="size-4" />
            Back to My Leave
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-sm">
              Leave request not found or you do not have access to view it.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const leaveTypeName =
    leaveTypes.find((type) => type.id === application.leave_type_id)?.leave_name ??
    "Unknown leave type"
  const leaveTypeNames = new Map(
    leaveTypes.map((type) => [type.id, type.leave_name] as const),
  )
  const overallStatus = coerceOverallStatus(application.overall_status)
  const cancelStatus = coerceCancelStatus(application.cancel_status)
  const leaveDays = resolveLeaveDaysFromRecord(application)
  const applicationDates = [...(application.leave_application_dates ?? [])].sort(
    (a, b) => a.leave_date.localeCompare(b.leave_date),
  )
  const dayCount = applicationDates.length || leaveDays.length
  const partialCount = applicationDates.length
    ? applicationDates.filter((day) => {
        const display = resolveDisplayDayPortion(
          day.approved_day_portion_1,
          day.approved_day_portion_2,
        )
        return display !== "wholeday"
      }).length
    : leaveDays.filter((day) => day.day_portion !== "wholeday").length
  const scheduleDates: ScheduleDateRow[] =
    applicationDates.length > 0
      ? applicationDates
      : leaveDays.map((day) => ({
          id: 0,
          leave_date: day.date,
          approved_day_portion_1: mapDayPortionToApiLabel(day.day_portion),
          approved_day_portion_2: null,
          approved_leave_type_id_1: application.leave_type_id,
          approved_leave_type_id_2: null,
          hr_status_1: "Pending",
          hr_status_2: null,
          hr_remarks: null,
          hr_approved_by: null,
          hr_approved_date: null,
        }))
  // const canEdit = overallStatus !== "approved"
  const canMutate = isLeaveApplicationPendingOnly(application)
  const canEdit = canMutate
  const canCancel = canMutate
  const hrApproval = resolveHrApprovalSummary(application)
  const supervisor = application.employee_teacher?.supervisor ?? null
  const manager = application.employee_teacher?.manager ?? null
  const cancelledByTeacher = application.cancelled_by_teacher ?? null
  const showCancelledBy =
    overallStatus === "cancelled" ||
    Boolean(application.cancelled_by) ||
    cancelledByTeacher != null

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1" asChild>
          <Link to="/my-leave">
            <ChevronLeft className="size-4" />
            Back to My Leave
          </Link>
        </Button>

        {canEdit || canCancel ? (
          <div className="flex flex-wrap items-center gap-2">
            {canEdit ? (
              <Button size="sm" className="gap-1.5 shadow-sm" asChild>
                <Link
                  to="/my-leave/leave-form/{-$leaveId}"
                  params={{ leaveId: String(application.id) }}
                >
                  <Pencil className="size-4" />
                  Edit request
                </Link>
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="size-4" />
                Cancel request
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <CancelLeaveDialog
        leaveId={String(application.id)}
        leaveLabel={`${leaveTypeName} (#${application.id})`}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />

      <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_55%),linear-gradient(135deg,_#fef3c7_0%,_#fffbeb_45%,_#ffffff_100%)]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900 shadow-sm">
                <Hash className="size-3.5" />
                Request #{application.id}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {leaveTypeName}
              </h1>
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="size-4 shrink-0 text-amber-700" />
                  <span className="font-medium text-foreground">
                    {formatDateRange(application.date_from, application.date_to)}
                  </span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="size-4 shrink-0 text-amber-700" />
                  Filed {formatTimestamp(application.created_at ?? application.date_filed)}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <OverallStatusBadge status={overallStatus} />
              {cancelStatus !== "none" ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Cancel:</span>
                  <CancelStatusBadge status={cancelStatus} />
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatPill icon={CalendarDays} label="Days" value={dayCount} />
            <StatPill
              icon={Sun}
              label="Whole day"
              value={dayCount - partialCount}
            />
            {partialCount > 0 ? (
              <StatPill icon={Clock} label="Partial" value={partialCount} />
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-5">
          <DetailCard
            icon={CalendarDays}
            title={`Leave schedule (${dayCount} day${dayCount === 1 ? "" : "s"})`}
          >
            <div className="space-y-2 pr-1">
              {scheduleDates.map((day, index) => (
                <ScheduleDayRow
                  key={day.leave_date}
                  day={day}
                  index={index}
                  leaveTypeNames={leaveTypeNames}
                  fallbackLeaveTypeName={leaveTypeName}
                  applicationCancelled={overallStatus === "cancelled"}
                />
              ))}
            </div>
          </DetailCard>

          <div className="grid gap-4 sm:grid-cols-1">
            <DetailCard icon={FileText} title="Reason">
              <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                {application.reason}
              </p>
            </DetailCard>

            <DetailCard icon={MapPin} title="Address while on leave">
              <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                {application.address ?? "—"}
              </p>
            </DetailCard>

            <SupportingDocumentsSection
              documents={application.supporting_documents}
              className="overflow-hidden rounded-xl border bg-card shadow-sm"
            />
          </div>
        </div>

        <aside className="space-y-4">
          <Card className="gap-0 overflow-hidden py-0 shadow-sm">
            <CardHeader className="border-b bg-muted/20 px-5 py-4">
              <CardTitle className="text-base">Approval workflow</CardTitle>
              <CardDescription>
                Approver and HR processing status.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y p-0">
              <LeaveApprovalStep
                title="Supervisor"
                subtitle=""
                teacher={supervisor}
                status={resolveApproverOrHrWorkflowStatus(
                  application.overall_status,
                  application.approver1_status,
                )}
                remarks={application.approver1_remarks}
                actedAt={
                  overallStatus === "cancelled"
                    ? null
                    : application.approver1_date
                }
              />
              <LeaveApprovalStep
                title="Manager"
                subtitle=""
                teacher={manager}
                status={resolveApproverOrHrWorkflowStatus(
                  application.overall_status,
                  application.approver2_status,
                )}
                remarks={application.approver2_remarks}
                actedAt={
                  overallStatus === "cancelled"
                    ? null
                    : application.approver2_date
                }
              />
              {overallStatus === "cancelled" ? (
                <LeaveApprovalStep
                  title="HR Approval"
                  status="—"
                  actedAt={null}
                />
              ) : hrApproval.approvers.length > 0 ? (
                <LeaveApprovalStep
                  title="HR Approval"
                  teachers={hrApproval.approvers}
                  status={hrApproval.status}
                  actedAt={hrApproval.latestApprovedDate}
                />
              ) : (
                <div className="px-5 py-4">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    HR Approval
                  </p>
                  <PendingStatusBadge className="mt-3">
                    Waiting for HR approval
                  </PendingStatusBadge>
                </div>
              )}
              {showCancelledBy ? (
                <LeaveApprovalStep
                  title="Cancelled by"
                  teacher={cancelledByTeacher}
                  status="Cancelled"
                  remarks={application.cancellation_reason}
                  actedAt={application.cancelled_at}
                />
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
