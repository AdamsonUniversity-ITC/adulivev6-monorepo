import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Loader2, Printer, X } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/alert';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/radio-group';
import { toast, Toaster } from 'sonner';
import AdamsonBudgetLayout from '../../layouts/Screenlayout';
import { itemrequestedperaccountRoute } from '../../router';
import { FieldError, Page, PageHeader, PageSurface } from '../../components/ui/Page';
import { ReportFilterCombobox, type ReportFilterOption } from './shared/ReportFilterCombobox';
import { ReportPrintPortal } from './shared/ReportPrintPortal';
import { formatMoney } from './shared/money';
import './shared/report-print.css';

type Identifier = string | number;
type PreviewType = 'summary' | 'detailed';
type UnitType = 'department' | 'section';
type Account = { id: Identifier; account_code: string; account_name: string };
type MainAccount = Account & { sub_accounts: Account[] };
type Unit = { type: UnitType; id: Identifier; name: string; active: boolean };
type LoaderPayload = { school_years?: string[]; main_accounts?: MainAccount[]; units?: Unit[] };
type Total = { total_amount: string };
type Item = {
  id: Identifier;
  requisition_date: string;
  requisition_number: string;
  description: string;
  unit_cost: string;
  quantity: number;
  amount: string;
};
type Preview = {
  report: {
    preview_type: PreviewType;
    school_year: string;
    from: string;
    to: string;
    all_accounts: boolean;
    main_account: Account | null;
    sub_account: Account | null;
    all_units: boolean;
    unit: Omit<Unit, 'active'> | null;
    printed_by: string;
  };
  main_account_groups: Array<{
    main_account: Account;
    sub_account_groups: Array<{
      sub_account: Account;
      rows: Array<{ unit: Omit<Unit, 'active'>; total_amount: string }>;
      unit_groups: Array<{ unit: Omit<Unit, 'active'>; items: Item[]; totals: Total }>;
      totals: Total;
    }>;
    totals: Total;
  }>;
  grand_total: Total;
  data_quality: {
    complete: boolean;
    warnings: Array<{ code: string; message: string; affected_count?: number; entity_ids?: Identifier[] }>;
    calculation_timezone: string;
    inclusive_period: { start: string; end: string };
  };
};
type Errors = Partial<Record<'schoolYear' | 'mainAccount' | 'unit' | 'from' | 'to', string>>;
type ApiFailure = { response?: { data?: { message?: string; errors?: Record<string, string[] | string> } } };

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const validAccount = (value: unknown) => isRecord(value)
  && (typeof value.id === 'string' || typeof value.id === 'number')
  && typeof value.account_code === 'string' && typeof value.account_name === 'string';
const validUnit = (value: unknown) => isRecord(value)
  && (value.type === 'department' || value.type === 'section')
  && (typeof value.id === 'string' || typeof value.id === 'number') && typeof value.name === 'string';
const validTotal = (value: unknown) => isRecord(value) && typeof value.total_amount === 'string';
const validItem = (value: unknown) => isRecord(value)
  && (typeof value.id === 'string' || typeof value.id === 'number')
  && typeof value.requisition_date === 'string' && typeof value.requisition_number === 'string'
  && typeof value.description === 'string' && typeof value.unit_cost === 'string'
  && Number.isInteger(value.quantity) && typeof value.amount === 'string';
const parsePreview = (value: unknown): Preview | null => {
  if (!isRecord(value) || !isRecord(value.report) || !isRecord(value.data_quality)) return null;
  const { report, data_quality: quality } = value;
  if ((report.preview_type !== 'summary' && report.preview_type !== 'detailed')
    || typeof report.school_year !== 'string' || typeof report.from !== 'string' || typeof report.to !== 'string'
    || typeof report.all_accounts !== 'boolean' || !(report.main_account === null || validAccount(report.main_account))
    || !(report.sub_account === null || validAccount(report.sub_account)) || typeof report.all_units !== 'boolean'
    || !(report.unit === null || validUnit(report.unit)) || typeof report.printed_by !== 'string'
    || (report.all_accounts ? report.main_account !== null || report.sub_account !== null : !validAccount(report.main_account))
    || (report.all_units ? report.unit !== null : !validUnit(report.unit))
    || !Array.isArray(value.main_account_groups) || !value.main_account_groups.every(mainGroup => isRecord(mainGroup)
      && validAccount(mainGroup.main_account) && validTotal(mainGroup.totals)
      && Array.isArray(mainGroup.sub_account_groups) && mainGroup.sub_account_groups.every(subGroup => isRecord(subGroup)
        && validAccount(subGroup.sub_account) && validTotal(subGroup.totals)
        && Array.isArray(subGroup.rows) && subGroup.rows.every(row => isRecord(row) && validUnit(row.unit) && typeof row.total_amount === 'string')
        && Array.isArray(subGroup.unit_groups) && subGroup.unit_groups.every(unitGroup => isRecord(unitGroup)
          && validUnit(unitGroup.unit) && validTotal(unitGroup.totals)
          && Array.isArray(unitGroup.items) && unitGroup.items.every(validItem))))
    || !validTotal(value.grand_total) || typeof quality.complete !== 'boolean'
    || !Array.isArray(quality.warnings) || !quality.warnings.every(warning => isRecord(warning) && typeof warning.code === 'string' && typeof warning.message === 'string')
    || typeof quality.calculation_timezone !== 'string' || !isRecord(quality.inclusive_period)
    || typeof quality.inclusive_period.start !== 'string' || typeof quality.inclusive_period.end !== 'string') return null;
  return value as unknown as Preview;
};
const requestError = (error: unknown) => {
  const data = (error as ApiFailure)?.response?.data;
  return Object.values(data?.errors ?? {}).flat()[0] || data?.message || 'The item requested report could not be loaded. Please review the filters and try again.';
};
const formatDate = (value: string) => {
  const [year, month, day] = value.split('-');
  return value ? `${month}/${day}/${year}` : '';
};
const AccountName = ({ account }: { account: Account }) => <>[{account.account_code}] {account.account_name}</>;
const UnitName = ({ unit }: { unit: Omit<Unit, 'active'> }) => <><span>{unit.name}</span><Badge variant="outline" className="type-badge ml-2 align-middle">{unit.type === 'department' ? 'Department' : 'Section'}</Badge></>;

function ReportBody({ preview }: { preview: Preview }) {
  if (!preview.main_account_groups.length) return <p className="report-empty">No requested items were found for the selected filters.</p>;
  if (preview.report.preview_type === 'summary') return <table className="requested-summary-table">
    <thead><tr><th>Account / Office</th><th>Total Amount</th></tr></thead>
    <tbody>{preview.main_account_groups.map(main => <Fragment key={String(main.main_account.id)}>
      <tr className="main-heading"><td><AccountName account={main.main_account} /></td><td>{formatMoney(main.totals.total_amount)}</td></tr>
      {main.sub_account_groups.map(sub => <Fragment key={`${main.main_account.id}-${sub.sub_account.id}`}>
        <tr className="sub-heading"><td><AccountName account={sub.sub_account} /></td><td>{formatMoney(sub.totals.total_amount)}</td></tr>
        {sub.rows.map(row => <tr key={`${sub.sub_account.id}-${row.unit.type}-${row.unit.id}`}><td className="unit-cell"><UnitName unit={row.unit} /></td><td>{formatMoney(row.total_amount)}</td></tr>)}
      </Fragment>)}
    </Fragment>)}<tr className="grand-total"><td>Overall Total:</td><td>{formatMoney(preview.grand_total.total_amount)}</td></tr></tbody>
  </table>;

  return <>{preview.main_account_groups.map(main => <section className="main-section" key={String(main.main_account.id)}>
    <div className="main-title"><span>Main Account: <AccountName account={main.main_account} /></span><strong>{formatMoney(main.totals.total_amount)}</strong></div>
    {main.sub_account_groups.map(sub => <section className="sub-section" key={`${main.main_account.id}-${sub.sub_account.id}`}>
      <div className="sub-title"><span>Sub Account: <AccountName account={sub.sub_account} /></span><strong>{formatMoney(sub.totals.total_amount)}</strong></div>
      {sub.unit_groups.map(unitGroup => <table className="requested-detail-table" key={`${sub.sub_account.id}-${unitGroup.unit.type}-${unitGroup.unit.id}`}>
        <caption><UnitName unit={unitGroup.unit} /></caption>
        <thead><tr><th>Date</th><th>Requisition No.</th><th>Description</th><th>Unit Cost</th><th>Quantity</th><th>Amount</th></tr></thead>
        <tbody>{unitGroup.items.map(item => <tr key={String(item.id)}><td>{formatDate(item.requisition_date)}</td><td>{item.requisition_number}</td><td>{item.description}</td><td>{formatMoney(item.unit_cost)}</td><td>{item.quantity}</td><td>{formatMoney(item.amount)}</td></tr>)}
          <tr className="unit-total"><td colSpan={5}>Unit Total:</td><td>{formatMoney(unitGroup.totals.total_amount)}</td></tr>
        </tbody>
      </table>)}
    </section>)}
  </section>)}<div className="detail-grand-total"><span>Overall Total:</span><strong>{formatMoney(preview.grand_total.total_amount)}</strong></div></>;
}

function PrintPreview({ preview, onClose }: { preview: Preview; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const overflow = document.body.style.overflow;
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden'; document.addEventListener('keydown', keydown); closeRef.current?.focus();
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); };
  }, [onClose]);
  const accountScope = preview.report.all_accounts ? 'All Accounts' : preview.report.main_account ? `[${preview.report.main_account.account_code}] ${preview.report.main_account.account_name}` : '';
  const unitScope = preview.report.all_units ? 'All Departments and Sections' : preview.report.unit?.name ?? '';
  return <ReportPrintPortal><div className="requested-report-preview abms-letter-preview fixed inset-0 z-[100] overflow-auto bg-slate-600/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Item requested per account print preview">
    <div className="report-actions abms-letter-actions mx-auto mb-3 flex justify-end gap-2"><Button ref={closeRef} variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" />Close</Button><Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button></div>
    <article className="requested-report abms-letter-sheet mx-auto bg-white p-7 text-black shadow-2xl sm:p-10">
      <header><h1>ADAMSON UNIVERSITY</h1><h2>ITEM REQUESTED PER ACCOUNT - {preview.report.preview_type === 'summary' ? 'Summary' : 'Detailed'} (Period: {formatDate(preview.report.from)} - {formatDate(preview.report.to)})</h2><p><b>School Year:</b><strong>{preview.report.school_year}</strong></p><p><b>Account:</b><strong>{accountScope}</strong></p>{preview.report.sub_account && <p><b>Sub Account:</b><strong><AccountName account={preview.report.sub_account} /></strong></p>}<p><b>Office:</b><strong>{unitScope}</strong></p></header>
      <ReportBody preview={preview} />
      <footer>-=xxx=- | Source: ABMS | Print Date: {new Date().toLocaleDateString()} | Printed By: {preview.report.printed_by}</footer>
    </article>
    <style>{`.requested-report{font-family:Arial,sans-serif;font-size:11px}.requested-report h1{font-size:20px;font-weight:800;margin:0}.requested-report h2{font-size:12px;margin:2px 0 10px}.requested-report header p{margin:3px 0;display:grid;grid-template-columns:100px 1fr}.requested-report table{width:100%;border-collapse:collapse;table-layout:fixed}.requested-report th,.requested-report td{padding:4px;font-variant-numeric:tabular-nums}.requested-summary-table thead,.requested-detail-table thead{border-top:2px dashed #555;border-bottom:2px dashed #555}.requested-summary-table th:first-child,.requested-summary-table td:first-child{text-align:left}.requested-summary-table th:last-child,.requested-summary-table td:last-child{text-align:right}.main-heading{font-weight:800;border-top:2px solid #555}.sub-heading{font-weight:700}.sub-heading td:first-child{padding-left:14px}.unit-cell{padding-left:30px!important}.type-badge{font-size:8px;padding:0 4px}.grand-total,.detail-grand-total{font-weight:800;border-top:2px solid #555;border-bottom:2px double #555}.grand-total td:first-child{text-align:right}.main-section{margin-top:10px}.main-title,.sub-title,.detail-grand-total{display:flex;justify-content:space-between;padding:5px 4px}.main-title{font-weight:800;border-top:2px solid #555}.sub-title{font-weight:700;border-top:1px dashed #777}.requested-detail-table{margin-bottom:8px}.requested-detail-table caption{text-align:left;font-weight:700;padding:5px 14px}.requested-detail-table th:nth-last-child(-n+3),.requested-detail-table td:nth-last-child(-n+3){text-align:right}.requested-detail-table th:nth-child(1){width:12%}.requested-detail-table th:nth-child(2){width:16%}.requested-detail-table th:nth-child(3){width:36%}.unit-total{font-weight:700;border-top:1px dashed #777}.unit-total td:first-child{text-align:right}.report-empty{text-align:center;padding:24px;color:#555}.requested-report footer{margin-top:20px;border-top:2px dashed #555;padding-top:4px}@page{size:letter landscape;margin:0.35in}@media print{body *{visibility:hidden!important}.requested-report-preview,.requested-report-preview *{visibility:visible!important}.requested-report-preview{position:absolute!important;inset:0!important;overflow:visible!important;background:white!important;padding:0!important}.report-actions{display:none!important}.requested-report{box-shadow:none!important;max-width:none!important;min-height:0!important;padding:0!important}.main-title,.sub-title,.unit-total,.grand-total,.detail-grand-total{break-inside:avoid}}`}</style>
  </div></ReportPrintPortal>;
}

export default function ItemRequestedPerAccount() {
  const navigate = useNavigate();
  const loader = itemrequestedperaccountRoute.useLoaderData() as { data?: { data?: LoaderPayload } | LoaderPayload };
  const payload = ((loader?.data as { data?: LoaderPayload })?.data ?? loader?.data ?? {}) as LoaderPayload;
  const [schoolYear, setSchoolYear] = useState('');
  const [allAccounts, setAllAccounts] = useState(false);
  const [mainAccountId, setMainAccountId] = useState('');
  const [subAccountId, setSubAccountId] = useState('');
  const [allUnits, setAllUnits] = useState(false);
  const [unitValue, setUnitValue] = useState('');
  const [previewType, setPreviewType] = useState<PreviewType>('summary');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const schoolYears = useMemo(() => Array.from(new Set(Array.isArray(payload.school_years) ? payload.school_years.filter((year): year is string => typeof year === 'string' && Boolean(year)) : [])).sort((a, b) => b.localeCompare(a)), [payload.school_years]);
  const mainAccounts = useMemo<MainAccount[]>(() => Array.isArray(payload.main_accounts) ? payload.main_accounts.filter((account): account is MainAccount => validAccount(account) && Array.isArray(account.sub_accounts) && account.sub_accounts.every(validAccount)) : [], [payload.main_accounts]);
  const units = useMemo<Unit[]>(() => Array.isArray(payload.units) ? payload.units.filter((unit): unit is Unit => validUnit(unit) && typeof unit.active === 'boolean').sort((a, b) => a.name.localeCompare(b.name)) : [], [payload.units]);
  const selectedMain = mainAccounts.find(account => String(account.id) === mainAccountId);
  const selectedSub = selectedMain?.sub_accounts.find(account => String(account.id) === subAccountId);
  const selectedUnit = units.find(unit => `${unit.type}:${unit.id}` === unitValue);
  const accountOption = (account: Account): ReportFilterOption => ({ value: String(account.id), label: `[${account.account_code}] ${account.account_name}` });

  const openPreview = async () => {
    const next: Errors = {};
    if (!schoolYear) next.schoolYear = 'School year is required.';
    if (!allAccounts && !selectedMain) next.mainAccount = 'Main Account is required unless All Accounts is selected.';
    if (!allUnits && !selectedUnit) next.unit = 'Department or Section is required unless All Units is selected.';
    if (!from) next.from = 'From date is required.';
    if (!to) next.to = 'To date is required.';
    if (from && to && from > to) next.to = 'To date must be on or after the From date.';
    setErrors(next); setPreviewError(null);
    if (Object.keys(next).length || (!allAccounts && !selectedMain) || (!allUnits && !selectedUnit)) return;
    setLoading(true); setPreview(null);
    try {
      const response = await financeSvc.get('/abms/item-requested-per-account/preview', { params: {
        school_year: schoolYear, preview_type: previewType, all_accounts: allAccounts ? 1 : 0,
        ...(!allAccounts && selectedMain ? { main_account_id: selectedMain.id } : {}),
        ...(!allAccounts && selectedSub ? { sub_account_id: selectedSub.id } : {}),
        all_units: allUnits ? 1 : 0,
        ...(!allUnits && selectedUnit ? { unit_type: selectedUnit.type, unit_id: selectedUnit.id } : {}),
        from, to,
      } });
      const nextPreview = parsePreview(response.data);
      if (!nextPreview) { setPreviewError('The finance service returned an invalid preview response. Please try again.'); return; }
      if (!nextPreview.data_quality.complete || nextPreview.data_quality.warnings.length) {
        const count = nextPreview.data_quality.warnings.length;
        toast.warning('Some requested-item history may be incomplete.', { description: count ? `${count} data-quality notice${count === 1 ? '' : 's'} found. The available figures are shown in the report.` : 'The available figures are shown in the report.', duration: 10000 });
      }
      setPreview(nextPreview);
    } catch (error) { setPreviewError(requestError(error)); } finally { setLoading(false); }
  };

  return <AdamsonBudgetLayout><Toaster position="bottom-right" richColors closeButton /><Page width="default">
    <PageHeader title="Item Requested Per Account" description="Review requested items by account, department, or section for an inclusive period." />
    <PageSurface><Card className="border-0 bg-transparent shadow-none"><CardContent className="space-y-6 py-6">
      {!schoolYears.length && <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">No school years are currently available.</p>}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5"><Label htmlFor="requested-school-year">School Year</Label><ReportFilterCombobox id="requested-school-year" options={schoolYears.map(value => ({ value, label: value }))} value={schoolYear} disabled={loading || !schoolYears.length} placeholder="Select school year" searchPlaceholder="Search school year..." emptyText="No school year found." invalid={Boolean(errors.schoolYear)} errorId="requested-school-year-error" groupLabel="Available school years" onChange={value => { setSchoolYear(value); setPreviewError(null); setErrors(current => ({ ...current, schoolYear: undefined })); }} /><FieldError id="requested-school-year-error">{errors.schoolYear}</FieldError></div>
        <div className="space-y-1.5"><Label htmlFor="requested-main-account">Main Account</Label><ReportFilterCombobox id="requested-main-account" options={mainAccounts.map(accountOption)} value={mainAccountId} disabled={loading || allAccounts || !mainAccounts.length} placeholder={allAccounts ? 'All accounts' : 'Select main account'} searchPlaceholder="Search main account..." emptyText="No main account found." invalid={Boolean(errors.mainAccount)} errorId="requested-main-account-error" groupLabel="Main accounts" onChange={value => { setMainAccountId(value); setSubAccountId(''); setPreviewError(null); setErrors(current => ({ ...current, mainAccount: undefined })); }} /><FieldError id="requested-main-account-error">{errors.mainAccount}</FieldError></div>
        <div className="space-y-1.5"><Label htmlFor="requested-sub-account">Sub Account <span className="text-muted-foreground">(Optional)</span></Label><ReportFilterCombobox id="requested-sub-account" options={(selectedMain?.sub_accounts ?? []).map(accountOption)} value={subAccountId} disabled={loading || allAccounts || !selectedMain || !selectedMain.sub_accounts.length} placeholder={allAccounts ? 'All accounts' : !selectedMain ? 'Select a main account first' : 'All sub-accounts'} searchPlaceholder="Search sub-account..." emptyText="No sub-account found." groupLabel="Sub-accounts" clearLabel="All sub-accounts" onChange={value => { setSubAccountId(value); setPreviewError(null); }} /></div>
        <div className="space-y-1.5"><Label htmlFor="requested-unit">Department / Section</Label><ReportFilterCombobox id="requested-unit" options={units.map(unit => ({ value: `${unit.type}:${unit.id}`, label: unit.active ? unit.name : `${unit.name} (Inactive)`, badge: `${unit.type === 'department' ? 'Department' : 'Section'}${unit.active ? '' : ' · Inactive'}` }))} value={unitValue} disabled={loading || allUnits || !units.length} placeholder={allUnits ? 'All departments and sections' : 'Select department or section'} searchPlaceholder="Search department or section..." emptyText="No department or section found." invalid={Boolean(errors.unit)} errorId="requested-unit-error" groupLabel="Departments and sections" onChange={value => { setUnitValue(value); setPreviewError(null); setErrors(current => ({ ...current, unit: undefined })); }} /><FieldError id="requested-unit-error">{errors.unit}</FieldError></div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <fieldset className="rounded-lg border border-[var(--abms-border)] p-4"><legend className="px-2 text-sm font-semibold text-[var(--abms-primary)]">Report Options</legend><RadioGroup value={previewType} onValueChange={value => { setPreviewType(value as PreviewType); setPreviewError(null); }} className="space-y-3"><div className="flex items-center gap-2"><RadioGroupItem id="requested-summary" value="summary" /><Label htmlFor="requested-summary">Summary</Label></div><div className="flex items-center gap-2"><RadioGroupItem id="requested-detailed" value="detailed" /><Label htmlFor="requested-detailed">Detailed</Label></div></RadioGroup><div className="mt-4 grid gap-3 border-t border-[var(--abms-border)] pt-4 sm:grid-cols-2"><div className="flex items-center gap-2"><Checkbox id="all-accounts" checked={allAccounts} disabled={loading} onCheckedChange={checked => { const enabled = checked === true; setAllAccounts(enabled); if (enabled) { setMainAccountId(''); setSubAccountId(''); } setErrors(current => ({ ...current, mainAccount: undefined })); setPreviewError(null); }} /><Label htmlFor="all-accounts">All Accounts</Label></div><div className="flex items-center gap-2"><Checkbox id="all-units" checked={allUnits} disabled={loading} onCheckedChange={checked => { const enabled = checked === true; setAllUnits(enabled); if (enabled) setUnitValue(''); setErrors(current => ({ ...current, unit: undefined })); setPreviewError(null); }} /><Label htmlFor="all-units">All Departments / Sections</Label></div></div></fieldset>
        <fieldset className="rounded-lg border border-[var(--abms-border)] p-4"><legend className="px-2 text-sm font-semibold text-[var(--abms-primary)]">Period</legend><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="requested-from">From</Label><Input id="requested-from" type="date" value={from} disabled={loading} onChange={event => { setFrom(event.target.value); setPreviewError(null); setErrors(current => ({ ...current, from: undefined, to: undefined })); }} className="mt-1.5" /><FieldError>{errors.from}</FieldError></div><div><Label htmlFor="requested-to">To</Label><Input id="requested-to" type="date" value={to} min={from || undefined} disabled={loading} onChange={event => { setTo(event.target.value); setPreviewError(null); setErrors(current => ({ ...current, to: undefined })); }} className="mt-1.5" /><FieldError>{errors.to}</FieldError></div></div></fieldset>
      </div>
      {previewError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Unable to generate preview</AlertTitle><AlertDescription>{previewError}</AlertDescription></Alert>}
      <div className="flex justify-end gap-3 border-t border-[var(--abms-border)] pt-5"><Button variant="outline" onClick={() => navigate({ to: '/' })}>Close</Button><Button onClick={openPreview} disabled={loading || !schoolYears.length || (!allAccounts && !mainAccounts.length) || (!allUnits && !units.length)} aria-busy={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading preview...</> : 'Preview'}</Button></div>
    </CardContent></Card></PageSurface>
  </Page>{preview && <PrintPreview preview={preview} onClose={() => setPreview(null)} />}</AdamsonBudgetLayout>;
}
