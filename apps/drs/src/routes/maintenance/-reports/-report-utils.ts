import type { ReportFilters, ReportType } from '@/api/reports.ts';

export type ReportPeriodMode = 'range' | 'month' | 'year';

export function formatReportCount(value: number): string {
  return value.toLocaleString();
}

export function formatReportCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatReportPercent(value: number): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
}

/** Stored slug to a sentence-case label (`for_payment` → `For payment`). */
export function formatReportLabel(value?: string | null): string {
  const normalized = String(value ?? '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();

  if (!normalized) return '—';

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatReportDays(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} days`;
}

const semesterLabels: Record<string, string> = {
  first: 'First semester',
  second: 'Second semester',
  summer: 'Summer',
};

const receiveModeLabels: Record<string, string> = {
  pickup: 'Pickup',
  delivery: 'Delivery',
  email: 'Email',
};

export const REPORT_MONTH_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export function reportPeriodMode(reportType: ReportType): ReportPeriodMode {
  if (reportType === 'monthly-accomplishment') return 'month';
  if (reportType === 'yearly-documents') return 'year';
  return 'range';
}

export function reportYearOptions(referenceYear = new Date().getFullYear()): number[] {
  const years: number[] = [];
  for (let year = referenceYear + 1; year >= referenceYear - 10; year -= 1) {
    years.push(year);
  }
  return years;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function parseIsoDateParts(
  value?: string,
): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return { year, month, day };
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function filtersFromMonthYear(
  year: number,
  month: number,
): Pick<ReportFilters, 'date_from' | 'date_to'> {
  const lastDay = lastDayOfMonth(year, month);
  return {
    date_from: `${year}-${pad2(month)}-01`,
    date_to: `${year}-${pad2(month)}-${pad2(lastDay)}`,
  };
}

export function filtersFromYear(
  year: number,
): Pick<ReportFilters, 'date_from' | 'date_to'> {
  return {
    date_from: `${year}-01-01`,
    date_to: `${year}-12-31`,
  };
}

export function monthYearFromFilters(
  filters: ReportFilters,
): { year: number; month: number } | null {
  const from = parseIsoDateParts(filters.date_from);
  const to = parseIsoDateParts(filters.date_to);
  if (!from || !to) return null;
  if (from.year !== to.year || from.month !== to.month) return null;
  if (from.day !== 1) return null;
  if (to.day !== lastDayOfMonth(to.year, to.month)) return null;
  return { year: from.year, month: from.month };
}

export function yearFromFilters(filters: ReportFilters): number | null {
  const from = parseIsoDateParts(filters.date_from);
  const to = parseIsoDateParts(filters.date_to);
  if (!from || !to) return null;
  if (from.year !== to.year) return null;
  if (from.month !== 1 || from.day !== 1) return null;
  if (to.month !== 12 || to.day !== 31) return null;
  return from.year;
}

export function isCleanMonthWindow(filters: ReportFilters): boolean {
  return monthYearFromFilters(filters) !== null;
}

export function isCleanYearWindow(filters: ReportFilters): boolean {
  return yearFromFilters(filters) !== null;
}

export function describeAppliedFilters(
  filters: ReportFilters,
  periodMode: ReportPeriodMode = 'range',
): string[] {
  const chips: string[] = [];

  if (periodMode === 'month') {
    const monthYear = monthYearFromFilters(filters);
    if (monthYear) {
      const monthLabel =
        REPORT_MONTH_OPTIONS.find((option) => option.value === monthYear.month)
          ?.label ?? String(monthYear.month);
      chips.push(`Month: ${monthLabel} ${monthYear.year}`);
    } else {
      if (filters.date_from) chips.push(`From ${filters.date_from}`);
      if (filters.date_to) chips.push(`To ${filters.date_to}`);
    }
  } else if (periodMode === 'year') {
    const year = yearFromFilters(filters);
    if (year != null) {
      chips.push(`Year: ${year}`);
    } else {
      if (filters.date_from) chips.push(`From ${filters.date_from}`);
      if (filters.date_to) chips.push(`To ${filters.date_to}`);
    }
  } else {
    if (filters.date_from) chips.push(`From ${filters.date_from}`);
    if (filters.date_to) chips.push(`To ${filters.date_to}`);
  }

  if (filters.school_year) chips.push(`SY ${filters.school_year}`);
  if (filters.semester) {
    chips.push(semesterLabels[filters.semester] ?? filters.semester);
  }
  if (filters.course_id) chips.push(`Course ${filters.course_id}`);
  if (filters.receive_mode) {
    chips.push(receiveModeLabels[filters.receive_mode] ?? filters.receive_mode);
  }
  if (filters.paid_only) chips.push('Paid only');
  if (filters.include_cancelled) chips.push('Including cancelled');
  if (filters.is_foreigner_student === true) chips.push('Foreigner students');
  if (filters.is_foreigner_student === false) chips.push('Local students');
  if (filters.status?.length) {
    chips.push(
      `Status: ${filters.status.map((status) => formatReportLabel(status)).join(', ')}`,
    );
  }

  return chips;
}

export function formatFiltersSummary(
  filters: ReportFilters,
  periodMode: ReportPeriodMode = 'range',
): string {
  const chips = describeAppliedFilters(filters, periodMode);
  return chips.length > 0 ? chips.join(' · ') : 'All records';
}
