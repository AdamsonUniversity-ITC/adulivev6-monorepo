import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
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
import { budgetperformanceuniversityRoute } from '../../router';
import { FieldError, Page, PageHeader, PageSurface } from '../../components/ui/Page';
import { ReportFilterCombobox } from './shared/ReportFilterCombobox';
import { ReportPrintPortal } from './shared/ReportPrintPortal';
import { formatMoney } from './shared/money';
import { getRequisitionDateDefaults, type RequisitionDateDefaultsPayload } from './shared/requisitionDateDefaults';
import './shared/report-print.css';

type Identifier = string | number;
type PreviewType = 'summary' | 'detailed';
type Money = {
  approved_budget: string;
  adjustment_additional: string;
  adjustment_deduction: string;
  released: string;
  unused_amount: string;
  balance: string;
};
type Account = { id: Identifier; account_code: string; account_name: string };
type AccountRow = Money & { account: Account };
type SubAccountRow = Money & { sub_account: Account };
type DataQualityWarning = { code: string; message: string; affected_count?: number; entity_ids?: Identifier[] };
type LoaderPayload = RequisitionDateDefaultsPayload & { school_years?: string[] };
type Preview = {
  report: {
    preview_type: PreviewType;
    school_year: string;
    from: string;
    to: string;
    group_by_section_type: boolean;
    printed_by: string;
  };
  rows: AccountRow[];
  section_type_groups: Array<{
    section_type: { id: number | null; code: string; name: string };
    rows: AccountRow[];
    totals: Money;
  }>;
  main_account_groups: Array<{
    main_account: Account;
    rows: SubAccountRow[];
    totals: Money;
  }>;
  grand_total: Money;
  data_quality: {
    complete: boolean;
    warnings: DataQualityWarning[];
    calculation_timezone: string;
    inclusive_period: { start: string; end: string };
    reconciliation: {
      status: 'reconciled' | 'unreconciled' | 'insufficient_data';
      expected_balance_movement: string;
      audited_balance_movement: string;
      difference: string;
    };
  };
};
type Errors = Partial<Record<'schoolYear' | 'from' | 'to', string>>;
type ApiFailure = { response?: { data?: { message?: string; errors?: Record<string, string[] | string> } } };

const moneyColumns: Array<keyof Money> = ['approved_budget', 'adjustment_additional', 'adjustment_deduction', 'released', 'unused_amount', 'balance'];
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const hasMoney = (value: unknown) => isRecord(value) && moneyColumns.every(column => typeof value[column] === 'string');
const validAccount = (value: unknown) => isRecord(value)
  && (typeof value.id === 'string' || typeof value.id === 'number')
  && typeof value.account_code === 'string'
  && typeof value.account_name === 'string';
const validAccountRow = (value: unknown) => isRecord(value) && hasMoney(value) && validAccount(value.account);
const validSubAccountRow = (value: unknown) => isRecord(value) && hasMoney(value) && validAccount(value.sub_account);
const parsePreview = (value: unknown): Preview | null => {
  if (!isRecord(value) || !isRecord(value.report) || !isRecord(value.data_quality)) return null;
  const { report, data_quality: quality } = value;
  if ((report.preview_type !== 'summary' && report.preview_type !== 'detailed')
    || typeof report.school_year !== 'string' || typeof report.from !== 'string' || typeof report.to !== 'string'
    || typeof report.group_by_section_type !== 'boolean' || typeof report.printed_by !== 'string'
    || !Array.isArray(value.rows) || !value.rows.every(validAccountRow)
    || !Array.isArray(value.section_type_groups) || !value.section_type_groups.every(group => isRecord(group)
      && isRecord(group.section_type)
      && (group.section_type.id === null || typeof group.section_type.id === 'number')
      && typeof group.section_type.code === 'string' && typeof group.section_type.name === 'string'
      && Array.isArray(group.rows) && group.rows.every(validAccountRow) && hasMoney(group.totals))
    || !Array.isArray(value.main_account_groups) || !value.main_account_groups.every(group => isRecord(group)
      && validAccount(group.main_account) && Array.isArray(group.rows) && group.rows.every(validSubAccountRow) && hasMoney(group.totals))
    || !hasMoney(value.grand_total) || typeof quality.complete !== 'boolean' || !Array.isArray(quality.warnings)
    || !quality.warnings.every(warning => isRecord(warning) && typeof warning.code === 'string' && typeof warning.message === 'string')
    || typeof quality.calculation_timezone !== 'string' || !isRecord(quality.inclusive_period)
    || typeof quality.inclusive_period.start !== 'string' || typeof quality.inclusive_period.end !== 'string'
    || !isRecord(quality.reconciliation)
    || (quality.reconciliation.status !== 'reconciled' && quality.reconciliation.status !== 'unreconciled' && quality.reconciliation.status !== 'insufficient_data')
    || typeof quality.reconciliation.expected_balance_movement !== 'string'
    || typeof quality.reconciliation.audited_balance_movement !== 'string'
    || typeof quality.reconciliation.difference !== 'string') return null;
  return value as unknown as Preview;
};
const errorMessage = (error: unknown) => {
  const data = (error as ApiFailure)?.response?.data;
  return Object.values(data?.errors ?? {}).flat()[0] || data?.message || 'The university budget performance preview could not be loaded. Please review the filters and try again.';
};
const formatDate = (value: string) => {
  const [year, month, day] = value.split('-');
  return value ? `${month}/${day}/${year}` : '';
};
const AmountCells = ({ amounts }: { amounts: Money }) => <>{moneyColumns.map(column => <td key={column}>{formatMoney(amounts[column])}</td>)}</>;
const AccountName = ({ account }: { account: Account }) => <>[{account.account_code}] {account.account_name}</>;

function ReportTable({ preview }: { preview: Preview }) {
  const groupedSummary = preview.report.preview_type === 'summary' && preview.report.group_by_section_type;
  const empty = preview.report.preview_type === 'detailed'
    ? preview.main_account_groups.length === 0
    : groupedSummary ? preview.section_type_groups.length === 0 : preview.rows.length === 0;

  return <table className="university-report-table">
    <thead><tr><th>Account</th><th>Approved Budget</th><th>Adj. Additional</th><th>Adj. Deduction</th><th>Released</th><th>Unused Amount</th><th>Balance</th></tr></thead>
    <tbody>
      {empty && <tr className="report-empty"><td colSpan={7}>No university budget allocation was found for the selected filters.</td></tr>}
      {preview.report.preview_type === 'summary' && !groupedSummary && preview.rows.map(row => <tr key={String(row.account.id)}><td><AccountName account={row.account} /></td><AmountCells amounts={row} /></tr>)}
      {groupedSummary && preview.section_type_groups.map(group => <Fragment key={group.section_type.id === null ? `unclassified-${group.section_type.code}` : String(group.section_type.id)}>
        <tr className="group-heading"><td colSpan={7}>Section Type: {group.section_type.code ? `[${group.section_type.code}] ` : ''}{group.section_type.name}</td></tr>
        {group.rows.map(row => <tr key={`${group.section_type.id ?? 'none'}-${row.account.id}`}><td><AccountName account={row.account} /></td><AmountCells amounts={row} /></tr>)}
        <tr className="report-subtotal"><td>Section Type Total:</td><AmountCells amounts={group.totals} /></tr>
      </Fragment>)}
      {preview.report.preview_type === 'detailed' && preview.main_account_groups.map(group => <Fragment key={String(group.main_account.id)}>
        <tr className="group-heading"><td colSpan={7}>Main Account: <AccountName account={group.main_account} /></td></tr>
        {group.rows.map(row => <tr className="sub-account-row" key={`${group.main_account.id}-${row.sub_account.id}`}><td>↳ <AccountName account={row.sub_account} /></td><AmountCells amounts={row} /></tr>)}
        <tr className="report-subtotal"><td>Main Account Total:</td><AmountCells amounts={group.totals} /></tr>
      </Fragment>)}
      <tr className="report-total"><td>Overall Total:</td><AmountCells amounts={preview.grand_total} /></tr>
    </tbody>
  </table>;
}

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
  return <ReportPrintPortal><div className="university-report-preview abms-letter-preview fixed inset-0 z-[100] overflow-auto bg-slate-600/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="University budget performance print preview">
    <div className="report-actions abms-letter-actions mx-auto mb-3 flex justify-end gap-2"><Button ref={closeRef} variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" />Close</Button><Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button></div>
    <article className="university-report abms-letter-sheet mx-auto bg-white p-7 text-black shadow-2xl sm:p-10">
      <header><div><h1>ADAMSON UNIVERSITY</h1><h2>BUDGET PERFORMANCE (UNIVERSITY) - {preview.report.preview_type === 'summary' ? 'Summary' : 'Detailed'} (Period: {formatDate(preview.report.from)} - {formatDate(preview.report.to)})</h2></div>
        <p><b>School Year:</b><strong>{preview.report.school_year}</strong></p>
        {preview.report.group_by_section_type && <p><b>Grouping:</b><strong>Section Type</strong></p>}
      </header>
      <ReportTable preview={preview} />
      <footer>-=xxx=- | Source: ABMS | Print Date: {new Date().toLocaleDateString()} | Printed By: {preview.report.printed_by}</footer>
    </article>
    <style>{`.university-report{font-family:Arial,sans-serif;font-size:11px}.university-report h1{font-size:20px;font-weight:800;margin:0}.university-report h2{font-size:12px;font-weight:700;margin:2px 0 10px}.university-report header p{margin:3px 0;display:grid;grid-template-columns:110px 1fr}.university-report-table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:8px}.university-report-table thead{display:table-header-group;border-top:2px dashed #555;border-bottom:2px dashed #555}.university-report-table th{font-weight:400;padding:5px 4px}.university-report-table th:first-child,.university-report-table td:first-child{width:31%;text-align:left}.university-report-table th:not(:first-child),.university-report-table td:not(:first-child){text-align:right}.university-report-table td{padding:3px 4px;font-variant-numeric:tabular-nums}.group-heading{font-weight:700;border-top:2px dashed #777}.group-heading td{padding-top:7px!important}.sub-account-row td:first-child{padding-left:16px}.report-subtotal{font-weight:700;border-top:1px dashed #777;border-bottom:2px dashed #777;break-inside:avoid}.report-subtotal td:first-child,.report-total td:first-child{text-align:right}.report-total{font-weight:800;border-top:2px solid #555;border-bottom:2px double #555}.report-total td{padding-top:6px;padding-bottom:6px}.report-empty td{text-align:center!important;padding:18px;color:#555}.university-report footer{margin-top:20px;border-top:2px dashed #555;padding-top:4px}@page{size:letter landscape;margin:0.35in}@media print{body *{visibility:hidden!important}.university-report-preview,.university-report-preview *{visibility:visible!important}.university-report-preview{position:absolute!important;inset:0!important;overflow:visible!important;background:white!important;padding:0!important}.report-actions{display:none!important}.university-report{box-shadow:none!important;max-width:none!important;min-height:0!important;padding:0!important}.group-heading,.report-subtotal,.report-total{break-inside:avoid}}`}</style>
  </div></ReportPrintPortal>;
}

export default function BudgetPerformanceUniversity() {
  const navigate = useNavigate();
  const loader = budgetperformanceuniversityRoute.useLoaderData() as { data?: { data?: LoaderPayload } | LoaderPayload };
  const payload = ((loader?.data as { data?: LoaderPayload })?.data ?? loader?.data ?? {}) as LoaderPayload;
  const [schoolYear, setSchoolYear] = useState('');
  const [previewType, setPreviewType] = useState<PreviewType>('summary');
  const [groupBySectionType, setGroupBySectionType] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const schoolYears = useMemo(() => Array.from(new Set(Array.isArray(payload.school_years)
    ? payload.school_years.filter((year): year is string => typeof year === 'string' && Boolean(year))
    : [])).sort((a, b) => b.localeCompare(a)), [payload.school_years]);

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
      const response = await financeSvc.get('/abms/budget-performance-university/preview', { params: { school_year: schoolYear, preview_type: previewType, group_by_section_type: previewType === 'summary' && groupBySectionType ? 1 : 0, from, to } });
      const nextPreview = parsePreview(response.data);
      if (!nextPreview) { setPreviewError('The finance service returned an invalid preview response. Please try again.'); return; }
      if (!nextPreview.data_quality.complete || nextPreview.data_quality.warnings.length) {
        const count = nextPreview.data_quality.warnings.length;
        toast.warning('Some historical activity could not be fully reconstructed.', { description: count ? `${count} data-quality notice${count === 1 ? '' : 's'} found. The available figures are shown in the report.` : 'The available figures are shown in the report.', duration: 10000 });
      }
      setPreview(nextPreview);
    } catch (error) { setPreviewError(errorMessage(error)); } finally { setLoading(false); }
  };

  return <AdamsonBudgetLayout><Toaster position="bottom-right" richColors closeButton /><Page width="default">
    <PageHeader title="Budget Performance University" description="Generate a university-wide, date-bounded budget performance report." />
    <PageSurface><Card className="border-0 bg-transparent shadow-none"><CardContent className="space-y-6 py-6">
      {!schoolYears.length && <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">No school years are currently available.</p>}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="university-school-year">School Year</Label><ReportFilterCombobox id="university-school-year" options={schoolYears.map(value => ({ value, label: value }))} value={schoolYear} disabled={loading || !schoolYears.length} placeholder="Select school year" searchPlaceholder="Search school year..." emptyText="No school year found." invalid={Boolean(errors.schoolYear)} errorId="university-school-year-error" groupLabel="Available school years" onChange={value => { const dates = getRequisitionDateDefaults(payload, value); setSchoolYear(value); setFrom(dates.from); setTo(dates.to); setPreviewError(null); setErrors(current => ({ ...current, schoolYear: undefined, from: undefined, to: undefined })); }} /><FieldError id="university-school-year-error">{errors.schoolYear}</FieldError></div>
        <fieldset className="rounded-lg border border-[var(--abms-border)] p-4"><legend className="px-2 text-sm font-semibold text-[var(--abms-primary)]">Report Options</legend><RadioGroup value={previewType} onValueChange={value => { const type = value as PreviewType; setPreviewType(type); if (type === 'detailed') setGroupBySectionType(false); setPreviewError(null); }} className="space-y-3"><div className="flex items-center gap-2"><RadioGroupItem id="university-summary" value="summary" /><Label htmlFor="university-summary">Summary</Label></div><div className="flex items-center gap-2"><RadioGroupItem id="university-detailed" value="detailed" /><Label htmlFor="university-detailed">Detailed</Label></div><div className="flex items-center gap-2 border-t border-[var(--abms-border)] pt-3"><Checkbox id="group-section-type" checked={groupBySectionType} disabled={loading || previewType !== 'summary'} onCheckedChange={checked => { setGroupBySectionType(checked === true); setPreviewError(null); }} /><Label htmlFor="group-section-type" className={previewType !== 'summary' ? 'text-muted-foreground' : ''}>Group summary by section type</Label></div></RadioGroup></fieldset>
      </div>
      <fieldset className="rounded-lg border border-[var(--abms-border)] p-4"><legend className="px-2 text-sm font-semibold text-[var(--abms-primary)]">Period</legend><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="university-from">From</Label><Input id="university-from" type="date" value={from} disabled={loading} onChange={event => { setFrom(event.target.value); setPreviewError(null); setErrors(current => ({ ...current, from: undefined, to: undefined })); }} className="mt-1.5" /><FieldError>{errors.from}</FieldError></div><div><Label htmlFor="university-to">To</Label><Input id="university-to" type="date" value={to} min={from || undefined} disabled={loading} onChange={event => { setTo(event.target.value); setPreviewError(null); setErrors(current => ({ ...current, to: undefined })); }} className="mt-1.5" /><FieldError>{errors.to}</FieldError></div></div></fieldset>
      {previewError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Unable to generate preview</AlertTitle><AlertDescription>{previewError}</AlertDescription></Alert>}
      <div className="flex justify-end gap-3 border-t border-[var(--abms-border)] pt-5"><Button variant="outline" onClick={() => navigate({ to: '/' })}>Close</Button><Button onClick={openPreview} disabled={loading || !schoolYears.length} aria-busy={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading preview...</> : 'Preview'}</Button></div>
    </CardContent></Card></PageSurface>
  </Page>{preview && <PrintPreview preview={preview} onClose={() => setPreview(null)} />}</AdamsonBudgetLayout>;
}
