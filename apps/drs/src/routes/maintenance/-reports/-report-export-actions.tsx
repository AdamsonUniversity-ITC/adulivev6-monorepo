import {
  buildReportExportUrl,
  type ReportFilters,
  type ReportType,
} from '@/api/reports.ts';
import { Button } from '@repo/ui/components/button';
import { Spinner } from '@repo/ui/components/spinner';
import { toast } from '@repo/ui/exports';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { downloadReportPdf } from './-report-pdf-document.tsx';

type ReportExportActionsProps = {
  reportType: ReportType;
  filters: ReportFilters;
  reportTitle: string;
  pdfPayload: Record<string, unknown>;
};

export function ReportExportActions({
  reportType,
  filters,
  reportTitle,
  pdfPayload,
}: ReportExportActionsProps) {
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  const handleExcelExport = () => {
    window.location.assign(buildReportExportUrl(reportType, filters));
    toast.success('Excel download started');
  };

  const handlePdfExport = async () => {
    setIsPdfExporting(true);

    try {
      await downloadReportPdf({
        reportType,
        title: reportTitle,
        filters,
        payload: pdfPayload,
      });
      toast.success('PDF downloaded');
    } catch {
      toast.error('Could not generate PDF. Try again or use Excel export.');
    } finally {
      setIsPdfExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={handleExcelExport}>
        <FileSpreadsheet className="mr-2 size-4" />
        Download Excel
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => void handlePdfExport()}
        disabled={isPdfExporting}
      >
        {isPdfExporting ? (
          <Spinner className="mr-2 size-4" />
        ) : (
          <Download className="mr-2 size-4" />
        )}
        {isPdfExporting ? 'Generating PDF...' : 'Download PDF'}
      </Button>
    </div>
  );
}
