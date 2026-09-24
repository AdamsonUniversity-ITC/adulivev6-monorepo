import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import type { ThemeTokens } from '../types';
import { previousPayrollPeriod } from '../payrollPeriod';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
type PayrollAccount = { account_id: number; account_code: string; account_name: string; main_account_code: string; main_account_name?: string; account_parent_id: number; balance: string | null; proposal_balance?: string | null; unavailable_reason?: string | null };

function cents(value: string | null | undefined): number | null {
    if (!value || !/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
    const [whole, fraction = ''] = value.split('.');
    return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function PayrollItemModal({ open, paymentForm, departmentId, sectionId, schoolYear, t, isDark, onClose, onCreate }: {
    open: boolean;
    paymentForm: string;
    departmentId: string;
    sectionId: string;
    schoolYear: string;
    t: ThemeTokens;
    isDark: boolean;
    onClose: () => void;
    onCreate: (month: number, year: number, amount: string, manual: boolean, accountId?: number) => Promise<void>;
}) {
    const [month, setMonth] = useState(() => previousPayrollPeriod().month);
    const [year, setYear] = useState(() => previousPayrollPeriod().year);
    const [amount, setAmount] = useState<string | null>(null);
    const [manualAmount, setManualAmount] = useState('');
    const [manual, setManual] = useState(false);
    const [requested, setRequested] = useState(false);
    const [previewWarning, setPreviewWarning] = useState('');
    const [account, setAccount] = useState<PayrollAccount | null>(null);
    const [accounts, setAccounts] = useState<PayrollAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        const period = previousPayrollPeriod();
        setMonth(period.month);
        setYear(period.year);
        setAmount(null);
        setManualAmount('');
        setManual(false);
        setRequested(false);
        setPreviewWarning('');
        setAccount(null);
        setAccounts([]);
        setSelectedAccountId(null);
        setError('');
    }, [open]);

    if (!open) return null;

    async function preview() {
        setBusy(true);
        setError('');
        setAmount(null);
        setAccount(null);
        setAccounts([]);
        setSelectedAccountId(null);
        setRequested(false);
        setPreviewWarning('');
        const params = {
            payment_form: paymentForm, school_year: schoolYear,
            ...(departmentId ? { department_id: departmentId } : { section_id: sectionId }),
        };
        try {
            const response = await financeSvc.get('/abms/budget-request-entry/payroll-preview', { params: {
                ...params, month, year,
            } });
            setAmount(String(response.data.amount));
            setAccount(response.data.account ?? null);
            setAccounts(response.data.accounts ?? []);
        } catch (e) {
            setPreviewWarning((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Unable to load payroll amount. You can enter it manually.');
            try {
                const response = await financeSvc.get('/abms/budget-request-entry/payroll-account', { params });
                setAccount(response.data.account ?? null);
                setAccounts(response.data.accounts ?? []);
            } catch (accountError) {
                setError((accountError as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'The configured account could not be loaded. Please retry.');
            }
        } finally {
            setRequested(true);
            setBusy(false);
        }
    }

    async function create() {
        const selectedAmount = manual ? manualAmount.trim() : amount;
        if (!selectedAmount || !activeAccount || (manual && !validManualAmount)) return;
        setBusy(true);
        setError('');
        try {
            await onCreate(month, year, selectedAmount, manual, needsFallback ? activeAccount.account_id : undefined);
        } catch (e) {
            setError((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Unable to create the payroll item. Please retry.');
        } finally {
            setBusy(false);
        }
    }

    const control = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputText };
    const validManualAmount = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(manualAmount.trim())
        && Number(manualAmount) > 0 && Number(manualAmount) <= 9999999999999.99;
    const selectedAmount = manual ? manualAmount.trim() : amount;
    const fallbackForm = paymentForm === "Employee's Payroll" || paymentForm === 'Employer Share';
    const unavailableReason = (option: PayrollAccount): string | null => {
        if (option.balance === null) return option.unavailable_reason ?? 'No allocation for this unit and school year';
        const required = cents(selectedAmount);
        if (required === null) return 'Enter an amount to check availability';
        if ((cents(option.balance) ?? 0) < required) return 'Account balance is insufficient';
        if ((cents(option.proposal_balance) ?? 0) < required) return 'Proposal balance is insufficient';
        return null;
    };
    const defaultUsable = account !== null && unavailableReason(account) === null;
    const needsFallback = fallbackForm && requested && cents(selectedAmount) !== null && (account === null || !defaultUsable);
    const activeAccount = needsFallback ? accounts.find(option => option.account_id === selectedAccountId && unavailableReason(option) === null) ?? null : account;

    return <>
        {createPortal(<div className="abms-modal-backdrop fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto p-4" style={{ background: isDark ? 'rgba(0,0,0,.72)' : 'rgba(0,20,60,.48)' }}>
            <div role="dialog" aria-modal="true" aria-labelledby="payroll-modal-title" className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
                <div className="flex items-center justify-between px-6 py-5" style={{ background: t.cardHeaderBg, borderBottom: `1px solid ${t.cardHeaderBorder}` }}>
                    <div><h2 id="payroll-modal-title" className="text-xl font-extrabold" style={{ color: t.titleColor }}>{paymentForm}</h2><p className="text-sm" style={{ color: t.cellMuted }}>Choose a payroll period and confirm its amount.</p></div>
                    <button type="button" aria-label="Close payroll form" onClick={onClose} disabled={busy} className="flex h-10 w-10 items-center justify-center rounded-xl border" style={{ borderColor: t.cardBorder, color: t.cellText }}><X size={20} strokeWidth={2.5} /></button>
                </div>
                <div className="min-h-0 space-y-5 overflow-y-auto px-6 py-6">
                    <div className="grid grid-cols-2 gap-4">
                        <label className="text-sm font-bold" style={{ color: t.cellText }}>Month<select value={month} onChange={e => { setMonth(Number(e.target.value)); setAmount(null); setAccount(null); setAccounts([]); setSelectedAccountId(null); setRequested(false); setManual(false); setPreviewWarning(''); setError(''); }} className="mt-2 w-full rounded-xl p-3" style={control}>{months.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}</select></label>
                        <label className="text-sm font-bold" style={{ color: t.cellText }}>Year<input type="number" min={1900} max={2100} value={year} onChange={e => { setYear(Number(e.target.value)); setAmount(null); setAccount(null); setAccounts([]); setSelectedAccountId(null); setRequested(false); setManual(false); setPreviewWarning(''); setError(''); }} className="mt-2 w-full rounded-xl p-3" style={control} /></label>
                    </div>
                    <button type="button" onClick={() => void preview()} disabled={busy || year < 1900 || year > 2100} className="rounded-xl px-5 py-3 text-sm font-bold text-white" style={{ background: t.cellBlue }}>Get payroll amount</button>
                    {requested && <button type="button" onClick={() => setManual(true)} disabled={busy} className="rounded-xl border px-4 py-2.5 text-sm font-bold" style={{ borderColor: t.cardBorder, color: t.cellBlue }}>Enter amount manually</button>}
                    {manual && <label className="block text-sm font-bold" style={{ color: t.cellText }}>Manual amount (PHP)<input type="text" inputMode="decimal" value={manualAmount} onChange={e => setManualAmount(e.target.value)} aria-invalid={manualAmount !== '' && !validManualAmount} className="mt-2 w-full rounded-xl p-3" style={control} placeholder="0.00" />{manualAmount !== '' && !validManualAmount && <span className="mt-1 block text-xs font-medium" style={{ color: t.cellRed }}>Enter a positive amount with up to two decimal places.</span>}</label>}
                    {manual && amount && <button type="button" onClick={() => setManual(false)} className="text-sm font-semibold underline" style={{ color: t.cellBlue }}>Use queried amount instead</button>}
                    {previewWarning && <p role="status" className="text-sm" style={{ color: t.cellMuted }}>{previewWarning}</p>}
                    {needsFallback && <div className="rounded-xl border p-4" style={{ borderColor: t.cardBorder, background: t.cardHeaderBg }}>
                        <p className="text-sm font-bold" style={{ color: t.cellText }}>Choose a 992 child account</p>
                        <p className="mt-1 text-sm" style={{ color: t.cellMuted }}>The default 992-5 account has no allocation or cannot cover this amount. Only an account allocated to this RS's department or section and school year can be used.</p>
                        <div role="radiogroup" aria-label="Alternative payroll account" className="mt-3 max-h-60 space-y-2 overflow-y-auto">
                            {accounts.map(option => {
                                const reason = unavailableReason(option);
                                const selected = selectedAccountId === option.account_id;
                                return <button key={option.account_id} type="button" role="radio" aria-checked={selected} disabled={busy || reason !== null} onClick={() => setSelectedAccountId(option.account_id)} className="flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60" style={{ borderColor: selected ? t.cellBlue : t.cardBorder, background: selected ? t.inputBg : t.cardBg, color: t.cellText }}>
                                    <span className="min-w-0"><span className="block font-bold">{option.main_account_code}-{option.account_code} · {option.account_name}</span><span className="block text-xs" style={{ color: t.cellMuted }}>{option.main_account_name ?? 'Parent account'} · Account #{option.account_id}</span></span>
                                    <span className="shrink-0 text-right text-xs" style={{ color: reason ? t.cellMuted : t.cellGreen }}>{reason ?? `Available ₱ ${Number(option.balance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}</span>
                                </button>;
                            })}
                            {accounts.length === 0 && <p className="py-3 text-sm" style={{ color: t.cellMuted }}>No active child accounts are available under 992.</p>}
                        </div>
                    </div>}
                    {selectedAmount && activeAccount && (!manual || validManualAmount) && <div className="rounded-xl border p-5" style={{ borderColor: t.cardBorder, background: t.cardHeaderBg }}><p className="text-sm" style={{ color: t.cellMuted }}>{paymentForm} for {months[month - 1]} {year} · {manual ? 'Manual amount' : 'Queried amount'}</p><p className="mt-1 text-2xl font-extrabold" style={{ color: t.cellText }}>₱ {Number(selectedAmount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="mt-2 text-sm" style={{ color: t.cellMuted }}>Account to charge: {activeAccount.main_account_code} / {activeAccount.account_code} — {activeAccount.account_name}</p><p className="mt-1 text-sm" style={{ color: t.cellMuted }}>Proceeding will deduct this amount from this account.</p></div>}
                    {error && <p role="alert" className="text-sm" style={{ color: t.cellRed }}>{error}</p>}
                </div>
                <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${t.cardBorder}` }}><button type="button" onClick={onClose} disabled={busy} className="rounded-xl border px-5 py-2.5 text-sm" style={{ borderColor: t.cardBorder, color: t.cellText }}>Cancel</button><button type="button" onClick={() => void create()} disabled={busy || !selectedAmount || !activeAccount || (manual && !validManualAmount)} className="rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50" style={{ background: t.cellBlue }}>{busy ? 'Working…' : 'Proceed and add item'}</button></div>
            </div>
        </div>, document.body)}
    </>;
}
