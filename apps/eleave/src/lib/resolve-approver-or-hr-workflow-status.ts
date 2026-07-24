/**
 * When the application is overall Cancelled, Approver/HR steps show "—"
 * (not Pending / Cancelled). Active apps keep their real status (default Pending).
 */
export function resolveApproverOrHrWorkflowStatus(
  overallStatus: string | null | undefined,
  status: string | null | undefined,
  fallbackWhenActive = "Pending",
): string {
  if ((overallStatus ?? "").trim().toLowerCase() === "cancelled") {
    return "—"
  }

  const trimmed = status?.trim()

  return trimmed && trimmed !== "" ? trimmed : fallbackWhenActive
}

export function isDashWorkflowStatus(status: string | null | undefined): boolean {
  const normalized = (status ?? "").trim()

  return normalized === "" || normalized === "-" || normalized === "—"
}
