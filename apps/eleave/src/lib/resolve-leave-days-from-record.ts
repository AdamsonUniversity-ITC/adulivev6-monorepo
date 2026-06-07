import type { LeaveApplicationRecord } from "@/lib/leave-applications-api"
import { mapApiDayPortion } from "@/lib/day-portion"
import type { LeaveDay } from "@/routes/my-leave/leave-form/schema"
import { syncLeaveDays } from "@/routes/my-leave/leave-form/utils"

function mapLeaveDays(
  days: Array<{ date: string; day_portion: string }>,
): LeaveDay[] {
  return days
    .map((day) => ({
      date: day.date,
      day_portion: mapApiDayPortion(day.day_portion),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function resolveLeaveDaysFromRecord(
  record: LeaveApplicationRecord,
): LeaveDay[] {
  if (record.leave_application_dates?.length) {
    return mapLeaveDays(
      record.leave_application_dates.map((day) => ({
        date: day.leave_date,
        day_portion: day.approved_day_portion_1,
      })),
    )
  }

  if (record.leave_days?.length) {
    return mapLeaveDays(record.leave_days)
  }

  return syncLeaveDays(record.date_from, record.date_to, [])
}

export function formatLeaveDatePortionLabel(
  approvedDayPortion1: string,
  approvedDayPortion2: string | null | undefined,
): string {
  const portion1 = mapApiDayPortion(approvedDayPortion1)

  if (!approvedDayPortion2) {
    return portion1
  }

  const portion2 = mapApiDayPortion(approvedDayPortion2)
  return `${portion1}+${portion2}`
}
