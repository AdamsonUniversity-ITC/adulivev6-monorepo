import type { BeginningBalanceRecord } from "@/lib/beginning-balances-api"
import { formatEmployeeName } from "@/lib/employee-teacher-display"

export type EmployeeBeginningBalanceGroup = {
  employee_no: string
  employee: BeginningBalanceRecord["employee"]
  balances: BeginningBalanceRecord[]
}

export function groupBeginningBalancesByEmployee(
  rows: BeginningBalanceRecord[],
): EmployeeBeginningBalanceGroup[] {
  const groups = new Map<string, EmployeeBeginningBalanceGroup>()

  for (const row of rows) {
    const existing = groups.get(row.employee_no)

    if (existing) {
      existing.balances.push(row)
      if (!existing.employee && row.employee) {
        existing.employee = row.employee
      }
      continue
    }

    groups.set(row.employee_no, {
      employee_no: row.employee_no,
      employee: row.employee ?? null,
      balances: [row],
    })
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      balances: [...group.balances].sort((a, b) => {
        if (a.leave_year !== b.leave_year) {
          return b.leave_year - a.leave_year
        }

        const aType = a.leave_type?.leave_name ?? String(a.leave_type_id)
        const bType = b.leave_type?.leave_name ?? String(b.leave_type_id)
        return aType.localeCompare(bType)
      }),
    }))
    .sort((a, b) =>
      formatEmployeeName(a.employee, a.employee_no).localeCompare(
        formatEmployeeName(b.employee, b.employee_no),
      ),
    )
}

export function getLatestUpdatedAt(group: EmployeeBeginningBalanceGroup): string | null {
  if (group.balances.length === 0) {
    return null
  }

  return group.balances.reduce((latest, balance) => {
    if (!latest) {
      return balance.updated_at
    }

    return balance.updated_at > latest ? balance.updated_at : latest
  }, null as string | null)
}
