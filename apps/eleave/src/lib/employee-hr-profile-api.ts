import { hrmdoSvc } from "@/lib/api"

export type EmployeeHrProfileRecord = {
  birthdate: string | null
  date_hired: string | null
  permanency_date: string | null
  address: string | null
}

export async function fetchMyEmployeeHrProfile(): Promise<EmployeeHrProfileRecord> {
  const response = await hrmdoSvc.get<{ data: EmployeeHrProfileRecord }>(
    "v1/employees/me/hr-profile",
  )
  return response.data.data
}

export async function fetchEmployeeHrProfile(
  employeeNo: string,
): Promise<EmployeeHrProfileRecord> {
  const response = await hrmdoSvc.get<{ data: EmployeeHrProfileRecord }>(
    `v1/employees/${encodeURIComponent(employeeNo)}/hr-profile`,
  )
  return response.data.data
}
