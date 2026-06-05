import { Badge } from "@repo/ui/components/badge"
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Pencil,
  Sun,
  type LucideIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import type { UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"

import type { DayPortion, LeaveFormValues } from "../schema"
import {
  formatDateRange,
  formatLeaveDay,
  getDayPortionLabel,
  getLeaveTypeLabel,
  leaveDaysChanged,
} from "../utils"

type ReviewStepProps = {
  form: UseFormReturn<LeaveFormValues>
  isEdit: boolean
  initialValues: LeaveFormValues | null
}

const PORTION_STYLES: Record<DayPortion, string> = {
  wholeday: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200",
  am: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200",
  pm: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100",
  evening:
    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-200",
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

function DetailCard({
  icon: Icon,
  title,
  changed,
  children,
  className,
}: {
  icon: LucideIcon
  title: string
  changed?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm",
        changed && "border-primary/30 ring-1 ring-primary/10",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            changed ? "bg-primary/10 text-primary" : "bg-background text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </div>
        <h3 className="flex-1 text-sm font-semibold">{title}</h3>
        {changed ? (
          <Badge variant="secondary" className="font-normal">
            Changed
          </Badge>
        ) : null}
      </div>
      <div className="px-4 py-3 text-sm">{children}</div>
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

export function ReviewStep({ form, isEdit, initialValues }: ReviewStepProps) {
  const values = form.watch()
  const initial = initialValues

  const dateRangeChanged =
    isEdit &&
    initial != null &&
    (values.date_from !== initial.date_from ||
      values.date_to !== initial.date_to)

  const leaveTypeChanged =
    isEdit && initial != null && values.leave_type_id !== initial.leave_type_id

  const daysChanged =
    isEdit && initial != null && leaveDaysChanged(values.leave_days, initial.leave_days)

  const reasonChanged =
    isEdit && initial != null && values.reason !== initial.reason

  const addressChanged =
    isEdit && initial != null && values.address !== initial.address

  const changeCount = [
    dateRangeChanged,
    leaveTypeChanged,
    daysChanged,
    reasonChanged,
    addressChanged,
  ].filter(Boolean).length

  const dayCount = values.leave_days.length
  const partialCount = values.leave_days.filter(
    (day) => day.day_portion !== "wholeday",
  ).length

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_55%),linear-gradient(135deg,_#fef3c7_0%,_#fffbeb_45%,_#ffffff_100%)]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900 shadow-sm">
                <CheckCircle2 className="size-3.5" />
                {isEdit ? "Update preview" : "Application preview"}
              </p>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {getLeaveTypeLabel(values.leave_type_id)}
              </h2>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Calendar className="size-4 shrink-0 text-amber-700" />
                <span className="font-medium text-foreground">
                  {formatDateRange(values.date_from, values.date_to)}
                </span>
              </div>
            </div>

            {(leaveTypeChanged || dateRangeChanged) && initial ? (
              <div className="w-full max-w-xs space-y-1 rounded-lg border border-amber-200/80 bg-white/70 p-3 text-xs sm:w-auto">
                {leaveTypeChanged ? (
                  <p>
                    <span className="text-muted-foreground">Type: </span>
                    <span className="line-through">{getLeaveTypeLabel(initial.leave_type_id)}</span>
                    {" → "}
                    <span className="font-medium">{getLeaveTypeLabel(values.leave_type_id)}</span>
                  </p>
                ) : null}
                {dateRangeChanged ? (
                  <p>
                    <span className="text-muted-foreground">Dates: </span>
                    <span className="line-through">
                      {formatDateRange(initial.date_from, initial.date_to)}
                    </span>
                    {" → "}
                    <span className="font-medium">
                      {formatDateRange(values.date_from, values.date_to)}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatPill icon={CalendarDays} label="Days" value={dayCount} />
            <StatPill icon={Sun} label="Whole day" value={dayCount - partialCount} />
            {partialCount > 0 ? (
              <StatPill icon={Clock} label="Partial" value={partialCount} />
            ) : null}
          </div>
        </div>
      </div>

      {isEdit && changeCount > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
          <Pencil className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-amber-950 dark:text-amber-100">
            <span className="font-medium">{changeCount} update{changeCount === 1 ? "" : "s"}</span>{" "}
            from the original request. Changed sections are highlighted below.
          </p>
        </div>
      ) : null}

      <DetailCard
        icon={CalendarDays}
        title={`Leave schedule (${dayCount} day${dayCount === 1 ? "" : "s"})`}
        changed={daysChanged}
      >
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {values.leave_days.map((day, index) => {
            const initialDay = initial?.leave_days.find((item) => item.date === day.date)
            const portionChanged =
              isEdit &&
              initialDay != null &&
              initialDay.day_portion !== day.day_portion

            return (
              <div
                key={day.date}
                className={cn(
                  "relative flex flex-col gap-2 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between",
                  portionChanged
                    ? "border-primary/25 bg-primary/5"
                    : "border-border/60 bg-muted/20",
                )}
              >
                <div className="absolute top-3 bottom-3 left-0 w-0.5 rounded-full bg-amber-400/80" />
                <div className="flex items-center gap-3 pl-2">
                  <span className="bg-background text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">{formatLeaveDay(day.date)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pl-2 sm:pl-0">
                  {portionChanged && initialDay ? (
                    <>
                      <span className="text-muted-foreground text-xs line-through">
                        {getDayPortionLabel(initialDay.day_portion)}
                      </span>
                      <span className="text-muted-foreground text-xs">→</span>
                      <PortionBadge portion={day.day_portion} />
                    </>
                  ) : (
                    <PortionBadge portion={day.day_portion} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </DetailCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailCard icon={FileText} title="Reason" changed={reasonChanged}>
          {reasonChanged && initial ? (
            <div className="space-y-2">
              <p className="text-muted-foreground whitespace-pre-wrap line-through">
                {initial.reason}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">{values.reason}</p>
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
              {values.reason}
            </p>
          )}
        </DetailCard>

        <DetailCard icon={MapPin} title="Address while on leave" changed={addressChanged}>
          {addressChanged && initial ? (
            <div className="space-y-2">
              <p className="text-muted-foreground whitespace-pre-wrap line-through">
                {initial.address}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">{values.address}</p>
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
              {values.address}
            </p>
          )}
        </DetailCard>
      </div>

      <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-3 text-center">
        <p className="text-muted-foreground text-xs sm:text-sm">
          Confirm the details above, then click{" "}
          <span className="text-foreground font-medium">
            {isEdit ? "Update Leave" : "Submit Leave"}
          </span>{" "}
          to {isEdit ? "save your changes" : "file this request"}.
        </p>
      </div>
    </div>
  )
}
