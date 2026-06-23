import {
  fetchByCourseReport,
  fetchClearanceBottleneckReport,
  fetchDocumentDemandReport,
  fetchForeignerSplitReport,
  fetchPaymentStatusReport,
  fetchReleaseModeReport,
  fetchRevenueReport,
  fetchStatusBreakdownReport,
  fetchSummaryReport,
  fetchTrendsReport,
  fetchTurnaroundReport,
  REPORT_TABS,
  type ReportFilters,
  type ReportType,
} from '@/api/reports.ts';
import { DrsPageHeader, DrsPageShell } from '@/components/drs-ui.tsx';
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
  Ban,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileStack,
  PackageCheck,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ReportAppliedFilters } from './-report-applied-filters.tsx';
import { ReportBarChart, ReportPieChart } from './-report-chart-card.tsx';
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
  formatReportPercent,
} from './-report-utils.ts';

const defaultFilters: ReportFilters = {};

export function ReportsPage() {
  const [draftFilters, setDraftFilters] =
    useState<ReportFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<ReportFilters>(defaultFilters);
  const [activeTab, setActiveTab] = useState<ReportType>('summary');

  const summaryQuery = useQuery({
    queryKey: ['drs-report', 'summary', appliedFilters],
    queryFn: () => fetchSummaryReport(appliedFilters),
  });
  const statusQuery = useQuery({
    queryKey: ['drs-report', 'status-breakdown', appliedFilters],
    queryFn: () => fetchStatusBreakdownReport(appliedFilters),
  });
  const documentQuery = useQuery({
    queryKey: ['drs-report', 'document-demand', appliedFilters],
    queryFn: () => fetchDocumentDemandReport(appliedFilters),
  });
  const revenueQuery = useQuery({
    queryKey: ['drs-report', 'revenue', appliedFilters],
    queryFn: () => fetchRevenueReport(appliedFilters),
  });
  const releaseModeQuery = useQuery({
    queryKey: ['drs-report', 'release-mode', appliedFilters],
    queryFn: () => fetchReleaseModeReport(appliedFilters),
  });
  const turnaroundQuery = useQuery({
    queryKey: ['drs-report', 'turnaround', appliedFilters],
    queryFn: () => fetchTurnaroundReport(appliedFilters),
  });
  const paymentQuery = useQuery({
    queryKey: ['drs-report', 'payment-status', appliedFilters],
    queryFn: () => fetchPaymentStatusReport(appliedFilters),
  });
  const clearanceQuery = useQuery({
    queryKey: ['drs-report', 'clearance-bottlenecks', appliedFilters],
    queryFn: () => fetchClearanceBottleneckReport(appliedFilters),
  });
  const courseQuery = useQuery({
    queryKey: ['drs-report', 'by-course', appliedFilters],
    queryFn: () => fetchByCourseReport(appliedFilters),
  });
  const trendsQuery = useQuery({
    queryKey: ['drs-report', 'trends', appliedFilters],
    queryFn: () => fetchTrendsReport(appliedFilters),
  });
  const foreignerQuery = useQuery({
    queryKey: ['drs-report', 'foreigner-split', appliedFilters],
    queryFn: () => fetchForeignerSplitReport(appliedFilters),
  });

  const activeQuery = useMemo(() => {
    const map = {
      summary: summaryQuery,
      'status-breakdown': statusQuery,
      'document-demand': documentQuery,
      revenue: revenueQuery,
      'release-mode': releaseModeQuery,
      turnaround: turnaroundQuery,
      'payment-status': paymentQuery,
      'clearance-bottlenecks': clearanceQuery,
      'by-course': courseQuery,
      trends: trendsQuery,
      'foreigner-split': foreignerQuery,
    } satisfies Record<ReportType, typeof summaryQuery>;

    return map[activeTab];
  }, [
    activeTab,
    summaryQuery,
    statusQuery,
    documentQuery,
    revenueQuery,
    releaseModeQuery,
    turnaroundQuery,
    paymentQuery,
    clearanceQuery,
    courseQuery,
    trendsQuery,
    foreignerQuery,
  ]);

  const activeLabel =
    REPORT_TABS.find((tab) => tab.id === activeTab)?.label ?? 'Report';

  const pdfPayload = useMemo(() => {
    switch (activeTab) {
      case 'summary':
        return { summary: summaryQuery.data ?? {} };
      case 'status-breakdown':
        return { statusBreakdown: statusQuery.data ?? {} };
      case 'document-demand':
        return { documentDemand: documentQuery.data ?? {} };
      case 'revenue':
        return { revenue: revenueQuery.data ?? {} };
      case 'release-mode':
        return { releaseMode: releaseModeQuery.data ?? {} };
      case 'turnaround':
        return { turnaround: turnaroundQuery.data ?? {} };
      case 'payment-status':
        return { paymentStatus: paymentQuery.data ?? {} };
      case 'clearance-bottlenecks':
        return { clearanceBottlenecks: clearanceQuery.data ?? {} };
      case 'by-course':
        return { byCourse: courseQuery.data ?? {} };
      case 'trends':
        return { trends: trendsQuery.data ?? {} };
      case 'foreigner-split':
        return { foreignerSplit: foreignerQuery.data ?? {} };
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
    paymentQuery.data,
    clearanceQuery.data,
    courseQuery.data,
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

  return (
    <DrsPageShell maxWidth="xl" contentClassName="space-y-6">
      <DrsPageHeader
        eyebrow="DRS administration"
        title="Statistical reports"
        description="Review application volume, workflow performance, revenue, and operational bottlenecks. Export any report to Excel or PDF."
        backTo="/maintenance/"
        backLabel="Back to maintenance"
        actions={
          <ReportExportActions
            reportType={activeTab}
            filters={appliedFilters}
            reportTitle={`DRS ${activeLabel} Report`}
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
        isApplying={activeQuery.isLoading}
      />

      <ReportAppliedFilters filters={appliedFilters} />

      <div className="space-y-4 lg:hidden">
        <div className="space-y-2">
          <Label htmlFor="report-type-select">Report type</Label>
          <Select
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ReportType)}
          >
            <SelectTrigger id="report-type-select">
              <SelectValue placeholder="Select report" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TABS.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ReportType)}
      >
        <ScrollArea className="hidden w-full lg:block">
          <TabsList className="h-auto w-max min-w-full justify-start">
            {REPORT_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="summary" className="space-y-4">
          <ReportTabPanel
            isLoading={summaryQuery.isLoading}
            isError={summaryQuery.isError}
            loadingLabel="Loading volume summary..."
            onRetry={() => void summaryQuery.refetch()}
          >
            <ReportKpiCards
              aria-label="Volume summary"
              items={[
                {
                  label: 'Total',
                  value: formatReportCount(summaryQuery.data?.total ?? 0),
                  icon: FileStack,
                  tone: 'blue',
                },
                {
                  label: 'Active',
                  value: formatReportCount(summaryQuery.data?.active ?? 0),
                  icon: Clock3,
                  tone: 'amber',
                },
                {
                  label: 'Released',
                  value: formatReportCount(summaryQuery.data?.released ?? 0),
                  icon: PackageCheck,
                  tone: 'emerald',
                },
                {
                  label: 'Cancelled',
                  value: formatReportCount(summaryQuery.data?.cancelled ?? 0),
                  icon: Ban,
                  tone: 'slate',
                },
                {
                  label: 'Disposed',
                  value: formatReportCount(summaryQuery.data?.disposed ?? 0),
                  icon: Trash2,
                  tone: 'slate',
                },
              ]}
            />
          </ReportTabPanel>
        </TabsContent>

        <TabsContent value="status-breakdown" className="space-y-4">
          <ReportTabPanel
            isLoading={statusQuery.isLoading}
            isError={statusQuery.isError}
            loadingLabel="Loading status breakdown..."
            onRetry={() => void statusQuery.refetch()}
          >
            <ReportPieChart
              title="Applications by status"
              data={(statusQuery.data?.rows ?? []).map((row) => ({
                label: row.status,
                value: row.count,
              }))}
            />
            <SimpleReportTable
              columns={['Status', 'Count', '%']}
              rows={(statusQuery.data?.rows ?? []).map((row) => [
                row.status,
                formatReportCount(row.count),
                formatReportPercent(row.percentage),
              ])}
            />
          </ReportTabPanel>
        </TabsContent>

        <TabsContent value="document-demand" className="space-y-4">
          <ReportTabPanel
            isLoading={documentQuery.isLoading}
            isError={documentQuery.isError}
            loadingLabel="Loading document demand..."
            onRetry={() => void documentQuery.refetch()}
          >
            <ReportBarChart
              title="Top requested documents"
              data={(documentQuery.data?.rows ?? []).slice(0, 8).map((row) => ({
                label: row.name,
                value: row.application_count,
              }))}
            />
            <SimpleReportTable
              columns={['Document', 'Applications', 'Quantity', 'Share %']}
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
            loadingLabel="Loading revenue report..."
            onRetry={() => void revenueQuery.refetch()}
          >
            <ReportKpiCards
              aria-label="Revenue summary"
              items={[
                {
                  label: 'Grand total',
                  value: formatReportCurrency(
                    revenueQuery.data?.grand_total ?? 0,
                  ),
                  icon: CircleDollarSign,
                  tone: 'blue',
                },
                {
                  label: 'Paid',
                  value: formatReportCurrency(
                    revenueQuery.data?.paid_total ?? 0,
                  ),
                  icon: CheckCircle2,
                  tone: 'emerald',
                },
                {
                  label: 'Unpaid',
                  value: formatReportCurrency(
                    revenueQuery.data?.unpaid_total ?? 0,
                  ),
                  tone: 'amber',
                },
              ]}
            />
            <SimpleReportTable
              columns={['Document', 'Qty', 'Amount', 'Share %']}
              rows={(revenueQuery.data?.rows ?? []).map((row) => [
                row.name,
                formatReportCount(row.total_quantity),
                formatReportCurrency(row.total_amount),
                formatReportPercent(row.share_percent),
              ])}
            />
          </ReportTabPanel>
        </TabsContent>

        <TabsContent value="release-mode" className="space-y-4">
          <ReportTabPanel
            isLoading={releaseModeQuery.isLoading}
            isError={releaseModeQuery.isError}
            loadingLabel="Loading release mode distribution..."
            onRetry={() => void releaseModeQuery.refetch()}
          >
            <ReportPieChart
              title="Release method distribution"
              data={(releaseModeQuery.data?.rows ?? []).map((row) => ({
                label: row.receive_mode,
                value: row.count,
              }))}
            />
            <SimpleReportTable
              columns={['Mode', 'Count', '%']}
              rows={(releaseModeQuery.data?.rows ?? []).map((row) => [
                row.receive_mode,
                formatReportCount(row.count),
                formatReportPercent(row.percentage),
              ])}
            />
          </ReportTabPanel>
        </TabsContent>

        <TabsContent value="turnaround" className="space-y-4">
          <ReportTabPanel
            isLoading={turnaroundQuery.isLoading}
            isError={turnaroundQuery.isError}
            loadingLabel="Loading turnaround metrics..."
            onRetry={() => void turnaroundQuery.refetch()}
          >
            <ReportKpiCards
              aria-label="Turnaround metrics"
              items={[
                {
                  label: 'Sample size',
                  value: formatReportCount(
                    turnaroundQuery.data?.sample_size ?? 0,
                  ),
                  tone: 'blue',
                },
                {
                  label: 'Average days',
                  value: formatReportDays(turnaroundQuery.data?.average_days),
                  tone: 'amber',
                },
                {
                  label: 'Median days',
                  value: formatReportDays(turnaroundQuery.data?.median_days),
                  tone: 'emerald',
                },
                {
                  label: 'P90 days',
                  value: formatReportDays(turnaroundQuery.data?.p90_days),
                  tone: 'slate',
                },
              ]}
            />
          </ReportTabPanel>
        </TabsContent>

        <TabsContent value="payment-status" className="space-y-4">
          <ReportTabPanel
            isLoading={paymentQuery.isLoading}
            isError={paymentQuery.isError}
            loadingLabel="Loading payment status..."
            onRetry={() => void paymentQuery.refetch()}
          >
            <ReportKpiCards
              aria-label="Payment status summary"
              items={[
                {
                  label: 'Total',
                  value: formatReportCount(paymentQuery.data?.total ?? 0),
                  tone: 'blue',
                },
                {
                  label: 'Paid',
                  value: formatReportCount(paymentQuery.data?.paid ?? 0),
                  icon: CheckCircle2,
                  tone: 'emerald',
                },
                {
                  label: 'Unpaid',
                  value: formatReportCount(paymentQuery.data?.unpaid ?? 0),
                  tone: 'amber',
                },
                {
                  label: 'Conversion %',
                  value: formatReportPercent(
                    paymentQuery.data?.conversion_rate ?? 0,
                  ),
                  tone: 'slate',
                },
              ]}
            />
            <ReportPieChart
              title="Paid vs unpaid"
              data={[
                { label: 'Paid', value: paymentQuery.data?.paid ?? 0 },
                { label: 'Unpaid', value: paymentQuery.data?.unpaid ?? 0 },
              ]}
            />
          </ReportTabPanel>
        </TabsContent>

        <TabsContent value="clearance-bottlenecks" className="space-y-4">
          <ReportTabPanel
            isLoading={clearanceQuery.isLoading}
            isError={clearanceQuery.isError}
            loadingLabel="Loading clearance bottlenecks..."
            onRetry={() => void clearanceQuery.refetch()}
          >
            <ReportBarChart
              title="Pending clearances by department"
              data={(clearanceQuery.data?.rows ?? []).map((row) => ({
                label: row.clearance_name,
                value: row.pending_count,
              }))}
            />
            <SimpleReportTable
              columns={['Department', 'Pending', 'Avg days pending']}
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
            loadingLabel="Loading course breakdown..."
            onRetry={() => void courseQuery.refetch()}
          >
            <ReportBarChart
              title="Applications by course"
              data={(courseQuery.data?.rows ?? []).slice(0, 10).map((row) => ({
                label: row.course_id,
                value: row.count,
              }))}
            />
            <SimpleReportTable
              columns={['Course', 'Count', '%']}
              rows={(courseQuery.data?.rows ?? []).map((row) => [
                row.course_id,
                formatReportCount(row.count),
                formatReportPercent(row.percentage),
              ])}
            />
          </ReportTabPanel>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <ReportTabPanel
            isLoading={trendsQuery.isLoading}
            isError={trendsQuery.isError}
            loadingLabel="Loading trends..."
            onRetry={() => void trendsQuery.refetch()}
          >
            <ReportBarChart
              title="Applications over time"
              data={(trendsQuery.data?.rows ?? []).map((row) => ({
                label: row.period,
                value: row.count,
              }))}
            />
            <SimpleReportTable
              columns={['School year', 'Semester', 'Period', 'Count']}
              rows={(trendsQuery.data?.rows ?? []).map((row) => [
                row.school_year,
                row.semester,
                row.period,
                formatReportCount(row.count),
              ])}
            />
          </ReportTabPanel>
        </TabsContent>

        <TabsContent value="foreigner-split" className="space-y-4">
          <ReportTabPanel
            isLoading={foreignerQuery.isLoading}
            isError={foreignerQuery.isError}
            loadingLabel="Loading foreigner split..."
            onRetry={() => void foreignerQuery.refetch()}
          >
            <ReportPieChart
              title="Local vs foreigner volume"
              data={(foreignerQuery.data?.segments ?? []).map((segment) => ({
                label: segment.segment,
                value: segment.count,
              }))}
            />
            <SimpleReportTable
              columns={['Segment', 'Count', 'Revenue']}
              rows={(foreignerQuery.data?.segments ?? []).map((segment) => [
                segment.segment,
                formatReportCount(segment.count),
                formatReportCurrency(segment.revenue),
              ])}
            />
          </ReportTabPanel>
        </TabsContent>
      </Tabs>
    </DrsPageShell>
  );
}
