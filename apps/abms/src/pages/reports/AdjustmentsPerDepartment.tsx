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
import { adjustmentsperdepartmentRoute } from '../../router';
import { FieldError, Page, PageHeader, PageSurface } from '../../components/ui/Page';
import { ReportFilterCombobox } from './shared/ReportFilterCombobox';
import { ReportPrintPortal } from './shared/ReportPrintPortal';
import { getEntryDateDefaults } from './shared/entryDateDefaults';
import { formatMoney } from './shared/money';
import './shared/report-print.css';

type Identifier = string | number;
type PreviewType = 'summary' | 'detailed' | 'detailed_per_date';
type UnitType = 'department' | 'section';
type Unit = { type: UnitType; id: number; name: string };
type LoaderUnit = Unit & { active: boolean };
type Account = { id: Identifier; account_code: string; account_name: string };
type Money = { additional: string; deduction: string };
type EventRow = Money & { id: Identifier; adjustment_id: Identifier; event_type: string; date: string; remarks: string };
type LoaderPayload = {
  school_years?: string[];
  units?: LoaderUnit[];
  adjustment_first_dates?: Record<string, unknown>;
  current_date?: unknown;
};
type Preview = {
  report: {
    preview_type: PreviewType;
    school_year: string;
    from: string;
    to: string;
    all_units: boolean;
    unit: Unit | null;
    printed_by: string;
  };
  unit_groups: Array<{
    unit: Unit;
    categories: Array<{
      classification: 'NON-CAPEX' | 'CAPEX';
      main_accounts: Array<{
        main_account: Account;
        sub_accounts: Array<{ sub_account: Account; rows: EventRow[]; totals: Money }>;
        totals: Money;
      }>;
      totals: Money;
    }>;
    totals: Money;
  }>;
  date_groups: Array<{
    date: string;
    rows: Array<EventRow & { unit: Unit; main_account: Account; sub_account: Account }>;
    totals: Money;
  }>;
  grand_total: Money;
  data_quality: {
    complete: boolean;
    warnings: Array<{ code: string; message: string; affected_count?: number; entity_ids?: Identifier[] }>;
    calculation_timezone: string;
    inclusive_period: { start: string; end: string };
  };
};
type Errors = Partial<Record<'schoolYear' | 'unit' | 'from' | 'to', string>>;
type ApiFailure = { response?: { data?: { message?: string; errors?: Record<string, string[] | string> } } };

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const validUnit = (value: unknown) => isRecord(value) && (value.type === 'department' || value.type === 'section')
  && typeof value.id === 'number' && typeof value.name === 'string';
const validAccount = (value: unknown) => isRecord(value) && (typeof value.id === 'string' || typeof value.id === 'number')
  && typeof value.account_code === 'string' && typeof value.account_name === 'string';
const validMoney = (value: unknown) => isRecord(value) && typeof value.additional === 'string' && typeof value.deduction === 'string';
const validEvent = (value: unknown) => isRecord(value) && validMoney(value)
  && (typeof value.id === 'string' || typeof value.id === 'number')
  && (typeof value.adjustment_id === 'string' || typeof value.adjustment_id === 'number')
  && typeof value.event_type === 'string' && typeof value.date === 'string' && typeof value.remarks === 'string';
const parsePreview = (value: unknown): Preview | null => {
  if (!isRecord(value) || !isRecord(value.report) || !isRecord(value.data_quality)) return null;
  const { report, data_quality: quality } = value;
  if ((report.preview_type !== 'summary' && report.preview_type !== 'detailed' && report.preview_type !== 'detailed_per_date')
    || typeof report.school_year !== 'string' || typeof report.from !== 'string' || typeof report.to !== 'string'
    || typeof report.all_units !== 'boolean' || !(report.unit === null || validUnit(report.unit)) || typeof report.printed_by !== 'string'
    || (report.all_units ? report.unit !== null : !validUnit(report.unit))
    || !Array.isArray(value.unit_groups) || !value.unit_groups.every(unitGroup => isRecord(unitGroup)
      && validUnit(unitGroup.unit) && validMoney(unitGroup.totals) && Array.isArray(unitGroup.categories)
      && unitGroup.categories.every(category => isRecord(category)
        && (category.classification === 'NON-CAPEX' || category.classification === 'CAPEX')
        && validMoney(category.totals) && Array.isArray(category.main_accounts)
        && category.main_accounts.every(main => isRecord(main) && validAccount(main.main_account)
          && validMoney(main.totals) && Array.isArray(main.sub_accounts)
          && main.sub_accounts.every(sub => isRecord(sub) && validAccount(sub.sub_account)
            && validMoney(sub.totals) && Array.isArray(sub.rows) && sub.rows.every(validEvent)))))
    || !Array.isArray(value.date_groups) || !value.date_groups.every(dateGroup => isRecord(dateGroup)
      && typeof dateGroup.date === 'string' && validMoney(dateGroup.totals) && Array.isArray(dateGroup.rows)
      && dateGroup.rows.every(row => validEvent(row) && isRecord(row) && validUnit(row.unit)
        && validAccount(row.main_account) && validAccount(row.sub_account)))
    || !validMoney(value.grand_total) || typeof quality.complete !== 'boolean'
    || !Array.isArray(quality.warnings) || !quality.warnings.every(warning => isRecord(warning) && typeof warning.code === 'string' && typeof warning.message === 'string')
    || typeof quality.calculation_timezone !== 'string' || !isRecord(quality.inclusive_period)
    || typeof quality.inclusive_period.start !== 'string' || typeof quality.inclusive_period.end !== 'string') return null;
  return value as unknown as Preview;
};
const errorMessage = (error: unknown) => {
  const data = (error as ApiFailure)?.response?.data;
  return Object.values(data?.errors ?? {}).flat()[0] || data?.message || 'The adjustments report could not be loaded. Please review the filters and try again.';
};
const formatDate = (value: string) => {
  const [year, month, day] = value.split('-');
  return value ? `${month}/${day}/${year}` : '';
};
const AccountName = ({ account }: { account: Account }) => <>[{account.account_code}] {account.account_name}</>;
const UnitName = ({ unit }: { unit: Unit }) => <>{unit.name}<Badge variant="outline" className="type-badge ml-2 align-middle">{unit.type === 'department' ? 'Department' : 'Section'}</Badge></>;
const MoneyCells = ({ money }: { money: Money }) => <><td>{formatMoney(money.additional)}</td><td>{formatMoney(money.deduction)}</td></>;

function SummaryTable({ preview }: { preview: Preview }) {
  if (!preview.unit_groups.length) return <p className="report-empty">No adjustments were found for the selected filters.</p>;
  return <table className="adjustment-summary-table"><thead><tr><th>Account</th><th>Additional</th><th>Deduction</th></tr></thead><tbody>
    {preview.unit_groups.map(unitGroup => <Fragment key={`${unitGroup.unit.type}-${unitGroup.unit.id}`}>
      <tr className="unit-heading"><td><UnitName unit={unitGroup.unit} /></td><MoneyCells money={unitGroup.totals} /></tr>
      {unitGroup.categories.map(category => <Fragment key={`${unitGroup.unit.type}-${unitGroup.unit.id}-${category.classification}`}>
        <tr className="category-heading"><td>{category.classification}</td><MoneyCells money={category.totals} /></tr>
        {category.main_accounts.map(main => <Fragment key={`${category.classification}-${main.main_account.id}`}>
          <tr className="main-account"><td><AccountName account={main.main_account} /></td><MoneyCells money={main.totals} /></tr>
          {main.sub_accounts.map(sub => <Fragment key={`${main.main_account.id}-${sub.sub_account.id}`}>
            <tr className="sub-account"><td><AccountName account={sub.sub_account} /></td><MoneyCells money={sub.totals} /></tr>
          </Fragment>)}
        </Fragment>)}
      </Fragment>)}
    </Fragment>)}
    <tr className="grand-total"><td>Overall Total:</td><MoneyCells money={preview.grand_total} /></tr>
  </tbody></table>;
}

function DetailedTable({ preview }: { preview: Preview }) {
  if (!preview.unit_groups.length) return <p className="report-empty">No adjustments were found for the selected filters.</p>;
  return <table className="adjustment-detail-table"><thead><tr><th>Account</th><th>Date</th><th>Adj. Additional</th><th>Adj. Deduction</th><th>Remarks / Description</th></tr></thead><tbody>
    {preview.unit_groups.map(unitGroup => <Fragment key={`${unitGroup.unit.type}-${unitGroup.unit.id}`}>
      <tr className="unit-heading"><td colSpan={2}><UnitName unit={unitGroup.unit} /></td><td>{formatMoney(unitGroup.totals.additional)}</td><td>{formatMoney(unitGroup.totals.deduction)}</td><td /></tr>
      {unitGroup.categories.map(category => <Fragment key={`${unitGroup.unit.type}-${unitGroup.unit.id}-${category.classification}`}>
        <tr className="category-heading"><td colSpan={2}>{category.classification}</td><td>{formatMoney(category.totals.additional)}</td><td>{formatMoney(category.totals.deduction)}</td><td /></tr>
        {category.main_accounts.map(main => <Fragment key={`${category.classification}-${main.main_account.id}`}>
          <tr className="main-account"><td colSpan={2}><AccountName account={main.main_account} /></td><td>{formatMoney(main.totals.additional)}</td><td>{formatMoney(main.totals.deduction)}</td><td /></tr>
          {main.sub_accounts.map(sub => <Fragment key={`${main.main_account.id}-${sub.sub_account.id}`}>
            <tr className="sub-account"><td colSpan={2}><AccountName account={sub.sub_account} /></td><td>{formatMoney(sub.totals.additional)}</td><td>{formatMoney(sub.totals.deduction)}</td><td /></tr>
            {sub.rows.map(row => <tr className="event-row" key={String(row.id)}><td /><td>{formatDate(row.date)}</td><td>{formatMoney(row.additional)}</td><td>{formatMoney(row.deduction)}</td><td>{row.remarks}</td></tr>)}
          </Fragment>)}
        </Fragment>)}
      </Fragment>)}
    </Fragment>)}
    <tr className="grand-total"><td colSpan={2}>Overall Total:</td><td>{formatMoney(preview.grand_total.additional)}</td><td>{formatMoney(preview.grand_total.deduction)}</td><td /></tr>
  </tbody></table>;
}

function PerDateTable({ preview }: { preview: Preview }) {
  if (!preview.date_groups.length) return <p className="report-empty">No adjustments were found for the selected date.</p>;
  return <table className="adjustment-date-table"><thead><tr><th>Department</th><th>Account</th><th>Adj. Additional</th><th>Adj. Deduction</th><th>Remarks / Description</th></tr></thead><tbody>
    {preview.date_groups.flatMap(group => group.rows.map(row => <tr key={`${group.date}-${row.id}`}><td><UnitName unit={row.unit} /></td><td><AccountName account={row.main_account} /> / <AccountName account={row.sub_account} /></td><td>{formatMoney(row.additional)}</td><td>{formatMoney(row.deduction)}</td><td>{row.remarks}</td></tr>))}
    <tr className="grand-total"><td colSpan={2}>Overall Total:</td><td>{formatMoney(preview.grand_total.additional)}</td><td>{formatMoney(preview.grand_total.deduction)}</td><td /></tr>
  </tbody></table>;
}

function PrintPreview({ preview, onClose }: { preview: Preview; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const overflow = document.body.style.overflow;
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden'; document.addEventListener('keydown', keydown); closeRef.current?.focus();
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); };
  }, [onClose]);
  const title = preview.report.preview_type === 'summary' ? 'Summary' : preview.report.preview_type === 'detailed' ? 'Detailed' : 'Detailed Per Date';
  return <ReportPrintPortal><div className="adjustment-report-preview abms-letter-preview fixed inset-0 z-[100] overflow-auto bg-slate-600/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Adjustments per department print preview">
    <div className="report-actions mx-auto mb-3 flex max-w-[1200px] justify-end gap-2"><Button ref={closeRef} variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" />Close</Button><Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button></div>
    <article className="adjustment-report mx-auto min-h-[700px] max-w-[1200px] bg-white p-7 text-black shadow-2xl sm:p-10"><header><h1>ADAMSON UNIVERSITY</h1><h2>ADJUSTMENTS PER DEPARTMENT - {title} ({preview.report.preview_type === 'detailed_per_date' ? `Date: ${formatDate(preview.report.from)}` : `Period: ${formatDate(preview.report.from)} - ${formatDate(preview.report.to)}`})</h2><p><b>School Year:</b><strong>{preview.report.school_year}</strong></p><p><b>Office:</b><strong>{preview.report.all_units ? 'All Departments and Sections' : preview.report.unit?.name}</strong></p></header>
      {preview.report.preview_type === 'summary' ? <SummaryTable preview={preview} /> : preview.report.preview_type === 'detailed' ? <DetailedTable preview={preview} /> : <PerDateTable preview={preview} />}
      <footer>-=xxx=- | Source: ABMS | Print Date: {new Date().toLocaleDateString()} | Printed By: {preview.report.printed_by}</footer></article>
    <style>{`.adjustment-report{font-family:Arial,sans-serif;font-size:10px}.adjustment-report h1{font-size:20px;font-weight:800;margin:0}.adjustment-report h2{font-size:12px;margin:2px 0 10px}.adjustment-report header p{margin:3px 0;display:grid;grid-template-columns:100px 1fr}.adjustment-report table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:8px}.adjustment-report thead{display:table-header-group;border-top:2px dashed #555;border-bottom:2px dashed #555}.adjustment-report th,.adjustment-report td{padding:3px 4px;text-align:left;font-variant-numeric:tabular-nums}.adjustment-summary-table th:first-child{width:72%}.adjustment-summary-table th:not(:first-child),.adjustment-summary-table td:not(:first-child),.adjustment-detail-table th:nth-child(3),.adjustment-detail-table th:nth-child(4),.adjustment-detail-table td:nth-child(3),.adjustment-detail-table td:nth-child(4),.adjustment-date-table th:nth-child(3),.adjustment-date-table th:nth-child(4),.adjustment-date-table td:nth-child(3),.adjustment-date-table td:nth-child(4){text-align:right}.adjustment-detail-table th:nth-child(1){width:28%}.adjustment-detail-table th:nth-child(2){width:11%}.adjustment-detail-table th:nth-child(3),.adjustment-detail-table th:nth-child(4){width:12%}.adjustment-date-table th:nth-child(1){width:20%}.adjustment-date-table th:nth-child(2){width:31%}.adjustment-date-table th:nth-child(3),.adjustment-date-table th:nth-child(4){width:12%}.unit-heading{font-weight:800;border-top:2px solid #555}.category-heading{font-weight:800}.category-heading td:first-child{padding-left:12px}.main-account{font-weight:700}.main-account td:first-child{padding-left:24px}.sub-account td:first-child{padding-left:38px}.event-row td:first-child{padding-left:54px;color:#334155}.type-badge{font-size:8px;padding:0 4px}.grand-total{font-weight:800;border-top:2px solid #555;border-bottom:2px double #555}.grand-total td:first-child{text-align:right}.report-empty{text-align:center;padding:24px;color:#555}.adjustment-report footer{margin-top:20px;border-top:2px dashed #555;padding-top:4px}@page{size:letter landscape;margin:0.35in}@media print{body *{visibility:hidden!important}.adjustment-report-preview,.adjustment-report-preview *{visibility:visible!important}.adjustment-report-preview{position:absolute!important;inset:0!important;overflow:visible!important;background:white!important;padding:0!important}.report-actions{display:none!important}.adjustment-report{box-shadow:none!important;max-width:none!important;min-height:0!important;padding:0!important}.unit-heading,.category-heading,.main-account,.sub-account,.grand-total{break-inside:avoid}}`}</style>
  </div></ReportPrintPortal>;
}

export default function AdjustmentsPerDepartment() {
  const navigate = useNavigate();
  const loader = adjustmentsperdepartmentRoute.useLoaderData() as { data?: { data?: LoaderPayload } | LoaderPayload };
  const payload = ((loader?.data as { data?: LoaderPayload })?.data ?? loader?.data ?? {}) as LoaderPayload;
  const [schoolYear, setSchoolYear] = useState('');
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
  const units = useMemo<LoaderUnit[]>(() => Array.isArray(payload.units) ? payload.units.filter((unit): unit is LoaderUnit => validUnit(unit) && typeof unit.active === 'boolean').sort((a, b) => a.name.localeCompare(b.name)) : [], [payload.units]);
  const selectedUnit = units.find(unit => `${unit.type}:${unit.id}` === unitValue);

  const openPreview = async () => {
    const next: Errors = {};
    if (!schoolYear) next.schoolYear = 'School year is required.';
    if (!allUnits && !selectedUnit) next.unit = 'Department or Section is required unless All Units is selected.';
    if (!from) next.from = 'From date is required.';
    if (!to) next.to = 'To date is required.';
    if (from && to && from > to) next.to = 'To date must be on or after the From date.';
    if (previewType === 'detailed_per_date' && from && to && from !== to) next.to = 'Detailed Per Date requires From and To to be the same date.';
    setErrors(next); setPreviewError(null);
    if (Object.keys(next).length || (!allUnits && !selectedUnit)) return;
    setLoading(true); setPreview(null);
    try {
      const response = await financeSvc.get('/abms/adjustments-per-department/preview', { params: { school_year: schoolYear, all_units: allUnits ? 1 : 0, ...(!allUnits && selectedUnit ? { unit_type: selectedUnit.type, unit_id: selectedUnit.id } : {}), from, to, preview_type: previewType } });
      const nextPreview = parsePreview(response.data);
      if (!nextPreview) { setPreviewError('The finance service returned an invalid preview response. Please try again.'); return; }
      if (!nextPreview.data_quality.complete || nextPreview.data_quality.warnings.length) {
        const count = nextPreview.data_quality.warnings.length;
        toast.warning('Some adjustment history may be incomplete.', { description: count ? `${count} data-quality notice${count === 1 ? '' : 's'} found. The available figures are shown in the report.` : 'The available figures are shown in the report.', duration: 10000 });
      }
      setPreview(nextPreview);
    } catch (error) { setPreviewError(errorMessage(error)); } finally { setLoading(false); }
  };

  return <AdamsonBudgetLayout><Toaster position="bottom-right" richColors closeButton /><Page width="default"><PageHeader title="Adjustments Per Department" description="Review additional and deduction adjustments by department or section." /><PageSurface><Card className="border-0 bg-transparent shadow-none"><CardContent className="space-y-6 py-6">
    {!schoolYears.length && <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">No school years are currently available.</p>}
    <div className="grid gap-5 md:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="adjustment-school-year">School Year</Label><ReportFilterCombobox id="adjustment-school-year" options={schoolYears.map(value => ({ value, label: value }))} value={schoolYear} disabled={loading || !schoolYears.length} placeholder="Select school year" searchPlaceholder="Search school year..." emptyText="No school year found." invalid={Boolean(errors.schoolYear)} errorId="adjustment-school-year-error" groupLabel="Available school years" onChange={value => { const dates = getEntryDateDefaults(payload.adjustment_first_dates, payload.current_date, value); setSchoolYear(value); setFrom(dates.from); setTo(dates.to); setPreviewError(null); setErrors(current => ({ ...current, schoolYear: undefined, from: undefined, to: undefined })); }} /><FieldError id="adjustment-school-year-error">{errors.schoolYear}</FieldError></div>
      <div className="space-y-1.5"><Label htmlFor="adjustment-unit">Department / Section</Label><ReportFilterCombobox id="adjustment-unit" options={units.map(unit => ({ value: `${unit.type}:${unit.id}`, label: unit.active ? unit.name : `${unit.name} (Inactive)`, badge: `${unit.type === 'department' ? 'Department' : 'Section'}${unit.active ? '' : ' · Inactive'}` }))} value={unitValue} disabled={loading || allUnits || !units.length} placeholder={allUnits ? 'All departments and sections' : 'Select department or section'} searchPlaceholder="Search department or section..." emptyText="No department or section found." invalid={Boolean(errors.unit)} errorId="adjustment-unit-error" groupLabel="Departments and sections" wideOptions onChange={value => { setUnitValue(value); setPreviewError(null); setErrors(current => ({ ...current, unit: undefined })); }} /><FieldError id="adjustment-unit-error">{errors.unit}</FieldError></div></div>
    <div className="grid gap-6 md:grid-cols-2"><fieldset className="rounded-lg border border-[var(--abms-border)] p-4"><legend className="px-2 text-sm font-semibold text-[var(--abms-primary)]">Report Options</legend><RadioGroup value={previewType} onValueChange={value => { setPreviewType(value as PreviewType); setPreviewError(null); setErrors(current => ({ ...current, to: undefined })); }} className="space-y-3"><div className="flex items-center gap-2"><RadioGroupItem id="adjustment-summary" value="summary" /><Label htmlFor="adjustment-summary">Summary</Label></div><div className="flex items-center gap-2"><RadioGroupItem id="adjustment-detailed" value="detailed" /><Label htmlFor="adjustment-detailed">Detailed</Label></div><div className="flex items-center gap-2"><RadioGroupItem id="adjustment-per-date" value="detailed_per_date" /><Label htmlFor="adjustment-per-date">Detailed Per Date</Label></div></RadioGroup><div className="mt-4 flex items-center gap-2 border-t border-[var(--abms-border)] pt-4"><Checkbox id="adjustment-all-units" checked={allUnits} disabled={loading} onCheckedChange={checked => { const enabled = checked === true; setAllUnits(enabled); if (enabled) setUnitValue(''); setErrors(current => ({ ...current, unit: undefined })); setPreviewError(null); }} /><Label htmlFor="adjustment-all-units">All Departments / Sections</Label></div></fieldset>
      <fieldset className="rounded-lg border border-[var(--abms-border)] p-4"><legend className="px-2 text-sm font-semibold text-[var(--abms-primary)]">Period</legend><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="adjustment-from">From</Label><Input id="adjustment-from" type="date" value={from} disabled={loading} onChange={event => { const value = event.target.value; setFrom(value); if (previewType === 'detailed_per_date') setTo(value); setPreviewError(null); setErrors(current => ({ ...current, from: undefined, to: undefined })); }} className="mt-1.5" /><FieldError>{errors.from}</FieldError></div><div><Label htmlFor="adjustment-to">To</Label><Input id="adjustment-to" type="date" value={to} min={from || undefined} disabled={loading} onChange={event => { setTo(event.target.value); setPreviewError(null); setErrors(current => ({ ...current, to: undefined })); }} className="mt-1.5" /><FieldError>{errors.to}</FieldError></div></div>{previewType === 'detailed_per_date' && <p className="mt-3 text-xs text-muted-foreground">Detailed Per Date requires a single date; changing From also updates To.</p>}</fieldset></div>
    {previewError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Unable to generate preview</AlertTitle><AlertDescription>{previewError}</AlertDescription></Alert>}
    <div className="flex justify-end gap-3 border-t border-[var(--abms-border)] pt-5"><Button variant="outline" onClick={() => navigate({ to: '/' })}>Close</Button><Button onClick={openPreview} disabled={loading || !schoolYears.length || (!allUnits && !units.length)} aria-busy={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading preview...</> : 'Preview'}</Button></div>
  </CardContent></Card></PageSurface></Page>{preview && <PrintPreview preview={preview} onClose={() => setPreview(null)} />}</AdamsonBudgetLayout>;
}
