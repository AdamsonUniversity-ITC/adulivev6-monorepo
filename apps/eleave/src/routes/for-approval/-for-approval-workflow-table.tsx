import { parseISO } from "date-fns"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  formatEmployeeName,
  getEmployeeAvatarUrl,
  getEmployeeInitials,
  type EmployeeTeacherRecord,
} from "@/lib/employee-teacher-display"
import type { LeaveApplicationRecord } from "@/lib/leave-applications-api"
import { resolveHrApprovalSummary } from "@/lib/resolve-hr-approval-summary"
import { Badge } from "@repo/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table"
import { PendingStatusBadge } from "@/routes/my-leave/-leave-status-badge"

type WorkflowTableRow = {
  step: string
  teachers: EmployeeTeacherRecord[]
  status: string
  remarks: string | null
  actedAt: string | null
}

const workflowDateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
})

const formatWorkflowActedAt = (value: string | null | undefined): string => {
  if (!value) {
    return "—"
  }

  try {
    return workflowDateTimeFormatter.format(parseISO(value))
  } catch {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? "—"
      : workflowDateTimeFormatter.format(date)
  }
}

const WorkflowApprovalStatusBadge = ({ status }: { status: string }) => {
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

  return (
    <Badge variant="outline" className="font-normal">
      {status}
    </Badge>
  )
}

const buildWorkflowRows = (record: LeaveApplicationRecord): WorkflowTableRow[] => {
  const hrApproval = resolveHrApprovalSummary(record)

  return [
    {
      step: "Immediate Superior",
      teachers: record.employee_teacher?.supervisor
        ? [record.employee_teacher.supervisor]
        : [],
      status: record.approver1_status ?? "Pending",
      remarks: record.approver1_remarks,
      actedAt: record.approver1_date,
    },
    {
      step: "Manager",
      teachers: record.employee_teacher?.manager
        ? [record.employee_teacher.manager]
        : [],
      status: record.approver2_status ?? "Pending",
      remarks: record.approver2_remarks,
      actedAt: record.approver2_date,
    },
    {
      step: "HR",
      teachers: hrApproval.approvers,
      status: hrApproval.approvers.length > 0 ? hrApproval.status : "Pending",
      remarks: null,
      actedAt: hrApproval.latestApprovedDate,
    },
  ]
}

export const ForApprovalWorkflowTable = ({
  record,
}: {
  record: LeaveApplicationRecord
}) => {
  const rows = buildWorkflowRows(record)

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
          <TableHead className="px-3 text-[11px] uppercase tracking-wide">
            Approver
          </TableHead>
          <TableHead className="px-3 text-[11px] uppercase tracking-wide" />
          <TableHead className="px-3 text-[11px] uppercase tracking-wide">
            Status
          </TableHead>
          <TableHead className="min-w-28 px-3 text-[11px] uppercase tracking-wide">
            Remarks
          </TableHead>
          <TableHead className="px-3 text-[11px] uppercase tracking-wide">
            Date
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const primaryTeacher = row.teachers[0]
          const extraApproverCount = Math.max(row.teachers.length - 1, 0)
          const displayName = primaryTeacher
            ? formatEmployeeName(primaryTeacher)
            : "—"
          const avatarUrl = getEmployeeAvatarUrl(primaryTeacher)
          const trimmedRemarks = row.remarks?.trim()

          return (
            <TableRow key={row.step}>
              <TableCell className="px-3 py-3 align-top text-xs font-medium text-slate-700">
                {row.step}
              </TableCell>
              <TableCell className="px-3 py-3 align-top">
                {primaryTeacher ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8 shrink-0">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={displayName} />
                      ) : null}
                      <AvatarFallback className="bg-amber-100 text-[10px] font-semibold text-amber-900">
                        {getEmployeeInitials(primaryTeacher)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{displayName}</p>
                      {primaryTeacher.designation ? (
                        <p className="text-muted-foreground text-xs">
                          {primaryTeacher.designation}
                        </p>
                      ) : null}
                      {extraApproverCount > 0 ? (
                        <p className="text-muted-foreground text-xs">
                          +{extraApproverCount} more
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell className="px-3 py-3 align-top">
                <WorkflowApprovalStatusBadge status={row.status} />
              </TableCell>
              <TableCell className="max-w-36 px-3 py-3 align-top whitespace-normal">
                {trimmedRemarks ? (
                  <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap">
                    {trimmedRemarks}
                  </p>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell className="px-3 py-3 align-top text-xs tabular-nums text-slate-600">
                {formatWorkflowActedAt(row.actedAt)}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
