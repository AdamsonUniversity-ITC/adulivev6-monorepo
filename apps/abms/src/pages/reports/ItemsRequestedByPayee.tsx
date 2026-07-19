import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Loader2, Printer, X } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/alert';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { toast, Toaster } from 'sonner';
import AdamsonBudgetLayout from '../../layouts/Screenlayout';
import { itemsrequestedbypayeeRoute } from '../../router';
import { FieldError, Page, PageHeader, PageSurface } from '../../components/ui/Page';
import { ReportFilterCombobox } from './shared/ReportFilterCombobox';
import { ReportPrintPortal } from './shared/ReportPrintPortal';
import './shared/report-print.css';

type Identifier = string | number;
type LoaderPayload = { school_years?: string[] };
type PayeeRow = {
  id: Identifier;
  payee: string;
  description: string;
  requisition_number: string;
  requisition_date: string;
  unit_cost: string;
  quantity: number;
  amount: string;
};
type Preview = {
  report: { school_year: string; from: string; to: string; printed_by: string };
  rows: PayeeRow[];
  grand_total: { total_amount: string };
  data_quality: {
    complete: boolean;
    warnings: Array<{ code: string; message: string; affected_count?: number; entity_ids?: Identifier[] }>;
    calculation_timezone: string;
    inclusive_period: { start: string; end: string };
  };
};
type Errors = Partial<Record<'schoolYear' | 'from' | 'to', string>>;
type ApiFailure = { response?: { data?: { message?: string; errors?: Record<string, string[] | string> } } };

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const validRow = (value: unknown) => isRecord(value)
  && (typeof value.id === 'string' || typeof value.id === 'number')
  && typeof value.payee === 'string' && typeof value.description === 'string'
  && typeof value.requisition_number === 'string' && typeof value.requisition_date === 'string'
  && typeof value.unit_cost === 'string' && typeof value.quantity === 'number'
  && Number.isFinite(value.quantity) && typeof value.amount === 'string';
const parsePreview = (value: unknown): Preview | null => {
  if (!isRecord(value) || !isRecord(value.report) || !isRecord(value.grand_total) || !isRecord(value.data_quality)) return null;
  const { report, data_quality: quality } = value;
  if (typeof report.school_year !== 'string' || typeof report.from !== 'string' || typeof report.to !== 'string'
    || typeof report.printed_by !== 'string' || !Array.isArray(value.rows) || !value.rows.every(validRow)
    || typeof value.grand_total.total_amount !== 'string' || typeof quality.complete !== 'boolean'
    || !Array.isArray(quality.warnings) || !quality.warnings.every(warning => isRecord(warning) && typeof warning.code === 'string' && typeof warning.message === 'string')
    || typeof quality.calculation_timezone !== 'string' || !isRecord(quality.inclusive_period)
    || typeof quality.inclusive_period.start !== 'string' || typeof quality.inclusive_period.end !== 'string') return null;
  return value as unknown as Preview;
};
const requestError = (error: unknown) => {
  const data = (error as ApiFailure)?.response?.data;
  return Object.values(data?.errors ?? {}).flat()[0] || data?.message || 'The items requested by payee report could not be loaded. Please review the filters and try again.';
};
const formatDate = (value: string) => {
  const [year, month, day] = value.split('-');
  return value ? `${month}/${day}/${year}` : '';
};

function PrintPreview({ preview, onClose }: { preview: Preview; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const overflow = document.body.style.overflow;
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden'; document.addEventListener('keydown', keydown); closeRef.current?.focus();
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); };
  }, [onClose]);
  return <ReportPrintPortal><div className="payee-report-preview abms-letter-preview fixed inset-0 z-[100] overflow-auto bg-slate-600/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Items requested by payee print preview">
    <div className="report-actions abms-letter-actions mx-auto mb-3 flex justify-end gap-2"><Button ref={closeRef} variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" />Close</Button><Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button></div>
    <article className="payee-report abms-letter-sheet mx-auto bg-white p-7 text-black shadow-2xl sm:p-10">
      <header><div><h1>ADAMSON UNIVERSITY</h1><h2>ITEMS REQUESTED BY PAYEE (Period: {formatDate(preview.report.from)} - {formatDate(preview.report.to)})</h2></div><p><b>School Year:</b><strong>{preview.report.school_year}</strong></p></header>
      <table className="payee-report-table"><thead><tr><th>Payee</th><th>Description</th><th>Requisition No.</th><th>Date</th><th>Unit Cost</th><th>Quantity</th><th>Amount</th></tr></thead><tbody>
        {!preview.rows.length && <tr className="report-empty"><td colSpan={7}>No requested items were found for this period.</td></tr>}
        {preview.rows.map(row => <tr key={String(row.id)}><td>{row.payee}</td><td>{row.description}</td><td>{row.requisition_number}</td><td>{formatDate(row.requisition_date)}</td><td>{row.unit_cost}</td><td>{row.quantity}</td><td>{row.amount}</td></tr>)}
        <tr className="report-total"><td colSpan={6}>Overall Total:</td><td>{preview.grand_total.total_amount}</td></tr>
      </tbody></table>
      <footer>-=xxx=- | Source: ABMS | Print Date: {new Date().toLocaleDateString()} | Printed By: {preview.report.printed_by}</footer>
    </article>
    <style>{`.payee-report{font-family:Arial,sans-serif;font-size:11px}.payee-report h1{font-size:20px;font-weight:800;margin:0}.payee-report h2{font-size:12px;margin:2px 0 10px}.payee-report header p{margin:3px 0;display:grid;grid-template-columns:100px 1fr}.payee-report-table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:8px}.payee-report-table thead{display:table-header-group;border-top:2px dashed #555;border-bottom:2px dashed #555}.payee-report-table th,.payee-report-table td{padding:4px;text-align:left;font-variant-numeric:tabular-nums}.payee-report-table th:nth-child(1){width:19%}.payee-report-table th:nth-child(2){width:28%}.payee-report-table th:nth-child(3){width:14%}.payee-report-table th:nth-child(4){width:11%}.payee-report-table th:nth-last-child(-n+3),.payee-report-table td:nth-last-child(-n+3){text-align:right}.report-total{font-weight:800;border-top:2px solid #555;border-bottom:2px double #555}.report-total td:first-child{text-align:right}.report-empty td{text-align:center!important;padding:20px;color:#555}.payee-report footer{margin-top:20px;border-top:2px dashed #555;padding-top:4px}@page{size:letter landscape;margin:0.35in}@media print{body *{visibility:hidden!important}.payee-report-preview,.payee-report-preview *{visibility:visible!important}.payee-report-preview{position:absolute!important;inset:0!important;overflow:visible!important;background:white!important;padding:0!important}.report-actions{display:none!important}.payee-report{box-shadow:none!important;max-width:none!important;min-height:0!important;padding:0!important}.report-total{break-inside:avoid}}`}</style>
  </div></ReportPrintPortal>;
}

export default function ItemsRequestedByPayee() {
  const navigate = useNavigate();
  const loader = itemsrequestedbypayeeRoute.useLoaderData() as { data?: { data?: LoaderPayload } | LoaderPayload };
  const payload = ((loader?.data as { data?: LoaderPayload })?.data ?? loader?.data ?? {}) as LoaderPayload;
  const [schoolYear, setSchoolYear] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const schoolYears = useMemo(() => Array.from(new Set(Array.isArray(payload.school_years) ? payload.school_years.filter((year): year is string => typeof year === 'string' && Boolean(year)) : [])).sort((a, b) => b.localeCompare(a)), [payload.school_years]);

  const openPreview = async () => {
    const next: Errors = {};
    if (!schoolYear) next.schoolYear = 'School year is required.';
    if (!from) next.from = 'From date is required.';
    if (!to) next.to = 'To date is required.';
    if (from && to && from > to) next.to = 'To date must be on or after the From date.';
    setErrors(next); setPreviewError(null);
    if (Object.keys(next).length) return;
    setLoading(true); setPreview(null);
    try {
      const response = await financeSvc.get('/abms/items-requested-by-payee/preview', { params: { school_year: schoolYear, from, to } });
      const nextPreview = parsePreview(response.data);
      if (!nextPreview) { setPreviewError('The finance service returned an invalid preview response. Please try again.'); return; }
      if (!nextPreview.data_quality.complete || nextPreview.data_quality.warnings.length) {
        const count = nextPreview.data_quality.warnings.length;
        toast.warning('Some requested-item history may be incomplete.', { description: count ? `${count} data-quality notice${count === 1 ? '' : 's'} found. The available rows are shown in the report.` : 'The available rows are shown in the report.', duration: 10000 });
      }
      setPreview(nextPreview);
    } catch (error) { setPreviewError(requestError(error)); } finally { setLoading(false); }
  };

  return <AdamsonBudgetLayout><Toaster position="bottom-right" richColors closeButton /><Page width="default">
    <PageHeader title="Items Requested by Payee" description="Review requested items and amounts by payee for an inclusive period." />
    <PageSurface><Card className="border-0 bg-transparent shadow-none"><CardContent className="space-y-6 py-6">
      {!schoolYears.length && <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">No school years are currently available.</p>}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-1.5"><Label htmlFor="payee-school-year">School Year</Label><ReportFilterCombobox id="payee-school-year" options={schoolYears.map(value => ({ value, label: value }))} value={schoolYear} disabled={loading || !schoolYears.length} placeholder="Select school year" searchPlaceholder="Search school year..." emptyText="No school year found." invalid={Boolean(errors.schoolYear)} errorId="payee-school-year-error" groupLabel="Available school years" onChange={value => { setSchoolYear(value); setPreviewError(null); setErrors(current => ({ ...current, schoolYear: undefined })); }} /><FieldError id="payee-school-year-error">{errors.schoolYear}</FieldError></div>
        <div><Label htmlFor="payee-from">From</Label><Input id="payee-from" type="date" value={from} disabled={loading} onChange={event => { setFrom(event.target.value); setPreviewError(null); setErrors(current => ({ ...current, from: undefined, to: undefined })); }} className="mt-1.5" /><FieldError>{errors.from}</FieldError></div>
        <div><Label htmlFor="payee-to">To</Label><Input id="payee-to" type="date" value={to} min={from || undefined} disabled={loading} onChange={event => { setTo(event.target.value); setPreviewError(null); setErrors(current => ({ ...current, to: undefined })); }} className="mt-1.5" /><FieldError>{errors.to}</FieldError></div>
      </div>
      {previewError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Unable to generate preview</AlertTitle><AlertDescription>{previewError}</AlertDescription></Alert>}
      <div className="flex justify-end gap-3 border-t border-[var(--abms-border)] pt-5"><Button variant="outline" onClick={() => navigate({ to: '/' })}>Close</Button><Button onClick={openPreview} disabled={loading || !schoolYears.length} aria-busy={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading preview...</> : 'Preview'}</Button></div>
    </CardContent></Card></PageSurface>
  </Page>{preview && <PrintPreview preview={preview} onClose={() => setPreview(null)} />}</AdamsonBudgetLayout>;
}
