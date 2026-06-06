import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Sun,
  type LucideIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import type { UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"
import { useLeaveTypes } from "@/hooks/use-leave-types"

import type { DayPortion, LeaveFormValues } from "../schema"
import {
  formatDateRange,
  formatLeaveDay,
  getDayPortionLabel,
  getLeaveTypeLabel,
} from "../utils"

type ReviewStepProps = {
  form: UseFormReturn<LeaveFormValues>
  isEdit: boolean
}

const PORTION_STYLES: Record<DayPortion, string> = {
  wholeday:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200",
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

export function ReviewStep({ form, isEdit }: ReviewStepProps) {
  const values = form.watch()
  const { data: leaveTypes = [] } = useLeaveTypes()

  const dayCount = values.leave_days.length
  const partialCount = values.leave_days.filter(
    (day) => day.day_portion !== "wholeday",
  ).length

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_55%),linear-gradient(135deg,_#fef3c7_0%,_#fffbeb_45%,_#ffffff_100%)]">
        <div className="p-5 sm:p-6">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900 shadow-sm">
              <CheckCircle2 className="size-3.5" />
              Application preview
            </p>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {getLeaveTypeLabel(values.leave_type_id, leaveTypes)}
            </h2>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Calendar className="size-4 shrink-0 text-amber-700" />
              <span className="font-medium text-foreground">
                {formatDateRange(values.date_from, values.date_to)}
              </span>
            </div>
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

      <DetailCard
        icon={CalendarDays}
        title={`Leave schedule (${dayCount} day${dayCount === 1 ? "" : "s"})`}
      >
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {values.leave_days.map((day, index) => (
            <div
              key={day.date}
              className="relative flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="absolute top-3 bottom-3 left-0 w-0.5 rounded-full bg-amber-400/80" />
              <div className="flex items-center gap-3 pl-2">
                <span className="bg-background text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                  {index + 1}
                </span>
                <span className="text-sm font-medium">{formatLeaveDay(day.date)}</span>
              </div>
              <div className="pl-2 sm:pl-0">
                <PortionBadge portion={day.day_portion} />
              </div>
            </div>
          ))}
        </div>
      </DetailCard>

      <div className="grid gap-4 sm:grid-cols-1">
        <DetailCard icon={FileText} title="Reason">
          <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
            {values.reason}
          </p>
        </DetailCard>

        <DetailCard icon={MapPin} title="Address while on leave">
          <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
            {values.address}
          </p>
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
