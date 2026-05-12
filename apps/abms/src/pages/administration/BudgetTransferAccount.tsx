import { useState, useCallback } from 'react';
import { z } from 'zod';
import AdamsonBudgetLayout from '../../layouts/Screenlayout';
import { budgettransferaccountRoute } from '../../router.tsx';
import { financeSvc } from '@repo/axios-config';
import {
    ArrowRightLeft, ChevronDown, Save, RefreshCw,
    FileText, Eye, Loader2, CheckCircle, XCircle, Info,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
const T = {
    dark: {
        titleColor: '#f0f6ff', subColor: '#a8c4f0',
        cardBg: 'rgba(11,19,40,0.96)', cardBorder: 'rgba(100,160,255,0.30)', cardShadow: '0 4px 40px rgba(37,99,235,0.22)',
        cardHeaderBg: 'rgba(7,14,32,0.98)', cardHeaderBorder: 'rgba(100,160,255,0.22)',
        inputBg: 'rgba(13,26,58,0.85)', inputBorder: 'rgba(100,160,255,0.32)', inputText: '#e8f0fe',
        tableHeadBg: 'rgba(10,22,50,0.90)', tableHeadText: '#7eb8ff', tableHeadBorder: 'rgba(100,160,255,0.26)',
        rowBorder: 'rgba(100,160,255,0.11)', rowEvenBg: 'rgba(13,26,58,0.32)', rowOddBg: 'transparent',
        cellText: '#ddeeff', cellMuted: '#7a9cc4', cellGreen: '#4ade80', cellBlue: '#60a5fa',
        pillBg: 'rgba(59,130,246,0.25)', pillText: '#93c5fd', pillBorder: 'rgba(100,160,255,0.45)',
        summaryBg: 'rgba(7,14,32,0.98)', summaryBorder: 'rgba(100,160,255,0.26)',
        summaryLabelText: '#7a9cc4', summaryValueBg: 'rgba(13,26,58,0.85)', summaryValueBorder: 'rgba(100,160,255,0.22)',
    },
    light: {
        titleColor: '#0a1628', subColor: '#2d4a7a',
        cardBg: 'rgba(255,255,255,0.98)', cardBorder: 'rgba(37,99,235,0.22)', cardShadow: '0 4px 32px rgba(0,48,135,0.12)',
        cardHeaderBg: 'rgba(240,246,255,0.99)', cardHeaderBorder: 'rgba(37,99,235,0.18)',
        inputBg: 'rgba(232,242,255,0.95)', inputBorder: 'rgba(37,99,235,0.28)', inputText: '#0a1628',
        tableHeadBg: 'rgba(210,228,255,0.95)', tableHeadText: '#1440a8', tableHeadBorder: 'rgba(37,99,235,0.22)',
        rowBorder: 'rgba(37,99,235,0.09)', rowEvenBg: 'rgba(232,242,255,0.60)', rowOddBg: 'transparent',
        cellText: '#0a1628', cellMuted: '#2d4a7a', cellGreen: '#047857', cellBlue: '#1440a8',
        pillBg: 'rgba(37,99,235,0.14)', pillText: '#1440a8', pillBorder: 'rgba(37,99,235,0.35)',
        summaryBg: 'rgba(240,246,255,0.99)', summaryBorder: 'rgba(37,99,235,0.22)',
        summaryLabelText: '#2d4a7a', summaryValueBg: 'rgba(232,242,255,0.95)', summaryValueBorder: 'rgba(37,99,235,0.20)',
    },
};

const fmt = (n: number) =>
    n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─────────────────────────────────────────────────────────────────────────────
// Zod schema — validates the payload sent to /save
// Each transfer must have a numeric item_id, a numeric account_id, and an
// optional remarks string. The array itself must have at least one entry.
// ─────────────────────────────────────────────────────────────────────────────
const saveSchema = z.object({
    transfers: z
        .array(
            z.object({
                item_id:    z.number({ required_error: 'item_id is required.' }),
                account_id: z.number({ required_error: 'account_id is required.' }),
                remarks:    z.string().optional(),
            })
        )
        .min(1, 'Select at least one transfer account before saving.'),
});

type SavePayload = z.infer<typeof saveSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Toast system — self-contained, no external lib required
// ─────────────────────────────────────────────────────────────────────────────
type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    kind: ToastKind;
    message: string;
}

let _toastSeq = 0;

function useToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const push = useCallback((kind: ToastKind, message: string, duration = 3500) => {
        const id = ++_toastSeq;
        setToasts(prev => [...prev, { id, kind, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }, []);

    const dismiss = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, push, dismiss };
}

function ToastStack({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: number) => void }) {
    if (toasts.length === 0) return null;
    return (
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => {
                const borderColor =
                    t.kind === 'success' ? 'rgba(74,222,128,0.40)' :
                    t.kind === 'error'   ? 'rgba(248,113,113,0.40)' :
                                           'rgba(96,165,250,0.40)';
                const icon =
                    t.kind === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#4ade80' }} /> :
                    t.kind === 'error'   ? <XCircle     className="w-4 h-4 shrink-0" style={{ color: '#f87171' }} /> :
                                           <Info        className="w-4 h-4 shrink-0" style={{ color: '#60a5fa' }} />;
                return (
                    <div
                        key={t.id}
                        onClick={() => dismiss(t.id)}
                        className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer select-none"
                        style={{
                            background: 'rgba(10,18,38,0.97)',
                            border: `1px solid ${borderColor}`,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.50)',
                            color: '#e2e8f0',
                            maxWidth: '340px',
                            animation: 'btaSlideIn 0.18s ease',
                        }}
                    >
                        {icon}
                        <span>{t.message}</span>
                    </div>
                );
            })}
            <style>{`@keyframes btaSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export
// ─────────────────────────────────────────────────────────────────────────────
export default function BudgetTransferAccount() {
    const { units, school_years } = budgettransferaccountRoute.useLoaderData();

    return (
        <AdamsonBudgetLayout>
            {(isDark: boolean) => {
                const t = isDark ? T.dark : T.light;
                return <BudgetTransferAccountInner t={t} isDark={isDark} units={units} school_years={school_years} />;
            }}
        </AdamsonBudgetLayout>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Unit {
    id: string | number;
    name: string;
    kind: 'Department' | 'Section';
}

interface DeptOption {
    id: string;
    name: string;
    kind: 'Department' | 'Section';
}

interface Account {
    id: number;
    account_code: string;
    account_name: string;
}

interface BudgetTransferItem {
    id: number;
    subAccountId: number;
    mainAccountCode: string;
    subAccountCode: string;
    subAccountName: string;
    /** Account this item currently belongs to — disabled in the dropdown */
    currentRootAccountId: number | null;
    description: string;
    amountProposed: number;
    amountApproved: number | null;
    remarks: string;
    transferToAccount: string | null;
    status: 'PENDING' | 'APPROVED' | 'DISAPPROVED';
    updatedAt: string | null;
}

type ReportOption = 'Detailed' | 'Summary';

// ─────────────────────────────────────────────────────────────────────────────
// DeptSelect
// ─────────────────────────────────────────────────────────────────────────────
function DeptSelect({
    value, onChange, departments, sections, t, isDark,
}: {
    value: string;
    onChange: (id: string, kind: 'Department' | 'Section') => void;
    departments: DeptOption[];
    sections: DeptOption[];
    t: typeof T.dark;
    isDark: boolean;
}) {
    const [open, setOpen] = useState(false);

    const mergedList: DeptOption[] = [
        ...departments.map(d => ({ ...d, kind: 'Department' as const })),
        ...sections.map(s => ({ ...s, kind: 'Section' as const })),
    ].sort((a, b) => a.name.localeCompare(b.name));

    const selected = mergedList.find(o => o.id === value) ?? null;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                className="w-full flex items-center gap-2 pl-3 pr-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 border outline-none"
                style={{
                    background: t.inputBg,
                    borderColor: open
                        ? (isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)')
                        : t.inputBorder,
                    color: selected ? t.inputText : t.cellMuted,
                }}
            >
                <span className="flex-1 text-left truncate">
                    {selected?.name ?? 'Select department / section…'}
                </span>
                {selected && (
                    <span
                        className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md shrink-0"
                        style={{
                            background: selected.kind === 'Department'
                                ? (isDark ? 'rgba(37,99,235,0.25)' : 'rgba(219,234,254,0.90)')
                                : (isDark ? 'rgba(5,150,105,0.25)' : 'rgba(209,250,229,0.90)'),
                            color: selected.kind === 'Department'
                                ? (isDark ? '#93c5fd' : '#1d4ed8')
                                : (isDark ? '#6ee7b7' : '#047857'),
                        }}
                    >
                        {selected.kind === 'Department' ? 'Dept' : 'Sec'}
                    </span>
                )}
                <ChevronDown
                    className="w-3.5 h-3.5 shrink-0 transition-transform duration-150"
                    style={{ color: t.subColor, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </button>

            {open && (
                <div
                    className="absolute top-full left-0 mt-1 z-50 rounded-xl overflow-hidden w-full min-w-[220px]"
                    style={{
                        background: isDark ? 'rgba(10,18,38,0.98)' : 'rgba(255,255,255,0.99)',
                        border: `1px solid ${isDark ? 'rgba(99,155,255,0.30)' : 'rgba(37,99,235,0.20)'}`,
                        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.50)' : '0 8px 32px rgba(0,48,135,0.15)',
                        maxHeight: '260px',
                        overflowY: 'auto',
                    }}
                >
                    {mergedList.map((item, idx) => {
                        const isSelected = item.id === value;
                        return (
                            <button
                                key={`${item.kind}-${item.id}`}
                                type="button"
                                className="w-full text-left px-4 py-2 text-xs transition-all duration-100 flex items-center justify-between gap-3"
                                style={{
                                    color: isSelected ? (isDark ? '#93c5fd' : '#1d4ed8') : (isDark ? '#e2e8f0' : '#0f172a'),
                                    background: isSelected ? (isDark ? 'rgba(37,99,235,0.20)' : 'rgba(219,234,254,0.80)') : 'transparent',
                                    fontWeight: isSelected ? 600 : 400,
                                    borderBottom: idx < mergedList.length - 1
                                        ? `1px solid ${isDark ? 'rgba(99,155,255,0.10)' : 'rgba(37,99,235,0.08)'}`
                                        : 'none',
                                }}
                                onClick={() => { onChange(item.id, item.kind); setOpen(false); }}
                                onMouseEnter={e => {
                                    if (!isSelected)
                                        (e.currentTarget as HTMLElement).style.background = isDark
                                            ? 'rgba(59,130,246,0.12)'
                                            : 'rgba(219,234,254,0.50)';
                                }}
                                onMouseLeave={e => {
                                    if (!isSelected)
                                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                                }}
                            >
                                <span className="truncate">{item.name}</span>
                                <span
                                    className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md shrink-0"
                                    style={{
                                        background: item.kind === 'Department'
                                            ? (isDark ? 'rgba(37,99,235,0.25)' : 'rgba(219,234,254,0.90)')
                                            : (isDark ? 'rgba(5,150,105,0.25)' : 'rgba(209,250,229,0.90)'),
                                        color: item.kind === 'Department'
                                            ? (isDark ? '#93c5fd' : '#1d4ed8')
                                            : (isDark ? '#6ee7b7' : '#047857'),
                                    }}
                                >
                                    {item.kind === 'Department' ? 'Dept' : 'Sec'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// AccountSelect — inline dropdown for the Transfer to Account column.
// `disabledAccountId` is the account the item already belongs to;
// that option is rendered disabled so the user can't pick the same account.
// ─────────────────────────────────────────────────────────────────────────────
function AccountSelect({
    value,
    onChange,
    accounts,
    disabledAccountId,
    t,
    isDark,
}: {
    value: string;
    onChange: (val: string) => void;
    accounts: Account[];
    disabledAccountId: number | null;
    t: typeof T.dark;
    isDark: boolean;
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-lg text-[11px] font-semibold border outline-none cursor-pointer transition-all duration-150"
                style={{
                    background: t.inputBg,
                    borderColor: t.inputBorder,
                    color: value ? t.inputText : t.cellMuted,
                    minWidth: '160px',
                }}
            >
                <option value="">— select account —</option>
                {accounts.map(a => {
                    const isCurrent = a.id === disabledAccountId;
                    return (
                        <option key={a.id} value={String(a.id)} disabled={isCurrent}>
                            {isCurrent ? '⊘ ' : ''}[{a.account_code}] {a.account_name}
                        </option>
                    );
                })}
            </select>
            <ChevronDown
                className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: isDark ? '#7eb8ff' : '#2d4a7a' }}
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner component
// ─────────────────────────────────────────────────────────────────────────────
function BudgetTransferAccountInner({
    t, isDark, units, school_years,
}: {
    t: typeof T.dark;
    isDark: boolean;
    units: Unit[];
    school_years: string[];
}) {
    const { toasts, push, dismiss } = useToast();

    const departments: DeptOption[] = units
        .filter(u => u.kind === 'Department')
        .map(u => ({ id: String(u.id), name: u.name, kind: 'Department' }));
    const sections: DeptOption[] = units
        .filter(u => u.kind === 'Section')
        .map(u => ({ id: String(u.id), name: u.name, kind: 'Section' }));

    const firstUnit = units[0] ?? null;
    const [selectedId,         setSelectedId]         = useState<string>(firstUnit ? String(firstUnit.id) : '');
    const [selectedKind,       setSelectedKind]       = useState<'Department' | 'Section'>(firstUnit?.kind ?? 'Department');
    const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>(school_years[0] ?? '');
    const [reportOption,       setReportOption]       = useState<ReportOption>('Detailed');
    const [items,              setItems]              = useState<BudgetTransferItem[]>([]);
    const [accounts,           setAccounts]           = useState<Account[]>([]);
    const [loading,            setLoading]            = useState(false);
    const [saving,             setSaving]             = useState(false);

    // Per-row account selection: item.id → chosen account id string
    const [transferSelections, setTransferSelections] = useState<Record<number, string>>({});

    // Per-row remarks edits: item.id → current remarks string
    const [remarksEdits, setRemarksEdits] = useState<Record<number, string>>({});

    // Derived totals
    const totalProposed    = items.reduce((s, r) => s + r.amountProposed, 0);
    const totalForApproval = items.reduce((s, r) => s + r.amountProposed, 0);
    const totalApproved    = items.reduce((s, r) => s + (r.amountApproved ?? 0), 0);

    // Count rows that have a non-empty account selection — drives save button state
    const selectionCount       = Object.values(transferSelections).filter(Boolean).length;
    const hasPendingSelections = selectionCount > 0;

    // ── Requery ──────────────────────────────────────────────────────────────
    async function handleRequery() {
        if (!selectedId || !selectedSchoolYear) return;
        setLoading(true);
        setItems([]);
        setAccounts([]);
        setTransferSelections({});
        setRemarksEdits({});
        try {
            const { data } = await financeSvc.get('/abms/budget-transfer-account/items', {
                params: {
                    kind:        selectedKind,
                    school_year: selectedSchoolYear,
                    unit_id:     selectedId,
                },
            });

            const rawItems    = data?.items    ?? [];
            const rawAccounts = data?.accounts ?? [];

            const rows: BudgetTransferItem[] = rawItems.map((r: any) => ({
                id:                   r.id,
                subAccountId:         r.sub_account_id,
                mainAccountCode:      r.main_account_code        ?? '',
                subAccountCode:       r.sub_account_code         ?? '',
                subAccountName:       r.sub_account_name         ?? '',
                currentRootAccountId: r.current_root_account_id  ?? null,
                description:          r.description              ?? '—',
                amountProposed:       Number(r.amount            ?? 0),
                amountApproved:       r.approved_total_cost != null ? Number(r.approved_total_cost) : null,
                remarks:              r.remarks                  ?? '',
                transferToAccount:    r.transfer_to_account      ?? null,
                status:               r.status                   ?? 'PENDING',
                updatedAt:            r.updated_at               ?? null,
            }));

            const accountList: Account[] = rawAccounts.map((a: any) => ({
                id:           a.id,
                account_code: a.account_code,
                account_name: a.account_name,
            }));

            // Pre-populate account selections from already-persisted transfer_to_account values
            const initialSelections: Record<number, string> = {};
            rows.forEach(row => {
                if (row.transferToAccount) {
                    initialSelections[row.id] = String(row.transferToAccount);
                }
            });

            // Pre-populate remarks from existing DB values
            const initialRemarks: Record<number, string> = {};
            rows.forEach(row => {
                initialRemarks[row.id] = row.remarks ?? '';
            });

            setItems(rows);
            setAccounts(accountList);
            setTransferSelections(initialSelections);
            setRemarksEdits(initialRemarks);

            if (rows.length === 0) {
                push('info', 'No items found for the selected unit and school year.');
            } else {
                push('success', `Loaded ${rows.length} item${rows.length !== 1 ? 's' : ''} successfully.`);
            }
        } catch {
            push('error', 'Failed to fetch items. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    // ── Save ─────────────────────────────────────────────────────────────────
    async function handleSave() {
        // Only include rows that have a non-empty account selection
        const transfers = Object.entries(transferSelections)
            .filter(([, accountId]) => Boolean(accountId))
            .map(([itemId, accountId]) => ({
                item_id:    Number(itemId),
                account_id: Number(accountId),
                remarks:    remarksEdits[Number(itemId)] ?? '',
            }));

        // Zod client-side validation
        const parsed = saveSchema.safeParse({ transfers });
        if (!parsed.success) {
            push('error', parsed.error.errors[0]?.message ?? 'Validation failed.');
            return;
        }

        setSaving(true);
        try {
            const { data } = await financeSvc.post(
                '/abms/budget-transfer-account/save',
                parsed.data satisfies SavePayload,
            );
            push('success', data?.message ?? `Saved ${transfers.length} transfer${transfers.length !== 1 ? 's' : ''} successfully.`);
            // Re-fetch so the table reflects the latest state, newest items first.
            await handleRequery();
        } catch (err: any) {
            const serverMsg = err?.response?.data?.message;
            push('error', serverMsg ?? 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    function handleTransferChange(itemId: number, accountId: string) {
        setTransferSelections(prev => ({ ...prev, [itemId]: accountId }));
    }

    function handleRemarksChange(itemId: number, value: string) {
        setRemarksEdits(prev => ({ ...prev, [itemId]: value }));
    }

    function handlePreview() {
        // TODO: wire preview/print logic
    }

    return (
        <>
            <ToastStack toasts={toasts} dismiss={dismiss} />

            <div style={{ fontFamily: "'Sora', 'DM Sans', sans-serif" }}>

                {/* ── Page title ──────────────────────────────────────── */}
                <div className="flex items-center gap-2.5 mb-5">
                    <ArrowRightLeft className="w-5 h-5" style={{ color: t.cellBlue }} />
                    <div>
                        <h1 className="text-lg font-bold tracking-tight" style={{ color: t.titleColor }}>
                            Budget Transfer Account
                        </h1>
                        <p className="text-[10px] tracking-widest uppercase" style={{ color: t.subColor }}>
                            Manage and review budget transfer entries
                        </p>
                    </div>
                </div>

                {/* ── Card ────────────────────────────────────────────── */}
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}
                >
                    {/* ── Card header ─────────────────────────────────── */}
                    <div
                        className="px-5 py-4 flex flex-wrap items-end gap-4"
                        style={{ background: t.cardHeaderBg, borderBottom: `1px solid ${t.cardHeaderBorder}` }}
                    >
                        {/* Department / Section */}
                        <div className="flex-1 min-w-[220px]">
                            <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: t.subColor }}>
                                Department / Section
                            </label>
                            <DeptSelect
                                value={selectedId}
                                onChange={(id, kind) => { setSelectedId(id); setSelectedKind(kind); }}
                                departments={departments}
                                sections={sections}
                                t={t}
                                isDark={isDark}
                            />
                        </div>

                        {/* School Year */}
                        <div className="min-w-[130px]">
                            <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: t.subColor }}>
                                School Year
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedSchoolYear}
                                    onChange={e => setSelectedSchoolYear(e.target.value)}
                                    className="w-full appearance-none pl-3 pr-9 py-2.5 rounded-xl text-xs font-semibold border outline-none cursor-pointer"
                                    style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText }}
                                >
                                    {school_years.length === 0 && <option value="">—</option>}
                                    {school_years.map(sy => <option key={sy} value={sy}>{sy}</option>)}
                                </select>
                                <ChevronDown
                                    className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ color: t.subColor }}
                                />
                            </div>
                        </div>

                        {/* Requery */}
                        <button
                            onClick={handleRequery}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-150"
                            style={{
                                background: 'rgba(37,99,235,0.85)', color: '#ffffff',
                                border: '1px solid rgba(99,155,255,0.70)',
                                cursor: loading ? 'wait' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {loading
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Querying…</>
                                : <><RefreshCw className="w-3.5 h-3.5" />Requery</>
                            }
                        </button>

                        {/* Divider */}
                        <div className="w-px h-8 self-center" style={{ background: t.cardHeaderBorder }} />

                        {/* Report Option */}
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: t.subColor }}>
                                Report Option
                            </label>
                            <div className="flex items-center gap-1 p-0.5 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
                                {(['Detailed', 'Summary'] as ReportOption[]).map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setReportOption(opt)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-150"
                                        style={{
                                            background: reportOption === opt ? 'rgba(37,99,235,0.80)' : 'transparent',
                                            color: reportOption === opt ? '#ffffff' : t.cellMuted,
                                            border: reportOption === opt ? '1px solid rgba(99,155,255,0.60)' : '1px solid transparent',
                                        }}
                                    >
                                        <FileText className="w-3 h-3" />
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        <button
                            onClick={handlePreview}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-150"
                            style={{
                                background: 'rgba(5,150,105,0.18)', color: '#4ade80',
                                border: '1px solid rgba(74,222,128,0.35)',
                                cursor: 'pointer', whiteSpace: 'nowrap',
                            }}
                        >
                            <Eye className="w-3.5 h-3.5" />
                            Preview
                        </button>

                        {/* Save — lights up when at least one row has a selection */}
                        <button
                            onClick={handleSave}
                            disabled={!hasPendingSelections || saving}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-150 ml-auto"
                            style={{
                                background: hasPendingSelections ? 'rgba(37,99,235,0.85)' : 'rgba(37,99,235,0.08)',
                                color:      hasPendingSelections ? '#ffffff'               : '#4b6a9b',
                                border:     hasPendingSelections ? '1px solid rgba(99,155,255,0.70)' : '1px solid rgba(99,155,255,0.12)',
                                cursor:  (!hasPendingSelections || saving) ? 'not-allowed' : 'pointer',
                                opacity: saving ? 0.7 : 1,
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s',
                            }}
                        >
                            {saving
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>
                                : <>
                                    <Save className="w-3.5 h-3.5" />
                                    Save{hasPendingSelections ? ` (${selectionCount})` : ''}
                                  </>
                            }
                        </button>
                    </div>

                    {/* ── Table ───────────────────────────────────────── */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr style={{ background: t.tableHeadBg }}>
                                    {[
                                        { label: '#',                   width: '48px'  },
                                        { label: 'Description',         width: 'auto'  },
                                        { label: 'Amount (Proposed)',   width: '150px' },
                                        { label: 'Amount (Approved)',   width: '150px' },
                                        { label: 'Remarks',             width: '200px' },
                                        { label: 'Transfer to Account', width: '220px' },
                                    ].map(({ label, width }) => (
                                        <th
                                            key={label}
                                            className="px-4 py-2.5 text-left font-bold uppercase tracking-widest whitespace-nowrap"
                                            style={{
                                                fontSize: '9px', color: t.tableHeadText,
                                                borderBottom: `2px solid ${t.tableHeadBorder}`,
                                                borderRight: `1px solid ${t.tableHeadBorder}`,
                                                width,
                                            }}
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-xs" style={{ color: t.cellMuted }}>
                                            {loading
                                                ? 'Fetching items…'
                                                : 'Select a department / section and school year, then click Requery.'
                                            }
                                        </td>
                                    </tr>
                                ) : items.map((row, i) => (
                                    <tr
                                        key={row.id}
                                        style={{
                                            background: i % 2 === 0 ? t.rowEvenBg : t.rowOddBg,
                                            borderBottom: `1px solid ${t.rowBorder}`,
                                            borderLeft: '3px solid transparent',
                                        }}
                                    >
                                        {/* # */}
                                        <td className="px-4 py-2.5" style={{ borderRight: `1px solid ${t.rowBorder}` }}>
                                            <span
                                                className="px-2 py-0.5 rounded-md font-mono font-bold"
                                                style={{ fontSize: '10px', background: t.pillBg, color: t.pillText, border: `1px solid ${t.pillBorder}` }}
                                            >
                                                {i + 1}
                                            </span>
                                        </td>

                                        {/* Description */}
                                        <td className="px-4 py-2.5" style={{ color: t.cellText, borderRight: `1px solid ${t.rowBorder}` }}>
                                            {(row.mainAccountCode || row.subAccountCode) && (
                                                <span
                                                    className="inline-block mr-2 px-1.5 py-0.5 rounded font-mono font-bold text-[9px]"
                                                    style={{ background: t.pillBg, color: t.pillText, border: `1px solid ${t.pillBorder}` }}
                                                >
                                                    {[row.mainAccountCode, row.subAccountCode].filter(Boolean).join(' - ')}
                                                </span>
                                            )}
                                            <span className="font-semibold">{row.description}</span>
                                        </td>

                                        {/* Amount Proposed */}
                                        <td
                                            className="px-4 py-2.5 text-right font-bold"
                                            style={{
                                                color: t.cellGreen,
                                                fontFamily: "'JetBrains Mono', monospace",
                                                fontVariantNumeric: 'tabular-nums',
                                                borderRight: `1px solid ${t.rowBorder}`,
                                            }}
                                        >
                                            {fmt(row.amountProposed)}
                                        </td>

                                        {/* Amount Approved */}
                                        <td
                                            className="px-4 py-2.5 text-right font-bold"
                                            style={{
                                                color: row.amountApproved != null ? t.cellBlue : t.cellMuted,
                                                fontFamily: "'JetBrains Mono', monospace",
                                                fontVariantNumeric: 'tabular-nums',
                                                borderRight: `1px solid ${t.rowBorder}`,
                                            }}
                                        >
                                            {row.amountApproved != null ? fmt(row.amountApproved) : '—'}
                                        </td>

                                        {/* Remarks — editable input */}
                                        <td className="px-3 py-2" style={{ borderRight: `1px solid ${t.rowBorder}` }}>
                                            <input
                                                type="text"
                                                value={remarksEdits[row.id] ?? ''}
                                                onChange={e => handleRemarksChange(row.id, e.target.value)}
                                                placeholder="Add remarks…"
                                                className="w-full px-2.5 py-1.5 rounded-lg text-[11px] border outline-none transition-all duration-150"
                                                style={{
                                                    background:  t.inputBg,
                                                    borderColor: t.inputBorder,
                                                    color:       t.inputText,
                                                    minWidth:    '140px',
                                                }}
                                            />
                                        </td>

                                        {/* Transfer to Account */}
                                        <td className="px-3 py-2" style={{ color: t.cellText }}>
                                            <AccountSelect
                                                value={transferSelections[row.id] ?? ''}
                                                onChange={val => handleTransferChange(row.id, val)}
                                                accounts={accounts}
                                                disabledAccountId={row.currentRootAccountId}
                                                t={t}
                                                isDark={isDark}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Summary footer ──────────────────────────────── */}
                    <div
                        className="px-5 py-3 flex flex-wrap items-center gap-4"
                        style={{ background: t.summaryBg, borderTop: `2px solid ${t.summaryBorder}` }}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.summaryLabelText }}>
                            {items.length} item{items.length !== 1 ? 's' : ''}
                        </span>

                        <div className="flex flex-wrap items-center gap-4 ml-auto">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: t.summaryLabelText }}>
                                    Total Proposed Budget
                                </span>
                                <div
                                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-right"
                                    style={{
                                        background: t.summaryValueBg, border: `1px solid ${t.summaryValueBorder}`,
                                        color: t.cellGreen, fontFamily: "'JetBrains Mono', monospace",
                                        fontVariantNumeric: 'tabular-nums', minWidth: '140px',
                                    }}
                                >
                                    {fmt(totalProposed)}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: t.summaryLabelText }}>
                                    Total Amount For Approval
                                </span>
                                <div
                                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-right"
                                    style={{
                                        background: t.summaryValueBg, border: `1px solid ${t.summaryValueBorder}`,
                                        color: t.cellBlue, fontFamily: "'JetBrains Mono', monospace",
                                        fontVariantNumeric: 'tabular-nums', minWidth: '140px',
                                    }}
                                >
                                    {fmt(totalForApproval)}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: t.summaryLabelText }}>
                                    Total Approved Budget
                                </span>
                                <div
                                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-right"
                                    style={{
                                        background: t.summaryValueBg,
                                        border: `1px solid ${totalApproved > 0 ? 'rgba(52,211,153,0.35)' : t.summaryValueBorder}`,
                                        color: totalApproved > 0 ? t.cellBlue : t.cellMuted,
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontVariantNumeric: 'tabular-nums', minWidth: '140px',
                                    }}
                                >
                                    {totalApproved > 0 ? fmt(totalApproved) : '—'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}