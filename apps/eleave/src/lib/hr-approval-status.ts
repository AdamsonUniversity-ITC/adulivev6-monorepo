export type HrApprovalStatus =
  | "pending"
  | "approved_with_pay"
  | "approved_without_pay"
  | "disapproved"
  | "cancelled"

export type ApiHrStatus =
  | "Pending"
  | "Approved With Pay"
  | "Approved Without Pay"
  | "Disapproved"
  | "Cancelled"

export function mapApiHrStatusToSlug(
  status: string | null | undefined,
): HrApprovalStatus {
  if (status === "Approved With Pay") {
    return "approved_with_pay"
  }

  if (status === "Approved Without Pay") {
    return "approved_without_pay"
  }

  if (status === "Disapproved") {
    return "disapproved"
  }

  if (status === "Cancelled") {
    return "cancelled"
  }

  return "pending"
}

export function mapSlugToApiHrStatus(status: HrApprovalStatus): ApiHrStatus | null {
  if (status === "approved_with_pay") {
    return "Approved With Pay"
  }

  if (status === "approved_without_pay") {
    return "Approved Without Pay"
  }

  if (status === "disapproved") {
    return "Disapproved"
  }

  if (status === "cancelled") {
    return "Cancelled"
  }

  return null
}

export function summarizeHrApprovalStatus(
  statuses: HrApprovalStatus[],
): HrApprovalStatus {
  if (statuses.every((status) => status === "approved_with_pay")) {
    return "approved_with_pay"
  }

  if (statuses.every((status) => status === "approved_without_pay")) {
    return "approved_without_pay"
  }

  if (statuses.every((status) => status === "disapproved")) {
    return "disapproved"
  }

  if (statuses.every((status) => status === "cancelled")) {
    return "cancelled"
  }

  return "pending"
}

export function getHrApprovalStatusMeta(status: HrApprovalStatus): {
  label: string
  className: string
} {
  if (status === "approved_with_pay") {
    return {
      label: "Approved With Pay",
      className:
        "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200",
    }
  }

  if (status === "approved_without_pay") {
    return {
      label: "Approved Without Pay",
      className:
        "inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200",
    }
  }

  if (status === "disapproved") {
    return {
      label: "Disapproved",
      className:
        "inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200",
    }
  }

  if (status === "cancelled") {
    return {
      label: "Cancelled",
      className:
        "inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-300",
    }
  }

  return {
    label: "Pending",
    className:
      "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200",
  }
}
