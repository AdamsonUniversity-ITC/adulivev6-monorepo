import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Loader2, Printer, X } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/alert';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/radio-group';
import { toast, Toaster } from 'sonner';
import AdamsonBudgetLayout from '../../layouts/Screenlayout';
import { budgetperformancedepartmentRoute } from '../../router';
import { FieldError, Page, PageHeader, PageSurface } from '../../components/ui/Page';
import { ReportFilterCombobox, type ReportFilterOption } from './shared/ReportFilterCombobox';
import { ReportPrintPortal } from './shared/ReportPrintPortal';
import { formatMoney } from './shared/money';
import './shared/report-print.css';

type OrgKind = 'Department' | 'Section';
type PreviewType = 'departmental' | 'grand' | 'detailed';
type Identifier = string | number;

type Division = { cid: Identifier; name?: string; description?: string; division_name?: string; isactive?: Identifier };
type Department = { cid: Identifier; division_id: Identifier; name?: string; description?: string; department_name?: string; isactive?: Identifier; kind?: string };
type Section = { cid: Identifier; department_id: Identifier; name?: string; description?: string; section_name?: string; isactive?: Identifier; kind?: string };
type UnitOption = { value: string; cid: string; name: string; kind: OrgKind };

type LoaderPayload = {
  school_years?: Array<string | { school_year?: string }>;
  divisions?: Division[];
  departments?: Department[];
  sections?: Section[];
};

type Errors = Partial<Record<'schoolYear' | 'division' | 'unit' | 'from' | 'to', string>>;

type BudgetPerformanceAmounts = {
  approved_budget: string;
  adjustment_additional: string;
  adjustment_deduction: string;
  released: string;
  unused_amount: string;
  balance: string;
};

type BudgetPerformanceAccount = BudgetPerformanceAmounts & {
  account_id: Identifier;
  account_code: string;
  account_name: string;
  children?: Array<BudgetPerformanceAmounts & {
    account_id: Identifier;
    account_code: string;
    account_name: string;
  }>;
};

type BudgetPerformanceCategory = {
  classification: 'NON-CAPEX' | 'CAPEX';
  accounts: BudgetPerformanceAccount[];
  totals: BudgetPerformanceAmounts;
};

type DataQualityWarning = {
  code: string;
  message: string;
  affected_count?: number;
  entity_ids?: Identifier[];
};

type BudgetPerformancePreview = {
  report: {
    preview_type: PreviewType;
    school_year: string;
    from: string;
    to: string;
    division: {
      id: Identifier;
      name: string;
    };
    unit: {
      type: 'department' | 'section';
      id: Identifier;
      name: string;
    } | null;
    printed_by: string;
  };
  categories: BudgetPerformanceCategory[];
  grand_total: BudgetPerformanceAmounts;
  data_quality: {
    complete: boolean;
    warnings: DataQualityWarning[];
    calculation_timezone: string;
    inclusive_period: {
      start: string;
      end: string;
    };
    reconciliation: {
      status: 'reconciled' | 'unreconciled' | 'insufficient_data';
      expected_balance_movement: string;
      audited_balance_movement: string;
      difference: string;
    };
  };
};

type ApiFailure = {
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string[] | string>;
    };
  };
};

const amountColumns: Array<keyof BudgetPerformanceAmounts> = [
  'approved_budget',
  'adjustment_additional',
  'adjustment_deduction',
  'released',
  'unused_amount',
  'balance',
];

const id = (value: unknown) => String(value ?? '');
const active = (value: unknown) => value === undefined || value === null || value === true || value === 1 || String(value) === '1';
const orgName = (record: Record<string, unknown>, fallback: string) =>
  String(record.name ?? record.description ?? record.division_name ?? record.department_name ?? record.section_name ?? fallback);

const formatDate = (value: string) => {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${month}/${day}/${year}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';

const hasMoneyFields = (value: unknown) =>
  isRecord(value) && amountColumns.every(column => typeof value[column] === 'string');

const previewPayload = (value: unknown): BudgetPerformancePreview | null => {
  if (!isRecord(value)) return null;
  const report = value.report;
  const categories = value.categories;
  const dataQuality = value.data_quality;
  if (!isRecord(report) || !isRecord(report.division)) return null;
  if (!isRecord(dataQuality) || !isRecord(dataQuality.inclusive_period) || !isRecord(dataQuality.reconciliation)) return null;

  const unitIsValid = report.preview_type === 'grand'
    ? report.unit === null
    : isRecord(report.unit)
      && (report.unit.type === 'department' || report.unit.type === 'section')
      && (typeof report.unit.id === 'string' || typeof report.unit.id === 'number')
      && typeof report.unit.name === 'string';
  const reportIsValid = (report.preview_type === 'departmental' || report.preview_type === 'grand' || report.preview_type === 'detailed')
    && typeof report.school_year === 'string'
    && typeof report.from === 'string'
    && typeof report.to === 'string'
    && (typeof report.division.id === 'string' || typeof report.division.id === 'number')
    && typeof report.division.name === 'string'
    && unitIsValid
    && typeof report.printed_by === 'string';

  const categoriesAreValid = Array.isArray(categories) && categories.every(category =>
    isRecord(category)
    && (category.classification === 'NON-CAPEX' || category.classification === 'CAPEX')
    && Array.isArray(category.accounts)
    && hasMoneyFields(category.totals)
    && category.accounts.every(account =>
      isRecord(account)
      && (typeof account.account_id === 'string' || typeof account.account_id === 'number')
      && typeof account.account_code === 'string'
      && typeof account.account_name === 'string'
      && hasMoneyFields(account)
      && (account.children === undefined || (Array.isArray(account.children) && account.children.every(child =>
        isRecord(child)
        && (typeof child.account_id === 'string' || typeof child.account_id === 'number')
        && typeof child.account_code === 'string'
        && typeof child.account_name === 'string'
        && hasMoneyFields(child),
      ))),
    ),
  );

  const warningsAreValid = Array.isArray(dataQuality.warnings) && dataQuality.warnings.every(warning =>
    isRecord(warning)
    && typeof warning.code === 'string'
    && typeof warning.message === 'string',
  );

  const reconciliation = dataQuality.reconciliation;
  const dataQualityIsValid = typeof dataQuality.complete === 'boolean'
    && warningsAreValid
    && typeof dataQuality.calculation_timezone === 'string'
    && typeof dataQuality.inclusive_period.start === 'string'
    && typeof dataQuality.inclusive_period.end === 'string'
    && (reconciliation.status === 'reconciled' || reconciliation.status === 'unreconciled' || reconciliation.status === 'insufficient_data')
    && typeof reconciliation.expected_balance_movement === 'string'
    && typeof reconciliation.audited_balance_movement === 'string'
    && typeof reconciliation.difference === 'string';

  if (
    !reportIsValid
    || !categoriesAreValid
    || !hasMoneyFields(value.grand_total)
    || !dataQualityIsValid
  ) return null;
  return value as unknown as BudgetPerformancePreview;
};

const requestErrorMessage = (error: unknown) => {
  const data = (error as ApiFailure)?.response?.data;
  const firstValidationError = Object.values(data?.errors ?? {}).flat()[0];
  return firstValidationError || data?.message || 'The budget performance preview could not be loaded. Please review the filters and try again.';
};

const AmountCells = ({ amounts }: { amounts: BudgetPerformanceAmounts }) => <>
  {amountColumns.map(column => <td key={column}>{formatMoney(amounts[column])}</td>)}
</>;

function ReportTable({ preview }: { preview: BudgetPerformancePreview }) {
  const classificationOrder = ['NON-CAPEX', 'CAPEX'] as const;
  const categories = classificationOrder.flatMap(classification =>
    preview.categories.filter(category => category.classification === classification),
  );
  const hasAccounts = categories.some(category => category.accounts.length > 0);

  return (
    <table className="budget-report-table">
      <thead><tr><th>Account</th><th>Approved Budget</th><th>Adj. Additional</th><th>Adj. Deduction</th><th>Released</th><th>Unused Amount</th><th>Balance</th></tr></thead>
      <tbody>
        {!hasAccounts && <tr className="report-empty"><td colSpan={7}>No budget activity was found for this period.</td></tr>}
        {categories.map(category => category.accounts.length > 0 && (
          <Fragment key={category.classification}>
            <tr className="report-classification"><td colSpan={7}>{category.classification}</td></tr>
            {category.accounts.map(account => (
              <Fragment key={`${category.classification}-${account.account_id}`}>
                <tr className={`report-account ${preview.report.preview_type === 'detailed' ? 'report-parent' : ''}`}>
                  <td>[{account.account_code}] {account.account_name}</td>
                  <AmountCells amounts={account} />
                </tr>
                {preview.report.preview_type === 'detailed' && account.children?.map(child => (
                  <tr className="report-child" key={`${account.account_id}-${child.account_id}`}>
                    <td>↳ [{child.account_code}] {child.account_name}</td>
                    <AmountCells amounts={child} />
                  </tr>
                ))}
              </Fragment>
            ))}
            <tr className="report-subtotal"><td>{category.classification} Subtotal:</td><AmountCells amounts={category.totals} /></tr>
          </Fragment>
        ))}
        <tr className="report-total"><td>Overall Total:</td><AmountCells amounts={preview.grand_total} /></tr>
      </tbody>
    </table>
  );
}

function PrintPreview({ preview, onClose }: {
  preview: BudgetPerformancePreview;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  return (
    <ReportPrintPortal><div className="report-preview fixed inset-0 z-[100] overflow-auto bg-slate-600/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Budget performance print preview">
      <div className="report-preview-actions mx-auto mb-3 flex max-w-[1200px] justify-end gap-2">
        <Button ref={closeButtonRef} variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" />Close</Button>
        <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
      </div>
      <article className="budget-report mx-auto min-h-[700px] max-w-[1200px] bg-white p-7 text-black shadow-2xl sm:p-10">
        <header>
          <div className="flex items-start justify-between gap-4">
          <div><h1>ADAMSON UNIVERSITY</h1><h2>BUDGET PERFORMANCE ({preview.report.preview_type === 'grand' ? 'GRAND' : preview.report.preview_type === 'detailed' ? 'DETAILED' : 'DEPARTMENTAL'}) - {preview.report.preview_type === 'detailed' ? 'Breakdown' : 'Summary'} (Period: {formatDate(preview.report.from)} - {formatDate(preview.report.to)})</h2></div>
          </div>
          <p><b>School Year:</b><strong>{preview.report.school_year}</strong></p>
          <p><b>Office/College:</b><strong>{preview.report.division.name}</strong></p>
          {preview.report.unit
            ? <p><b>Section/Department:</b><strong>{preview.report.unit.name}</strong></p>
            : <p><b>Scope:</b><strong>All Departments and Sections</strong></p>}
        </header>
        <ReportTable preview={preview} />
        <footer>-=xxx=- | Source: ABMS | Print Date: {new Date().toLocaleDateString()} | Printed By: {preview.report.printed_by}</footer>
      </article>
      <style>{`
        .budget-report{font-family:Arial,sans-serif;font-size:11px}.budget-report h1{font-size:20px;font-weight:800;margin:0}.budget-report h2{font-size:12px;font-weight:700;margin:2px 0 10px}.budget-report header p{margin:3px 0;display:grid;grid-template-columns:130px 1fr}.budget-report-table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:8px}.budget-report-table thead{display:table-header-group;border-top:2px dashed #555;border-bottom:2px dashed #555}.budget-report-table th{font-weight:400;padding:5px 4px}.budget-report-table th:first-child,.budget-report-table td:first-child{width:31%;text-align:left}.budget-report-table th:not(:first-child),.budget-report-table td:not(:first-child){text-align:right}.budget-report-table td{padding:3px 4px;font-variant-numeric:tabular-nums}.report-classification{font-weight:800;border-top:1px solid #777}.report-classification td{padding-top:7px!important}.report-account td:first-child{padding-left:12px}.report-parent{font-weight:700;background:#f1f5f9}.report-child td:first-child{padding-left:28px}.report-child{color:#334155}.report-subtotal{font-weight:700;border-top:1px dashed #777;border-bottom:2px dashed #777;break-inside:avoid}.report-subtotal td:first-child,.report-total td:first-child{text-align:right}.report-total{font-weight:800;border-top:2px solid #555;border-bottom:2px double #555;break-inside:avoid}.report-total td{padding-top:6px;padding-bottom:6px}.report-empty td{text-align:center!important;padding:18px;color:#555}.budget-report footer{margin-top:20px;border-top:2px dashed #555;padding-top:4px}
        @page{size:letter landscape;margin:0.35in}@media print{body *{visibility:hidden!important}.report-preview,.report-preview *{visibility:visible!important}.report-preview{position:absolute!important;inset:0!important;overflow:visible!important;background:white!important;padding:0!important}.report-preview-actions{display:none!important}.budget-report{box-shadow:none!important;max-width:none!important;min-height:0!important;padding:0!important}.budget-report-table thead{display:table-header-group}.report-classification,.report-account,.report-subtotal,.report-total{break-inside:avoid}}
      `}</style>
    </div></ReportPrintPortal>
  );
}

export default function BudgetPerformanceDepartment() {
  const navigate = useNavigate();
  const loader = budgetperformancedepartmentRoute.useLoaderData() as { data?: { data?: LoaderPayload } | LoaderPayload };
  const payload = ((loader?.data as { data?: LoaderPayload })?.data ?? loader?.data ?? {}) as LoaderPayload;
  const [schoolYear, setSchoolYear] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [previewType, setPreviewType] = useState<PreviewType>('departmental');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [preview, setPreview] = useState<BudgetPerformancePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const schoolYears = useMemo(() => Array.from(new Set((payload.school_years ?? []).map(year => typeof year === 'string' ? year : year.school_year).filter((year): year is string => Boolean(year)))).sort((a, b) => b.localeCompare(a)), [payload.school_years]);
  const divisions = useMemo(() => (payload.divisions ?? []).filter(division => active(division.isactive)), [payload.divisions]);
  const departments = useMemo(() => (payload.departments ?? []).filter(department => active(department.isactive)), [payload.departments]);
  const sections = useMemo(() => (payload.sections ?? []).filter(section => active(section.isactive)), [payload.sections]);
  const units = useMemo<UnitOption[]>(() => {
    if (!divisionId) return [];
    const childDepartments = departments.filter(department => id(department.division_id) === divisionId);
    const departmentIds = new Set(childDepartments.map(department => id(department.cid)));
    return [
      ...childDepartments.map(department => ({ value: `Department:${id(department.cid)}`, cid: id(department.cid), name: orgName(department, `Department ${department.cid}`), kind: 'Department' as const })),
      ...sections.filter(section => departmentIds.has(id(section.department_id))).map(section => ({ value: `Section:${id(section.cid)}`, cid: id(section.cid), name: orgName(section, `Section ${section.cid}`), kind: 'Section' as const })),
    ].sort((a, b) => a.name.localeCompare(b.name));
  }, [departments, sections, divisionId]);
  const schoolYearOptions = useMemo<ReportFilterOption[]>(() => schoolYears.map(year => ({ value: year, label: year })), [schoolYears]);
  const divisionOptions = useMemo<ReportFilterOption[]>(() => divisions.map(division => ({
    value: id(division.cid),
    label: orgName(division, `Division ${division.cid}`),
  })), [divisions]);
  const unitOptions = useMemo<ReportFilterOption[]>(() => units.map(unit => ({
    value: unit.value,
    label: unit.name,
    badge: unit.kind,
  })), [units]);
  const selectedUnit = units.find(unit => unit.value === unitValue);

  const openPreview = async () => {
    const next: Errors = {};
    if (!schoolYear) next.schoolYear = 'School year is required.';
    if (!divisionId) next.division = 'Office/College is required.';
    if (previewType !== 'grand' && !selectedUnit) next.unit = 'Section/Department is required.';
    if (!from) next.from = 'From date is required.';
    if (!to) next.to = 'To date is required.';
    if (from && to && from > to) next.to = 'To date must be on or after the From date.';
    setErrors(next);
    setPreviewError(null);
    if (Object.keys(next).length > 0 || (previewType !== 'grand' && !selectedUnit)) return;

    setIsLoadingPreview(true);
    setPreview(null);
    try {
      const response = await financeSvc.get('/abms/budget-performance-per-department/preview', {
        params: {
          school_year: schoolYear,
          division_id: divisionId,
          ...(previewType !== 'grand' && selectedUnit ? {
            unit_type: selectedUnit.kind.toLowerCase(),
            unit_id: selectedUnit.cid,
          } : {}),
          from,
          to,
          preview_type: previewType,
        },
      });
      const nextPreview = previewPayload(response.data);
      if (!nextPreview) {
        setPreviewError('The finance service returned an invalid preview response. Please try again.');
        return;
      }
      if (!nextPreview.data_quality.complete || nextPreview.data_quality.warnings.length > 0) {
        const noticeCount = nextPreview.data_quality.warnings.length;
        toast.warning('Some historical activity could not be fully reconstructed.', {
          description: noticeCount > 0
            ? `${noticeCount} data-quality notice${noticeCount === 1 ? '' : 's'} found. The available figures are shown in the report.`
            : 'The available figures are shown in the report.',
          duration: 10000,
        });
      }
      setPreview(nextPreview);
    } catch (error: unknown) {
      setPreviewError(requestErrorMessage(error));
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return <AdamsonBudgetLayout>
    <Toaster position="bottom-right" richColors closeButton />
    <Page width="default">
      <PageHeader title="Budget Performance Per Department" description="Generate a date-bounded departmental budget performance report." />
      <PageSurface><Card className="border-0 bg-transparent shadow-none"><CardContent className="space-y-6 py-6">
        {schoolYears.length === 0 && <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">No school years are currently available.</p>}
        {divisions.length === 0 && <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">No active offices or colleges are currently available.</p>}
        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-1.5"><Label htmlFor="school-year-selector">School Year</Label><ReportFilterCombobox id="school-year-selector" options={schoolYearOptions} value={schoolYear} disabled={isLoadingPreview || schoolYearOptions.length === 0} placeholder="Select school year" searchPlaceholder="Search school year..." emptyText="No school year found." invalid={Boolean(errors.schoolYear)} errorId="school-year-error" groupLabel="Available school years" onChange={value => { setSchoolYear(value); setPreviewError(null); setErrors(current => ({ ...current, schoolYear: undefined })); }} /><FieldError id="school-year-error">{errors.schoolYear}</FieldError></div>
          <div className="space-y-1.5"><Label htmlFor="division-selector">Office / College</Label><ReportFilterCombobox id="division-selector" options={divisionOptions} value={divisionId} disabled={isLoadingPreview || divisionOptions.length === 0} placeholder="Select office or college" searchPlaceholder="Search office or college..." emptyText="No office or college found." invalid={Boolean(errors.division)} errorId="division-error" groupLabel="Active offices and colleges" onChange={value => { setDivisionId(value); setUnitValue(''); setPreviewError(null); setErrors(current => ({ ...current, division: undefined, unit: undefined })); }} /><FieldError id="division-error">{errors.division}</FieldError></div>
          <div className="space-y-1.5"><Label htmlFor="unit-selector">Section / Department</Label><ReportFilterCombobox id="unit-selector" options={unitOptions} value={unitValue} disabled={isLoadingPreview || previewType === 'grand' || !divisionId || unitOptions.length === 0} placeholder={previewType === 'grand' ? 'All departments and sections' : !divisionId ? 'Select an office or college first' : unitOptions.length ? 'Select section or department' : 'No active units available'} searchPlaceholder="Search section or department..." emptyText="No section or department found." invalid={Boolean(errors.unit)} errorId="unit-selector-error" groupLabel="Departments and sections" onChange={value => { setUnitValue(value); setPreviewError(null); setErrors(current => ({ ...current, unit: undefined })); }} /><FieldError id="unit-selector-error">{errors.unit}</FieldError></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <fieldset className="rounded-lg border border-[var(--abms-border)] p-4">
            <legend className="px-2 text-sm font-semibold text-[var(--abms-primary)]">Report Options</legend>
            <RadioGroup value={previewType} onValueChange={value => { setPreviewType(value as PreviewType); setPreviewError(null); setErrors(current => ({ ...current, unit: undefined })); }} className="space-y-3">
              <div className="flex items-center gap-2"><RadioGroupItem id="departmental" value="departmental" /><Label htmlFor="departmental">Summary (Departmental)</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem id="grand" value="grand" /><Label htmlFor="grand">Summary (Grand)</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem id="detailed" value="detailed" /><Label htmlFor="detailed">Detailed</Label></div>
            </RadioGroup>
          </fieldset>
          <fieldset className="rounded-lg border border-[var(--abms-border)] p-4"><legend className="px-2 text-sm font-semibold text-[var(--abms-primary)]">Period</legend><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="from">From</Label><Input id="from" type="date" value={from} disabled={isLoadingPreview} onChange={event => { setFrom(event.target.value); setPreviewError(null); setErrors(current => ({ ...current, from: undefined, to: undefined })); }} className="mt-1.5" /><FieldError>{errors.from}</FieldError></div><div><Label htmlFor="to">To</Label><Input id="to" type="date" value={to} min={from || undefined} disabled={isLoadingPreview} onChange={event => { setTo(event.target.value); setPreviewError(null); setErrors(current => ({ ...current, to: undefined })); }} className="mt-1.5" /><FieldError>{errors.to}</FieldError></div></div></fieldset>
        </div>
        {previewError && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Unable to generate preview</AlertTitle>
            <AlertDescription>{previewError}</AlertDescription>
          </Alert>
        )}
        <div className="flex justify-end gap-3 border-t border-[var(--abms-border)] pt-5">
          <Button variant="outline" onClick={() => navigate({ to: '/' })}>Close</Button>
          <Button onClick={openPreview} disabled={isLoadingPreview || schoolYears.length === 0 || divisions.length === 0} aria-busy={isLoadingPreview}>
            {isLoadingPreview ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading preview...</> : 'Preview'}
          </Button>
        </div>
      </CardContent></Card></PageSurface>
    </Page>
    {preview && <PrintPreview preview={preview} onClose={() => setPreview(null)} />}
  </AdamsonBudgetLayout>;
}
