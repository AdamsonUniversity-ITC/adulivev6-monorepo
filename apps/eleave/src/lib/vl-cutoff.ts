export function canUseVlForLeaveDate(
  leaveDate: string,
  computationYear: number,
  vlCutoffMonth: number,
): boolean {
  const trimmed = leaveDate.trim()

  if (trimmed === "") {
    return false
  }

  const date = new Date(`${trimmed}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  if (date.getFullYear() !== computationYear) {
    return false
  }

  return date.getMonth() + 1 >= vlCutoffMonth
}

export function vlCutoffMonthName(vlCutoffMonth: number): string {
  return new Date(2000, Math.max(1, Math.min(12, vlCutoffMonth)) - 1, 1).toLocaleString(
    "en-US",
    { month: "long" },
  )
}
