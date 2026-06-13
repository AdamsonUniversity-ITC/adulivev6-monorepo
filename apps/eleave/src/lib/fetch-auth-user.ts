import { authSvc } from "@repo/axios-config/auth-service"

export type AuthUser = {
  id?: number
  username?: string
  email?: string
  emp_no?: string
  employee_no?: string
  employeeNo?: string
  idno?: string
  permissions?: string[]
  [key: string]: unknown
}

let inflight: ReturnType<typeof authSvc.get<AuthUser>> | null = null

export function fetchAuthUser() {
  if (!inflight) {
    inflight = authSvc.get<AuthUser>("user").finally(() => {
      inflight = null
    })
  }

  return inflight
}

export function resolveEmployeeNo(user: AuthUser): string | null {
  const candidates = [
    user.emp_no,
    user.employee_no,
    user.employeeNo,
    user.idno,
    user.username,
    user.email,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim() !== "") {
      return candidate.trim()
    }
  }

  return null
}

export function resolveDisplayName(user: AuthUser): string {
  const username = typeof user.username === "string" ? user.username.trim() : ""
  if (username !== "") {
    return username
  }

  const email = typeof user.email === "string" ? user.email.trim() : ""
  if (email !== "") {
    const localPart = email.split("@")[0]?.trim()
    if (localPart) {
      return localPart
    }
  }

  return resolveEmployeeNo(user) ?? "Employee"
}
