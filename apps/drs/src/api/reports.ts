import { env } from '@repo/axios-config/env';
import { registrarSvc } from '@repo/axios-config/registrar-service';

export type ReportFilters = {
  date_from?: string;
  date_to?: string;
  school_year?: string;
  semester?: string;
  status?: string[];
  course_id?: string;
  receive_mode?: 'email' | 'delivery' | 'pickup';
  is_foreigner_student?: boolean;
  paid_only?: boolean;
  include_cancelled?: boolean;
};

export type ReportType =
  | 'summary'
  | 'status-breakdown'
  | 'document-demand'
  | 'revenue'
  | 'release-mode'
  | 'turnaround'
  | 'payment-status'
  | 'clearance-bottlenecks'
  | 'by-course'
  | 'trends'
  | 'foreigner-split';

export type SummaryReport = {
  total: number;
  active: number;
  released: number;
  cancelled: number;
  disposed: number;
};

export type StatusBreakdownReport = {
  total: number;
  rows: Array<{ status: string; count: number; percentage: number }>;
};

export type DocumentDemandReport = {
  total_applications: number;
  rows: Array<{
    requestable_type: string;
    requestable_id: number;
    name: string;
    application_count: number;
    total_quantity: number;
    share_percent: number;
  }>;
};

export type RevenueReport = {
  grand_total: number;
  paid_total: number;
  unpaid_total: number;
  rows: Array<{
    name: string;
    total_quantity: number;
    total_amount: number;
    share_percent: number;
  }>;
};

export type ReleaseModeReport = {
  total: number;
  rows: Array<{ receive_mode: string; count: number; percentage: number }>;
};

export type TurnaroundReport = {
  sample_size: number;
  average_days: number | null;
  median_days: number | null;
  p90_days: number | null;
};

export type PaymentStatusReport = {
  total: number;
  paid: number;
  unpaid: number;
  conversion_rate: number;
};

export type ClearanceBottleneckReport = {
  total_pending: number;
  rows: Array<{
    clearance_id: number;
    clearance_name: string;
    pending_count: number;
    avg_days_pending: number | null;
  }>;
};

export type ByCourseReport = {
  total: number;
  rows: Array<{
    course_id: string;
    count: number;
    percentage: number;
    status_breakdown: Array<{ status: string; count: number }>;
  }>;
};

export type TrendsReport = {
  rows: Array<{
    school_year: string;
    semester: string;
    period: string;
    count: number;
  }>;
};

export type ForeignerSplitReport = {
  total: number;
  segments: Array<{
    segment: 'local' | 'foreigner';
    count: number;
    revenue: number;
    status_breakdown: Array<{ status: string; count: number }>;
  }>;
};

function toParams(filters: ReportFilters): Record<string, string | boolean> {
  const params: Record<string, string | boolean> = {};

  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.school_year) params.school_year = filters.school_year;
  if (filters.semester) params.semester = filters.semester;
  if (filters.course_id) params.course_id = filters.course_id;
  if (filters.receive_mode) params.receive_mode = filters.receive_mode;
  if (filters.is_foreigner_student !== undefined) {
    params.is_foreigner_student = filters.is_foreigner_student;
  }
  if (filters.paid_only) params.paid_only = true;
  if (filters.include_cancelled) params.include_cancelled = true;
  if (filters.status?.length) {
    filters.status.forEach((value, index) => {
      params[`status[${index}]`] = value;
    });
  }

  return params;
}

async function fetchReport<T>(
  path: string,
  filters: ReportFilters,
): Promise<T> {
  const { data } = await registrarSvc.get<{ data: T }>(path, {
    params: toParams(filters),
  });

  return data.data;
}

export const fetchSummaryReport = (filters: ReportFilters) =>
  fetchReport<SummaryReport>('/v1/drs/reports/summary', filters);

export const fetchStatusBreakdownReport = (filters: ReportFilters) =>
  fetchReport<StatusBreakdownReport>(
    '/v1/drs/reports/status-breakdown',
    filters,
  );

export const fetchDocumentDemandReport = (filters: ReportFilters) =>
  fetchReport<DocumentDemandReport>('/v1/drs/reports/document-demand', filters);

export const fetchRevenueReport = (filters: ReportFilters) =>
  fetchReport<RevenueReport>('/v1/drs/reports/revenue', filters);

export const fetchReleaseModeReport = (filters: ReportFilters) =>
  fetchReport<ReleaseModeReport>('/v1/drs/reports/release-mode', filters);

export const fetchTurnaroundReport = (filters: ReportFilters) =>
  fetchReport<TurnaroundReport>('/v1/drs/reports/turnaround', filters);

export const fetchPaymentStatusReport = (filters: ReportFilters) =>
  fetchReport<PaymentStatusReport>('/v1/drs/reports/payment-status', filters);

export const fetchClearanceBottleneckReport = (filters: ReportFilters) =>
  fetchReport<ClearanceBottleneckReport>(
    '/v1/drs/reports/clearance-bottlenecks',
    filters,
  );

export const fetchByCourseReport = (filters: ReportFilters) =>
  fetchReport<ByCourseReport>('/v1/drs/reports/by-course', filters);

export const fetchTrendsReport = (filters: ReportFilters) =>
  fetchReport<TrendsReport>('/v1/drs/reports/trends', filters);

export const fetchForeignerSplitReport = (filters: ReportFilters) =>
  fetchReport<ForeignerSplitReport>('/v1/drs/reports/foreigner-split', filters);

export function buildReportExportUrl(
  reportType: ReportType,
  filters: ReportFilters,
): string {
  const params = new URLSearchParams();
  const entries = toParams(filters);

  Object.entries(entries).forEach(([key, value]) => {
    params.set(key, String(value));
  });

  const query = params.toString();
  const base = env.registrarService.replace(/\/$/, '');

  return `${base}/v1/drs/reports/${reportType}/export${query ? `?${query}` : ''}`;
}

export const REPORT_TABS: Array<{ id: ReportType; label: string }> = [
  { id: 'summary', label: 'Volume' },
  { id: 'status-breakdown', label: 'Status' },
  { id: 'document-demand', label: 'Documents' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'release-mode', label: 'Release mode' },
  { id: 'turnaround', label: 'Turnaround' },
  { id: 'payment-status', label: 'Payment' },
  { id: 'clearance-bottlenecks', label: 'Clearances' },
  { id: 'by-course', label: 'By course' },
  { id: 'trends', label: 'Trends' },
  { id: 'foreigner-split', label: 'Foreigner split' },
];
