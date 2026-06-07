import { hrmdoSvc } from "@/lib/api"

export type EmployeeSearchRecord = {
  emp_no: string | null
  user_id: number | null
  name: string | null
  email: string | null
  position: string | null
  department: string | null
}

export async function searchEmployees(
  query: string,
  limit = 20,
): Promise<EmployeeSearchRecord[]> {
  const trimmed = query.trim()

  if (trimmed.length < 2) {
    return []
  }

  const response = await hrmdoSvc.get<{ data: EmployeeSearchRecord[] }>(
    "v1/employee-search",
    {
      params: {
        q: trimmed,
        limit,
      },
    },
  )

  return response.data.data ?? []
}
