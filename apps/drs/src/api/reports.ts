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
  | 'tat-by-status'
  | 'payment-status'
  | 'clearance-bottlenecks'
  | 'by-course'
  | 'trends'
  | 'foreigner-split'
  | 'day-to-day'
  | 'monthly-accomplishment'
  | 'yearly-documents';

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

export type TatByStatusReport = {
  rows: Array<{
    status: string;
    status_label: string;
    sample_size: number;
    average_days: number | null;
    median_days: number | null;
  }>;
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

export type ReportCourseOption = {
  id: string;
  label: string;
};

export type DayToDayReport = {
  rows: Array<{
    date: string | null;
    student_no: string;
    name: string;
    course: string;
    documents_requested: string;
    assessment_amount: number;
    drs_no: string | null;
    purpose: string | null;
    graduation_date: string | null;
    eta: string | null;
    delivered_or_picked_up: string | null;
    contact_no: string | null;
    receive_mode: string;
  }>;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type MonthlyAccomplishmentMetrics = {
  persons: number;
  attachments: number;
  documents_accomplished: number;
  income: number;
};

export type MonthlyAccomplishmentReport = {
  sections: Array<{
    college_id: string;
    college_name: string;
    rows: Array<{
      document_group_id: number | null;
      document_group_name: string;
      persons: number;
      attachments: number;
      documents_accomplished: number;
      income: number;
    }>;
    totals: MonthlyAccomplishmentMetrics;
  }>;
  grand_totals: MonthlyAccomplishmentMetrics;
};

export type YearlyDocumentsReport = {
  year: number;
  rows: Array<{
    requestable_type: string;
    requestable_id: number;
    name: string;
    kind: string;
    months: Record<string, number>;
    total: number;
  }>;
  month_totals: Record<string, number>;
  grand_total: number;
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
  extraParams?: Record<string, string | number | boolean>,
): Promise<T> {
  const { data } = await registrarSvc.get<{ data: T }>(path, {
    params: { ...toParams(filters), ...extraParams },
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

export const fetchTatByStatusReport = (filters: ReportFilters) =>
  fetchReport<TatByStatusReport>('/v1/drs/reports/tat-by-status', filters);

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

export const fetchDayToDayReport = (filters: ReportFilters, page = 1) =>
  fetchReport<DayToDayReport>('/v1/drs/reports/day-to-day', filters, { page });

export const fetchMonthlyAccomplishmentReport = (filters: ReportFilters) =>
  fetchReport<MonthlyAccomplishmentReport>(
    '/v1/drs/reports/monthly-accomplishment',
    filters,
  );

export const fetchYearlyDocumentsReport = (filters: ReportFilters) =>
  fetchReport<YearlyDocumentsReport>('/v1/drs/reports/yearly-documents', filters);

export async function fetchReportCourses(): Promise<ReportCourseOption[]> {
  const { data } = await registrarSvc.get<{ data: ReportCourseOption[] }>(
    '/v1/drs/reports/courses',
  );

  return Array.isArray(data.data) ? data.data : [];
}

export async function queueReportExport(
  reportType: ReportType,
  filters: ReportFilters,
): Promise<string> {
  const { data } = await registrarSvc.post<{ message?: string }>(
    `/v1/drs/reports/${reportType}/export`,
    toParams(filters),
  );

  return (
    data.message ?? 'Your report is being prepared and will be emailed to you.'
  );
}

export const REPORT_TABS: Array<{ id: ReportType; label: string }> = [
  { id: 'status-breakdown', label: 'Status' },
  { id: 'clearance-bottlenecks', label: 'Clearances' },
  { id: 'payment-status', label: 'Payment' },
  { id: 'document-demand', label: 'Documents' },
  { id: 'turnaround', label: 'Turnaround' },
  { id: 'by-course', label: 'By course' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'day-to-day', label: 'Day to day' },
  { id: 'monthly-accomplishment', label: 'Monthly accomplishment' },
  { id: 'yearly-documents', label: 'Yearly documents' },
];

export type ReportGroupId = 'now' | 'workload' | 'programs' | 'register';

export const REPORT_GROUPS: Array<{
  id: ReportGroupId;
  label: string;
  tabs: ReportType[];
}> = [
  {
    id: 'now',
    label: 'Now',
    tabs: ['status-breakdown', 'clearance-bottlenecks', 'payment-status'],
  },
  {
    id: 'workload',
    label: 'Workload',
    tabs: ['document-demand', 'turnaround'],
  },
  {
    id: 'programs',
    label: 'Programs',
    tabs: ['by-course', 'revenue'],
  },
  {
    id: 'register',
    label: 'Register',
    tabs: ['day-to-day', 'monthly-accomplishment', 'yearly-documents'],
  },
];

export function reportGroupForType(reportType: ReportType): ReportGroupId {
  const group = REPORT_GROUPS.find((entry) => entry.tabs.includes(reportType));
  return group?.id ?? 'volume';
}
