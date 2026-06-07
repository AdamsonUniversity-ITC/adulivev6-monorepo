import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Paperclip,
  Sun,
  type LucideIcon,
} from "lucide-react"
import type { UseFormReturn } from "react-hook-form"

import { FileAttachmentList } from "@/components/shared/file-dropzone"
import { useLeaveTypes } from "@/hooks/use-leave-types"
import { cn } from "@/lib/utils"

import type { DayPortion, LeaveFormValues } from "../schema"
import {
  formatDateRange,
  formatLeaveDay,
  getDayPortionLabel,
  getLeaveTypeLabel,
} from "../utils"
import { StepSection } from "./-step-section"

type ReviewStepProps = {
  form: UseFormReturn<LeaveFormValues>
  isEdit: boolean
}

const PORTION_STYLES: Record<DayPortion, string> = {
  wholeday: "border-slate-200 bg-slate-50 text-slate-700",
  am: "border-sky-200 bg-sky-50 text-sky-800",
  pm: "border-amber-200 bg-amber-50 text-amber-900",
  evening: "border-violet-200 bg-violet-50 text-violet-800",
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
    <div className="space-y-4">
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

      <StepSection
        icon={CalendarDays}
        title="Leave days"
        description={`${dayCount} day${dayCount === 1 ? "" : "s"} in your schedule`}
      >
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {values.leave_days.map((day, index) => (
            <div
              key={day.date}
              className={cn(
                "flex flex-col gap-3 rounded-xl border px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between",
                index % 2 === 0 ? "border-slate-200 bg-white" : "border-slate-200/80 bg-slate-50/60",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums">
                  {index + 1}
                </span>
                <span className="text-sm font-medium">{formatLeaveDay(day.date)}</span>
              </div>
              <PortionBadge portion={day.day_portion} />
            </div>
          ))}
        </div>
      </StepSection>

      <StepSection icon={FileText} title="Reason for leave">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {values.reason}
        </p>
      </StepSection>

      {values.supporting_documents.length > 0 ? (
        <StepSection
          icon={Paperclip}
          title="Supporting documents"
          description={`${values.supporting_documents.length} file${values.supporting_documents.length === 1 ? "" : "s"} attached`}
        >
          <FileAttachmentList files={values.supporting_documents} />
        </StepSection>
      ) : null}

      <StepSection icon={MapPin} title="Address while on leave">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {values.address}
        </p>
      </StepSection>

      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3 text-center">
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
