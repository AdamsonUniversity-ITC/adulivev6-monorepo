import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Loader2, Printer, X } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/alert';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/radio-group';
import { toast, Toaster } from 'sonner';
import AdamsonBudgetLayout from '../../layouts/Screenlayout';
import { budgetperformanceaccountRoute } from '../../router';
import { FieldError, Page, PageHeader, PageSurface } from '../../components/ui/Page';
import { ReportFilterCombobox, type ReportFilterOption } from './shared/ReportFilterCombobox';
import { ReportPrintPortal } from './shared/ReportPrintPortal';
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
type MainAccount = Account & { sub_accounts: Account[] };
type UnitRow = Money & { unit: { type: 'department' | 'section'; id: Identifier; name: string } };
type Warning = { code: string; message: string; affected_count?: number; entity_ids?: Identifier[] };
type LoaderPayload = { school_years?: string[]; main_accounts?: MainAccount[] };
type Preview = {
  report: {
    preview_type: PreviewType;
    school_year: string;
    from: string;
    to: string;
    main_account: Account;
    sub_account: Account | null;
    printed_by: string;
  };
  rows: UnitRow[];
  sub_account_groups: Array<{ sub_account: Account; rows: UnitRow[]; totals: Money }>;
  grand_total: Money;
  data_quality: {
    complete: boolean;
    warnings: Warning[];
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
type Errors = Partial<Record<'schoolYear' | 'mainAccount' | 'subAccount' | 'from' | 'to', string>>;
type ApiFailure = { response?: { data?: { message?: string; errors?: Record<string, string[] | string> } } };

const moneyColumns: Array<keyof Money> = ['approved_budget', 'adjustment_additional', 'adjustment_deduction', 'released', 'unused_amount', 'balance'];
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const hasMoney = (value: unknown) => isRecord(value) && moneyColumns.every(column => typeof value[column] === 'string');
const validAccount = (value: unknown) => isRecord(value)
  && (typeof value.id === 'string' || typeof value.id === 'number')
  && typeof value.account_code === 'string'
  && typeof value.account_name === 'string';
const validRow = (value: unknown) => isRecord(value) && hasMoney(value) && isRecord(value.unit)
  && (value.unit.type === 'department' || value.unit.type === 'section')
  && (typeof value.unit.id === 'string' || typeof value.unit.id === 'number')
  && typeof value.unit.name === 'string';
const parsePreview = (value: unknown): Preview | null => {
  if (!isRecord(value) || !isRecord(value.report) || !isRecord(value.data_quality)) return null;
  const { report, data_quality: quality } = value;
  if ((report.preview_type !== 'summary' && report.preview_type !== 'detailed')
    || typeof report.school_year !== 'string' || typeof report.from !== 'string' || typeof report.to !== 'string'
    || !validAccount(report.main_account) || !(report.sub_account === null || validAccount(report.sub_account))
    || typeof report.printed_by !== 'string' || !Array.isArray(value.rows) || !value.rows.every(validRow)
    || !Array.isArray(value.sub_account_groups) || !value.sub_account_groups.every(group => isRecord(group)
      && validAccount(group.sub_account) && Array.isArray(group.rows) && group.rows.every(validRow) && hasMoney(group.totals))
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
  return Object.values(data?.errors ?? {}).flat()[0] || data?.message || 'The budget performance preview could not be loaded. Please review the filters and try again.';
};
const formatDate = (value: string) => {
  const [year, month, day] = value.split('-');
  return value ? `${month}/${day}/${year}` : '';
};
const AmountCells = ({ amounts }: { amounts: Money }) => <>{moneyColumns.map(column => <td key={column}>{amounts[column]}</td>)}</>;
const UnitCell = ({ row }: { row: UnitRow }) => <td><span>{row.unit.name}</span><Badge variant="outline" className="unit-badge ml-2 align-middle">{row.unit.type === 'department' ? 'Department' : 'Section'}</Badge></td>;

function ReportTable({ preview }: { preview: Preview }) {
  const noData = preview.report.preview_type === 'summary' ? preview.rows.length === 0 : preview.sub_account_groups.length === 0;
  return <table className="account-report-table">
    <thead><tr><th>Office / Department</th><th>Approved Budget</th><th>Adj. Additional</th><th>Adj. Deduction</th><th>Released</th><th>Unused Amount</th><th>Balance</th></tr></thead>
    <tbody>
      {noData && <tr className="report-empty"><td colSpan={7}>No allocated budget accounts were found for the selected filters.</td></tr>}
      {preview.report.preview_type === 'summary' && preview.rows.map(row => <tr key={`${row.unit.type}-${row.unit.id}`}><UnitCell row={row} /><AmountCells amounts={row} /></tr>)}
      {preview.report.preview_type === 'detailed' && preview.sub_account_groups.map(group => <Fragment key={String(group.sub_account.id)}>
        <tr className="sub-account-heading"><td colSpan={7}>Sub Account: [{group.sub_account.account_code}] {group.sub_account.account_name}</td></tr>
        {group.rows.map(row => <tr key={`${group.sub_account.id}-${row.unit.type}-${row.unit.id}`}><UnitCell row={row} /><AmountCells amounts={row} /></tr>)}
        <tr className="report-subtotal"><td>Sub Total:</td><AmountCells amounts={group.totals} /></tr>
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
  return <ReportPrintPortal><div className="account-report-preview abms-letter-preview fixed inset-0 z-[100] overflow-auto bg-slate-600/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Budget performance per account print preview">
    <div className="report-actions abms-letter-actions mx-auto mb-3 flex justify-end gap-2"><Button ref={closeRef} variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" />Close</Button><Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button></div>
    <article className="account-report abms-letter-sheet mx-auto bg-white p-7 text-black shadow-2xl sm:p-10">
      <header><div><h1>ADAMSON UNIVERSITY</h1><h2>BUDGET PERFORMANCE (PER ACCOUNT) - {preview.report.preview_type === 'summary' ? 'Summary' : 'Detailed'} (Period: {formatDate(preview.report.from)} - {formatDate(preview.report.to)})</h2></div>
        <p><b>School Year:</b><strong>{preview.report.school_year}</strong></p>
        <p><b>Main Account:</b><strong>[{preview.report.main_account.account_code}] {preview.report.main_account.account_name}</strong></p>
        {preview.report.sub_account && <p><b>Sub Account:</b><strong>[{preview.report.sub_account.account_code}] {preview.report.sub_account.account_name}</strong></p>}
      </header>
      <ReportTable preview={preview} />
      <footer>-=xxx=- | Source: ABMS | Print Date: {new Date().toLocaleDateString()} | Printed By: {preview.report.printed_by}</footer>
    </article>
    <style>{`.account-report{font-family:Arial,sans-serif;font-size:11px}.account-report h1{font-size:20px;font-weight:800;margin:0}.account-report h2{font-size:12px;font-weight:700;margin:2px 0 10px}.account-report header p{margin:3px 0;display:grid;grid-template-columns:110px 1fr}.account-report-table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:8px}.account-report-table thead{display:table-header-group;border-top:2px dashed #555;border-bottom:2px dashed #555}.account-report-table th{font-weight:400;padding:5px 4px}.account-report-table th:first-child,.account-report-table td:first-child{width:31%;text-align:left}.account-report-table th:not(:first-child),.account-report-table td:not(:first-child){text-align:right}.account-report-table td{padding:3px 4px;font-variant-numeric:tabular-nums}.unit-badge{font-size:8px;padding:0 4px}.sub-account-heading{font-weight:700;border-top:2px dashed #777}.sub-account-heading td{padding-top:7px!important}.report-subtotal{font-weight:700;border-top:1px dashed #777;border-bottom:2px dashed #777;break-inside:avoid}.report-subtotal td:first-child,.report-total td:first-child{text-align:right}.report-total{font-weight:800;border-top:2px solid #555;border-bottom:2px double #555}.report-total td{padding-top:6px;padding-bottom:6px}.report-empty td{text-align:center!important;padding:18px;color:#555}.account-report footer{margin-top:20px;border-top:2px dashed #555;padding-top:4px}@page{size:letter landscape;margin:0.35in}@media print{body *{visibility:hidden!important}.account-report-preview,.account-report-preview *{visibility:visible!important}.account-report-preview{position:absolute!important;inset:0!important;overflow:visible!important;background:white!important;padding:0!important}.report-actions{display:none!important}.account-report{box-shadow:none!important;max-width:none!important;min-height:0!important;padding:0!important}.sub-account-heading,.report-subtotal,.report-total{break-inside:avoid}}`}</style>
  </div></ReportPrintPortal>;
}

export default function BudgetPerformanceAccount() {
  const navigate = useNavigate();
  const loader = budgetperformanceaccountRoute.useLoaderData() as { data?: { data?: LoaderPayload } | LoaderPayload };
  const payload = ((loader?.data as { data?: LoaderPayload })?.data ?? loader?.data ?? {}) as LoaderPayload;
  const [schoolYear, setSchoolYear] = useState('');
  const [mainAccountId, setMainAccountId] = useState('');
  const [subAccountId, setSubAccountId] = useState('');
  const [previewType, setPreviewType] = useState<PreviewType>('summary');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const schoolYears = useMemo(() => Array.from(new Set(Array.isArray(payload.school_years)
    ? payload.school_years.filter((year): year is string => typeof year === 'string' && Boolean(year))
    : [])).sort((a, b) => b.localeCompare(a)), [payload.school_years]);
  const mainAccounts = useMemo<MainAccount[]>(() => Array.isArray(payload.main_accounts)
    ? payload.main_accounts.filter((account): account is MainAccount => validAccount(account) && Array.isArray(account.sub_accounts) && account.sub_accounts.every(validAccount))
    : [], [payload.main_accounts]);
  const selectedMain = mainAccounts.find(account => String(account.id) === mainAccountId);
  const subAccounts = selectedMain?.sub_accounts ?? [];
  const schoolYearOptions = schoolYears.map(value => ({ value, label: value }));
  const accountOption = (account: Account): ReportFilterOption => ({ value: String(account.id), label: `[${account.account_code}] ${account.account_name}` });

  const openPreview = async () => {
    const next: Errors = {};
    if (!schoolYear) next.schoolYear = 'School year is required.';
    if (!selectedMain) next.mainAccount = 'Main Account is required.';
    if (previewType === 'summary' && subAccountId) next.subAccount = 'Sub Account is available only for Detailed reports.';
    if (!from) next.from = 'From date is required.';
    if (!to) next.to = 'To date is required.';
    if (from && to && from > to) next.to = 'To date must be on or after the From date.';
    setErrors(next); setPreviewError(null);
    if (Object.keys(next).length || !selectedMain) return;
    setLoading(true); setPreview(null);
    try {
      const response = await financeSvc.get('/abms/budget-performance-per-account/preview', { params: { school_year: schoolYear, main_account_id: mainAccountId, ...(previewType === 'detailed' && subAccountId ? { sub_account_id: subAccountId } : {}), from, to, preview_type: previewType } });
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
    <PageHeader title="Budget Performance Per Account" description="Generate a date-bounded budget performance report for a main account." />
    <PageSurface><Card className="border-0 bg-transparent shadow-none"><CardContent className="space-y-6 py-6">
      {!schoolYears.length && <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">No school years are currently available.</p>}
      {!mainAccounts.length && <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">No main accounts are currently available.</p>}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-1.5"><Label htmlFor="account-school-year">School Year</Label><ReportFilterCombobox id="account-school-year" options={schoolYearOptions} value={schoolYear} disabled={loading || !schoolYearOptions.length} placeholder="Select school year" searchPlaceholder="Search school year..." emptyText="No school year found." invalid={Boolean(errors.schoolYear)} errorId="account-school-year-error" groupLabel="Available school years" onChange={value => { setSchoolYear(value); setPreviewError(null); setErrors(current => ({ ...current, schoolYear: undefined })); }} /><FieldError id="account-school-year-error">{errors.schoolYear}</FieldError></div>
        <div className="space-y-1.5"><Label htmlFor="main-account">Main Account</Label><ReportFilterCombobox id="main-account" options={mainAccounts.map(accountOption)} value={mainAccountId} disabled={loading || !mainAccounts.length} placeholder="Select main account" searchPlaceholder="Search main account..." emptyText="No main account found." invalid={Boolean(errors.mainAccount)} errorId="main-account-error" groupLabel="Main accounts" onChange={value => { setMainAccountId(value); setSubAccountId(''); setPreviewError(null); setErrors(current => ({ ...current, mainAccount: undefined, subAccount: undefined })); }} /><FieldError id="main-account-error">{errors.mainAccount}</FieldError></div>
        <div className="space-y-1.5"><Label htmlFor="sub-account">Sub Account <span className="text-muted-foreground">(Optional)</span></Label><ReportFilterCombobox id="sub-account" options={subAccounts.map(accountOption)} value={subAccountId} disabled={loading || previewType === 'summary' || !selectedMain || !subAccounts.length} placeholder={previewType === 'summary' ? 'All sub-accounts included' : !selectedMain ? 'Select a main account first' : subAccounts.length ? 'All sub-accounts' : 'No sub-accounts available'} searchPlaceholder="Search sub-account..." emptyText="No sub-account found." invalid={Boolean(errors.subAccount)} errorId="sub-account-error" groupLabel="Sub-accounts" clearLabel="All sub-accounts" onChange={value => { setSubAccountId(value); setPreviewError(null); setErrors(current => ({ ...current, subAccount: undefined })); }} /><FieldError id="sub-account-error">{errors.subAccount}</FieldError></div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <fieldset className="rounded-lg border border-[var(--abms-border)] p-4"><legend className="px-2 text-sm font-semibold text-[var(--abms-primary)]">Report Options</legend><RadioGroup value={previewType} onValueChange={value => { const type = value as PreviewType; setPreviewType(type); if (type === 'summary') setSubAccountId(''); setPreviewError(null); setErrors(current => ({ ...current, subAccount: undefined })); }} className="space-y-3"><div className="flex items-center gap-2"><RadioGroupItem id="account-summary" value="summary" /><Label htmlFor="account-summary">Summary</Label></div><div className="flex items-center gap-2"><RadioGroupItem id="account-detailed" value="detailed" /><Label htmlFor="account-detailed">Detailed</Label></div></RadioGroup></fieldset>
        <fieldset className="rounded-lg border border-[var(--abms-border)] p-4"><legend className="px-2 text-sm font-semibold text-[var(--abms-primary)]">Period</legend><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="account-from">From</Label><Input id="account-from" type="date" value={from} disabled={loading} onChange={event => { setFrom(event.target.value); setPreviewError(null); setErrors(current => ({ ...current, from: undefined, to: undefined })); }} className="mt-1.5" /><FieldError>{errors.from}</FieldError></div><div><Label htmlFor="account-to">To</Label><Input id="account-to" type="date" value={to} min={from || undefined} disabled={loading} onChange={event => { setTo(event.target.value); setPreviewError(null); setErrors(current => ({ ...current, to: undefined })); }} className="mt-1.5" /><FieldError>{errors.to}</FieldError></div></div></fieldset>
      </div>
      {previewError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Unable to generate preview</AlertTitle><AlertDescription>{previewError}</AlertDescription></Alert>}
      <div className="flex justify-end gap-3 border-t border-[var(--abms-border)] pt-5"><Button variant="outline" onClick={() => navigate({ to: '/' })}>Close</Button><Button onClick={openPreview} disabled={loading || !schoolYears.length || !mainAccounts.length} aria-busy={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading preview...</> : 'Preview'}</Button></div>
    </CardContent></Card></PageSurface>
  </Page>{preview && <PrintPreview preview={preview} onClose={() => setPreview(null)} />}</AdamsonBudgetLayout>;
}
