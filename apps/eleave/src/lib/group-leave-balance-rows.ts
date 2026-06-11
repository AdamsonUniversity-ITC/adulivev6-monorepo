export type LeaveBalanceRow = {
  leave_code: string
  leave_type: string
  credits: number
  pending_filed_leave: number
}

type GroupedRow = LeaveBalanceRow & {
  names: string[]
}

export function groupLeaveBalanceRowsByCode(
  rows: LeaveBalanceRow[],
): LeaveBalanceRow[] {
  const groups = new Map<string, GroupedRow>()

  for (const row of rows) {
    const code = row.leave_code
    const existing = groups.get(code)

    if (existing === undefined) {
      groups.set(code, {
        leave_code: code,
        leave_type: row.leave_type,
        credits: row.credits,
        pending_filed_leave: row.pending_filed_leave,
        names: [row.leave_type],
      })
      continue
    }

    if (!existing.names.includes(row.leave_type)) {
      existing.names.push(row.leave_type)
      existing.leave_type = existing.names.join(" / ")
    }

    existing.pending_filed_leave += row.pending_filed_leave
  }

  return Array.from(groups.values()).map(
    ({ leave_code, leave_type, credits, pending_filed_leave }) => ({
      leave_code,
      leave_type,
      credits,
      pending_filed_leave,
    }),
  )
}
