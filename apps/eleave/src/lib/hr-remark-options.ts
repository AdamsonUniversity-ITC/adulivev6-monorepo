export const HR_REMARK_OTHERS_CODE = "others"

export type HrRemarkOption = {
  code: string
  label: string
  allowsCustom: boolean
}

export const HR_REMARK_OPTIONS: HrRemarkOption[] = [
  { code: "approved", label: "Approved", allowsCustom: false },
  { code: "duplication", label: "Duplication of Leave", allowsCustom: false },
  { code: "cancelled_leave", label: "Cancelled Leave", allowsCustom: false },
  {
    code: "credit_not_earned",
    label: "Leave Credit Not yet Earned",
    allowsCustom: false,
  },
  {
    code: "credit_consumed",
    label: "leave credit has been consumed.",
    allowsCustom: false,
  },
  {
    code: "el_reason_not_applicable",
    label:
      "reason not applicable for Emergency Leave (Please refer to HRMDO portal - ISO Administrative Manual, 3.2.3 Emergency Leave)",
    allowsCustom: false,
  },
  { code: HR_REMARK_OTHERS_CODE, label: "Others", allowsCustom: true },
]

const labelsByCode = new Map(
  HR_REMARK_OPTIONS.map((option) => [option.code, option.label]),
)

export function normalizeHrRemarkCode(
  code: string | null | undefined,
): string | null {
  if (code == null) {
    return null
  }

  const normalized = code.trim().toLowerCase()

  return normalized === "" ? null : normalized
}

export function isHrRemarkOthers(
  code: string | null | undefined,
): boolean {
  return normalizeHrRemarkCode(code) === HR_REMARK_OTHERS_CODE
}

export function getHrRemarkLabel(
  code: string | null | undefined,
): string | null {
  const normalized = normalizeHrRemarkCode(code)

  if (normalized == null) {
    return null
  }

  return labelsByCode.get(normalized) ?? null
}

/**
 * Resolve display text for persistence/UI. Non-others codes always use the catalog label.
 */
export function resolveHrRemarkDisplayText(
  code: string | null | undefined,
  customText: string | null | undefined,
): string | null {
  const normalized = normalizeHrRemarkCode(code)

  if (normalized == null || !labelsByCode.has(normalized)) {
    return null
  }

  if (normalized === HR_REMARK_OTHERS_CODE) {
    const trimmed = customText?.trim() ?? ""

    return trimmed === "" ? null : trimmed
  }

  return labelsByCode.get(normalized) ?? null
}
