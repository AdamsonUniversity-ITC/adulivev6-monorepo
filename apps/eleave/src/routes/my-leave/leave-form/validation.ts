import { format, startOfDay } from "date-fns"
import type { FieldPath, UseFormReturn } from "react-hook-form"

import { getBirthdayLeaveValidationError } from "@/lib/birthday-leave-validation"
import type { LeaveBalanceRecord } from "@/lib/leave-balances-api"
import type { LeaveTypeRecord } from "@/lib/leave-types-api"
import { getLeaveCreditValidationMessage } from "@/lib/paternity-leave-credits"
import { validateLeaveFilingTiming } from "@/lib/validate-leave-filing-timing"

import {
  leaveFormStep1Schema,
  leaveFormStep2Schema,
  leaveFormStep3Schema,
  type LeaveFormValues,
} from "./schema"
import { getDaysInRange, getLeaveDayExclusionsFromForm } from "./utils"

export type LeaveFormFieldPath = FieldPath<LeaveFormValues>

/** Only the error surface of the form, so callers can pass any useForm instance. */
type LeaveFormErrorApi = Pick<
  UseFormReturn<LeaveFormValues>,
  "getValues" | "getFieldState" | "clearErrors"
>

export type LeaveFormFieldError = {
  field: LeaveFormFieldPath
  message: string
}

export type LeaveFormRules = {
  canSelectEvening: boolean
  leaveTypes: Array<
    Pick<
      LeaveTypeRecord,
      "id" | "leave_code" | "filing_timing" | "required_lead_days"
    >
  >
  leaveBalances: Array<
    Pick<LeaveBalanceRecord, "leave_code" | "credits" | "pending_filed_leave">
  >
  birthdate: string | null | undefined
}

/** Fields whose errors can become stale when the keyed field changes. */
const RELATED_ERROR_PATHS: Record<string, LeaveFormFieldPath[]> = {
  date_from: ["date_from", "date_to", "leave_days", "leave_type_id"],
  date_to: ["date_from", "date_to", "leave_days", "leave_type_id"],
  exclude_saturdays: ["date_from", "date_to", "leave_days", "leave_type_id"],
  exclude_sundays: ["date_from", "date_to", "leave_days", "leave_type_id"],
  leave_type_id: ["leave_type_id", "date_from", "date_to"],
  leave_days: ["leave_days", "leave_type_id"],
  reason: ["reason"],
  address: ["address"],
  supporting_documents: ["supporting_documents"],
}

function addIssuePaths(
  issues: Array<{ path: PropertyKey[] }>,
  target: Set<string>,
) {
  for (const issue of issues) {
    if (issue.path.length === 0) continue
    target.add(issue.path.join("."))
  }
}

/**
 * Filing window, birth month, and credit rules that the step schemas cannot express.
 * Filing-date failures surface on leave type because date_filed is not a form field.
 */
export function getLeaveTypeBusinessError(
  values: LeaveFormValues,
  rules: LeaveFormRules,
  today: Date = new Date(),
): LeaveFormFieldError | null {
  if (!values.leave_type_id || !values.date_from || !values.date_to) {
    return null
  }

  const leaveType = rules.leaveTypes.find(
    (type) => String(type.id) === values.leave_type_id,
  )
  if (!leaveType) {
    return null
  }

  const timingMessage = validateLeaveFilingTiming(
    leaveType,
    values.date_from,
    values.date_to,
    startOfDay(today),
  )
  if (timingMessage) {
    return { field: "leave_type_id", message: timingMessage }
  }

  const birthdayError = getBirthdayLeaveValidationError({
    leaveCode: leaveType.leave_code,
    birthdate: rules.birthdate,
    dateFiled: format(today, "yyyy-MM-dd"),
    dateFrom: values.date_from,
    dateTo: values.date_to,
  })
  if (birthdayError) {
    return {
      field:
        birthdayError.field === "date_filed"
          ? "leave_type_id"
          : birthdayError.field,
      message: birthdayError.message,
    }
  }

  const creditMessage = getLeaveCreditValidationMessage({
    leaveCode: leaveType.leave_code,
    leaveDays: values.leave_days,
    balances: rules.leaveBalances,
  })
  if (creditMessage) {
    return { field: "leave_type_id", message: creditMessage }
  }

  return null
}

/** Every field path that still fails a step schema or a business rule. */
export function getInvalidLeaveFormPaths(
  values: LeaveFormValues,
  rules: LeaveFormRules,
  today: Date = new Date(),
): Set<string> {
  const invalid = new Set<string>()

  const step1 = leaveFormStep1Schema.safeParse({
    date_from: values.date_from,
    date_to: values.date_to,
    exclude_sundays: values.exclude_sundays,
    exclude_saturdays: values.exclude_saturdays,
  })
  if (step1.success) {
    const daysInRange = getDaysInRange(
      values.date_from,
      values.date_to,
      getLeaveDayExclusionsFromForm(values),
    )
    if (daysInRange.length === 0) {
      invalid.add("date_to")
    }
  } else {
    addIssuePaths(step1.error.issues, invalid)
  }

  const step2 = leaveFormStep2Schema.safeParse({
    leave_type_id: values.leave_type_id,
    leave_days: values.leave_days,
  })
  if (!step2.success) {
    addIssuePaths(step2.error.issues, invalid)
  }

  if (
    !rules.canSelectEvening &&
    values.leave_days.some((day) => day.day_portion === "evening")
  ) {
    invalid.add("leave_days")
  }

  const businessError = getLeaveTypeBusinessError(values, rules, today)
  if (businessError) {
    invalid.add(businessError.field)
  }

  const step3 = leaveFormStep3Schema.safeParse({
    reason: values.reason,
    supporting_documents: values.supporting_documents,
    address: values.address,
  })
  if (!step3.success) {
    addIssuePaths(step3.error.issues, invalid)
  }

  return invalid
}

/**
 * Paths related to `changedField` that now pass validation, so messages left over
 * from an earlier Next or Submit attempt can be dropped as soon as the value is fixed.
 */
export function getResolvedErrorPaths(
  changedField: string,
  values: LeaveFormValues,
  rules: LeaveFormRules,
  today: Date = new Date(),
): LeaveFormFieldPath[] {
  const rootField = changedField.split(".")[0] ?? changedField
  const relatedPaths = RELATED_ERROR_PATHS[rootField]

  if (!relatedPaths) {
    return []
  }

  const invalid = getInvalidLeaveFormPaths(values, rules, today)
  const resolved: LeaveFormFieldPath[] = []

  for (const path of relatedPaths) {
    if (path === "leave_days") {
      values.leave_days.forEach((_, index) => {
        const dayPath = `leave_days.${index}.day_portion` as LeaveFormFieldPath
        if (!invalid.has(dayPath)) {
          resolved.push(dayPath)
        }
      })

      const hasLeaveDaysIssue = [...invalid].some(
        (invalidPath) =>
          invalidPath === "leave_days" || invalidPath.startsWith("leave_days."),
      )
      if (!hasLeaveDaysIssue) {
        resolved.push("leave_days")
      }

      continue
    }

    if (!invalid.has(path)) {
      resolved.push(path)
    }
  }

  return resolved
}

export function clearResolvedLeaveFormErrors(
  form: LeaveFormErrorApi,
  changedField: string,
  rules: LeaveFormRules,
): void {
  for (const path of getResolvedErrorPaths(
    changedField,
    form.getValues(),
    rules,
  )) {
    if (form.getFieldState(path).error) {
      form.clearErrors(path)
    }
  }
}
