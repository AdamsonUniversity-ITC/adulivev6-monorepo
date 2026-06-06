import type { DayPortion, LeaveFormValues } from "@/routes/my-leave/leave-form/schema"
import { format } from "date-fns"

const DAY_PORTION_API_LABELS: Record<DayPortion, string> = {
  wholeday: "Whole Day",
  am: "AM",
  pm: "PM",
  evening: "Evening",
}

export type ApplyLeaveApplicationPayload = {
  employee_no: string
  leave_type_id: number
  date_from: string
  date_to: string
  date_filed: string
  reason: string
  address: string
  leave_days: Array<{
    date: string
    day_portion: string
  }>
}

export function mapLeaveFormToApplyPayload(
  values: LeaveFormValues,
  employeeNo: string,
): ApplyLeaveApplicationPayload {
  return {
    employee_no: employeeNo,
    leave_type_id: Number(values.leave_type_id),
    date_from: values.date_from,
    date_to: values.date_to,
    date_filed: format(new Date(), "yyyy-MM-dd"),
    reason: values.reason.trim(),
    address: values.address.trim(),
    leave_days: values.leave_days.map((day) => ({
      date: day.date,
      day_portion: DAY_PORTION_API_LABELS[day.day_portion as DayPortion],
    })),
  }
}
