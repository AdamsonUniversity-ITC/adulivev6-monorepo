import { mapApiHrStatusToSlug } from "@/lib/hr-approval-status"
import type { LeaveApplicationRecord } from "@/lib/leave-applications-api"
import {
  coerceOverallStatus,
  type LeaveOverallStatus,
} from "@/routes/my-leave/-leave-status"

function isHrPendingStatus(status: string | null | undefined): boolean {
  return status == null || status === "Pending"
}

function flattenHrStatusesFromRecord(
  record: LeaveApplicationRecord,
): string[] {
  return (record.leave_application_dates ?? []).flatMap((day) =>
    [day.hr_status_1, day.hr_status_2].filter(
      (status): status is string => status != null && status !== "",
    ),
  )
}

export function resolveOverallStatusFromHrDayStatuses(
  hrStatuses: Array<string | null | undefined>,
): LeaveOverallStatus {
  if (hrStatuses.length === 0) {
    return "pending"
  }

  const slugs = hrStatuses.map((status) =>
    isHrPendingStatus(status) ? "pending" : mapApiHrStatusToSlug(status),
  )

  const hasPending = slugs.some((status) => status === "pending")
  const hasApprovedWithPay = slugs.some(
    (status) => status === "approved_with_pay",
  )
  const hasApprovedWithoutPay = slugs.some(
    (status) => status === "approved_without_pay",
  )
  const hasApproved = hasApprovedWithPay || hasApprovedWithoutPay
  const hasDisapproved = slugs.some((status) => status === "disapproved")
  const hasCancelled = slugs.some((status) => status === "cancelled")
  const hasOtherDayStatus = hasPending || hasDisapproved || hasCancelled

  if (slugs.every((status) => status === "pending")) {
    return "pending"
  }

  if (hasApproved && !hasOtherDayStatus) {
    return "approved"
  }

  if (hasApproved && hasOtherDayStatus) {
    return "partially_approved"
  }

  if (hasDisapproved && hasCancelled) {
    return "disapproved"
  }

  if (slugs.every((status) => status === "disapproved")) {
    return "disapproved"
  }

  if (slugs.every((status) => status === "cancelled")) {
    return "cancelled"
  }

  if (hasDisapproved) {
    return "disapproved"
  }

  if (hasCancelled) {
    return "cancelled"
  }

  return "partially_approved"
}

export function resolveHrOverallStatus(
  record: LeaveApplicationRecord,
): LeaveOverallStatus {
  const hrStatuses = flattenHrStatusesFromRecord(record)

  if (hrStatuses.length === 0) {
    return coerceOverallStatus(record.overall_status)
  }

  if (hrStatuses.every((status) => isHrPendingStatus(status))) {
    return coerceOverallStatus(record.overall_status)
  }

  return resolveOverallStatusFromHrDayStatuses(hrStatuses)
}

export function flattenHrStatusesFromDayDecision(
  entry: {
    status1: string
    status2: string | null
    isSplit: boolean
  },
  mapStatusToApi: (status: string) => string | null,
): string[] {
  const statuses = [mapStatusToApi(entry.status1) ?? "Pending"]

  if (entry.isSplit && entry.status2) {
    statuses.push(mapStatusToApi(entry.status2) ?? "Pending")
  }

  return statuses
}
