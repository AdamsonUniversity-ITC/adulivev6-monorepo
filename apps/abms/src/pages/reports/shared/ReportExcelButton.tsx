import { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { toast } from 'sonner';
import { exportReportElementToExcel } from './reportExcel';

export function ReportExcelButton() {
  const [exporting, setExporting] = useState(false);

  const exportReport = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const dialog = event.currentTarget.closest<HTMLElement>('[role="dialog"]');
    const report = dialog?.querySelector<HTMLElement>('article');
    if (!report) {
      toast.error('The active report preview could not be found.');
      return;
    }

    setExporting(true);
    try {
      const filename = await exportReportElementToExcel(report);
      toast.success(`Excel report exported as ${filename}.`);
    } catch (error) {
      console.error('Unable to export ABMS report to Excel.', error);
      toast.error('Unable to export this report to Excel. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button type="button" variant="outline" onClick={exportReport} disabled={exporting} aria-busy={exporting}>
      {exporting
        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        : <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />}
      {exporting ? 'Exporting...' : 'Export to Excel'}
    </Button>
  );
}
