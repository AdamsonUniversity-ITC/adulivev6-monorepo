const TEACHER_AVATAR_TYPE = 2

export type EmployeeSectionRecord = {
  id: number
  sec_name: string | null
}

export type EmployeeTeacherRecord = {
  id: number
  emp_no: string
  teacher_no?: string | null
  first_name: string
  middle_name: string | null
  last_name: string
  designation: string | null
  section?: EmployeeSectionRecord | null
  email: string | null
  is_active?: boolean | number | null
  hr_active?: boolean | number | null
  is_admin?: boolean | number | null
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

export function getAvatarUrlFromEmpNo(
  empNo: string | null | undefined,
): string | null {
  const trimmed = empNo?.trim()

  if (!trimmed) {
    return null
  }

  return `https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${trimmed}_${TEACHER_AVATAR_TYPE}`
}

export function getInitialsFromDisplayName(
  name: string | null | undefined,
  empNo: string | null | undefined,
  fallback = "?",
): string {
  const trimmedName = name?.trim()

  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean)

    if (parts.length >= 2) {
      return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase()
    }

    if (parts.length === 1) {
      const single = parts[0]!
      return single.length >= 2
        ? single.slice(0, 2).toUpperCase()
        : single.charAt(0).toUpperCase()
    }
  }

  const trimmedEmpNo = empNo?.trim() ?? ""
  return trimmedEmpNo.slice(0, 2).toUpperCase() || fallback
}

export function getEmployeeDepartment(
  teacher: EmployeeTeacherRecord | null | undefined,
  fallback = "—",
): string {
  const department = teacher?.section?.sec_name?.trim()

  return department || fallback
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

export function formatEmployeeNameLastFirst(
  teacher: EmployeeTeacherRecord | null | undefined,
  fallback = "Unassigned",
): string {
  if (!teacher) {
    return fallback
  }

  const lastName = teacher.last_name?.trim()
  const firstName = teacher.first_name?.trim()

  if (lastName && firstName) {
    return `${lastName}, ${firstName}`
  }

  return formatEmployeeName(teacher, fallback)
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
