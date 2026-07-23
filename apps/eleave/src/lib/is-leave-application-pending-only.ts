import type { LeaveApplicationRecord } from "@/lib/leave-applications-api"

function isApproverPending(status: string | null | undefined): boolean {
  if (status == null) return true
  const normalized = status.trim()
  return normalized === "" || normalized.toLowerCase() === "pending"
}

function isHrStatusPendingOnly(status: string | null | undefined): boolean {
  if (status == null) return true
  const normalized = status.trim()
  return normalized === "" || normalized.toLowerCase() === "pending"
}

/**
 * Cancel and Edit are allowed only while the application is fully Pending
 * (no Approved / Disapproved / Cancelled at overall, approver, or HR day level).
 */
export function isLeaveApplicationPendingOnly(
  application: Pick<
    LeaveApplicationRecord,
    | "overall_status"
    | "approver1_status"
    | "approver2_status"
    | "leave_application_dates"
  >,
): boolean {
  const overall = (application.overall_status ?? "Pending").trim().toLowerCase()
  if (overall !== "pending") {
    return false
  }

  if (!isApproverPending(application.approver1_status)) {
    return false
  }

  if (!isApproverPending(application.approver2_status)) {
    return false
  }

  const dates = application.leave_application_dates ?? []
  for (const day of dates) {
    if (!isHrStatusPendingOnly(day.hr_status_1)) {
      return false
    }
    if (
      day.hr_status_2 != null &&
      day.hr_status_2.trim() !== "" &&
      !isHrStatusPendingOnly(day.hr_status_2)
    ) {
      return false
    }
  }

  return true
}
