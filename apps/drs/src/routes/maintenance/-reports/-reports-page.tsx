import {
  fetchByCourseReport,
  fetchClearanceBottleneckReport,
  fetchDayToDayReport,
  fetchDocumentDemandReport,
  fetchForeignerSplitReport,
  fetchPaymentStatusReport,
  fetchReleaseModeReport,
  fetchRevenueReport,
  fetchStatusBreakdownReport,
  fetchSummaryReport,
  fetchTatByStatusReport,
  fetchTrendsReport,
  fetchTurnaroundReport,
  REPORT_GROUPS,
  REPORT_TABS,
  reportGroupForType,
  type ReportFilters,
  type ReportGroupId,
  type ReportType,
} from '@/api/reports.ts';
import {
  DrsLoadingState,
  DrsPageHeader,
  DrsPageShell,
} from '@/components/drs-ui.tsx';
import { Button } from '@repo/ui/components/button';
import { Label } from '@repo/ui/components/label';
import { ScrollArea, ScrollBar } from '@repo/ui/components/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import { useQuery } from '@tanstack/react-query';
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ReportAppliedFilters } from './-report-applied-filters.tsx';
import { ReportExportActions } from './-report-export-actions.tsx';
import { ReportFiltersBar } from './-report-filters.tsx';
import { ReportKpiCards } from './-report-kpi-cards.tsx';
import { ReportTabPanel } from './-report-tab-panel.tsx';
import { SimpleReportTable } from './-report-table.tsx';
import {
  describeAppliedFilters,
  formatReportCount,
  formatReportCurrency,
  formatReportDays,
  formatReportLabel,
  formatReportPercent,
} from './-report-utils.ts';

const ReportBarChart = lazy(() =>
  import('./-report-chart-card.tsx').then((module) => ({
    default: module.ReportBarChart,
  })),
);
const ReportPieChart = lazy(() =>
  import('./-report-chart-card.tsx').then((module) => ({
    default: module.ReportPieChart,
  })),
);

function ReportChartSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={<DrsLoadingState label="Loading chart…" className="py-8" />}
    >
      {children}
    </Suspense>
  );
}

function ReportSectionTitle({ children }: { children: string }) {
  return <h3 className="text-foreground text-sm font-medium">{children}</h3>;
}

const defaultFilters: ReportFilters = {};

export function ReportsPage() {
  const [draftFilters, setDraftFilters] =
    useState<ReportFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<ReportFilters>(defaultFilters);
  const [activeTab, setActiveTab] = useState<ReportType>('status-breakdown');
  const [activeGroup, setActiveGroup] = useState<ReportGroupId>(() =>
    reportGroupForType('status-breakdown'),
  );
  const [dayToDayPage, setDayToDayPage] = useState(1);

  const groupTabs = useMemo(() => {
    const group = REPORT_GROUPS.find((entry) => entry.id === activeGroup);
    const tabs = group?.tabs ?? REPORT_GROUPS[0]?.tabs ?? [];
    return tabs
      .map((id) => REPORT_TABS.find((tab) => tab.id === id))
      .filter((tab): tab is (typeof REPORT_TABS)[number] => tab != null);
  }, [activeGroup]);

  const handleGroupChange = (groupId: ReportGroupId) => {
    setActiveGroup(groupId);
    const group = REPORT_GROUPS.find((entry) => entry.id === groupId);
    const nextTab = group?.tabs[0];
    if (nextTab) {
      setActiveTab(nextTab);
    }
  };

  const handleTabChange = (value: string) => {
    const next = value as ReportType;
    setActiveTab(next);
    setActiveGroup(reportGroupForType(next));
  };

  const onNow = activeGroup === 'now';
  const onStatus = activeTab === 'status-breakdown';
  const onTurnaround = activeTab === 'turnaround';

  useEffect(() => {
    setDayToDayPage(1);
  }, [appliedFilters]);

  const summaryQuery = useQuery({
    queryKey: ['drs-report', 'summary', appliedFilters],
    queryFn: () => fetchSummaryReport(appliedFilters),
  });
  const statusQuery = useQuery({
    queryKey: ['drs-report', 'status-breakdown', appliedFilters],
    queryFn: () => fetchStatusBreakdownReport(appliedFilters),
    enabled: onStatus,
  });
  const documentQuery = useQuery({
    queryKey: ['drs-report', 'document-demand', appliedFilters],
    queryFn: () => fetchDocumentDemandReport(appliedFilters),
    enabled: activeTab === 'document-demand',
  });
  const revenueQuery = useQuery({
    queryKey: ['drs-report', 'revenue', appliedFilters],
    queryFn: () => fetchRevenueReport(appliedFilters),
    enabled: activeTab === 'revenue',
  });
  const releaseModeQuery = useQuery({
    queryKey: ['drs-report', 'release-mode', appliedFilters],
    queryFn: () => fetchReleaseModeReport(appliedFilters),
    enabled: onStatus,
  });
  const turnaroundQuery = useQuery({
    queryKey: ['drs-report', 'turnaround', appliedFilters],
    queryFn: () => fetchTurnaroundReport(appliedFilters),
    enabled: onTurnaround,
  });
  const tatByStatusQuery = useQuery({
    queryKey: ['drs-report', 'tat-by-status', appliedFilters],
    queryFn: () => fetchTatByStatusReport(appliedFilters),
    enabled: onTurnaround,
  });
  const paymentQuery = useQuery({
    queryKey: ['drs-report', 'payment-status', appliedFilters],
    queryFn: () => fetchPaymentStatusReport(appliedFilters),
    enabled: activeTab === 'payment-status',
  });
  const clearanceQuery = useQuery({
    queryKey: ['drs-report', 'clearance-bottlenecks', appliedFilters],
    queryFn: () => fetchClearanceBottleneckReport(appliedFilters),
    enabled: activeTab === 'clearance-bottlenecks',
  });
  const courseQuery = useQuery({
    queryKey: ['drs-report', 'by-course', appliedFilters],
    queryFn: () => fetchByCourseReport(appliedFilters),
    enabled: activeTab === 'by-course',
  });
  const trendsQuery = useQuery({
    queryKey: ['drs-report', 'trends', appliedFilters],
    queryFn: () => fetchTrendsReport(appliedFilters),
    enabled: onNow,
  });
  const foreignerQuery = useQuery({
    queryKey: ['drs-report', 'foreigner-split', appliedFilters],
    queryFn: () => fetchForeignerSplitReport(appliedFilters),
    enabled: onStatus,
  });
  const dayToDayQuery = useQuery({
    queryKey: ['drs-report', 'day-to-day', appliedFilters, dayToDayPage],
    queryFn: () => fetchDayToDayReport(appliedFilters, dayToDayPage),
    enabled: activeTab === 'day-to-day',
  });

  const activeLabel =
    REPORT_TABS.find((tab) => tab.id === activeTab)?.label ?? 'Report';

  const pdfPayload = useMemo(() => {
    switch (activeTab) {
      case 'status-breakdown':
        return {
          summary: summaryQuery.data ?? {},
          trends: trendsQuery.data ?? {},
          statusBreakdown: statusQuery.data ?? {},
          releaseMode: releaseModeQuery.data ?? {},
          foreignerSplit: foreignerQuery.data ?? {},
        };
      case 'document-demand':
        return { documentDemand: documentQuery.data ?? {} };
      case 'revenue':
        return { revenue: revenueQuery.data ?? {} };
      case 'turnaround':
        return {
          turnaround: turnaroundQuery.data ?? {},
          tatByStatus: tatByStatusQuery.data ?? {},
        };
      case 'payment-status':
        return {
          summary: summaryQuery.data ?? {},
          paymentStatus: paymentQuery.data ?? {},
        };
      case 'clearance-bottlenecks':
        return {
          summary: summaryQuery.data ?? {},
          clearanceBottlenecks: clearanceQuery.data ?? {},
        };
      case 'by-course':
        return { byCourse: courseQuery.data ?? {} };
      case 'day-to-day':
        return { dayToDay: dayToDayQuery.data ?? {} };
      default:
        return {};
    }
  }, [
    activeTab,
    summaryQuery.data,
    statusQuery.data,
    documentQuery.data,
    revenueQuery.data,
    releaseModeQuery.data,
    turnaroundQuery.data,
    tatByStatusQuery.data,
    paymentQuery.data,
    clearanceQuery.data,
    courseQuery.data,
    dayToDayQuery.data,
    trendsQuery.data,
    foreignerQuery.data,
  ]);

  const handleResetFilters = () => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const canResetFilters =
    describeAppliedFilters(draftFilters).length > 0 ||
    describeAppliedFilters(appliedFilters).length > 0;

  const tabLoading =
    (onStatus && statusQuery.isLoading) ||
    (activeTab === 'clearance-bottlenecks' && clearanceQuery.isLoading) ||
    (activeTab === 'payment-status' && paymentQuery.isLoading) ||
    (activeTab === 'document-demand' && documentQuery.isLoading) ||
    (onTurnaround &&
      (turnaroundQuery.isLoading || tatByStatusQuery.isLoading)) ||
    (activeTab === 'by-course' && courseQuery.isLoading) ||
    (activeTab === 'revenue' && revenueQuery.isLoading) ||
    (activeTab === 'day-to-day' && dayToDayQuery.isLoading);

  return (
    <DrsPageShell maxWidth="xl" contentClassName="space-y-5">
      <DrsPageHeader
        title="Reports"
        description="What is waiting, how long it takes, and how requests break down by program. Set the filters, then pick a report. Excel is emailed to your Adamson mail. PDF downloads on this page."
        backTo="/maintenance/"
        backLabel="Configuration"
        actions={
          <ReportExportActions
            reportType={activeTab}
            filters={appliedFilters}
            reportTitle={`${activeLabel} report`}
            pdfPayload={pdfPayload}
          />
        }
      />

      <ReportFiltersBar
        filters={draftFilters}
        onChange={setDraftFilters}
        onApply={() => setAppliedFilters({ ...draftFilters })}
        onReset={handleResetFilters}
        canReset={canResetFilters}
        isApplying={tabLoading || (onNow && summaryQuery.isLoading)}
      />

      <ReportAppliedFilters filters={appliedFilters} />

      <div className="space-y-4">
        <div className="space-y-2 lg:hidden">
          <Label htmlFor="report-type-select">Report</Label>
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger id="report-type-select">
              <SelectValue placeholder="Select report" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_GROUPS.map((group) => (
                <div key={group.id}>
                  <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                    {group.label}
                  </div>
                  {group.tabs.map((tabId) => {
                    const tab = REPORT_TABS.find((entry) => entry.id === tabId);
                    if (!tab) return null;
                    return (
                      <SelectItem key={tab.id} value={tab.id}>
                        {tab.label}
                      </SelectItem>
                    );
                  })}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="hidden space-y-2 lg:block">
            <div
              role="tablist"
              aria-label="Report groups"
              className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]"
            >
              {REPORT_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  role="tab"
                  aria-selected={activeGroup === group.id}
                  className={
                    activeGroup === group.id
                      ? 'bg-background text-foreground inline-flex h-[calc(100%-1px)] items-center justify-center rounded-md border border-transparent px-3 py-1 text-sm font-medium shadow-sm'
                      : 'inline-flex h-[calc(100%-1px)] items-center justify-center rounded-md px-3 py-1 text-sm font-medium'
                  }
                  onClick={() => handleGroupChange(group.id)}
                >
                  {group.label}
                </button>
              ))}
            </div>
            <ScrollArea className="w-full">
              <TabsList className="h-auto w-max min-w-full justify-start">
                {groupTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {onNow ? (
            <div className="space-y-4 pt-2">
              <ReportTabPanel
                isLoading={summaryQuery.isLoading}
                isError={summaryQuery.isError}
                loadingLabel="Loading volume…"
                onRetry={() => void summaryQuery.refetch()}
              >
                <ReportKpiCards
                  aria-label="Volume"
                  items={[
                    {
                      label: 'Total',
                      value: formatReportCount(summaryQuery.data?.total ?? 0),
                    },
                    {
                      label: 'Active',
                      value: formatReportCount(summaryQuery.data?.active ?? 0),
                    },
                    {
                      label: 'Released',
                      value: formatReportCount(
                        summaryQuery.data?.released ?? 0,
                      ),
                    },
                    {
                      label: 'Cancelled',
                      value: formatReportCount(
                        summaryQuery.data?.cancelled ?? 0,
                      ),
                    },
                    {
                      label: 'Disposed',
                      value: formatReportCount(
                        summaryQuery.data?.disposed ?? 0,
                      ),
                    },
                  ]}
                />
              </ReportTabPanel>
              <ReportTabPanel
                isLoading={trendsQuery.isLoading}
                isError={trendsQuery.isError}
                loadingLabel="Loading trends…"
                onRetry={() => void trendsQuery.refetch()}
              >
                <ReportChartSuspense>
                  <ReportBarChart
                    title="Applications over time"
                    data={(trendsQuery.data?.rows ?? []).map((row) => ({
                      label: `${row.school_year} ${formatReportLabel(row.semester)}`,
                      value: row.count,
                    }))}
                  />
                </ReportChartSuspense>
              </ReportTabPanel>
            </div>
          ) : null}

          <TabsContent value="status-breakdown" className="space-y-6">
            <ReportTabPanel
              isLoading={statusQuery.isLoading}
              isError={statusQuery.isError}
              loadingLabel="Loading status…"
              onRetry={() => void statusQuery.refetch()}
            >
              <ReportChartSuspense>
                <ReportPieChart
                  title="Applications by status"
                  data={(statusQuery.data?.rows ?? []).map((row) => ({
                    label: formatReportLabel(row.status),
                    value: row.count,
                  }))}
                />
              </ReportChartSuspense>
              <SimpleReportTable
                columns={['Status', 'Count', 'Share']}
                rows={(statusQuery.data?.rows ?? []).map((row) => [
                  formatReportLabel(row.status),
                  formatReportCount(row.count),
                  formatReportPercent(row.percentage),
                ])}
              />
            </ReportTabPanel>

            <ReportTabPanel
              isLoading={releaseModeQuery.isLoading}
              isError={releaseModeQuery.isError}
              loadingLabel="Loading release mode…"
              onRetry={() => void releaseModeQuery.refetch()}
            >
              <ReportSectionTitle>Release mode</ReportSectionTitle>
              <ReportChartSuspense>
                <ReportPieChart
                  title="Release mode"
                  data={(releaseModeQuery.data?.rows ?? []).map((row) => ({
                    label: formatReportLabel(row.receive_mode),
                    value: row.count,
                  }))}
                />
              </ReportChartSuspense>
              <SimpleReportTable
                columns={['Release mode', 'Count', 'Share']}
                rows={(releaseModeQuery.data?.rows ?? []).map((row) => [
                  formatReportLabel(row.receive_mode),
                  formatReportCount(row.count),
                  formatReportPercent(row.percentage),
                ])}
              />
            </ReportTabPanel>

            <ReportTabPanel
              isLoading={foreignerQuery.isLoading}
              isError={foreignerQuery.isError}
              loadingLabel="Loading local and foreigner split…"
              onRetry={() => void foreignerQuery.refetch()}
            >
              <ReportSectionTitle>Local and foreigner</ReportSectionTitle>
              <ReportChartSuspense>
                <ReportPieChart
                  title="Local and foreigner"
                  data={(foreignerQuery.data?.segments ?? []).map(
                    (segment) => ({
                      label: formatReportLabel(segment.segment),
                      value: segment.count,
                    }),
                  )}
                />
              </ReportChartSuspense>
              <SimpleReportTable
                columns={['Segment', 'Count', 'Revenue']}
                rows={(foreignerQuery.data?.segments ?? []).map((segment) => [
                  formatReportLabel(segment.segment),
                  formatReportCount(segment.count),
                  formatReportCurrency(segment.revenue),
                ])}
              />
            </ReportTabPanel>
          </TabsContent>

          <TabsContent value="document-demand" className="space-y-4">
            <ReportTabPanel
              isLoading={documentQuery.isLoading}
              isError={documentQuery.isError}
              loadingLabel="Loading documents…"
              onRetry={() => void documentQuery.refetch()}
            >
              <ReportChartSuspense>
                <ReportBarChart
                  title="Top requested documents"
                  data={(documentQuery.data?.rows ?? [])
                    .slice(0, 8)
                    .map((row) => ({
                      label: row.name,
                      value: row.application_count,
                    }))}
                />
              </ReportChartSuspense>
              <SimpleReportTable
                columns={['Document', 'Applications', 'Quantity', 'Share']}
                rows={(documentQuery.data?.rows ?? []).map((row) => [
                  row.name,
                  formatReportCount(row.application_count),
                  formatReportCount(row.total_quantity),
                  formatReportPercent(row.share_percent),
                ])}
              />
            </ReportTabPanel>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <ReportTabPanel
              isLoading={revenueQuery.isLoading}
              isError={revenueQuery.isError}
              loadingLabel="Loading revenue…"
              onRetry={() => void revenueQuery.refetch()}
            >
              <ReportKpiCards
                aria-label="Revenue"
                items={[
                  {
                    label: 'Grand total',
                    value: formatReportCurrency(
                      revenueQuery.data?.grand_total ?? 0,
                    ),
                  },
                  {
                    label: 'Paid',
                    value: formatReportCurrency(
                      revenueQuery.data?.paid_total ?? 0,
                    ),
                  },
                  {
                    label: 'Unpaid',
                    value: formatReportCurrency(
                      revenueQuery.data?.unpaid_total ?? 0,
                    ),
                  },
                ]}
              />
              <SimpleReportTable
                columns={['Document', 'Quantity', 'Amount', 'Share']}
                rows={(revenueQuery.data?.rows ?? []).map((row) => [
                  row.name,
                  formatReportCount(row.total_quantity),
                  formatReportCurrency(row.total_amount),
                  formatReportPercent(row.share_percent),
                ])}
              />
            </ReportTabPanel>
          </TabsContent>

          <TabsContent value="turnaround" className="space-y-4">
            <ReportTabPanel
              isLoading={
                turnaroundQuery.isLoading || tatByStatusQuery.isLoading
              }
              isError={turnaroundQuery.isError || tatByStatusQuery.isError}
              loadingLabel="Loading turnaround…"
              onRetry={() => {
                void turnaroundQuery.refetch();
                void tatByStatusQuery.refetch();
              }}
            >
              <ReportKpiCards
                aria-label="Turnaround"
                items={[
                  {
                    label: 'Sample size',
                    value: formatReportCount(
                      turnaroundQuery.data?.sample_size ?? 0,
                    ),
                  },
                  {
                    label: 'Average days',
                    value: formatReportDays(turnaroundQuery.data?.average_days),
                  },
                  {
                    label: 'Median days',
                    value: formatReportDays(turnaroundQuery.data?.median_days),
                  },
                  {
                    label: '90th percentile',
                    value: formatReportDays(turnaroundQuery.data?.p90_days),
                  },
                ]}
              />
              <ReportChartSuspense>
                <ReportBarChart
                  title="Average days by stage"
                  data={(tatByStatusQuery.data?.rows ?? []).map((row) => ({
                    label: row.status_label,
                    value: row.average_days ?? 0,
                  }))}
                />
              </ReportChartSuspense>
              <SimpleReportTable
                columns={[
                  'Status',
                  'Sample size',
                  'Average days',
                  'Median days',
                ]}
                rows={(tatByStatusQuery.data?.rows ?? []).map((row) => [
                  row.status_label,
                  formatReportCount(row.sample_size),
                  formatReportDays(row.average_days),
                  formatReportDays(row.median_days),
                ])}
              />
            </ReportTabPanel>
          </TabsContent>

          <TabsContent value="payment-status" className="space-y-4">
            <ReportTabPanel
              isLoading={paymentQuery.isLoading}
              isError={paymentQuery.isError}
              loadingLabel="Loading payment…"
              onRetry={() => void paymentQuery.refetch()}
            >
              <ReportKpiCards
                aria-label="Payment"
                items={[
                  {
                    label: 'Total',
                    value: formatReportCount(paymentQuery.data?.total ?? 0),
                  },
                  {
                    label: 'Paid',
                    value: formatReportCount(paymentQuery.data?.paid ?? 0),
                  },
                  {
                    label: 'Unpaid',
                    value: formatReportCount(paymentQuery.data?.unpaid ?? 0),
                  },
                  {
                    label: 'Paid share',
                    value: formatReportPercent(
                      paymentQuery.data?.conversion_rate ?? 0,
                    ),
                  },
                ]}
              />
              <ReportChartSuspense>
                <ReportPieChart
                  title="Paid and unpaid"
                  data={[
                    { label: 'Paid', value: paymentQuery.data?.paid ?? 0 },
                    { label: 'Unpaid', value: paymentQuery.data?.unpaid ?? 0 },
                  ]}
                />
              </ReportChartSuspense>
            </ReportTabPanel>
          </TabsContent>

          <TabsContent value="clearance-bottlenecks" className="space-y-4">
            <ReportTabPanel
              isLoading={clearanceQuery.isLoading}
              isError={clearanceQuery.isError}
              loadingLabel="Loading clearances…"
              onRetry={() => void clearanceQuery.refetch()}
            >
              <ReportChartSuspense>
                <ReportBarChart
                  title="Pending clearances by department"
                  data={(clearanceQuery.data?.rows ?? []).map((row) => ({
                    label: row.clearance_name,
                    value: row.pending_count,
                  }))}
                />
              </ReportChartSuspense>
              <SimpleReportTable
                columns={['Department', 'Pending', 'Average days pending']}
                rows={(clearanceQuery.data?.rows ?? []).map((row) => [
                  row.clearance_name,
                  formatReportCount(row.pending_count),
                  formatReportDays(row.avg_days_pending),
                ])}
              />
            </ReportTabPanel>
          </TabsContent>

          <TabsContent value="by-course" className="space-y-4">
            <ReportTabPanel
              isLoading={courseQuery.isLoading}
              isError={courseQuery.isError}
              loadingLabel="Loading courses…"
              onRetry={() => void courseQuery.refetch()}
            >
              <ReportChartSuspense>
                <ReportBarChart
                  title="Applications by course"
                  data={(courseQuery.data?.rows ?? [])
                    .slice(0, 10)
                    .map((row) => ({
                      label: row.course_id,
                      value: row.count,
                    }))}
                />
              </ReportChartSuspense>
              <SimpleReportTable
                columns={['Course', 'Count', 'Share']}
                rows={(courseQuery.data?.rows ?? []).map((row) => [
                  row.course_id,
                  formatReportCount(row.count),
                  formatReportPercent(row.percentage),
                ])}
              />
            </ReportTabPanel>
          </TabsContent>

          <TabsContent value="day-to-day" className="space-y-4">
            <ReportTabPanel
              isLoading={dayToDayQuery.isLoading}
              isError={dayToDayQuery.isError}
              loadingLabel="Loading transactions…"
              onRetry={() => void dayToDayQuery.refetch()}
            >
              <SimpleReportTable
                columns={[
                  'Date',
                  'Student no.',
                  'Name',
                  'Course',
                  'Documents requested',
                  'Assessment amount',
                  'DRS no.',
                  'Purpose',
                  'Date of graduation',
                  'ETA',
                  'Delivered or picked up',
                  'Contact no.',
                  'Release mode',
                ]}
                rows={(dayToDayQuery.data?.rows ?? []).map((row) => [
                  row.date,
                  row.student_no,
                  row.name,
                  row.course,
                  row.documents_requested,
                  formatReportCurrency(row.assessment_amount),
                  row.drs_no,
                  row.purpose,
                  row.graduation_date,
                  row.eta,
                  row.delivered_or_picked_up,
                  row.contact_no,
                  row.receive_mode,
                ])}
              />
              {(dayToDayQuery.data?.meta.last_page ?? 1) > 1 ? (
                <div className="flex items-center gap-3 text-sm">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={dayToDayPage <= 1}
                    onClick={() => setDayToDayPage((page) => page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-muted-foreground tabular-nums">
                    Page {dayToDayQuery.data?.meta.current_page ?? dayToDayPage}{' '}
                    of {dayToDayQuery.data?.meta.last_page ?? 1}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      dayToDayPage >= (dayToDayQuery.data?.meta.last_page ?? 1)
                    }
                    onClick={() => setDayToDayPage((page) => page + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </ReportTabPanel>
          </TabsContent>
        </Tabs>
      </div>
    </DrsPageShell>
  );
}
