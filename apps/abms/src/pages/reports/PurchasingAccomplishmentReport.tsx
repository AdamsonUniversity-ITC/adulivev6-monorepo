import { useEffect, useRef, useState } from 'react';
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
import { purchasingAccomplishmentReportRoute } from '../../router';
import { FieldError, Page, PageHeader, PageSurface } from '../../components/ui/Page';
import { ReportPrintPortal } from './shared/ReportPrintPortal';
import './shared/report-print.css';

type LoaderPayload = { current_date?: string };
type Totals = { total_rs: number; processed_rs: number; pending_rs: number; cancelled_disapproved_rs: number };
type Warning = { code: string; message: string; affected_count?: number; entity_ids?: number[] };
type Preview = {
  report: { from: string; to: string; printed_by: string };
  totals: Totals;
  data_quality: { complete: boolean; warnings: Warning[]; calculation_timezone: string; inclusive_period: { start: string; end: string } };
};
type Errors = Partial<Record<'from' | 'to', string>>;
type ApiFailure = { response?: { data?: { message?: string; errors?: Record<string, string[] | string> } } };

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const isInteger = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0;
const parsePreview = (value: unknown): Preview | null => {
  if (!isRecord(value) || !isRecord(value.report) || !isRecord(value.totals) || !isRecord(value.data_quality)) return null;
  if (typeof value.report.from !== 'string' || typeof value.report.to !== 'string' || typeof value.report.printed_by !== 'string') return null;
  if (!isInteger(value.totals.total_rs) || !isInteger(value.totals.processed_rs) || !isInteger(value.totals.pending_rs) || !isInteger(value.totals.cancelled_disapproved_rs)) return null;
  if (typeof value.data_quality.complete !== 'boolean' || !Array.isArray(value.data_quality.warnings)) return null;
  return value as unknown as Preview;
};
const errorMessage = (error: unknown) => {
  const data = (error as ApiFailure)?.response?.data;
  return Object.values(data?.errors ?? {}).flat()[0] || data?.message || 'The Purchasing Accomplishment Report could not be loaded. Please review the dates and try again.';
};
const formatDate = (value: string) => {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${month}/${day}/${year}` : value;
};

function PrintPreview({ preview, onClose }: { preview: Preview; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const overflow = document.body.style.overflow;
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', keydown);
    closeRef.current?.focus();
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); };
  }, [onClose]);

  const summaries = [
    ['Total Number of RS', preview.totals.total_rs],
    ['Total Number of Processed RS', preview.totals.processed_rs],
    ['Total Number of Pending RS', preview.totals.pending_rs],
    ['Total Number of Cancelled/Disapproved RS', preview.totals.cancelled_disapproved_rs],
  ] as const;

  return <ReportPrintPortal><div className="purchasing-report-preview abms-letter-preview fixed inset-0 z-[100] overflow-auto bg-slate-600/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Purchasing Accomplishment Report print preview">
    <div className="report-actions abms-letter-actions mx-auto mb-3 flex justify-end gap-2">
      <Button ref={closeRef} variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" />Close</Button>
      <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
    </div>
    <article className="purchasing-report abms-letter-sheet mx-auto flex flex-col bg-white text-black shadow-2xl" data-report-title="Purchasing Accomplishment Report">
      <header className="text-center"><h1 className="m-0 font-extrabold">ADAMSON UNIVERSITY</h1><h2 className="mt-1 font-bold uppercase">Purchasing Accomplishment Report</h2><p className="!block text-center">Period: {formatDate(preview.report.from)} - {formatDate(preview.report.to)}</p></header>
      <table className="purchasing-summary-grid" aria-label="Purchasing accomplishment totals"><tbody>
        {summaries.map(([label, count]) => <tr className="purchasing-summary-card report-total" key={label}><td>{label}</td><td>{count.toLocaleString('en-US')}</td></tr>)}
      </tbody></table>
      <footer className="mt-auto border-t border-black pt-2">ABMS | Print Date: {new Date().toLocaleDateString()} | Printed By: {preview.report.printed_by}</footer>
    </article>
    <style>{`.purchasing-report{font-family:Arial,sans-serif}.purchasing-report header p{margin:8px 0 0}.purchasing-summary-grid,.purchasing-summary-grid tbody{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;width:100%;margin:auto 0;border-collapse:separate}.purchasing-summary-grid tbody{grid-column:1/-1}.purchasing-summary-card{display:flex;min-height:150px;flex-direction:column;align-items:center;justify-content:center;border:2px solid #334155;border-radius:10px;padding:14px;text-align:center}.purchasing-summary-card td{display:block;padding:0!important;border:0!important;text-align:center!important}.purchasing-summary-card td:first-child{min-height:48px;font-size:15px!important;font-weight:700}.purchasing-summary-card td:last-child{font-size:42px!important;font-weight:800;line-height:1!important;font-variant-numeric:tabular-nums}@media(max-width:900px){.purchasing-summary-grid,.purchasing-summary-grid tbody{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:540px){.purchasing-summary-grid,.purchasing-summary-grid tbody{grid-template-columns:1fr}}@page{size:letter landscape;margin:.3in}@media print{body *{visibility:hidden!important}.purchasing-report-preview,.purchasing-report-preview *{visibility:visible!important}.purchasing-report-preview{position:absolute!important;inset:0!important;overflow:visible!important;background:#fff!important;padding:0!important}.report-actions{display:none!important}.purchasing-report{max-width:none!important;min-height:7.9in!important;padding:0!important;box-shadow:none!important}.purchasing-summary-card{break-inside:avoid}}`}</style>
  </div></ReportPrintPortal>;
}

export default function PurchasingAccomplishmentReport() {
  const navigate = useNavigate();
  const loader = purchasingAccomplishmentReportRoute.useLoaderData() as { data?: { data?: LoaderPayload } | LoaderPayload };
  const payload = ((loader?.data as { data?: LoaderPayload })?.data ?? loader?.data ?? {}) as LoaderPayload;
  const [from, setFrom] = useState(payload.current_date ?? '');
  const [to, setTo] = useState(payload.current_date ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);

  const openPreview = async () => {
    const next: Errors = {};
    if (!from) next.from = 'From date is required.';
    if (!to) next.to = 'To date is required.';
    if (from && to && from > to) next.to = 'To date must be on or after the From date.';
    setErrors(next); setPreviewError(null);
    if (Object.keys(next).length) return;
    setLoading(true); setPreview(null);
    try {
      const response = await financeSvc.get('/abms/purchasing-accomplishment-report/preview', { params: { from, to } });
      const result = parsePreview(response.data);
      if (!result) { setPreviewError('The finance service returned an invalid preview response. Please try again.'); return; }
      if (!result.data_quality.complete || result.data_quality.warnings.length) toast.warning('Some purchasing history requires attention.', { description: `${result.data_quality.warnings.length} data-quality notice${result.data_quality.warnings.length === 1 ? '' : 's'} found.`, duration: 10000 });
      setPreview(result);
    } catch (error) { setPreviewError(errorMessage(error)); } finally { setLoading(false); }
  };

  return <AdamsonBudgetLayout><Toaster position="bottom-right" richColors closeButton /><Page width="default"><PageHeader title="Purchasing Accomplishment Report" description="Review requisitions received and processed by Purchasing during a selected arrival period." /><PageSurface><Card className="border-0 bg-transparent shadow-none"><CardContent className="space-y-6 py-6"><div className="grid gap-5 md:grid-cols-2"><div><Label htmlFor="purchasing-from">From</Label><Input id="purchasing-from" type="date" value={from} max={to || undefined} disabled={loading} onChange={event => { setFrom(event.target.value); setPreviewError(null); setErrors(current => ({ ...current, from: undefined, to: undefined })); }} className="mt-1.5" /><FieldError>{errors.from}</FieldError></div><div><Label htmlFor="purchasing-to">To</Label><Input id="purchasing-to" type="date" value={to} min={from || undefined} disabled={loading} onChange={event => { setTo(event.target.value); setPreviewError(null); setErrors(current => ({ ...current, to: undefined })); }} className="mt-1.5" /><FieldError>{errors.to}</FieldError></div></div>{previewError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Unable to generate preview</AlertTitle><AlertDescription>{previewError}</AlertDescription></Alert>}<div className="flex justify-end gap-3 border-t border-[var(--abms-border)] pt-5"><Button variant="outline" onClick={() => navigate({ to: '/' })}>Close</Button><Button onClick={openPreview} disabled={loading} aria-busy={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading preview...</> : 'Preview'}</Button></div></CardContent></Card></PageSurface></Page>{preview && <PrintPreview preview={preview} onClose={() => setPreview(null)} />}</AdamsonBudgetLayout>;
}
