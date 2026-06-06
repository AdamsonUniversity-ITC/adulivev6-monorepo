const TEACHER_AVATAR_TYPE = 2

export type EmployeeTeacherRecord = {
  id: number
  emp_no: string
  teacher_no?: string | null
  first_name: string
  middle_name: string | null
  last_name: string
  designation: string | null
  email: string | null
  is_active?: boolean | number | null
  hr_active?: boolean | number | null
  supervisor?: EmployeeTeacherRecord | null
  manager?: EmployeeTeacherRecord | null
}

export function getEmployeeAvatarUrl(
  teacher: EmployeeTeacherRecord | null | undefined,
): string | null {
  const empNo = teacher?.emp_no?.trim()

  if (!empNo) {
    return null
  }

  return `https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${empNo}_${TEACHER_AVATAR_TYPE}`
}

export function formatEmployeeName(
  teacher: EmployeeTeacherRecord | null | undefined,
  fallback = "Unassigned",
): string {
  if (!teacher) {
    return fallback
  }

  const parts = [teacher.first_name, teacher.last_name].filter(Boolean)

  if (parts.length > 0) {
    return parts.join(" ")
  }

  return teacher.emp_no || fallback
}

export function getEmployeeInitials(
  teacher: EmployeeTeacherRecord | null | undefined,
  fallback = "?",
): string {
  if (!teacher) {
    return fallback
  }

  const first = teacher.first_name?.trim().charAt(0) ?? ""
  const last = teacher.last_name?.trim().charAt(0) ?? ""

  if (first && last) {
    return `${first}${last}`.toUpperCase()
  }

  if (first) {
    return first.toUpperCase()
  }

  const empNo = teacher.emp_no?.trim() ?? ""
  return empNo.slice(0, 2).toUpperCase() || fallback
}
