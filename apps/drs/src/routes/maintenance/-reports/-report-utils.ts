import type { ReportFilters } from '@/api/reports.ts';

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

export function describeAppliedFilters(filters: ReportFilters): string[] {
  const chips: string[] = [];

  if (filters.date_from) chips.push(`From ${filters.date_from}`);
  if (filters.date_to) chips.push(`To ${filters.date_to}`);
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
    chips.push(`Status: ${filters.status.join(', ')}`);
  }

  return chips;
}

export function formatFiltersSummary(filters: ReportFilters): string {
  const chips = describeAppliedFilters(filters);
  return chips.length > 0 ? chips.join(' · ') : 'All records';
}
