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

/** HR-split days were filed as Whole Day; show Whole Day unless the employee filed AM/PM/Evening. */
export function resolveDisplayDayPortion(
  portion1: string,
  portion2?: string | null,
): DayPortion {
  const hasPortion2 = portion2 != null && portion2.trim() !== ""

  if (hasPortion2) {
    return "wholeday"
  }

  return mapApiDayPortion(portion1)
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

export function getDayPortionWeight(portion: DayPortion | ""): number {
  if (portion === "wholeday") {
    return 1
  }

  if (portion === "am" || portion === "pm" || portion === "evening") {
    return 0.5
  }

  return 0
}
