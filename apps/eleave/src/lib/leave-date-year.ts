type LeaveDateRange = {
  date_from: string
  date_to: string
}

function parseLeaveDate(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed)
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2]) - 1
    const day = Number(match[3])
    const date = new Date(year, month, day)

    return Number.isNaN(date.getTime()) ? null : date
  }

  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

function normalizeLeaveDateRange(dateFrom: string, dateTo: string) {
  const from = parseLeaveDate(dateFrom)
  const to = parseLeaveDate(dateTo || dateFrom)

  if (!from || !to) {
    return null
  }

  return from <= to
    ? { rangeStart: from, rangeEnd: to }
    : { rangeStart: to, rangeEnd: from }
}

export function leaveOverlapsYear(
  dateFrom: string,
  dateTo: string,
  year: number,
): boolean {
  const range = normalizeLeaveDateRange(dateFrom, dateTo)
  if (!range) {
    return false
  }

  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31)

  return range.rangeStart <= yearEnd && range.rangeEnd >= yearStart
}

export function getLeavePeriodYears(dateFrom: string, dateTo: string): number[] {
  const range = normalizeLeaveDateRange(dateFrom, dateTo)
  if (!range) {
    return []
  }

  const years: number[] = []
  for (
    let year = range.rangeStart.getFullYear();
    year <= range.rangeEnd.getFullYear();
    year += 1
  ) {
    years.push(year)
  }

  return years
}

export function collectLeavePeriodYears(items: LeaveDateRange[]): number[] {
  const years = new Set<number>()

  for (const item of items) {
    for (const year of getLeavePeriodYears(item.date_from, item.date_to)) {
      years.add(year)
    }
  }

  return [...years].sort((a, b) => b - a)
}

export function matchesLeaveYearFilter(
  dateFrom: string,
  dateTo: string,
  yearFilter: string,
): boolean {
  if (yearFilter === "all") {
    return true
  }

  const year = Number(yearFilter)
  if (!Number.isFinite(year)) {
    return true
  }

  return leaveOverlapsYear(dateFrom, dateTo, year)
}
