import type { DayPortion, LeaveFormValues } from "@/routes/my-leave/leave-form/schema"
import { format } from "date-fns"

const DAY_PORTION_API_LABELS: Record<DayPortion, string> = {
  wholeday: "Whole Day",
  am: "AM",
  pm: "PM",
  evening: "Evening",
}

export function buildLeaveApplyFormData(
  values: LeaveFormValues,
  employeeNo: string,
): FormData {
  const formData = new FormData()

  formData.append("employee_no", employeeNo)
  formData.append("leave_type_id", String(Number(values.leave_type_id)))
  formData.append("date_from", values.date_from)
  formData.append("date_to", values.date_to)
  formData.append("date_filed", format(new Date(), "yyyy-MM-dd"))
  formData.append("reason", values.reason.trim())
  formData.append("address", values.address.trim())

  values.leave_days.forEach((day, index) => {
    formData.append(`leave_days[${index}][date]`, day.date)
    formData.append(
      `leave_days[${index}][day_portion]`,
      DAY_PORTION_API_LABELS[day.day_portion as DayPortion],
    )
  })

  values.supporting_documents?.forEach((document, index) => {
    formData.append(
      `supporting_documents[${index}]`,
      document,
      document.name,
    )
  })

  return formData
}
