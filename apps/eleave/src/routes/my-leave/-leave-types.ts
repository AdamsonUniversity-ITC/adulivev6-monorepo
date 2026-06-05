export type LeaveTypeOption = {
  id: number
  name: string
}

// Replace with API fetch when leave types endpoint is available.
export const LEAVE_TYPE_OPTIONS: LeaveTypeOption[] = [
  { id: 1, name: "Vacation Leave" },
  { id: 2, name: "Sick Leave" },
  { id: 3, name: "Emergency Leave" },
  { id: 4, name: "Maternity Leave" },
  { id: 5, name: "Paternity Leave" },
  { id: 6, name: "Special Leave" },
]
