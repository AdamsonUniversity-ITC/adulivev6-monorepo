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
import { unservedRsRoute } from '../../router';
import { FieldError, Page, PageHeader, PageSurface } from '../../components/ui/Page';
import { ReportFilterCombobox } from './shared/ReportFilterCombobox';
import { ReportPrintPortal } from './shared/ReportPrintPortal';
import { formatMoney } from './shared/money';
import './shared/report-print.css';

type LocationOption = { value: string; label: string };
type ReportUnit = { type: 'department' | 'section' | 'unmapped'; id: number | null; name: string; active: boolean };
type Row = { id: number; requisition_date: string; requisition_number: string; unit: ReportUnit; location: string; status: string; total_amount: string; certified_date: string | null };
type StatusGroup = { status: LocationOption; rows: Row[]; totals: { total_amount: string } };
type LocationGroup = { location: LocationOption; status_groups: StatusGroup[]; totals: { total_amount: string } };
type Preview = { report: { from: string; to: string; location: string | null; printed_by: string }; location_groups: LocationGroup[]; grand_total: { total_amount: string }; data_quality: { complete: boolean; warnings: Array<{ code: string; message: string }>; calculation_timezone: string; inclusive_period: { start: string; end: string } } };
type LoaderPayload = { locations?: LocationOption[] };
type Errors = Partial<Record<'from' | 'to' | 'location', string>>;
type ApiFailure = { response?: { data?: { message?: string; errors?: Record<string, string[] | string> } } };

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const validOption = (value: unknown): value is LocationOption => isRecord(value) && typeof value.value === 'string' && typeof value.label === 'string';
const validUnit = (value: unknown): value is ReportUnit => isRecord(value) && ['department', 'section', 'unmapped'].includes(String(value.type)) && (typeof value.id === 'number' || value.id === null) && typeof value.name === 'string' && typeof value.active === 'boolean';
const validRow = (value: unknown): value is Row => isRecord(value) && typeof value.id === 'number' && typeof value.requisition_date === 'string' && typeof value.requisition_number === 'string' && validUnit(value.unit) && typeof value.location === 'string' && typeof value.status === 'string' && typeof value.total_amount === 'string' && (typeof value.certified_date === 'string' || value.certified_date === null);
const validTotals = (value: unknown) => isRecord(value) && typeof value.total_amount === 'string';
const parsePreview = (value: unknown): Preview | null => {
  if (!isRecord(value) || !isRecord(value.report) || typeof value.report.from !== 'string' || typeof value.report.to !== 'string' || typeof value.report.printed_by !== 'string' || !Array.isArray(value.location_groups) || !validTotals(value.grand_total) || !isRecord(value.data_quality) || typeof value.data_quality.complete !== 'boolean' || !Array.isArray(value.data_quality.warnings)) return null;
  for (const location of value.location_groups) {
    if (!isRecord(location) || !validOption(location.location) || !Array.isArray(location.status_groups) || !validTotals(location.totals)) return null;
    for (const status of location.status_groups) {
      if (!isRecord(status) || !validOption(status.status) || !Array.isArray(status.rows) || !status.rows.every(validRow) || !validTotals(status.totals)) return null;
    }
  }
  return value as unknown as Preview;
};
const errorMessage = (error: unknown) => { const data = (error as ApiFailure)?.response?.data; return Object.values(data?.errors ?? {}).flat()[0] || data?.message || 'The Unserved RS report could not be loaded. Please review the filters and try again.'; };
const formatDate = (value: string | null) => { if (!value) return '—'; const [year, month, day] = value.split('-'); return year && month && day ? `${month}/${day}/${year}` : value; };
const unitBadge = (unit: ReportUnit) => unit.type === 'department' ? 'DEPARTMENT' : unit.type === 'section' ? 'SECTION' : 'UNMAPPED';

function PrintPreview({ preview, onClose }: { preview: Preview; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { const overflow = document.body.style.overflow; const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; document.body.style.overflow = 'hidden'; document.addEventListener('keydown', keydown); closeRef.current?.focus(); return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); }; }, [onClose]);
  return <ReportPrintPortal><div className="unserved-report-preview abms-letter-preview fixed inset-0 z-[100] overflow-auto bg-slate-600/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Unserved RS print preview">
    <div className="report-actions abms-letter-actions mx-auto mb-3 flex justify-end gap-2"><Button ref={closeRef} variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" />Close</Button><Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button></div>
    <article className="unserved-report abms-letter-sheet mx-auto bg-white p-7 text-black shadow-2xl sm:p-10">
      <header><h1>ADAMSON UNIVERSITY</h1><h2>UNSERVED RS (Period: {formatDate(preview.report.from)} - {formatDate(preview.report.to)})</h2></header>
      {!preview.location_groups.length && <p className="empty">No unserved requisitions were found for this period.</p>}
      {preview.location_groups.map((location, locationIndex) => <section className="location-group" key={location.location.value}><h3>Location: {location.location.label}</h3>{location.status_groups.map(status => <section className="status-group" key={status.status.value}><h4>Status: {status.status.label}</h4><table><thead><tr><th>Date</th><th>R.S. No.</th><th>Department / Section</th><th>Amount</th><th>Date Certified</th></tr></thead><tbody>{status.rows.map(row => <tr key={row.id}><td>{formatDate(row.requisition_date)}</td><td>{row.requisition_number}</td><td>{row.unit.name} <span className="unit-badge">{unitBadge(row.unit)}{row.unit.active || row.unit.type === 'unmapped' ? '' : ' · INACTIVE'}</span></td><td>{formatMoney(row.total_amount)}</td><td>{formatDate(row.certified_date)}</td></tr>)}<tr className="subtotal"><td colSpan={3}>Status Total:</td><td>{formatMoney(status.totals.total_amount)}</td><td /></tr></tbody></table></section>)}<div className="location-total"><span>Location Total:</span><b>{formatMoney(location.totals.total_amount)}</b></div>{locationIndex === preview.location_groups.length - 1 && <div className="grand-total"><span>Grand Total:</span><b>{formatMoney(preview.grand_total.total_amount)}</b></div>}</section>)}
      <footer>ABMS | Print Date: {new Date().toLocaleDateString()} | Printed By: {preview.report.printed_by}</footer>
    </article>
    <style>{`.unserved-report{font-family:Arial,sans-serif;font-size:10px}.unserved-report h1{font-size:18px;font-weight:800;margin:0}.unserved-report h2{font-size:12px;margin:2px 0 10px}.location-group{margin:10px 0}.location-group h3{font-size:12px;margin:0;border-bottom:1px solid #555;padding-bottom:4px}.status-group h4{font-size:11px;margin:7px 0 2px}.unserved-report table{width:100%;border-collapse:collapse;table-layout:fixed}.unserved-report th,.unserved-report td{padding:4px;text-align:left;font-variant-numeric:tabular-nums}.unserved-report thead{border-top:1px solid #777;border-bottom:1px solid #777}.unserved-report th:nth-child(1){width:12%}.unserved-report th:nth-child(2){width:17%}.unserved-report th:nth-child(3){width:43%}.unserved-report th:nth-child(4){width:14%}.unserved-report th:nth-child(5){width:14%}.unserved-report th:nth-child(4),.unserved-report td:nth-child(4){text-align:right}.unit-badge{font-size:8px;border:1px solid #777;border-radius:999px;padding:1px 5px;white-space:nowrap}.subtotal{border-top:1px solid #777;font-weight:700}.subtotal td:first-child{text-align:right}.location-total,.grand-total{margin-left:auto;width:35%;display:grid;grid-template-columns:1fr 45%;gap:8px;text-align:right;border-top:2px solid #555;padding:4px}.grand-total{border-bottom:3px double #555;font-size:11px}.empty{text-align:center;color:#555;padding:24px}.unserved-report footer{margin-top:18px;border-top:1px solid #555;padding-top:4px}@page{size:letter landscape;margin:0.35in}@media print{body *{visibility:hidden!important}.unserved-report-preview,.unserved-report-preview *{visibility:visible!important}.unserved-report-preview{position:absolute!important;inset:0!important;overflow:visible!important;background:white!important;padding:0!important}.report-actions{display:none!important}.unserved-report{box-shadow:none!important;max-width:none!important;min-height:0!important;padding:0!important}.location-group+.location-group{break-before:page}.status-group h4,.unserved-report thead,.subtotal,.location-total,.grand-total{break-inside:avoid}}`}</style>
  </div></ReportPrintPortal>;
}

export default function UnservedRs() {
  const navigate = useNavigate();
  const loader = unservedRsRoute.useLoaderData() as { data?: { data?: LoaderPayload } | LoaderPayload };
  const payload = ((loader?.data as { data?: LoaderPayload })?.data ?? loader?.data ?? {}) as LoaderPayload;
  const locations = useMemo(() => Array.isArray(payload.locations) ? payload.locations.filter(validOption) : [], [payload.locations]);
  const [location, setLocation] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [errors, setErrors] = useState<Errors>({}); const [previewError, setPreviewError] = useState<string | null>(null); const [preview, setPreview] = useState<Preview | null>(null); const [loading, setLoading] = useState(false);
  const openPreview = async () => { const next: Errors = {}; if (!from) next.from = 'From date is required.'; if (!to) next.to = 'To date is required.'; if (from && to && from > to) next.to = 'To date must be on or after the From date.'; setErrors(next); setPreviewError(null); if (Object.keys(next).length) return; setLoading(true); setPreview(null); try { const response = await financeSvc.get('/abms/unserved-rs/preview', { params: { from, to, ...(location ? { location } : {}) } }); const result = parsePreview(response.data); if (!result) { setPreviewError('The finance service returned an invalid preview response. Please try again.'); return; } if (!result.data_quality.complete || result.data_quality.warnings.length) toast.warning('Some requisition information requires attention.', { description: `${result.data_quality.warnings.length} data-quality notice${result.data_quality.warnings.length === 1 ? '' : 's'} found.`, duration: 10000 }); setPreview(result); } catch (error) { setPreviewError(errorMessage(error)); } finally { setLoading(false); } };
  return <AdamsonBudgetLayout><Toaster position="bottom-right" richColors closeButton /><Page width="default"><PageHeader title="Unserved RS" description="Review requisitions that have not yet reached a served status." /><PageSurface><Card className="border-0 bg-transparent shadow-none"><CardContent className="space-y-6 py-6"><div className="grid gap-5 md:grid-cols-3"><div className="space-y-1.5"><Label htmlFor="unserved-location">Location <span className="text-muted-foreground">(Optional · All locations)</span></Label><ReportFilterCombobox id="unserved-location" options={locations} value={location} disabled={loading || !locations.length} placeholder="All locations" searchPlaceholder="Search location..." emptyText="No location found." groupLabel="Current locations" clearLabel="All locations" onChange={value => { setLocation(value); setPreviewError(null); }} /></div><div><Label htmlFor="unserved-from">From</Label><Input id="unserved-from" type="date" value={from} disabled={loading} onChange={event => { setFrom(event.target.value); setPreviewError(null); setErrors(current => ({ ...current, from: undefined, to: undefined })); }} className="mt-1.5" /><FieldError>{errors.from}</FieldError></div><div><Label htmlFor="unserved-to">To</Label><Input id="unserved-to" type="date" value={to} min={from || undefined} disabled={loading} onChange={event => { setTo(event.target.value); setPreviewError(null); setErrors(current => ({ ...current, to: undefined })); }} className="mt-1.5" /><FieldError>{errors.to}</FieldError></div></div>{previewError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Unable to generate preview</AlertTitle><AlertDescription>{previewError}</AlertDescription></Alert>}<div className="flex justify-end gap-3 border-t border-[var(--abms-border)] pt-5"><Button variant="outline" onClick={() => navigate({ to: '/' })}>Close</Button><Button onClick={openPreview} disabled={loading} aria-busy={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading preview...</> : 'Preview'}</Button></div></CardContent></Card></PageSurface></Page>{preview && <PrintPreview preview={preview} onClose={() => setPreview(null)} />}</AdamsonBudgetLayout>;
}
