import {
  queueReportExport,
  type ReportFilters,
  type ReportType,
} from '@/api/reports.ts';
import { Button } from '@repo/ui/components/button';
import { Spinner } from '@repo/ui/components/spinner';
import { toast } from '@repo/ui/exports';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';

type ReportExportActionsProps = {
  reportType: ReportType;
  filters: ReportFilters;
  reportTitle: string;
  pdfPayload: Record<string, unknown>;
};

function exportErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
  ) {
    const data = (error.response as { data?: { message?: unknown } }).data;
    if (typeof data?.message === 'string' && data.message.trim() !== '') {
      return data.message;
    }
  }

  return 'Could not email the report. Try again.';
}

export function ReportExportActions({
  reportType,
  filters,
  reportTitle,
  pdfPayload,
}: ReportExportActionsProps) {
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);

  const handleExcelExport = async () => {
    setIsEmailing(true);
    try {
      const message = await queueReportExport(reportType, filters);
      toast.success(message);
    } catch (error) {
      toast.error(exportErrorMessage(error));
    } finally {
      setIsEmailing(false);
    }
  };

  const handlePdfExport = async () => {
    setIsPdfExporting(true);

    try {
      const { downloadReportPdf } = await import('./-report-pdf-document.tsx');
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
      <Button
        type="button"
        variant="outline"
        onClick={() => void handleExcelExport()}
        disabled={isEmailing}
      >
        {isEmailing ? (
          <Spinner className="mr-2 size-4" />
        ) : (
          <FileSpreadsheet className="mr-2 size-4" />
        )}
        {isEmailing ? 'Emailing…' : 'Email Excel'}
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
