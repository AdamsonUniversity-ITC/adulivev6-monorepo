import type { LeaveApplicationRecord } from "@/lib/leave-applications-api"

export type ViewerApprovalStatus =
  | "pending"
  | "approved"
  | "disapproved"
  | "cancelled"

export function normalizeApproverDecisionStatus(
  value: string | null | undefined,
): ViewerApprovalStatus {
  const normalized = value?.trim().toLowerCase() ?? ""

  if (normalized === "approved") {
    return "approved"
  }

  if (normalized === "disapproved") {
    return "disapproved"
  }

  if (normalized === "cancelled") {
    return "cancelled"
  }

  return "pending"
}

export function resolveViewerApprovalStatus(
  record: LeaveApplicationRecord,
  viewerEmpNo: string | null | undefined,
): ViewerApprovalStatus | null {
  if ((record.overall_status ?? "").trim().toLowerCase() === "cancelled") {
    return "cancelled"
  }

  const viewer = viewerEmpNo?.trim()

  if (!viewer) {
    return null
  }

  const supervisorEmpNo = record.employee_teacher?.supervisor?.emp_no?.trim()
  const managerEmpNo = record.employee_teacher?.manager?.emp_no?.trim()

  if (supervisorEmpNo === viewer) {
    return normalizeApproverDecisionStatus(record.approver1_status)
  }

  if (managerEmpNo === viewer) {
    return normalizeApproverDecisionStatus(record.approver2_status)
  }

  return null
}
