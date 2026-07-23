import { Badge } from "@repo/ui/components/badge"

import { PendingStatusBadge } from "./-leave-status-badge"
import { format, parseISO } from "date-fns"
import { Clock } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { EmployeeTeacherRecord } from "@/lib/employee-teacher-display"
import {
  formatEmployeeName,
  getEmployeeAvatarUrl,
  getEmployeeInitials,
} from "@/lib/employee-teacher-display"
import { cn } from "@/lib/utils"

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatActedAt(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  try {
    return dateTimeFormatter.format(parseISO(value))
  } catch {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : dateTimeFormatter.format(date)
  }
}

function ApprovalStatusBadge({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase()

  if (normalized === "approved" || normalized === "processed") {
    return <Badge className="font-normal">{status}</Badge>
  }

  if (normalized === "disapproved") {
    return (
      <Badge variant="destructive" className="font-normal">
        {status}
      </Badge>
    )
  }

  if (normalized === "partially processed") {
    return (
      <Badge variant="secondary" className="font-normal">
        {status}
      </Badge>
    )
  }

  if (normalized === "pending") {
    return <PendingStatusBadge>{status}</PendingStatusBadge>
  }

  if (normalized === "cancelled") {
    return (
      <Badge variant="outline" className="font-normal text-slate-700">
        {status}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="font-normal">
      {status}
    </Badge>
  )
}

type LeaveApprovalStepProps = {
  title: string
  subtitle?: string
  teacher?: EmployeeTeacherRecord | null
  teachers?: EmployeeTeacherRecord[]
  status: string
  remarks?: string | null
  actedAt?: string | null
  className?: string
}

export function LeaveApprovalStep({
  title,
  subtitle,
  teacher,
  teachers = [],
  status,
  remarks,
  actedAt,
  className,
}: LeaveApprovalStepProps) {
  const people = teachers.length > 0 ? teachers : teacher ? [teacher] : []
  const primaryPerson = people[0]
  const extraCount = Math.max(people.length - 1, 0)
  const formattedActedAt = formatActedAt(actedAt)
  const isPending = status.trim().toLowerCase() === "pending"
  const displayName = primaryPerson
    ? formatEmployeeName(primaryPerson)
    : "Unassigned"
  const avatarUrl = getEmployeeAvatarUrl(primaryPerson)

  const trimmedRemarks = remarks?.trim()

  return (
    <div className={cn("px-5 py-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {title}
        </p>
        {isPending ? (
          <PendingStatusBadge>{status}</PendingStatusBadge>
        ) : (
          <ApprovalStatusBadge status={status} />
        )}
      </div>
      {subtitle ? (
        <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>
      ) : null}

      <div className="mt-3 flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={displayName} />
          ) : null}
          <AvatarFallback
            className={cn(
              "text-xs font-semibold",
              primaryPerson
                ? "bg-amber-100 text-amber-900"
                : "bg-muted text-muted-foreground",
            )}
          >
            {primaryPerson ? (
              getEmployeeInitials(primaryPerson)
            ) : (
              <Clock className="size-4" />
            )}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{displayName}</p>
          {primaryPerson?.designation ? (
            <p className="text-muted-foreground text-xs">
              {primaryPerson.designation}
            </p>
          ) : null}
          {extraCount > 0 ? (
            <p className="text-muted-foreground text-xs">
              +{extraCount} more reviewer{extraCount === 1 ? "" : "s"}
            </p>
          ) : null}
          {formattedActedAt && !isPending ? (
            <p className="text-muted-foreground mt-1 text-xs tabular-nums">
              {formattedActedAt}
            </p>
          ) : null}
        </div>
      </div>

      {trimmedRemarks ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">
            Remarks
          </p>
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
            {trimmedRemarks}
          </p>
        </div>
      ) : null}
    </div>
  )
}
