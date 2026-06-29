import { hrmdoSvc } from "@/lib/api"

export type EmployeeHrProfile = {
  emp_no: string | null
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  full_name: string | null
  email: string | null
  is_supervisor: boolean
  is_manager: boolean
  is_academic_contractual: boolean
  can_select_evening_day_portion: boolean
  birthdate: string | null
  date_hired: string | null
  permanency_date: string | null
  address: string | null
}

export async function fetchMyEmployeeHrProfile(): Promise<EmployeeHrProfile> {
  const response = await hrmdoSvc.get<{ data: EmployeeHrProfile }>(
    "v1/employees/me/hr-profile",
  )

  return response.data.data
}

export async function fetchEmployeeHrProfile(
  employeeNo: string,
): Promise<EmployeeHrProfile> {
  const response = await hrmdoSvc.get<{ data: EmployeeHrProfile }>(
    `v1/employees/${encodeURIComponent(employeeNo)}/hr-profile`,
  )

  return response.data.data
}
