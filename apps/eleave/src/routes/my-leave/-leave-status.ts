export const LEAVE_OVERALL_STATUSES = [
  "pending",
  "approved",
  "partially_approved",
  "disapproved",
  "cancelled",
] as const

export const LEAVE_CANCEL_STATUSES = [
  "none",
  "requested",
  "approved",
  "disapproved",
] as const

export type LeaveOverallStatus = (typeof LEAVE_OVERALL_STATUSES)[number]
export type LeaveCancelStatus = (typeof LEAVE_CANCEL_STATUSES)[number]

export const LEAVE_OVERALL_STATUS_LABELS: Record<LeaveOverallStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  partially_approved: "Partially Approved",
  disapproved: "Disapproved",
  cancelled: "Cancelled",
}

export const LEAVE_CANCEL_STATUS_LABELS: Record<LeaveCancelStatus, string> = {
  none: "None",
  requested: "Requested",
  approved: "Approved",
  disapproved: "Disapproved",
}

export const LEAVE_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...LEAVE_OVERALL_STATUSES.filter((status) => status !== "partially_approved").map(
    (status) => ({
      value: status,
      label: LEAVE_OVERALL_STATUS_LABELS[status],
    }),
  ),
] as const

export function formatOverallStatusLabel(
  status: LeaveOverallStatus,
): string {
  return LEAVE_OVERALL_STATUS_LABELS[status]
}

export function formatCancelStatusLabel(status: LeaveCancelStatus): string {
  return LEAVE_CANCEL_STATUS_LABELS[status]
}

export function coerceOverallStatus(
  value: string | null | undefined,
): LeaveOverallStatus {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, "_") ?? ""

  if (LEAVE_OVERALL_STATUSES.includes(normalized as LeaveOverallStatus)) {
    return normalized as LeaveOverallStatus
  }

  return "pending"
}

export function coerceCancelStatus(
  value: string | null | undefined,
): LeaveCancelStatus {
  const normalized = value?.trim().toLowerCase()

  if (
    normalized &&
    LEAVE_CANCEL_STATUSES.includes(normalized as LeaveCancelStatus)
  ) {
    return normalized as LeaveCancelStatus
  }

  return "none"
}
