import { resolveHrApprovalSummary } from "@/lib/resolve-hr-approval-summary"
import type { FiledLeaveReportRow } from "@/lib/map-filed-leave-report-row"
import { formatDateShort } from "@/routes/my-leave/leave-form/utils"

export function formatPrintApprovalDate(
  row: FiledLeaveReportRow,
): string {
  const latestApprovedDate = resolveHrApprovalSummary(row.record).latestApprovedDate

  if (!latestApprovedDate) {
    return "—"
  }

  return formatDateShort(latestApprovedDate)
}

export function formatAfterCutoffLeaveDate(
  dateFrom: string,
  dateTo: string,
): string {
  const from = formatDateShort(dateFrom)
  const to = formatDateShort(dateTo)

  if (!to || from === to) {
    return from
  }

  return `${from}-To-${to}`
}

export function formatAfterCutoffHrRemarks(row: FiledLeaveReportRow): string {
  const remarks = row.hrRemarksLabel.trim()

  return remarks || "—"
}

export function formatAfterCutoffDateRangeLabel(
  dateFrom: string,
  dateTo: string,
): string | null {
  const from = dateFrom.trim()
  const to = dateTo.trim()

  if (!from && !to) {
    return null
  }

  const fromLabel = from ? formatDateShort(from) : ""
  const toLabel = to ? formatDateShort(to) : ""

  if (fromLabel && toLabel) {
    return `${fromLabel} - to - ${toLabel}`
  }

  return fromLabel || toLabel
}
