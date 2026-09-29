import type {
  ByCourseReport,
  ClearanceBottleneckReport,
  DayToDayReport,
  DocumentDemandReport,
  ForeignerSplitReport,
  PaymentStatusReport,
  ReleaseModeReport,
  ReportFilters,
  ReportType,
  RevenueReport,
  StatusBreakdownReport,
  SummaryReport,
  TatByStatusReport,
  TrendsReport,
  TurnaroundReport,
} from '@/api/reports.ts';
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer';
import {
  formatFiltersSummary,
  formatReportCount,
  formatReportCurrency,
  formatReportDays,
  formatReportLabel,
  formatReportPercent,
} from './-report-utils.ts';

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
    marginTop: 4,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    width: '30%',
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: 700,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  headerCell: {
    flex: 1,
    fontSize: 9,
    fontWeight: 700,
  },
  cell: {
    flex: 1,
    fontSize: 9,
  },
});

type PdfDownloadInput = {
  reportType: ReportType;
  title: string;
  filters: ReportFilters;
  payload: Record<string, unknown>;
};

function KpiSection({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  if (items.length === 0) return null;

  return (
    <View>
      <Text style={styles.sectionTitle}>Summary</Text>
      <View style={styles.kpiRow}>
        {items.map((item) => (
          <View key={item.label} style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{item.label}</Text>
            <Text style={styles.kpiValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  if (rows.length === 0) {
    return (
      <Text style={styles.subtitle}>No data for the selected filters.</Text>
    );
  }

  return (
    <View>
      <View style={styles.tableHeader}>
        {columns.map((column) => (
          <Text key={column} style={styles.headerCell}>
            {column}
          </Text>
        ))}
      </View>
      {rows.map((row, index) => (
        <View key={index} style={styles.tableRow}>
          {row.map((cell, cellIndex) => (
            <Text key={`${index}-${cellIndex}`} style={styles.cell}>
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function renderReportBody(
  reportType: ReportType,
  payload: Record<string, unknown>,
) {
  switch (reportType) {
    case 'summary': {
      const data = payload.summary as SummaryReport | undefined;
      return (
        <KpiSection
          items={[
            { label: 'Total', value: formatReportCount(data?.total ?? 0) },
            { label: 'Active', value: formatReportCount(data?.active ?? 0) },
            {
              label: 'Released',
              value: formatReportCount(data?.released ?? 0),
            },
            {
              label: 'Cancelled',
              value: formatReportCount(data?.cancelled ?? 0),
            },
            {
              label: 'Disposed',
              value: formatReportCount(data?.disposed ?? 0),
            },
          ]}
        />
      );
    }
    case 'status-breakdown': {
      const summary = payload.summary as SummaryReport | undefined;
      const trends = payload.trends as TrendsReport | undefined;
      const data = payload.statusBreakdown as StatusBreakdownReport | undefined;
      const release = payload.releaseMode as ReleaseModeReport | undefined;
      const foreigner = payload.foreignerSplit as
        | ForeignerSplitReport
        | undefined;
      return (
        <>
          <KpiSection
            items={[
              { label: 'Total', value: formatReportCount(summary?.total ?? 0) },
              {
                label: 'Active',
                value: formatReportCount(summary?.active ?? 0),
              },
              {
                label: 'Released',
                value: formatReportCount(summary?.released ?? 0),
              },
              {
                label: 'Cancelled',
                value: formatReportCount(summary?.cancelled ?? 0),
              },
              {
                label: 'Disposed',
                value: formatReportCount(summary?.disposed ?? 0),
              },
            ]}
          />
          {(trends?.rows ?? []).length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Applications over time</Text>
              <DataTable
                columns={['School year', 'Semester', 'Period', 'Count']}
                rows={(trends?.rows ?? []).map((row) => [
                  row.school_year,
                  formatReportLabel(row.semester),
                  row.period,
                  formatReportCount(row.count),
                ])}
              />
            </>
          ) : null}
          <Text style={styles.sectionTitle}>Status</Text>
          <DataTable
            columns={['Status', 'Count', 'Share']}
            rows={(data?.rows ?? []).map((row) => [
              formatReportLabel(row.status),
              formatReportCount(row.count),
              formatReportPercent(row.percentage),
            ])}
          />
          <Text style={styles.sectionTitle}>Release mode</Text>
          <DataTable
            columns={['Release mode', 'Count', 'Share']}
            rows={(release?.rows ?? []).map((row) => [
              formatReportLabel(row.receive_mode),
              formatReportCount(row.count),
              formatReportPercent(row.percentage),
            ])}
          />
          <Text style={styles.sectionTitle}>Local and foreigner</Text>
          <DataTable
            columns={['Segment', 'Count', 'Revenue']}
            rows={(foreigner?.segments ?? []).map((segment) => [
              formatReportLabel(segment.segment),
              formatReportCount(segment.count),
              formatReportCurrency(segment.revenue),
            ])}
          />
        </>
      );
    }
    case 'document-demand': {
      const data = payload.documentDemand as DocumentDemandReport | undefined;
      return (
        <>
          <KpiSection
            items={[
              {
                label: 'Total applications',
                value: formatReportCount(data?.total_applications ?? 0),
              },
            ]}
          />
          <Text style={styles.sectionTitle}>Document demand</Text>
          <DataTable
            columns={['Document', 'Applications', 'Quantity', 'Share']}
            rows={(data?.rows ?? []).map((row) => [
              row.name,
              formatReportCount(row.application_count),
              formatReportCount(row.total_quantity),
              formatReportPercent(row.share_percent),
            ])}
          />
        </>
      );
    }
    case 'revenue': {
      const data = payload.revenue as RevenueReport | undefined;
      return (
        <>
          <KpiSection
            items={[
              {
                label: 'Grand total',
                value: formatReportCurrency(data?.grand_total ?? 0),
              },
              {
                label: 'Paid',
                value: formatReportCurrency(data?.paid_total ?? 0),
              },
              {
                label: 'Unpaid',
                value: formatReportCurrency(data?.unpaid_total ?? 0),
              },
            ]}
          />
          <Text style={styles.sectionTitle}>Revenue by document</Text>
          <DataTable
            columns={['Document', 'Quantity', 'Amount', 'Share']}
            rows={(data?.rows ?? []).map((row) => [
              row.name,
              formatReportCount(row.total_quantity),
              formatReportCurrency(row.total_amount),
              formatReportPercent(row.share_percent),
            ])}
          />
        </>
      );
    }
    case 'release-mode': {
      const data = payload.releaseMode as ReleaseModeReport | undefined;
      return (
        <>
          <KpiSection
            items={[
              {
                label: 'Total applications',
                value: formatReportCount(data?.total ?? 0),
              },
            ]}
          />
          <Text style={styles.sectionTitle}>Release mode distribution</Text>
          <DataTable
            columns={['Release mode', 'Count', 'Share']}
            rows={(data?.rows ?? []).map((row) => [
              formatReportLabel(row.receive_mode),
              formatReportCount(row.count),
              formatReportPercent(row.percentage),
            ])}
          />
        </>
      );
    }
    case 'turnaround': {
      const data = payload.turnaround as TurnaroundReport | undefined;
      const stages = payload.tatByStatus as TatByStatusReport | undefined;
      return (
        <>
          <KpiSection
            items={[
              {
                label: 'Sample size',
                value: formatReportCount(data?.sample_size ?? 0),
              },
              {
                label: 'Average days',
                value: formatReportDays(data?.average_days),
              },
              {
                label: 'Median days',
                value: formatReportDays(data?.median_days),
              },
              {
                label: '90th percentile',
                value: formatReportDays(data?.p90_days),
              },
            ]}
          />
          <Text style={styles.sectionTitle}>Average days by stage</Text>
          <DataTable
            columns={['Status', 'Sample size', 'Average days', 'Median days']}
            rows={(stages?.rows ?? []).map((row) => [
              row.status_label,
              formatReportCount(row.sample_size),
              formatReportDays(row.average_days),
              formatReportDays(row.median_days),
            ])}
          />
        </>
      );
    }
    case 'tat-by-status': {
      const data = payload.tatByStatus as TatByStatusReport | undefined;
      return (
        <>
          <Text style={styles.sectionTitle}>Average days by stage</Text>
          <DataTable
            columns={['Status', 'Sample size', 'Average days', 'Median days']}
            rows={(data?.rows ?? []).map((row) => [
              row.status_label,
              formatReportCount(row.sample_size),
              formatReportDays(row.average_days),
              formatReportDays(row.median_days),
            ])}
          />
        </>
      );
    }
    case 'payment-status': {
      const summary = payload.summary as SummaryReport | undefined;
      const data = payload.paymentStatus as PaymentStatusReport | undefined;
      return (
        <>
          {summary ? (
            <KpiSection
              items={[
                {
                  label: 'Total',
                  value: formatReportCount(summary.total ?? 0),
                },
                {
                  label: 'Active',
                  value: formatReportCount(summary.active ?? 0),
                },
                {
                  label: 'Released',
                  value: formatReportCount(summary.released ?? 0),
                },
                {
                  label: 'Cancelled',
                  value: formatReportCount(summary.cancelled ?? 0),
                },
                {
                  label: 'Disposed',
                  value: formatReportCount(summary.disposed ?? 0),
                },
              ]}
            />
          ) : null}
          <KpiSection
            items={[
              { label: 'Total', value: formatReportCount(data?.total ?? 0) },
              { label: 'Paid', value: formatReportCount(data?.paid ?? 0) },
              { label: 'Unpaid', value: formatReportCount(data?.unpaid ?? 0) },
              {
                label: 'Paid share',
                value: formatReportPercent(data?.conversion_rate ?? 0),
              },
            ]}
          />
        </>
      );
    }
    case 'clearance-bottlenecks': {
      const summary = payload.summary as SummaryReport | undefined;
      const data = payload.clearanceBottlenecks as
        | ClearanceBottleneckReport
        | undefined;
      return (
        <>
          {summary ? (
            <KpiSection
              items={[
                {
                  label: 'Total',
                  value: formatReportCount(summary.total ?? 0),
                },
                {
                  label: 'Active',
                  value: formatReportCount(summary.active ?? 0),
                },
                {
                  label: 'Released',
                  value: formatReportCount(summary.released ?? 0),
                },
                {
                  label: 'Cancelled',
                  value: formatReportCount(summary.cancelled ?? 0),
                },
                {
                  label: 'Disposed',
                  value: formatReportCount(summary.disposed ?? 0),
                },
              ]}
            />
          ) : null}
          <Text style={styles.sectionTitle}>Clearances</Text>
          <DataTable
            columns={['Department', 'Pending', 'Average days pending']}
            rows={(data?.rows ?? []).map((row) => [
              row.clearance_name,
              formatReportCount(row.pending_count),
              formatReportDays(row.avg_days_pending),
            ])}
          />
        </>
      );
    }
    case 'by-course': {
      const data = payload.byCourse as ByCourseReport | undefined;
      return (
        <>
          <KpiSection
            items={[
              {
                label: 'Total applications',
                value: formatReportCount(data?.total ?? 0),
              },
            ]}
          />
          <Text style={styles.sectionTitle}>Applications by course</Text>
          <DataTable
            columns={['Course', 'Count', 'Share']}
            rows={(data?.rows ?? []).map((row) => [
              row.course_id,
              formatReportCount(row.count),
              formatReportPercent(row.percentage),
            ])}
          />
        </>
      );
    }
    case 'trends': {
      const data = payload.trends as TrendsReport | undefined;
      return (
        <>
          <Text style={styles.sectionTitle}>Application trends</Text>
          <DataTable
            columns={['School year', 'Semester', 'Period', 'Count']}
            rows={(data?.rows ?? []).map((row) => [
              row.school_year,
              formatReportLabel(row.semester),
              row.period,
              formatReportCount(row.count),
            ])}
          />
        </>
      );
    }
    case 'foreigner-split': {
      const data = payload.foreignerSplit as ForeignerSplitReport | undefined;
      return (
        <>
          <KpiSection
            items={[
              {
                label: 'Total applications',
                value: formatReportCount(data?.total ?? 0),
              },
            ]}
          />
          <Text style={styles.sectionTitle}>Local vs foreigner split</Text>
          <DataTable
            columns={['Segment', 'Count', 'Revenue']}
            rows={(data?.segments ?? []).map((segment) => [
              formatReportLabel(segment.segment),
              formatReportCount(segment.count),
              formatReportCurrency(segment.revenue),
            ])}
          />
        </>
      );
    }
    case 'day-to-day': {
      const data = payload.dayToDay as DayToDayReport | undefined;
      return (
        <>
          <Text style={styles.sectionTitle}>Day to day transactions</Text>
          <DataTable
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
            rows={(data?.rows ?? []).map((row) => [
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
        </>
      );
    }
    default:
      return null;
  }
}

function ReportPdfDocument({
  reportType,
  title,
  filters,
  payload,
}: PdfDownloadInput) {
  return (
    <Document>
      <Page
        size="A4"
        orientation={reportType === 'day-to-day' ? 'landscape' : 'portrait'}
        style={styles.page}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{formatFiltersSummary(filters)}</Text>
        {renderReportBody(reportType, payload)}
      </Page>
    </Document>
  );
}

export async function downloadReportPdf(
  input: PdfDownloadInput,
): Promise<void> {
  const blob = await pdf(<ReportPdfDocument {...input} />).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `drs-report-${input.reportType}-${Date.now()}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
