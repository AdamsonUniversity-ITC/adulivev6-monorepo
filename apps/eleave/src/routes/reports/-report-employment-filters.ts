export const EMPLOYMENT_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All employment types" },
  { value: "academic", label: "Academic" },
  { value: "co_academic", label: "Co-academic" },
] as const

export const CLASSIFICATION_FILTER_OPTIONS = [
  { value: "all", label: "All classifications" },
  { value: "admin", label: "Admin" },
  { value: "rank_and_file", label: "Rank and File" },
] as const

export function resolveEmploymentTypeLabel(value: string): string {
  return (
    EMPLOYMENT_TYPE_FILTER_OPTIONS.find((option) => option.value === value)
      ?.label ?? value
  )
}

export function resolveClassificationLabel(value: string): string {
  return (
    CLASSIFICATION_FILTER_OPTIONS.find((option) => option.value === value)
      ?.label ?? value
  )
}
