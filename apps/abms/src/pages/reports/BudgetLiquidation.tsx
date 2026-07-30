import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Loader2, Printer, X } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/alert';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/radio-group';
import { toast, Toaster } from 'sonner';
import AdamsonBudgetLayout from '../../layouts/Screenlayout';
import { budgetliquidationRoute } from '../../router';
import { FieldError, Page, PageHeader, PageSurface } from '../../components/ui/Page';
import { ReportFilterCombobox } from './shared/ReportFilterCombobox';
import { ReportPrintPortal } from './shared/ReportPrintPortal';
import { formatMoney } from './shared/money';
import { getRequisitionDateDefaults, type RequisitionDateDefaultsPayload } from './shared/requisitionDateDefaults';
import './shared/report-print.css';

type Unit = { type: 'department' | 'section'; id: number; name: string; active: boolean };
type Account = { id: number | null; account_code: string; account_name: string };
type Totals = { total_amount: string; returned_amount: string; liquidated_amount: string };
type RequisitionRow = Totals & {
  id: number;
  requisition_number: string;
  requisition_date: string;
  liquidation_status: 'for_liquidation' | 'liquidated';
  liquidated_by: string | null;
  liquidation_date: string | null;
};
type ItemRow = { id: number; account: string; main_account: Account; sub_account: Account; description: string; unit_cost: string; quantity: string; unit_of_measurement: string; total_amount: string };
type RequisitionGroup = RequisitionRow & { items: ItemRow[] };
type AccountGroup = { main_account: Account; sub_accounts: Array<{ sub_account: Account; total_amount: string }>; total_amount: string };
type UnitGroup = { unit: Unit; rows: RequisitionRow[]; requisition_groups: RequisitionGroup[]; account_groups: AccountGroup[]; totals: Totals };
type Preview = {
  report: { school_year: string; all_units: boolean; unit: Unit | null; liquidation_scope: LiquidationScope; cash_advances: boolean; preview_type: PreviewType; summary_per_account: boolean; from: string; to: string; printed_by: string };
  unit_groups: UnitGroup[];
  grand_total: Totals;
  data_quality: { complete: boolean; warnings: Array<{ code: string; message: string }>; calculation_timezone: string; inclusive_from: string; inclusive_to: string };
};
type LoaderPayload = RequisitionDateDefaultsPayload & { school_years?: string[]; units?: Unit[]; unit_scope_restricted?: boolean };
type PreviewType = 'summary' | 'detailed';
type LiquidationScope = 'both' | 'for_liquidation' | 'liquidated';
type Errors = Partial<Record<'schoolYear' | 'unit' | 'from' | 'to', string>>;
type ApiFailure = { response?: { data?: { message?: string; errors?: Record<string, string[] | string> } } };

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const isMoney = (value: unknown) => typeof value === 'string';
const validTotals = (value: unknown) => isRecord(value) && isMoney(value.total_amount) && isMoney(value.returned_amount) && isMoney(value.liquidated_amount);
const validUnit = (value: unknown): value is Unit => isRecord(value) && (value.type === 'department' || value.type === 'section') && typeof value.id === 'number' && typeof value.name === 'string' && typeof value.active === 'boolean';
const validRequisition = (value: unknown) => isRecord(value) && typeof value.id === 'number' && typeof value.requisition_number === 'string' && typeof value.requisition_date === 'string' && validTotals(value);
const parsePreview = (value: unknown): Preview | null => {
  if (!isRecord(value) || !isRecord(value.report) || !validTotals(value.grand_total) || !isRecord(value.data_quality) || !Array.isArray(value.unit_groups)) return null;
  const quality = value.data_quality;
  if (typeof value.report.printed_by !== 'string' || typeof value.report.cash_advances !== 'boolean' || typeof quality.complete !== 'boolean' || !Array.isArray(quality.warnings)
    || !quality.warnings.every(warning => isRecord(warning) && typeof warning.code === 'string' && typeof warning.message === 'string')) return null;
  for (const group of value.unit_groups) {
    if (!isRecord(group) || !validUnit(group.unit) || !validTotals(group.totals) || !Array.isArray(group.rows)
      || !group.rows.every(validRequisition) || !Array.isArray(group.requisition_groups) || !group.requisition_groups.every(validRequisition)
      || !Array.isArray(group.account_groups)) return null;
  }
  return value as unknown as Preview;
};
const errorMessage = (error: unknown) => {
  const data = (error as ApiFailure)?.response?.data;
  return Object.values(data?.errors ?? {}).flat()[0] || data?.message || 'The budget liquidation report could not be loaded. Please review the filters and try again.';
};
const formatDate = (value: string | null) => {
  if (!value) return '—';
  const [date, time] = value.split(' ');
  const [year, month, day] = date.split('-');
  return `${month}/${day}/${year}${time ? ` ${time}` : ''}`;
};
const statusLabel = (status: RequisitionRow['liquidation_status']) => status === 'liquidated' ? 'Liquidated' : 'For Liquidation';

function ReportHeader({ preview }: { preview: Preview }) {
  const title = preview.report.summary_per_account ? 'BUDGET LIQUIDATION - SUMMARY PER DEPARTMENT AND ACCOUNT' : `BUDGET LIQUIDATION - ${preview.report.preview_type.toUpperCase()}`;
  const scope = preview.report.liquidation_scope === 'both' ? 'Both' : preview.report.liquidation_scope === 'liquidated' ? 'Liquidated' : 'For Liquidation';
  return <header><h1>ADAMSON UNIVERSITY</h1><h2>{title} (R.S. Date: {formatDate(preview.report.from)} - {formatDate(preview.report.to)})</h2><p><b>School Year:</b><strong>{preview.report.school_year}</strong></p><p><b>Status:</b><strong>{scope}</strong></p>{preview.report.cash_advances && <p><b>Filter:</b><strong>Cash Advances Only</strong></p>}</header>;
}

function RequisitionColumns() {
  return <thead><tr><th>R.S. Number</th><th>R.S. Date</th><th>Status</th><th>Liquidated By</th><th>Liquidation Date</th><th>Total Amount</th><th>Returned Amount</th><th>Liquidated Amount</th></tr></thead>;
}

function RequisitionCells({ row }: { row: RequisitionRow }) {
  return <><td>{row.requisition_number}</td><td>{formatDate(row.requisition_date)}</td><td>{statusLabel(row.liquidation_status)}</td><td>{row.liquidated_by ?? '—'}</td><td>{formatDate(row.liquidation_date)}</td><td>{formatMoney(row.total_amount)}</td><td>{formatMoney(row.returned_amount)}</td><td>{formatMoney(row.liquidated_amount)}</td></>;
}

function UnitSection({ preview, group }: { preview: Preview; group: UnitGroup }) {
  return <section className="liquidation-unit">
    <div className="unit-heading"><span>{group.unit.name}</span><span className="unit-tag">{group.unit.type === 'department' ? 'Department' : 'Section'}{group.unit.active ? '' : ' · Inactive'}</span></div>
    {preview.report.summary_per_account ? <div className="account-summary">
      {!group.account_groups.length && <p className="empty">No requisitions were found for this unit.</p>}
      {group.account_groups.map((parent, parentIndex) => <div className="account-parent" key={`${parent.main_account.id ?? 'unmapped'}-${parentIndex}`}>
        <h3>[{parent.main_account.account_code}] {parent.main_account.account_name}</h3>
        <table><tbody>{parent.sub_accounts.map((sub, index) => <tr key={`${sub.sub_account.id ?? 'unmapped'}-${index}`}><td>[{sub.sub_account.account_code}] {sub.sub_account.account_name}</td><td>{formatMoney(sub.total_amount)}</td></tr>)}<tr className="subtotal"><td>Per Account Total:</td><td>{formatMoney(parent.total_amount)}</td></tr></tbody></table>
      </div>)}
    </div> : preview.report.preview_type === 'summary' ? <table className="requisition-table"><RequisitionColumns /><tbody>
      {!group.rows.length && <tr className="empty"><td colSpan={8}>No requisitions were found for this unit.</td></tr>}
      {group.rows.map(row => <tr key={row.id}><RequisitionCells row={row} /></tr>)}
    </tbody></table> : <div className="detailed-list">
      {!group.requisition_groups.length && <p className="empty">No requisitions were found for this unit.</p>}
      {group.requisition_groups.map(entry => <article className="requisition-detail" key={entry.id}>
        <table className="requisition-table"><RequisitionColumns /><tbody><tr><RequisitionCells row={entry} /></tr></tbody></table>
        <table className="item-table"><thead><tr><th>Account</th><th>Description</th><th>Unit Cost</th><th>Quantity</th><th>Unit of Measurement</th><th>Total</th></tr></thead><tbody>
          {!entry.items.length && <tr className="empty"><td colSpan={6}>No live items.</td></tr>}
          {entry.items.map(item => <tr key={item.id}><td>{item.account}</td><td>{item.description}</td><td>{formatMoney(item.unit_cost)}</td><td>{item.quantity}</td><td>{item.unit_of_measurement || '—'}</td><td>{formatMoney(item.total_amount)}</td></tr>)}
        </tbody></table>
      </article>)}
    </div>}
    <div className="unit-total"><span>Unit Total:</span><b>{formatMoney(group.totals.total_amount)}</b>{!preview.report.summary_per_account && <><span>Returned:</span><b>{formatMoney(group.totals.returned_amount)}</b><span>Liquidated:</span><b>{formatMoney(group.totals.liquidated_amount)}</b></>}</div>
  </section>;
}

function PrintPreview({ preview, onClose }: { preview: Preview; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const overflow = document.body.style.overflow;
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden'; document.addEventListener('keydown', keydown); closeRef.current?.focus();
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); };
  }, [onClose]);

  return <ReportPrintPortal><div className="liquidation-report-preview fixed inset-0 z-[100] overflow-auto bg-slate-600/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Budget liquidation print preview">
    <div className="report-actions mx-auto mb-3 flex max-w-[1320px] justify-end gap-2"><Button ref={closeRef} variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" />Close</Button><Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button></div>
    <article className="liquidation-report mx-auto min-h-[700px] max-w-[1320px] bg-white p-7 text-black shadow-2xl sm:p-10"><ReportHeader preview={preview} />
      {!preview.unit_groups.length && <p className="empty">No liquidation requisitions were found for the selected filters.</p>}
      {preview.unit_groups.map(group => <UnitSection key={`${group.unit.type}:${group.unit.id}`} preview={preview} group={group} />)}
      <div className="grand-total"><span>Overall Total:</span><b>{formatMoney(preview.grand_total.total_amount)}</b>{!preview.report.summary_per_account && <><span>Returned:</span><b>{formatMoney(preview.grand_total.returned_amount)}</b><span>Liquidated:</span><b>{formatMoney(preview.grand_total.liquidated_amount)}</b></>}</div>
      <footer>-=xxx=- | Source: ABMS | Print Date: {new Date().toLocaleDateString()} | Printed By: {preview.report.printed_by}</footer>
    </article>
    <style>{`.liquidation-report{font-family:Arial,sans-serif;font-size:10px}.liquidation-report h1{font-size:20px;font-weight:800;margin:0}.liquidation-report h2{font-size:12px;margin:2px 0 10px}.liquidation-report header p{margin:3px 0;display:grid;grid-template-columns:90px 1fr}.liquidation-unit{margin-top:18px}.unit-heading{border-bottom:2px dashed #555;padding:5px 0;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800}.unit-tag{border:1px solid #777;border-radius:999px;padding:1px 6px;font-size:8px;text-transform:uppercase}.requisition-table,.item-table,.account-summary table{width:100%;border-collapse:collapse;table-layout:fixed}.requisition-table th,.requisition-table td,.item-table th,.item-table td,.account-summary td{padding:4px;text-align:left;vertical-align:top;font-variant-numeric:tabular-nums}.requisition-table thead,.item-table thead{border-bottom:1px solid #777}.requisition-table th:nth-last-child(-n+3),.requisition-table td:nth-last-child(-n+3),.item-table th:nth-last-child(-n+4),.item-table td:nth-last-child(-n+4),.account-summary td:last-child{text-align:right}.requisition-table th:nth-child(1){width:11%}.requisition-table th:nth-child(2){width:10%}.requisition-table th:nth-child(3){width:11%}.requisition-table th:nth-child(4){width:12%}.requisition-table th:nth-child(5){width:15%}.item-table{margin:5px 0 14px 18px;width:calc(100% - 18px);background:#fafafa}.item-table th:nth-child(1){width:12%}.item-table th:nth-child(2){width:39%}.requisition-detail{border-bottom:1px solid #aaa;padding-top:8px;break-inside:auto}.account-parent{margin:8px 0 14px 18px;break-inside:auto}.account-parent h3{font-size:11px;margin:0 0 3px}.account-summary td:last-child{width:20%}.subtotal{border-top:1px dashed #555;font-weight:800}.subtotal td:first-child{text-align:right}.unit-total,.grand-total{margin-left:auto;margin-top:8px;width:max-content;display:grid;grid-template-columns:auto 95px auto 95px auto 95px;gap:4px 8px;text-align:right;border-top:2px solid #555;padding-top:4px}.grand-total{font-size:12px;border-bottom:3px double #555;margin-top:16px}.empty{text-align:center!important;color:#555;padding:18px!important}.liquidation-report footer{margin-top:20px;border-top:2px dashed #555;padding-top:4px}@page{size:letter landscape;margin:0.35in}@media print{body *{visibility:hidden!important}.liquidation-report-preview,.liquidation-report-preview *{visibility:visible!important}.liquidation-report-preview{position:absolute!important;inset:0!important;overflow:visible!important;background:white!important;padding:0!important}.report-actions{display:none!important}.liquidation-report{box-shadow:none!important;max-width:none!important;min-height:0!important;padding:0!important}.liquidation-unit+.liquidation-unit{break-before:page}.liquidation-unit{break-after:page}.liquidation-unit:last-of-type{break-after:auto}}`}</style>
  </div></ReportPrintPortal>;
}

export default function BudgetLiquidation() {
  const navigate = useNavigate();
  const loader = budgetliquidationRoute.useLoaderData() as { data?: { data?: LoaderPayload } | LoaderPayload };
  const payload = ((loader?.data as { data?: LoaderPayload })?.data ?? loader?.data ?? {}) as LoaderPayload;
  const [schoolYear, setSchoolYear] = useState('');
  const [allUnits, setAllUnits] = useState(payload.unit_scope_restricted !== true);
  const [unitValue, setUnitValue] = useState('');
  const [scope, setScope] = useState<LiquidationScope>('both');
  const [cashAdvances, setCashAdvances] = useState(false);
  const [previewType, setPreviewType] = useState<PreviewType>('summary');
  const [summaryPerAccount, setSummaryPerAccount] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const schoolYears = useMemo(() => Array.from(new Set(Array.isArray(payload.school_years) ? payload.school_years.filter((year): year is string => typeof year === 'string' && Boolean(year)) : [])).sort((a, b) => b.localeCompare(a)), [payload.school_years]);
  const units = useMemo(() => (Array.isArray(payload.units) ? payload.units.filter(validUnit) : []).sort((a, b) => a.name.localeCompare(b.name) || a.type.localeCompare(b.type) || a.id - b.id), [payload.units]);
  const unitScopeRestricted = payload.unit_scope_restricted === true;
  const selectedUnit = units.find(unit => `${unit.type}:${unit.id}` === unitValue);

  useEffect(() => {
    if (unitScopeRestricted && allUnits) setAllUnits(false);
    if (units.length === 1 && !unitValue) {
      setAllUnits(false);
      setUnitValue(`${units[0].type}:${units[0].id}`);
    }
  }, [allUnits, unitScopeRestricted, units, unitValue]);

  const openPreview = async () => {
    const next: Errors = {};
    if (!schoolYear) next.schoolYear = 'School year is required.';
    if (!allUnits && !selectedUnit) next.unit = 'Department or Section is required.';
    if (!from) next.from = 'From date is required.';
    if (!to) next.to = 'To date is required.';
    if (from && to && from > to) next.to = 'To date must be on or after the From date.';
    setErrors(next); setPreviewError(null);
    if (Object.keys(next).length) return;
    setLoading(true); setPreview(null);
    try {
      const response = await financeSvc.get('/abms/budget-liquidation/preview', { params: {
        school_year: schoolYear, all_units: allUnits ? 1 : 0,
        ...(!allUnits && selectedUnit ? { unit_type: selectedUnit.type, unit_id: selectedUnit.id } : {}),
        liquidation_scope: scope, cash_advances: cashAdvances ? 1 : 0, preview_type: previewType, summary_per_account: summaryPerAccount ? 1 : 0, from, to,
      } });
      const nextPreview = parsePreview(response.data);
      if (!nextPreview) { setPreviewError('The finance service returned an invalid preview response. Please try again.'); return; }
      if (!nextPreview.data_quality.complete || nextPreview.data_quality.warnings.length) {
        const count = nextPreview.data_quality.warnings.length;
        toast.warning('Some liquidation data requires attention.', { description: `${count} data-quality notice${count === 1 ? '' : 's'} found. The available records and preserved amounts are shown.`, duration: 10000 });
      }
      setPreview(nextPreview);
    } catch (error) { setPreviewError(errorMessage(error)); } finally { setLoading(false); }
  };

  return <AdamsonBudgetLayout><Toaster position="bottom-right" richColors closeButton /><Page width="default"><PageHeader title="Budget Liquidation" description="Review liquidation and cash-advance requisitions by department or section." /><PageSurface><Card className="border-0 bg-transparent shadow-none"><CardContent className="space-y-6 py-6">
    {!schoolYears.length && <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">No school years are currently available.</p>}
    <div className="grid gap-5 md:grid-cols-3">
      <div className="space-y-1.5"><Label htmlFor="liquidation-school-year">School Year</Label><ReportFilterCombobox id="liquidation-school-year" options={schoolYears.map(value => ({ value, label: value }))} value={schoolYear} disabled={loading || !schoolYears.length} placeholder="Select school year" searchPlaceholder="Search school year..." emptyText="No school year found." invalid={Boolean(errors.schoolYear)} errorId="liquidation-school-year-error" groupLabel="Available school years" onChange={value => { const dates = getRequisitionDateDefaults(payload, value); setSchoolYear(value); setFrom(dates.from); setTo(dates.to); setErrors(current => ({ ...current, schoolYear: undefined, from: undefined, to: undefined })); setPreviewError(null); }} /><FieldError id="liquidation-school-year-error">{errors.schoolYear}</FieldError></div>
      <div className="space-y-1.5"><Label htmlFor="liquidation-unit">Department / Section</Label><ReportFilterCombobox id="liquidation-unit" options={units.map(unit => ({ value: `${unit.type}:${unit.id}`, label: unit.active ? unit.name : `${unit.name} (Inactive)`, badge: `${unit.type === 'department' ? 'Department' : 'Section'}${unit.active ? '' : ' · Inactive'}` }))} value={unitValue} disabled={loading || allUnits || !units.length} placeholder={allUnits ? 'All departments and sections' : 'Select department or section'} searchPlaceholder="Search department or section..." emptyText="No department or section found." invalid={Boolean(errors.unit)} errorId="liquidation-unit-error" groupLabel="Departments and sections" wideOptions onChange={value => { setUnitValue(value); setErrors(current => ({ ...current, unit: undefined })); setPreviewError(null); }} /><FieldError id="liquidation-unit-error">{errors.unit}</FieldError></div>
      <div className="space-y-1.5"><Label htmlFor="liquidation-scope">Liquidation Status</Label><ReportFilterCombobox id="liquidation-scope" options={[{ value: 'both', label: 'Both' }, { value: 'for_liquidation', label: 'For Liquidation' }, { value: 'liquidated', label: 'Liquidated' }]} value={scope} disabled={loading} placeholder="Select status" searchPlaceholder="Search status..." emptyText="No status found." groupLabel="Liquidation statuses" onChange={value => { setScope(value as LiquidationScope); setPreviewError(null); }} /></div>
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      <fieldset className="rounded-lg border border-[var(--abms-border)] p-4"><legend className="px-2 text-sm font-semibold text-[var(--abms-primary)]">Report Options</legend><RadioGroup value={previewType} onValueChange={value => { const next = value as PreviewType; setPreviewType(next); if (next === 'detailed') setSummaryPerAccount(false); setPreviewError(null); }} className="space-y-3"><div className="flex items-center gap-2"><RadioGroupItem id="liquidation-summary" value="summary" /><Label htmlFor="liquidation-summary">Summary</Label></div><div className="flex items-center gap-2"><RadioGroupItem id="liquidation-detailed" value="detailed" /><Label htmlFor="liquidation-detailed">Detailed</Label></div></RadioGroup><div className="mt-4 space-y-3 border-t border-[var(--abms-border)] pt-4"><div className="flex items-center gap-2"><Checkbox id="liquidation-all-units" checked={allUnits} disabled={loading || unitScopeRestricted} onCheckedChange={checked => { const enabled = checked === true; setAllUnits(enabled); if (enabled) setUnitValue(''); setErrors(current => ({ ...current, unit: undefined })); setPreviewError(null); }} /><Label htmlFor="liquidation-all-units">All Departments / Sections{unitScopeRestricted ? ' (Requires report-wide access)' : ''}</Label></div><div className="flex items-center gap-2"><Checkbox id="liquidation-cash-advances" checked={cashAdvances} disabled={loading} onCheckedChange={checked => { setCashAdvances(checked === true); setPreviewError(null); }} /><Label htmlFor="liquidation-cash-advances">Cash Advances Only</Label></div><div className="flex items-center gap-2"><Checkbox id="liquidation-summary-account" checked={summaryPerAccount} disabled={loading || previewType === 'detailed'} onCheckedChange={checked => { setSummaryPerAccount(checked === true); setPreviewError(null); }} /><Label htmlFor="liquidation-summary-account">Summary per Department and Account</Label></div></div></fieldset>
      <fieldset className="rounded-lg border border-[var(--abms-border)] p-4"><legend className="px-2 text-sm font-semibold text-[var(--abms-primary)]">R.S. Date</legend><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="liquidation-from">From</Label><Input id="liquidation-from" type="date" value={from} disabled={loading} onChange={event => { setFrom(event.target.value); setErrors(current => ({ ...current, from: undefined, to: undefined })); setPreviewError(null); }} className="mt-1.5" /><FieldError>{errors.from}</FieldError></div><div><Label htmlFor="liquidation-to">To</Label><Input id="liquidation-to" type="date" min={from || undefined} value={to} disabled={loading} onChange={event => { setTo(event.target.value); setErrors(current => ({ ...current, to: undefined })); setPreviewError(null); }} className="mt-1.5" /><FieldError>{errors.to}</FieldError></div></div></fieldset>
    </div>
    {previewError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Unable to generate preview</AlertTitle><AlertDescription>{previewError}</AlertDescription></Alert>}
    <div className="flex justify-end gap-3 border-t border-[var(--abms-border)] pt-5"><Button variant="outline" onClick={() => navigate({ to: '/' })}>Close</Button><Button onClick={openPreview} disabled={loading || !schoolYears.length || (!allUnits && !units.length)} aria-busy={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading preview...</> : 'Preview'}</Button></div>
  </CardContent></Card></PageSurface></Page>{preview && <PrintPreview preview={preview} onClose={() => setPreview(null)} />}</AdamsonBudgetLayout>;
}
