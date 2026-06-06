import type { EmployeeTeacherRecord } from "@/lib/employee-teacher-display"
import type { LeaveApplicationRecord } from "@/lib/leave-applications-api"

export type HrApprovalSummaryStatus =
  | "Pending"
  | "Processed"
  | "Disapproved"
  | "Partially processed"

export type HrApprovalSummary = {
  status: HrApprovalSummaryStatus
  approvers: EmployeeTeacherRecord[]
  latestApprovedDate: string | null
}

const HR_APPROVED_STATUSES = new Set([
  "Approved With Pay",
  "Approved Without Pay",
])

function isHrApprovedStatus(status: string | null | undefined): boolean {
  return status != null && HR_APPROVED_STATUSES.has(status)
}

function isHrPendingStatus(status: string | null | undefined): boolean {
  return status == null || status === "Pending"
}

function flattenHrStatuses(
  dates: LeaveApplicationRecord["leave_application_dates"],
): string[] {
  return (dates ?? []).flatMap((day) =>
    [day.hr_status_1, day.hr_status_2].filter(
      (status): status is string => status != null && status !== "",
    ),
  )
}

export function resolveHrApprovalSummary(
  record: LeaveApplicationRecord,
): HrApprovalSummary {
  const dates = record.leave_application_dates ?? []

  if (dates.length === 0) {
    return {
      status: "Pending",
      approvers: [],
      latestApprovedDate: null,
    }
  }

  const statuses = flattenHrStatuses(dates)
  const hasApproved = statuses.some((status) => isHrApprovedStatus(status))
  const hasDisapproved = statuses.some((status) => status === "Disapproved")
  const allPending = statuses.every((status) => isHrPendingStatus(status))

  let status: HrApprovalSummaryStatus = "Pending"

  if (hasApproved) {
    status = "Processed"
  } else if (allPending) {
    status = "Pending"
  } else if (hasDisapproved && !hasApproved) {
    status = "Disapproved"
  } else {
    status = "Partially processed"
  }

  const approverMap = new Map<string, EmployeeTeacherRecord>()

  for (const day of dates) {
    const approver = day.hr_approver
    if (!approver?.emp_no) {
      continue
    }

    approverMap.set(approver.emp_no, approver)
  }

  const latestApprovedDate = dates
    .filter((day) => {
      const hasApprovedStatus =
        isHrApprovedStatus(day.hr_status_1) || isHrApprovedStatus(day.hr_status_2)

      return hasApprovedStatus && day.hr_approved_date
    })
    .map((day) => day.hr_approved_date as string)
    .sort((a, b) => b.localeCompare(a))[0] ?? null

  return {
    status,
    approvers: [...approverMap.values()],
    latestApprovedDate,
  }
}
