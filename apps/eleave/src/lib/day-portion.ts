import {
  DAY_PORTION_OPTIONS,
  type DayPortion,
} from "@/routes/my-leave/leave-form/schema"

export { DAY_PORTION_OPTIONS, type DayPortion }

export const DAY_PORTION_API_LABELS: Record<DayPortion, string> = {
  wholeday: "Whole Day",
  am: "AM",
  pm: "PM",
  evening: "Evening",
}

export const SPLIT_DAY_PORTION_OPTIONS = DAY_PORTION_OPTIONS.filter(
  (option) => option.value !== "wholeday",
)

export function mapApiDayPortion(value: string): DayPortion {
  const normalized = value.trim().toLowerCase()

  if (normalized === "whole day" || normalized === "wholeday") {
    return "wholeday"
  }
  if (normalized === "am") {
    return "am"
  }
  if (normalized === "pm") {
    return "pm"
  }
  if (normalized === "evening") {
    return "evening"
  }

  return "wholeday"
}

export function mapDayPortionToApiLabel(portion: DayPortion): string {
  return DAY_PORTION_API_LABELS[portion]
}

export function isWholeDayPortion(portion: DayPortion): boolean {
  return portion === "wholeday"
}

export function getDayPortionLabel(portion: DayPortion): string {
  return (
    DAY_PORTION_OPTIONS.find((option) => option.value === portion)?.label ??
    portion
  )
}
