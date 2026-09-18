import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import type { ThemeTokens } from '../types';
import { SelectAccountModal, type AccountOption } from './SelectAccountModal';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function PayrollItemModal({ open, paymentForm, departmentId, sectionId, schoolYear, t, isDark, onClose, onCreate }: {
    open: boolean;
    paymentForm: string;
    departmentId: string;
    sectionId: string;
    schoolYear: string;
    t: ThemeTokens;
    isDark: boolean;
    onClose: () => void;
    onCreate: (month: number, year: number, amount: string, account: AccountOption) => Promise<void>;
}) {
    const [month, setMonth] = useState(() => new Date().getMonth() + 1);
    const [year, setYear] = useState(() => new Date().getFullYear());
    const [amount, setAmount] = useState<string | null>(null);
    const [account, setAccount] = useState<AccountOption | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        const now = new Date();
        setMonth(now.getMonth() + 1);
        setYear(now.getFullYear());
        setAmount(null);
        setAccount(null);
        setError('');
    }, [open]);

    if (!open) return null;

    async function preview() {
        setBusy(true);
        setError('');
        setAmount(null);
        setAccount(null);
        try {
            const response = await financeSvc.get('/abms/budget-request-entry/payroll-preview', { params: {
                payment_form: paymentForm, month, year,
                ...(departmentId ? { department_id: departmentId } : { section_id: sectionId }),
            } });
            setAmount(String(response.data.amount));
        } catch (e) {
            setError((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Unable to load payroll amount. Please retry.');
        } finally {
            setBusy(false);
        }
    }

    async function create() {
        if (!amount || !account) return;
        setBusy(true);
        setError('');
        try {
            await onCreate(month, year, amount, account);
        } catch (e) {
            setError((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Unable to create the payroll item. Please retry.');
        } finally {
            setBusy(false);
        }
    }

    const control = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputText };

    return <>
        {createPortal(<div className="abms-modal-backdrop fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto p-4" style={{ background: isDark ? 'rgba(0,0,0,.72)' : 'rgba(0,20,60,.48)' }}>
            <div role="dialog" aria-modal="true" aria-labelledby="payroll-modal-title" className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
                <div className="flex items-center justify-between px-6 py-5" style={{ background: t.cardHeaderBg, borderBottom: `1px solid ${t.cardHeaderBorder}` }}>
                    <div><h2 id="payroll-modal-title" className="text-xl font-extrabold" style={{ color: t.titleColor }}>{paymentForm}</h2><p className="text-sm" style={{ color: t.cellMuted }}>Choose a payroll period and confirm its amount.</p></div>
                    <button type="button" aria-label="Close payroll form" onClick={onClose} disabled={busy} className="flex h-10 w-10 items-center justify-center rounded-xl border" style={{ borderColor: t.cardBorder, color: t.cellText }}><X size={20} strokeWidth={2.5} /></button>
                </div>
                <div className="min-h-0 space-y-5 overflow-y-auto px-6 py-6">
                    <div className="grid grid-cols-2 gap-4">
                        <label className="text-sm font-bold" style={{ color: t.cellText }}>Month<select value={month} onChange={e => { setMonth(Number(e.target.value)); setAmount(null); setAccount(null); }} className="mt-2 w-full rounded-xl p-3" style={control}>{months.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}</select></label>
                        <label className="text-sm font-bold" style={{ color: t.cellText }}>Year<input type="number" min={1900} max={2100} value={year} onChange={e => { setYear(Number(e.target.value)); setAmount(null); setAccount(null); }} className="mt-2 w-full rounded-xl p-3" style={control} /></label>
                    </div>
                    <button type="button" onClick={() => void preview()} disabled={busy || year < 1900 || year > 2100} className="rounded-xl px-5 py-3 text-sm font-bold text-white" style={{ background: t.cellBlue }}>Get payroll amount</button>
                    {amount && <div className="rounded-xl border p-5" style={{ borderColor: t.cardBorder, background: t.cardHeaderBg }}><p className="text-sm" style={{ color: t.cellMuted }}>{paymentForm} for {months[month - 1]} {year}</p><p className="mt-1 text-2xl font-extrabold" style={{ color: t.cellText }}>₱ {Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p><p className="mt-2 text-sm" style={{ color: t.cellMuted }}>Proceeding will deduct this amount from the account you select.</p></div>}
                    {amount && <div><button type="button" onClick={() => setPickerOpen(true)} disabled={busy} className="rounded-xl border px-5 py-3 text-sm font-bold" style={{ borderColor: t.inputBorder, color: t.cellBlue }}>{account ? `${account.account_code} — ${account.account_name}` : 'Select account'}</button></div>}
                    {error && <p role="alert" className="text-sm" style={{ color: t.cellRed }}>{error}</p>}
                </div>
                <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${t.cardBorder}` }}><button type="button" onClick={onClose} disabled={busy} className="rounded-xl border px-5 py-2.5 text-sm" style={{ borderColor: t.cardBorder, color: t.cellText }}>Cancel</button><button type="button" onClick={() => void create()} disabled={busy || !amount || !account} className="rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50" style={{ background: t.cellBlue }}>{busy ? 'Working…' : 'Proceed and add item'}</button></div>
            </div>
        </div>, document.body)}
        <SelectAccountModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={selected => { setAccount(selected); setPickerOpen(false); }} t={t} isDark={isDark} departmentId={departmentId} sectionId={sectionId} currentSchoolYear={schoolYear} />
    </>;
}
