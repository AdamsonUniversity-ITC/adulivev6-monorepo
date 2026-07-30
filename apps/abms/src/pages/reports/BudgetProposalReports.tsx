import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Loader2, Printer, X } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/alert';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Label } from '@repo/ui/components/label';
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/radio-group';
import { toast, Toaster } from 'sonner';
import AdamsonBudgetLayout from '../../layouts/Screenlayout';
import { budgetproposalreportsRoute } from '../../router';
import { FieldError, Page, PageHeader, PageSurface } from '../../components/ui/Page';
import { ReportFilterCombobox } from './shared/ReportFilterCombobox';
import { ReportPrintPortal } from './shared/ReportPrintPortal';
import { formatMoney } from './shared/money';
import './shared/report-print.css';

type Account = { id: number | null; account_code: string; account_name: string };
type MainAccount = Account & { id: number; sub_accounts: Array<Account & { id: number }> };
type Unit = { type: 'department' | 'section'; id: number; name: string; active: boolean };
type ReportUnit = Unit | { type: 'unmapped'; id: null; name: string; active: false };
type Totals = { proposed_amount: string; approved_amount: string };
type UniversityTotals = Totals & { quantity: number };
type ProposalItem = { id: number; description: string; quantity: number; proposed_amount: string; approved_amount: string; status: string; status_updated_at: string | null; remarks: string | null };
type DetailMainGroup = { main_account: Account; sub_account_groups: Array<{ sub_account: Account; items: ProposalItem[]; totals: Totals }>; totals: Totals };
type UniversityRow = { unit: ReportUnit; quantity: number; proposed_amount: string; approved_amount: string };
type UniversityMainGroup = { main_account: Account; sub_account_groups: Array<{ sub_account: Account; rows: UniversityRow[]; totals: UniversityTotals }>; totals: UniversityTotals };
type ApprovedSubAccount = { sub_account: Account; quantity: number; proposed_amount: string; approved_amount: string };
type ApprovedMainGroup = { main_account: Account; sub_account_groups: ApprovedSubAccount[]; totals: UniversityTotals };
type ApprovedItemTotals = { quantity: number; amount: string };
type ApprovedItem = { id: number; description: string; quantity: number; amount: string };
type ApprovedItemUnitGroup = { unit: ReportUnit; sub_account_groups: Array<{ sub_account: Account; items: ApprovedItem[]; totals: ApprovedItemTotals }>; totals: ApprovedItemTotals };
type ApprovedDepartmentItem = { id: number; description: string; quantity: number; proposed_amount: string; approved_amount: string };
type ApprovedDepartmentUnitGroup = { unit: ReportUnit; items: ApprovedDepartmentItem[]; totals: UniversityTotals };
type ApprovedDepartmentSubGroup = { sub_account: Account; unit_groups: ApprovedDepartmentUnitGroup[]; totals: UniversityTotals };
type PercentageAmounts = Totals & { percentage: string };
type PercentageMainGroup = { main_account: Account; sub_account_groups: Array<{ sub_account: Account } & PercentageAmounts>; totals: PercentageAmounts };
type YearComparisonAmounts = { previous_approved_amount: string; current_approved_amount: string; percentage: string };
type YearComparisonMainGroup = { main_account: Account; sub_account_groups: Array<{ sub_account: Account } & YearComparisonAmounts>; totals: YearComparisonAmounts };
type DataQuality = { complete: boolean; warnings: Array<{ code: string; message: string }>; calculation_timezone: string };
type DetailPreview = { report: { preview_type: 'details_and_status'; school_year: string; unit: Unit; main_account: Account | null; sub_account: Account | null; printed_by: string }; main_account_groups: DetailMainGroup[]; grand_total: Totals; data_quality: DataQuality };
type UniversityPreview = { report: { preview_type: 'university_budget'; school_year: string; main_account: Account | null; sub_account: Account | null; printed_by: string }; main_account_groups: UniversityMainGroup[]; grand_total: UniversityTotals; data_quality: DataQuality };
type ApprovedPreview = { report: { preview_type: 'approved_budget'; school_year: string; unit: Unit; main_account: null; sub_account: null; printed_by: string }; main_account_groups: ApprovedMainGroup[]; grand_total: UniversityTotals; data_quality: DataQuality };
type ApprovedItemsPreview = { report: { preview_type: 'approved_items_per_account'; school_year: string; unit: Unit | null; all_units: boolean; main_account: Account; sub_account: Account | null; printed_by: string }; unit_groups: ApprovedItemUnitGroup[]; grand_total: ApprovedItemTotals; data_quality: DataQuality };
type ApprovedItemsDepartmentPreview = { report: { preview_type: 'approved_items_per_account_department'; school_year: string; unit: Unit | null; all_units: boolean; main_account: Account; sub_account: Account | null; printed_by: string }; sub_account_groups: ApprovedDepartmentSubGroup[]; main_account_total: UniversityTotals; grand_total: UniversityTotals; data_quality: DataQuality };
type PercentagePreview = { report: { preview_type: 'proposed_vs_approved_percentage'; school_year: string; unit: Unit; main_account: Account | null; sub_account: Account | null; printed_by: string }; main_account_groups: PercentageMainGroup[]; grand_total: PercentageAmounts; data_quality: DataQuality };
type YearComparisonPreview = { report: { preview_type: 'approved_previous_vs_current_percentage'; previous_school_year: string; current_school_year: string; unit: Unit; main_account: Account | null; sub_account: Account | null; printed_by: string }; main_account_groups: YearComparisonMainGroup[]; grand_total: YearComparisonAmounts; data_quality: DataQuality };
type Preview = DetailPreview | UniversityPreview | ApprovedPreview | ApprovedItemsPreview | ApprovedItemsDepartmentPreview | PercentagePreview | YearComparisonPreview;
type PreviewType = Preview['report']['preview_type'];
type LoaderPayload = { school_years?: string[]; current_school_year?: string; units?: Unit[]; main_accounts?: MainAccount[]; unit_scope_restricted?: boolean };
type Errors = Partial<Record<'schoolYear' | 'unit' | 'mainAccount', string>>;
type ApiFailure = { response?: { data?: { message?: string; errors?: Record<string, string[] | string> } } };

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const validUnit = (value: unknown): value is Unit => isRecord(value) && (value.type === 'department' || value.type === 'section') && typeof value.id === 'number' && typeof value.name === 'string' && typeof value.active === 'boolean';
const validReportUnit = (value: unknown): value is ReportUnit => validUnit(value) || (isRecord(value) && value.type === 'unmapped' && value.id === null && typeof value.name === 'string' && value.active === false);
const validAccount = (value: unknown) => isRecord(value) && (typeof value.id === 'number' || value.id === null) && typeof value.account_code === 'string' && typeof value.account_name === 'string';
const validTotals = (value: unknown) => isRecord(value) && typeof value.proposed_amount === 'string' && typeof value.approved_amount === 'string';
const validUniversityTotals = (value: unknown) => validTotals(value) && typeof value.quantity === 'number';
const validApprovedItemTotals = (value: unknown) => isRecord(value) && typeof value.quantity === 'number' && typeof value.amount === 'string';
const validPercentageAmounts = (value: unknown) => validTotals(value) && typeof value.percentage === 'string';
const validYearComparisonAmounts = (value: unknown) => isRecord(value) && typeof value.previous_approved_amount === 'string' && typeof value.current_approved_amount === 'string' && typeof value.percentage === 'string';
const parsePreview = (value: unknown): Preview | null => {
  if (!isRecord(value) || !isRecord(value.report) || typeof value.report.printed_by !== 'string'
    || !isRecord(value.data_quality)
    || typeof value.data_quality.complete !== 'boolean' || !Array.isArray(value.data_quality.warnings)) return null;
  if (value.report.preview_type === 'approved_items_per_account') {
    if (!validAccount(value.report.main_account) || (value.report.unit !== null && !validUnit(value.report.unit))
      || !Array.isArray(value.unit_groups) || !validApprovedItemTotals(value.grand_total)) return null;
    for (const unitGroup of value.unit_groups) {
      if (!isRecord(unitGroup) || !validReportUnit(unitGroup.unit) || !Array.isArray(unitGroup.sub_account_groups) || !validApprovedItemTotals(unitGroup.totals)) return null;
      for (const sub of unitGroup.sub_account_groups) {
        if (!isRecord(sub) || !validAccount(sub.sub_account) || !Array.isArray(sub.items) || !validApprovedItemTotals(sub.totals)) return null;
        if (sub.items.some(item => !isRecord(item) || typeof item.id !== 'number' || typeof item.description !== 'string' || typeof item.quantity !== 'number' || typeof item.amount !== 'string')) return null;
      }
    }
    return value as unknown as ApprovedItemsPreview;
  }
  if (value.report.preview_type === 'approved_items_per_account_department') {
    if (!validAccount(value.report.main_account) || (value.report.unit !== null && !validUnit(value.report.unit))
      || !Array.isArray(value.sub_account_groups) || !validUniversityTotals(value.main_account_total) || !validUniversityTotals(value.grand_total)) return null;
    for (const sub of value.sub_account_groups) {
      if (!isRecord(sub) || !validAccount(sub.sub_account) || !Array.isArray(sub.unit_groups) || !validUniversityTotals(sub.totals)) return null;
      for (const unitGroup of sub.unit_groups) {
        if (!isRecord(unitGroup) || !validReportUnit(unitGroup.unit) || !Array.isArray(unitGroup.items) || !validUniversityTotals(unitGroup.totals)) return null;
        if (unitGroup.items.some(item => !isRecord(item) || typeof item.id !== 'number' || typeof item.description !== 'string' || typeof item.quantity !== 'number' || typeof item.proposed_amount !== 'string' || typeof item.approved_amount !== 'string')) return null;
      }
    }
    return value as unknown as ApprovedItemsDepartmentPreview;
  }
  if (value.report.preview_type === 'proposed_vs_approved_percentage') {
    if (!validUnit(value.report.unit) || !Array.isArray(value.main_account_groups) || !validPercentageAmounts(value.grand_total)) return null;
    for (const main of value.main_account_groups) {
      if (!isRecord(main) || !validAccount(main.main_account) || !validPercentageAmounts(main.totals) || !Array.isArray(main.sub_account_groups)) return null;
      if (main.sub_account_groups.some(sub => !isRecord(sub) || !validAccount(sub.sub_account) || !validPercentageAmounts(sub))) return null;
    }
    return value as unknown as PercentagePreview;
  }
  if (value.report.preview_type === 'approved_previous_vs_current_percentage') {
    if (!validUnit(value.report.unit) || typeof value.report.previous_school_year !== 'string' || typeof value.report.current_school_year !== 'string'
      || !Array.isArray(value.main_account_groups) || !validYearComparisonAmounts(value.grand_total)) return null;
    for (const main of value.main_account_groups) {
      if (!isRecord(main) || !validAccount(main.main_account) || !validYearComparisonAmounts(main.totals) || !Array.isArray(main.sub_account_groups)) return null;
      if (main.sub_account_groups.some(sub => !isRecord(sub) || !validAccount(sub.sub_account) || !validYearComparisonAmounts(sub))) return null;
    }
    return value as unknown as YearComparisonPreview;
  }
  if (value.report.preview_type !== 'details_and_status' && value.report.preview_type !== 'university_budget' && value.report.preview_type !== 'approved_budget') return null;
  if (!Array.isArray(value.main_account_groups)) return null;
  const university = value.report.preview_type === 'university_budget';
  const approved = value.report.preview_type === 'approved_budget';
  const summarized = university || approved;
  if ((!university && !validUnit(value.report.unit)) || (summarized ? !validUniversityTotals(value.grand_total) : !validTotals(value.grand_total))) return null;
  for (const main of value.main_account_groups) {
    if (!isRecord(main) || !validAccount(main.main_account) || (summarized ? !validUniversityTotals(main.totals) : !validTotals(main.totals)) || !Array.isArray(main.sub_account_groups)) return null;
    for (const sub of main.sub_account_groups) {
      if (!isRecord(sub) || !validAccount(sub.sub_account)) return null;
      if (university) {
        if (!validUniversityTotals(sub.totals)) return null;
        if (!Array.isArray(sub.rows) || sub.rows.some(row => !isRecord(row) || !validReportUnit(row.unit) || typeof row.quantity !== 'number' || typeof row.proposed_amount !== 'string' || typeof row.approved_amount !== 'string')) return null;
      } else if (approved) {
        if (!validUniversityTotals(sub)) return null;
      } else if (!validTotals(sub.totals) || !Array.isArray(sub.items)) return null;
    }
  }
  return value as unknown as Preview;
};
const errorMessage = (error: unknown) => {
  const data = (error as ApiFailure)?.response?.data;
  return Object.values(data?.errors ?? {}).flat()[0] || data?.message || 'The budget proposal report could not be loaded. Please review the filters and try again.';
};
const accountLabel = (account: Account) => `[${account.account_code}] ${account.account_name}`;
const formatStatusDate = (value: string | null) => {
  if (!value) return '';
  const parsed = new Date(value.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

function PrintPreview({ preview, onClose }: { preview: Preview; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const overflow = document.body.style.overflow;
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden'; document.addEventListener('keydown', keydown); closeRef.current?.focus();
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); };
  }, [onClose]);
  const approvedItems = preview.report.preview_type === 'approved_items_per_account';
  const approvedItemsDepartment = preview.report.preview_type === 'approved_items_per_account_department';
  const proposedVsApproved = preview.report.preview_type === 'proposed_vs_approved_percentage';
  const approvedYearComparison = preview.report.preview_type === 'approved_previous_vs_current_percentage';
  const reportTitle = preview.report.preview_type === 'university_budget'
    ? 'UNIVERSITY BUDGET'
    : approvedItemsDepartment
      ? 'APPROVED BUDGET ITEMS'
    : proposedVsApproved
      ? 'PROPOSED VS. APPROVED BUDGET'
    : approvedYearComparison
      ? 'APPROVED BUDGET COMPARISON'
    : approvedItems
      ? 'APPROVED ITEMS PER ACCOUNT'
      : preview.report.preview_type === 'approved_budget' ? 'BUDGET' : 'PROPOSED BUDGET';
  return <ReportPrintPortal><div className="proposal-report-preview fixed inset-0 z-[100] overflow-auto bg-slate-600/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Budget proposal report print preview">
    <div className="report-actions mx-auto mb-3 flex max-w-[1200px] justify-end gap-2"><Button ref={closeRef} variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" />Close</Button><Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button></div>
    <article className="proposal-report mx-auto min-h-[700px] max-w-[1200px] bg-white p-7 text-black shadow-2xl sm:p-10">
      {!approvedItems && !approvedItemsDepartment && <header><h1>ADAMSON UNIVERSITY</h1>{approvedYearComparison ? <h2>BUDGET FOR PREVIOUS SCHOOL YEAR: {preview.report.previous_school_year} VS. SCHOOL YEAR: {preview.report.current_school_year}</h2> : <h2>{reportTitle} FOR SCHOOL YEAR: {preview.report.school_year}</h2>}{preview.report.preview_type !== 'university_budget' && <div className="unit-title">{preview.report.unit.name} <span>{preview.report.unit.type === 'department' ? 'DEPARTMENT' : 'SECTION'}{preview.report.unit.active ? '' : ' · INACTIVE'}</span></div>}</header>}
      {(approvedItems ? !preview.unit_groups.length : approvedItemsDepartment ? !preview.sub_account_groups.length : !preview.main_account_groups.length) && <p className="empty">No proposal items were found for the selected filters.</p>}
      {approvedItems
        ? preview.unit_groups.map((unitGroup, unitIndex) => <section className="approved-items-unit" key={`${unitGroup.unit.type}:${unitGroup.unit.id ?? 'unmapped'}:${unitIndex}`}><header><h1>ADAMSON UNIVERSITY</h1><h2>{reportTitle}</h2><div>School Year: <b>{preview.report.school_year}</b></div><div className="account-title">Account: {accountLabel(preview.report.main_account)}{preview.report.sub_account ? ` · ${accountLabel(preview.report.sub_account)}` : ''}</div></header><h3 className="approved-items-unit-heading">{unitGroup.unit.name} <span className="unit-badge">{unitGroup.unit.type === 'department' ? 'DEPARTMENT' : unitGroup.unit.type === 'section' ? 'SECTION' : 'UNMAPPED'}{unitGroup.unit.active || unitGroup.unit.type === 'unmapped' ? '' : ' · INACTIVE'}</span></h3><table className="approved-items-table"><thead><tr><th>Department / Section</th><th>Item Description</th><th>Quantity</th><th>Amount</th></tr></thead><tbody>
          {unitGroup.sub_account_groups.map((sub, subIndex) => <Fragment key={`${sub.sub_account.id ?? 'unmapped'}-${subIndex}`}><tr className="sub-account-heading"><td colSpan={4}>{accountLabel(sub.sub_account)}</td></tr>{sub.items.map(item => <tr key={item.id}><td>{unitGroup.unit.name}</td><td>{item.description || '—'}</td><td>{item.quantity}</td><td>{formatMoney(item.amount)}</td></tr>)}<tr className="subtotal"><td colSpan={2}>Sub Total:</td><td>{sub.totals.quantity}</td><td>{formatMoney(sub.totals.amount)}</td></tr></Fragment>)}
          <tr className="unit-report-total"><td colSpan={2}>Department / Section Total:</td><td>{unitGroup.totals.quantity}</td><td>{formatMoney(unitGroup.totals.amount)}</td></tr>
        </tbody></table>{unitIndex === preview.unit_groups.length - 1 && <div className="approved-items-grand-total"><span>Grand Total:</span><b>{preview.grand_total.quantity}</b><b>{formatMoney(preview.grand_total.amount)}</b></div>}<footer>ABMS | Print Date: {new Date().toLocaleDateString()} | Printed By: {preview.report.printed_by}</footer></section>)
        : approvedItemsDepartment
        ? <section className="approved-items-department-report"><header><h1>ADAMSON UNIVERSITY</h1><h2>{reportTitle} FOR SCHOOL YEAR: {preview.report.school_year}</h2><div className="account-title">Account: {accountLabel(preview.report.main_account)}</div></header>
          {preview.sub_account_groups.map((sub, subIndex) => <section className="approved-department-sub" key={`${sub.sub_account.id ?? 'unmapped'}-${subIndex}`}><h3>{accountLabel(sub.sub_account)}</h3>
            {sub.unit_groups.map((unitGroup, unitIndex) => <div className="approved-department-unit" key={`${unitGroup.unit.type}:${unitGroup.unit.id ?? 'unmapped'}:${unitIndex}`}><h4>{unitGroup.unit.name} <span className="unit-badge">{unitGroup.unit.type === 'department' ? 'DEPARTMENT' : unitGroup.unit.type === 'section' ? 'SECTION' : 'UNMAPPED'}{unitGroup.unit.active || unitGroup.unit.type === 'unmapped' ? '' : ' · INACTIVE'}</span></h4><table className="approved-department-table"><thead><tr><th>Item Description</th><th>Quantity</th><th>Proposed Amount</th><th>Approved Amount</th></tr></thead><tbody>
              {unitGroup.items.map(item => <tr key={item.id}><td>{item.description || '—'}</td><td>{item.quantity}</td><td>{formatMoney(item.proposed_amount)}</td><td>{formatMoney(item.approved_amount)}</td></tr>)}
              <tr className="subtotal"><td>Department / Section Total:</td><td>{unitGroup.totals.quantity}</td><td>{formatMoney(unitGroup.totals.proposed_amount)}</td><td>{formatMoney(unitGroup.totals.approved_amount)}</td></tr>
            </tbody></table></div>)}
            <div className="approved-department-total"><span>Sub Account Total:</span><b>{sub.totals.quantity}</b><b>{formatMoney(sub.totals.proposed_amount)}</b><b>{formatMoney(sub.totals.approved_amount)}</b></div>
          </section>)}
          <div className="approved-department-total account"><span>Account Total:</span><b>{preview.main_account_total.quantity}</b><b>{formatMoney(preview.main_account_total.proposed_amount)}</b><b>{formatMoney(preview.main_account_total.approved_amount)}</b></div>
        </section>
        : preview.report.preview_type === 'details_and_status'
        ? preview.main_account_groups.map((main, mainIndex) => <section className="main-group" key={`${main.main_account.id ?? 'unmapped'}-${mainIndex}`}><h3>{accountLabel(main.main_account)}</h3>
          {main.sub_account_groups.map((sub, subIndex) => <div className="sub-group" key={`${sub.sub_account.id ?? 'unmapped'}-${subIndex}`}><h4>{accountLabel(sub.sub_account)}</h4><table><thead><tr><th>Description</th><th>Quantity</th><th>Proposed Amount</th><th>Approved Amount</th><th>Status</th></tr></thead><tbody>
            {sub.items.map(item => <tr key={item.id}><td>{item.description || '—'}</td><td>{item.quantity}</td><td>{formatMoney(item.proposed_amount)}</td><td>{formatMoney(item.approved_amount)}</td><td><b>{item.status}</b>{item.status_updated_at && <> ({formatStatusDate(item.status_updated_at)})</>}{item.remarks && <> {item.remarks}</>}</td></tr>)}
            <tr className="subtotal"><td colSpan={2}>Sub Account Total:</td><td>{formatMoney(sub.totals.proposed_amount)}</td><td>{formatMoney(sub.totals.approved_amount)}</td><td /></tr>
          </tbody></table></div>)}
          <div className="main-total"><span>Main Account Total:</span><b>{formatMoney(main.totals.proposed_amount)}</b><b>{formatMoney(main.totals.approved_amount)}</b></div>
        </section>)
        : preview.report.preview_type === 'university_budget' ? preview.main_account_groups.map((main, mainIndex) => <section className="main-group university-main-group" key={`${main.main_account.id ?? 'unmapped'}-${mainIndex}`}><h3>Account: {accountLabel(main.main_account)}</h3>
          {main.sub_account_groups.map((sub, subIndex) => <div className="sub-group university-sub-group" key={`${sub.sub_account.id ?? 'unmapped'}-${subIndex}`}><h4>{accountLabel(sub.sub_account)}</h4><table className="university-budget-table"><thead><tr><th>Department / Section</th><th>Quantity</th><th>Proposed Amount</th><th>Approved Amount</th></tr></thead><tbody>
            {sub.rows.map((row, rowIndex) => <tr key={`${row.unit.type}:${row.unit.id ?? 'unmapped'}:${rowIndex}`}><td>{row.unit.name} <span className="unit-badge">{row.unit.type === 'department' ? 'DEPARTMENT' : row.unit.type === 'section' ? 'SECTION' : 'UNMAPPED'}{row.unit.active || row.unit.type === 'unmapped' ? '' : ' · INACTIVE'}</span></td><td>{row.quantity}</td><td>{formatMoney(row.proposed_amount)}</td><td>{formatMoney(row.approved_amount)}</td></tr>)}
            <tr className="subtotal"><td>Sub Account Total:</td><td>{sub.totals.quantity}</td><td>{formatMoney(sub.totals.proposed_amount)}</td><td>{formatMoney(sub.totals.approved_amount)}</td></tr>
          </tbody></table></div>)}
          <div className="university-main-total"><span>Main Account Total:</span><b>{main.totals.quantity}</b><b>{formatMoney(main.totals.proposed_amount)}</b><b>{formatMoney(main.totals.approved_amount)}</b></div>
        </section>)
        : approvedYearComparison
        ? preview.main_account_groups.map((main, mainIndex) => <section className="main-group percentage-main-group" key={`${main.main_account.id ?? 'unmapped'}-${mainIndex}`}><h3>{accountLabel(main.main_account)}</h3><table className="percentage-budget-table"><thead><tr><th>Account</th><th>{preview.report.previous_school_year}<br />Approved Amount</th><th>{preview.report.current_school_year}<br />Approved Amount</th><th>Percentage</th></tr></thead><tbody>
          {main.sub_account_groups.map((sub, subIndex) => <tr key={`${sub.sub_account.id ?? 'unmapped'}-${subIndex}`}><td>{accountLabel(sub.sub_account)}</td><td>{formatMoney(sub.previous_approved_amount)}</td><td>{formatMoney(sub.current_approved_amount)}</td><td>{sub.percentage} %</td></tr>)}
          <tr className="subtotal"><td>Main Account Total:</td><td>{formatMoney(main.totals.previous_approved_amount)}</td><td>{formatMoney(main.totals.current_approved_amount)}</td><td>{main.totals.percentage} %</td></tr>
        </tbody></table></section>)
        : proposedVsApproved
        ? preview.main_account_groups.map((main, mainIndex) => <section className="main-group percentage-main-group" key={`${main.main_account.id ?? 'unmapped'}-${mainIndex}`}><h3>{accountLabel(main.main_account)}</h3><table className="percentage-budget-table"><thead><tr><th>Account</th><th>Proposed Amount</th><th>Approved Amount</th><th>Percentage</th></tr></thead><tbody>
          {main.sub_account_groups.map((sub, subIndex) => <tr key={`${sub.sub_account.id ?? 'unmapped'}-${subIndex}`}><td>{accountLabel(sub.sub_account)}</td><td>{formatMoney(sub.proposed_amount)}</td><td>{formatMoney(sub.approved_amount)}</td><td>{sub.percentage} %</td></tr>)}
          <tr className="subtotal"><td>Main Account Total:</td><td>{formatMoney(main.totals.proposed_amount)}</td><td>{formatMoney(main.totals.approved_amount)}</td><td>{main.totals.percentage} %</td></tr>
        </tbody></table></section>)
        : preview.main_account_groups.map((main, mainIndex) => <section className="main-group approved-main-group" key={`${main.main_account.id ?? 'unmapped'}-${mainIndex}`}><h3>{accountLabel(main.main_account)}</h3><table className="approved-budget-table"><thead><tr><th>Account</th><th>Quantity</th><th>Proposed Amount</th><th>Approved Amount</th></tr></thead><tbody>
          {main.sub_account_groups.map((sub, subIndex) => <tr key={`${sub.sub_account.id ?? 'unmapped'}-${subIndex}`}><td>{accountLabel(sub.sub_account)}</td><td>{sub.quantity}</td><td>{formatMoney(sub.proposed_amount)}</td><td>{formatMoney(sub.approved_amount)}</td></tr>)}
          <tr className="subtotal"><td>Main Account Total:</td><td>{main.totals.quantity}</td><td>{formatMoney(main.totals.proposed_amount)}</td><td>{formatMoney(main.totals.approved_amount)}</td></tr>
        </tbody></table></section>)}
      {approvedItems || approvedItemsDepartment
        ? null
        : preview.report.preview_type === 'details_and_status'
        ? <div className="grand-total"><span>Grand Total:</span><b>{formatMoney(preview.grand_total.proposed_amount)}</b><b>{formatMoney(preview.grand_total.approved_amount)}</b></div>
        : proposedVsApproved
        ? <div className="percentage-grand-total"><span>Grand Total:</span><b>{formatMoney(preview.grand_total.proposed_amount)}</b><b>{formatMoney(preview.grand_total.approved_amount)}</b><b>{preview.grand_total.percentage} %</b></div>
        : approvedYearComparison
        ? <div className="percentage-grand-total"><span>Grand Total:</span><b>{formatMoney(preview.grand_total.previous_approved_amount)}</b><b>{formatMoney(preview.grand_total.current_approved_amount)}</b><b>{preview.grand_total.percentage} %</b></div>
        : <div className="university-grand-total"><span>Grand Total:</span><b>{preview.grand_total.quantity}</b><b>{formatMoney(preview.grand_total.proposed_amount)}</b><b>{formatMoney(preview.grand_total.approved_amount)}</b></div>}
      {!approvedItems && <footer>ABMS | Print Date: {new Date().toLocaleDateString()} | Printed By: {preview.report.printed_by}</footer>}
    </article>
    <style>{`.proposal-report{font-family:Arial,sans-serif;font-size:10px}.proposal-report h1{font-size:18px;font-weight:800;margin:0}.proposal-report h2{font-size:12px;margin:2px 0}.unit-title,.account-title{font-size:12px;font-weight:800;margin-bottom:10px}.unit-title span,.unit-badge{font-size:8px;border:1px solid #777;border-radius:999px;padding:1px 5px;white-space:nowrap}.main-group{break-inside:auto;margin:10px 0}.main-group h3{font-size:12px;margin:0;border-top:1px solid #555;padding-top:5px}.sub-group{margin:5px 0 10px 12px}.sub-group h4{font-size:10px;margin:0 0 2px}.proposal-report table{width:100%;border-collapse:collapse;table-layout:fixed}.proposal-report th,.proposal-report td{padding:3px 5px;text-align:left;vertical-align:top;font-variant-numeric:tabular-nums}.proposal-report th{border-bottom:1px solid #555}.proposal-report th:nth-child(1){width:31%}.proposal-report th:nth-child(2){width:9%}.proposal-report th:nth-child(3),.proposal-report th:nth-child(4){width:14%}.proposal-report th:nth-child(5){width:32%}.proposal-report th:nth-child(n+2):nth-child(-n+4),.proposal-report td:nth-child(n+2):nth-child(-n+4){text-align:right}.university-budget-table th:first-child,.approved-budget-table th:first-child{width:52%}.university-budget-table th:nth-child(2),.approved-budget-table th:nth-child(2){width:12%}.university-budget-table th:nth-child(3),.university-budget-table th:nth-child(4),.approved-budget-table th:nth-child(3),.approved-budget-table th:nth-child(4){width:18%}.percentage-budget-table th:first-child{width:46%}.percentage-budget-table th:nth-child(2),.percentage-budget-table th:nth-child(3){width:21%}.percentage-budget-table th:nth-child(4){width:12%}.approved-items-unit{margin-top:10px}.approved-items-unit-heading{display:flex;align-items:center;gap:6px;border-bottom:1px solid #555;padding-bottom:4px;font-size:12px}.approved-items-table th:first-child{width:36%}.approved-items-table th:nth-child(2){width:40%}.approved-items-table th:nth-child(3){width:10%}.approved-items-table th:nth-child(4){width:14%}.approved-items-table th:nth-child(3),.approved-items-table th:nth-child(4),.approved-items-table td:nth-child(3),.approved-items-table td:nth-child(4){text-align:right}.approved-department-sub{margin-top:12px}.approved-department-sub>h3{border-bottom:1px solid #555;font-size:12px;margin:0 0 6px;padding-bottom:3px}.approved-department-unit{margin:0 0 10px 12px}.approved-department-unit h4{font-size:11px;font-style:italic;margin:3px 0}.approved-department-table th:first-child{width:46%}.approved-department-table th:nth-child(2){width:12%}.approved-department-table th:nth-child(3),.approved-department-table th:nth-child(4){width:21%}.approved-department-total{margin-left:auto;width:62%;display:grid;grid-template-columns:1fr 16% 27% 27%;gap:5px;border-top:1px solid #555;padding:4px 5px;text-align:right;font-weight:700}.approved-department-total.account{border-top:2px solid #333;border-bottom:3px double #333;font-size:11px}.sub-account-heading{font-weight:800;text-decoration:underline}.subtotal,.unit-report-total{border-top:1px solid #777;font-weight:700}.subtotal td:first-child,.unit-report-total td:first-child{text-align:right!important}.unit-report-total{border-bottom:3px double #555}.approved-items-grand-total{margin-left:auto;width:42%;display:grid;grid-template-columns:1fr 25% 35%;gap:5px;border-top:2px solid #444;border-bottom:3px double #444;padding:4px 5px;text-align:right;font-size:11px}.main-total,.grand-total{margin-left:auto;width:52%;display:grid;grid-template-columns:1fr 27% 27%;gap:5px;text-align:right;border-top:2px solid #444;padding:4px 5px}.university-main-total,.university-grand-total,.percentage-grand-total{margin-left:auto;width:48%;display:grid;grid-template-columns:1fr 20% 30% 30%;gap:5px;text-align:right;border-top:2px solid #444;padding:4px 5px}.grand-total,.university-grand-total,.percentage-grand-total{font-size:11px;border-bottom:3px double #444}.empty{text-align:center;color:#555;padding:24px}.proposal-report footer{margin-top:18px;border-top:1px solid #555;padding-top:4px}@page{size:letter landscape;margin:0.35in}@media print{body *{visibility:hidden!important}.proposal-report-preview,.proposal-report-preview *{visibility:visible!important}.proposal-report-preview{position:absolute!important;inset:0!important;overflow:visible!important;background:white!important;padding:0!important}.report-actions{display:none!important}.proposal-report{box-shadow:none!important;max-width:none!important;min-height:0!important;padding:0!important}.approved-items-unit+.approved-items-unit{break-before:page}.approved-items-unit{break-after:page}.approved-items-unit:last-of-type{break-after:auto}.university-sub-group h4,.university-budget-table thead,.approved-budget-table thead,.percentage-budget-table thead,.approved-items-table thead,.approved-department-sub>h3,.approved-department-unit h4,.approved-department-table thead,.subtotal,.approved-department-total,.sub-account-heading,.unit-report-total,.university-main-total,.university-grand-total,.percentage-grand-total{break-inside:avoid}}`}</style>
  </div></ReportPrintPortal>;
}

const futureOptions = ['Budget Proposal (For Excel)'];

export default function BudgetProposalReports() {
  const navigate = useNavigate();
  const loader = budgetproposalreportsRoute.useLoaderData() as { data?: { data?: LoaderPayload } | LoaderPayload };
  const payload = ((loader?.data as { data?: LoaderPayload })?.data ?? loader?.data ?? {}) as LoaderPayload;
  const [previewType, setPreviewType] = useState<PreviewType>('details_and_status');
  const [schoolYear, setSchoolYear] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [mainAccountId, setMainAccountId] = useState('');
  const [subAccountId, setSubAccountId] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const schoolYears = useMemo(() => Array.from(new Set(Array.isArray(payload.school_years) ? payload.school_years.filter((year): year is string => typeof year === 'string' && Boolean(year)) : [])).sort((a, b) => b.localeCompare(a)), [payload.school_years]);
  const currentSchoolYear = typeof payload.current_school_year === 'string' ? payload.current_school_year.trim() : '';
  const selectableSchoolYears = previewType === 'approved_previous_vs_current_percentage' ? schoolYears.filter(year => year !== currentSchoolYear) : schoolYears;
  const units = useMemo(() => (Array.isArray(payload.units) ? payload.units.filter(validUnit) : []), [payload.units]);
  const unitScopeRestricted = payload.unit_scope_restricted === true;
  const mainAccounts = useMemo(() => (Array.isArray(payload.main_accounts) ? payload.main_accounts.filter(account => validAccount(account) && Array.isArray(account.sub_accounts)) : []) as MainAccount[], [payload.main_accounts]);
  const selectedUnit = units.find(unit => `${unit.type}:${unit.id}` === unitValue);
  const selectedMain = mainAccounts.find(account => String(account.id) === mainAccountId);
  const approvedItemsMode = previewType === 'approved_items_per_account' || previewType === 'approved_items_per_account_department';
  const accountOption = (account: Account) => ({ value: String(account.id), label: accountLabel(account) });

  useEffect(() => {
    if (unitScopeRestricted && previewType === 'university_budget') {
      setPreviewType('details_and_status');
    }
    if (units.length === 1 && !unitValue) {
      setUnitValue(`${units[0].type}:${units[0].id}`);
    }
  }, [previewType, unitScopeRestricted, units, unitValue]);

  const openPreview = async () => {
    const next: Errors = {};
    if (!schoolYear) next.schoolYear = 'School year is required.';
    if (previewType === 'approved_previous_vs_current_percentage' && !currentSchoolYear) next.schoolYear = 'The current school year is not configured in Budget Settings.';
    if ((unitScopeRestricted || previewType === 'details_and_status' || previewType === 'approved_budget' || previewType === 'proposed_vs_approved_percentage' || previewType === 'approved_previous_vs_current_percentage') && !selectedUnit) next.unit = 'Department or Section is required.';
    if (approvedItemsMode && !selectedMain) next.mainAccount = 'Main Account is required.';
    setErrors(next); setPreviewError(null);
    if (Object.keys(next).length) return;
    setLoading(true); setPreview(null);
    try {
      const response = await financeSvc.get('/abms/budget-proposal-reports/preview', { params: { school_year: schoolYear, ...(previewType !== 'university_budget' && selectedUnit ? { unit_type: selectedUnit.type, unit_id: selectedUnit.id } : {}), ...(previewType !== 'approved_budget' && mainAccountId ? { main_account_id: mainAccountId } : {}), ...(previewType !== 'approved_budget' && subAccountId ? { sub_account_id: subAccountId } : {}), preview_type: previewType } });
      const nextPreview = parsePreview(response.data);
      if (!nextPreview) { setPreviewError('The finance service returned an invalid preview response. Please try again.'); return; }
      if (!nextPreview.data_quality.complete || nextPreview.data_quality.warnings.length) {
        const count = nextPreview.data_quality.warnings.length;
        toast.warning('Some proposal data requires attention.', { description: `${count} data-quality notice${count === 1 ? '' : 's'} found. Preserved values are shown in the report.`, duration: 10000 });
      }
      setPreview(nextPreview);
    } catch (error) { setPreviewError(errorMessage(error)); } finally { setLoading(false); }
  };

  return <AdamsonBudgetLayout><Toaster position="bottom-right" richColors closeButton /><Page width="default"><PageHeader title="Budget Proposal Reports" description="Review current proposal details or university-wide proposed and approved budgets." /><PageSurface><Card className="border-0 bg-transparent shadow-none"><CardContent className="space-y-6 py-6">
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5"><Label htmlFor="proposal-report-unit">Department / Section {previewType === 'university_budget' ? <span className="text-muted-foreground">(Not used for University Budget)</span> : approvedItemsMode && !unitScopeRestricted ? <span className="text-muted-foreground">(Optional · All units)</span> : null}</Label><ReportFilterCombobox id="proposal-report-unit" options={units.map(unit => ({ value: `${unit.type}:${unit.id}`, label: unit.active ? unit.name : `${unit.name} (Inactive)`, badge: `${unit.type === 'department' ? 'Department' : 'Section'}${unit.active ? '' : ' · Inactive'}` }))} value={unitValue} disabled={loading || !units.length || previewType === 'university_budget'} placeholder={previewType === 'university_budget' || (approvedItemsMode && !unitScopeRestricted) ? 'All departments and sections' : 'Select department or section'} searchPlaceholder="Search department or section..." emptyText="No department or section found." invalid={Boolean(errors.unit)} errorId="proposal-report-unit-error" groupLabel="Departments and sections" clearLabel={approvedItemsMode && !unitScopeRestricted ? 'All departments and sections' : undefined} wideOptions onChange={value => { setUnitValue(value); setErrors(current => ({ ...current, unit: undefined })); setPreviewError(null); }} /><FieldError id="proposal-report-unit-error">{errors.unit}</FieldError></div>
      <div className="space-y-1.5"><Label htmlFor="proposal-report-main">Main Account <span className="text-muted-foreground">{previewType === 'approved_budget' ? '(All accounts included)' : approvedItemsMode ? '(Required)' : '(Optional)'}</span></Label><ReportFilterCombobox id="proposal-report-main" options={mainAccounts.map(accountOption)} value={mainAccountId} disabled={loading || !mainAccounts.length || previewType === 'approved_budget'} placeholder={previewType === 'approved_budget' ? 'All main accounts' : 'Select main account'} searchPlaceholder="Search main account..." emptyText="No main account found." groupLabel="Main accounts" clearLabel={approvedItemsMode ? undefined : 'All main accounts'} invalid={Boolean(errors.mainAccount)} errorId="proposal-report-main-error" onChange={value => { setMainAccountId(value); setSubAccountId(''); setErrors(current => ({ ...current, mainAccount: undefined })); setPreviewError(null); }} /><FieldError id="proposal-report-main-error">{errors.mainAccount}</FieldError></div>
      <div className="space-y-1.5"><Label htmlFor="proposal-report-sub">Sub-Account <span className="text-muted-foreground">{previewType === 'approved_budget' ? '(All accounts included)' : '(Optional)'}</span></Label><ReportFilterCombobox id="proposal-report-sub" options={(selectedMain?.sub_accounts ?? []).map(accountOption)} value={subAccountId} disabled={loading || previewType === 'approved_budget' || !selectedMain || !selectedMain.sub_accounts.length} placeholder={previewType === 'approved_budget' ? 'All sub-accounts' : !selectedMain ? 'Select a main account first' : 'All sub-accounts'} searchPlaceholder="Search sub-account..." emptyText="No sub-account found." groupLabel="Sub-accounts" clearLabel="All sub-accounts" onChange={value => { setSubAccountId(value); setPreviewError(null); }} /></div>
      <div className="space-y-1.5"><Label htmlFor="proposal-report-year">{previewType === 'approved_previous_vs_current_percentage' ? 'Previous School Year' : 'School Year'} {previewType === 'approved_previous_vs_current_percentage' && currentSchoolYear && <span className="text-muted-foreground">(Current: {currentSchoolYear})</span>}</Label><ReportFilterCombobox id="proposal-report-year" options={selectableSchoolYears.map(value => ({ value, label: value }))} value={schoolYear} disabled={loading || !selectableSchoolYears.length} placeholder={previewType === 'approved_previous_vs_current_percentage' ? 'Select previous school year' : 'Select school year'} searchPlaceholder="Search school year..." emptyText="No school year found." invalid={Boolean(errors.schoolYear)} errorId="proposal-report-year-error" groupLabel="Available school years" onChange={value => { setSchoolYear(value); setErrors(current => ({ ...current, schoolYear: undefined })); setPreviewError(null); }} /><FieldError id="proposal-report-year-error">{errors.schoolYear}</FieldError></div>
    </div>
    <fieldset className="rounded-lg border border-[var(--abms-border)] p-4"><legend className="px-2 text-sm font-semibold text-[var(--abms-primary)]">Report Options</legend><RadioGroup value={previewType} onValueChange={value => { const nextType = value as PreviewType; setPreviewType(nextType); if (nextType === 'university_budget') setUnitValue(''); if (nextType === 'approved_budget') { setMainAccountId(''); setSubAccountId(''); } if (nextType === 'approved_previous_vs_current_percentage' && schoolYear === currentSchoolYear) setSchoolYear(''); setErrors({}); setPreviewError(null); setPreview(null); }} className="grid gap-3 md:grid-cols-2"><div className="flex items-center gap-2"><RadioGroupItem id="proposal-details-status" value="details_and_status" /><Label htmlFor="proposal-details-status">Budget Proposal with Details and Status</Label></div><div className="flex items-center gap-2"><RadioGroupItem id="proposal-approved-budget" value="approved_budget" /><Label htmlFor="proposal-approved-budget">Approved Budget</Label></div><div className="flex items-center gap-2"><RadioGroupItem id="proposal-university-budget" value="university_budget" disabled={unitScopeRestricted} /><Label htmlFor="proposal-university-budget">University Budget{unitScopeRestricted ? ' (Requires report-wide access)' : ''}</Label></div><div className="flex items-center gap-2"><RadioGroupItem id="proposal-approved-items-account" value="approved_items_per_account" /><Label htmlFor="proposal-approved-items-account">Approved Items Per Account</Label></div><div className="flex items-center gap-2"><RadioGroupItem id="proposal-approved-items-account-department" value="approved_items_per_account_department" /><Label htmlFor="proposal-approved-items-account-department">Approved Items Per Account/Department</Label></div><div className="flex items-center gap-2"><RadioGroupItem id="proposal-proposed-vs-approved" value="proposed_vs_approved_percentage" /><Label htmlFor="proposal-proposed-vs-approved">% of Proposed vs. Approved Budget</Label></div><div className="flex items-center gap-2"><RadioGroupItem id="proposal-approved-year-comparison" value="approved_previous_vs_current_percentage" /><Label htmlFor="proposal-approved-year-comparison">% of Approved Budget (Previous vs. Current SY)</Label></div>{futureOptions.map((option, index) => <div className="flex items-center gap-2 opacity-60" key={option}><RadioGroupItem id={`proposal-future-${index}`} value={`future-${index}`} disabled /><Label htmlFor={`proposal-future-${index}`}>{option}</Label><Badge variant="secondary">Coming soon</Badge></div>)}</RadioGroup></fieldset>
    {previewError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Unable to generate preview</AlertTitle><AlertDescription>{previewError}</AlertDescription></Alert>}
    <div className="flex justify-end gap-3 border-t border-[var(--abms-border)] pt-5"><Button variant="outline" onClick={() => navigate({ to: '/' })}>Close</Button><Button onClick={openPreview} disabled={loading || !schoolYears.length || (previewType !== 'university_budget' && !units.length)} aria-busy={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading preview...</> : 'Preview'}</Button></div>
  </CardContent></Card></PageSurface></Page>{preview && <PrintPreview preview={preview} onClose={() => setPreview(null)} />}</AdamsonBudgetLayout>;
}
