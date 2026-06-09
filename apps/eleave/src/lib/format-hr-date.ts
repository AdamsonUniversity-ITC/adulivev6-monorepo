import { format, isValid, parse, parseISO } from "date-fns"

const HR_DATE_FORMATS = [
  "yyyy-MM-dd",
  "yyyy-MM-dd HH:mm:ss",
  "yyyy/MM/dd",
  "MM/dd/yyyy",
  "M/d/yyyy",
  "dd/MM/yyyy",
  "d/M/yyyy",
  "MMM d, yyyy",
  "MMMM d, yyyy",
  "dd-MMM-yyyy",
  "yyyyMMdd",
] as const

const EMPTY_HR_DATE_PATTERN = /^0{4}[-/]0{1,2}[-/]0{1,2}/

function parseHrDate(value: string): Date | null {
  const trimmed = value.trim()

  if (EMPTY_HR_DATE_PATTERN.test(trimmed)) {
    return null
  }

  const isoParsed = parseISO(trimmed)
  if (isValid(isoParsed)) {
    return isoParsed
  }

  for (const formatString of HR_DATE_FORMATS) {
    const parsed = parse(trimmed, formatString, new Date())
    if (isValid(parsed)) {
      return parsed
    }
  }

  const nativeParsed = new Date(trimmed)
  if (isValid(nativeParsed)) {
    return nativeParsed
  }

  return null
}

export function formatHrDate(value: string | null | undefined): string {
  if (!value?.trim()) {
    return "—"
  }

  const trimmed = value.trim()
  const parsed = parseHrDate(trimmed)

  if (parsed) {
    return format(parsed, "MMM d, yyyy")
  }

  return trimmed
}
