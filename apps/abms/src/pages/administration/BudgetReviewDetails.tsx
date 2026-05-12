import { useState, useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { financeSvc } from '@repo/axios-config';
import AdamsonBudgetLayout from '../../layouts/Screenlayout';
import { FileSpreadsheet, ChevronDown, Clock, CheckCircle2, XCircle, ArrowLeft, Save, Loader2, History } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — mirrors BudgetReview / ScreenLayout palette
// ─────────────────────────────────────────────────────────────────────────────
const T = {
    dark: {
        titleColor: '#f0f6ff', subColor: '#a8c4f0',
        cardBg: 'rgba(11,19,40,0.96)', cardBorder: 'rgba(100,160,255,0.30)', cardShadow: '0 4px 40px rgba(37,99,235,0.22)',
        cardHeaderBg: 'rgba(7,14,32,0.98)', cardHeaderBorder: 'rgba(100,160,255,0.22)',
        inputBg: 'rgba(13,26,58,0.85)', inputBorder: 'rgba(100,160,255,0.32)', inputText: '#e8f0fe',
        tableHeadBg: 'rgba(10,22,50,0.90)', tableHeadText: '#7eb8ff', tableHeadBorder: 'rgba(100,160,255,0.26)',
        rowBorder: 'rgba(100,160,255,0.11)', rowEvenBg: 'rgba(13,26,58,0.32)', rowOddBg: 'transparent',
        rowHoverBg: 'rgba(59,130,246,0.13)', rowSelectedBg: 'rgba(37,99,235,0.18)',
        cellText: '#ddeeff', cellMuted: '#7a9cc4', cellGreen: '#4ade80', cellBlue: '#60a5fa',
        pillBg: 'rgba(59,130,246,0.25)', pillText: '#93c5fd', pillBorder: 'rgba(100,160,255,0.45)',
        openBg: 'rgba(37,99,235,0.25)', openText: '#7eb8ff', openBorder: 'rgba(100,160,255,0.45)',
        closedBg: 'rgba(100,116,139,0.28)', closedText: '#b0c4de', closedBorder: 'rgba(100,116,139,0.40)',
        approvedBg: 'rgba(5,150,105,0.22)', approvedText: '#4ade80', approvedBorder: 'rgba(74,222,128,0.42)',
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
        rowHoverBg: 'rgba(210,228,255,0.75)', rowSelectedBg: 'rgba(210,228,255,0.55)',
        cellText: '#0a1628', cellMuted: '#2d4a7a', cellGreen: '#047857', cellBlue: '#1440a8',
        pillBg: 'rgba(37,99,235,0.14)', pillText: '#1440a8', pillBorder: 'rgba(37,99,235,0.35)',
        openBg: 'rgba(210,228,255,0.95)', openText: '#1440a8', openBorder: 'rgba(37,99,235,0.35)',
        closedBg: 'rgba(226,232,240,0.90)', closedText: '#334155', closedBorder: 'rgba(100,116,139,0.35)',
        approvedBg: 'rgba(187,247,208,0.90)', approvedText: '#065f46', approvedBorder: 'rgba(5,150,105,0.40)',
        summaryBg: 'rgba(240,246,255,0.99)', summaryBorder: 'rgba(37,99,235,0.22)',
        summaryLabelText: '#2d4a7a', summaryValueBg: 'rgba(232,242,255,0.95)', summaryValueBorder: 'rgba(37,99,235,0.20)',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface BudgetItem {
    id: number;
    particulars: string;
    remarks: string;
    amount: number;
    approvedAmount: number | null;
    status: 'PENDING' | 'APPROVED' | 'DISAPPROVED';
    uom: string;
    unitCost: number;
    qty: number;
}

interface SubAccountOption {
    id: string | number;
    name: string;
}

interface NavState {
    mainAccountId:       number;
    mainAccountName:     string;
    unitId:              string;
    unitName:            string;
    unitKind:            'Department' | 'Section';
    current_school_year: string;
    proposal_school_year: string;
}

const fmt = (n: number) =>
    n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─────────────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status, t }: { status: string; t: typeof T.dark }) {
    const cfg =
        status === 'PENDING'
            ? { bg: t.openBg,     text: t.openText,     border: t.openBorder,     Icon: Clock        }
            : status === 'APPROVED'
            ? { bg: t.approvedBg, text: t.approvedText, border: t.approvedBorder, Icon: CheckCircle2 }
            : { bg: t.closedBg,   text: t.closedText,   border: t.closedBorder,   Icon: XCircle      };

    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-widest uppercase"
            style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
        >
            <cfg.Icon className="w-3 h-3" />
            {status}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Select wrapper
// ─────────────────────────────────────────────────────────────────────────────
function StyledSelect({
    label, value, options, onChange, t,
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
    t: typeof T.dark;
}) {
    return (
        <div>
            <label
                className="block text-[9px] font-bold uppercase tracking-widest mb-1.5"
                style={{ color: t.subColor }}
            >
                {label}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full appearance-none pl-3 pr-9 py-2.5 rounded-xl text-xs font-semibold border outline-none cursor-pointer"
                    style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText }}
                >
                    {options.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown
                    className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: t.subColor }}
                />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-row editable draft — keyed by item id
// ─────────────────────────────────────────────────────────────────────────────
interface ItemDraft {
    approvedAmount: string;          // raw string from input
    remarks:        string;
    status:         BudgetItem['status'];
}

type DraftMap = Record<number, ItemDraft>;

function makeDraft(item: BudgetItem): ItemDraft {
    return {
        approvedAmount: item.approvedAmount != null ? String(item.approvedAmount) : '',
        remarks:        item.remarks,
        status:         item.status,
    };
}


export default function BudgetReviewDetails() {
    const router   = useRouter();
    const navState = (router.state.location.state ?? {}) as Partial<NavState>;

    return (
        <AdamsonBudgetLayout>
            {(isDark: boolean) => {
                const t = isDark ? T.dark : T.light;
                return <BudgetReviewDetailsInner t={t} navState={navState} />;
            }}
        </AdamsonBudgetLayout>
    );
}

function BudgetReviewDetailsInner({ t, navState }: { t: typeof T.dark; navState: Partial<NavState> }) {
    const router = useRouter();

    const {
        mainAccountId,
        mainAccountName   = '—',
        unitId,
        unitName          = '—',
        unitKind,
        current_school_year   = '—',
        proposal_school_year  = '—',
    } = navState;

    // ── Sub-account list fetched from API ─────────────────────────────────────
    const [subAccounts,  setSubAccounts]  = useState<SubAccountOption[]>([]);
    const [subAccount,   setSubAccount]   = useState<SubAccountOption | null>(null);
    const [items,        setItems]        = useState<BudgetItem[]>([]);
    const [loadingSubs,  setLoadingSubs]  = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    const [selectedItem, setSelectedItem] = useState<BudgetItem | null>(null);

    // ── Editable drafts + dirty tracking ─────────────────────────────────────
    const [drafts,   setDrafts]   = useState<DraftMap>({});
    const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
    const [saving,   setSaving]   = useState(false);
    const [toast,    setToast]    = useState<{ visible: boolean; type: 'success' | 'error'; message: string }>({
        visible: false, type: 'success', message: '',
    });

    // ── Previous-year comparison panel ────────────────────────────────────────
    const [showPrevious,  setShowPrevious]  = useState(false);
    const [prevItems,     setPrevItems]     = useState<BudgetItem[]>([]);
    const [loadingPrev,   setLoadingPrev]   = useState(false);

    function showToast(type: 'success' | 'error', message: string) {
        setToast({ visible: true, type, message });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3500);
    }

    // Fetch sub-accounts for this main account + unit
    useEffect(() => {
        if (!mainAccountId || !unitId) return;
        setLoadingSubs(true);
        financeSvc
            .get('/abms/budget-review/sub-accounts', {
                params: {
                    main_account_id: mainAccountId,
                    kind:            unitKind,
                    ...(unitKind === 'Department' ? { department_id: unitId } : { section_id: unitId }),
                    current_school_year,
                    proposed_school_year: proposal_school_year,
                },
            })
            .then(({ data }) => {
                const list: SubAccountOption[] = data ?? [];
                setSubAccounts(list);
                setSubAccount(list[0] ?? null);
            })
            .catch(console.error)
            .finally(() => setLoadingSubs(false));
    }, [mainAccountId, unitId, unitKind, current_school_year, proposal_school_year]);

    // Fetch items whenever the selected sub-account changes
    useEffect(() => {
        if (!subAccount) { setItems([]); return; }
        setLoadingItems(true);
        financeSvc
            .get('/abms/budget-review/items', {
                params: {
                    sub_account_id: subAccount.id,
                    kind:           unitKind,
                    ...(unitKind === 'Department' ? { department_id: unitId } : { section_id: unitId }),
                    current_school_year,
                    proposed_school_year: proposal_school_year,
                },
            })
            .then(({ data }) => {
                const rows: BudgetItem[] = (data ?? []).map((r: any, i: number) => {
                    const rawStatus = r.status ?? 0;
                    const statusMap: Record<string | number, BudgetItem['status']> = {
                        0: 'PENDING', 1: 'APPROVED', 2: 'DISAPPROVED',
                        'PENDING': 'PENDING', 'APPROVED': 'APPROVED', 'DISAPPROVED': 'DISAPPROVED',
                    };
                    return {
                        id:          r.id        ?? i + 1,
                        particulars: r.particulars ?? r.description ?? '—',
                        remarks:     r.remarks    ?? '',
                        amount:         Number(r.amount     ?? r.total_cost ?? 0),
                        approvedAmount: r.approved_total_cost != null ? Number(r.approved_total_cost) : null,
                        status:         statusMap[rawStatus] ?? 'PENDING',
                        uom:         r.uom       ?? '',
                        unitCost:    Number(r.unit_cost  ?? 0),
                        qty:         Number(r.quantity   ?? 0),
                    };
                });
                setItems(rows);
                setSelectedItem(rows[0] ?? null);
                // Seed drafts from freshly loaded data, clear dirty tracking
                const seed: DraftMap = {};
                rows.forEach(r => { seed[r.id] = makeDraft(r); });
                setDrafts(seed);
                setDirtyIds(new Set());
            })
            .catch(console.error)
            .finally(() => setLoadingItems(false));
    }, [subAccount]);

    const total = items.reduce((s, r) => s + r.amount, 0);
    const totalApproved = items.reduce((s, r) => {
        const val = parseFloat(drafts[r.id]?.approvedAmount ?? '');
        return s + (isNaN(val) ? 0 : val);
    }, 0);

    // ── Draft helpers ─────────────────────────────────────────────────────────
    function patchDraft(id: number, patch: Partial<ItemDraft>) {
        setDrafts(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
        setDirtyIds(prev => new Set(prev).add(id));
    }

    function handleApprovedChange(id: number, raw: string) {
        const trimmed = raw.trim();
        const hasValue = trimmed !== '' && !isNaN(Number(trimmed)) && Number(trimmed) >= 0;
        patchDraft(id, {
            approvedAmount: raw,
            status:         hasValue ? 'APPROVED' : 'PENDING',
        });
    }

    function handleRemarksChange(id: number, value: string) {
        patchDraft(id, { remarks: value });
    }

    function handleDisapprove(id: number) {
        patchDraft(id, { approvedAmount: '', status: 'DISAPPROVED' });
    }

    // ── Save (dirty rows only) ────────────────────────────────────────────────
    async function handleSave() {
        if (dirtyIds.size === 0 || saving) return;
        setSaving(true);

        const statusToNum: Record<BudgetItem['status'], number> = {
            PENDING: 0, APPROVED: 1, DISAPPROVED: 2,
        };

        const payload = Array.from(dirtyIds).map(id => {
            const d = drafts[id];
            const approvedVal = d.approvedAmount.trim();
            return {
                id,
                approved_total_cost: approvedVal === '' ? null : Number(approvedVal),
                remarks:             d.remarks,
                status:              statusToNum[d.status],
            };
        });

        try {
            await financeSvc.put('/abms/budget-review/save-items', { items: payload });
            // Commit drafts back into items state and clear dirty
            setItems(prev => prev.map(item => {
                if (!dirtyIds.has(item.id)) return item;
                const d = drafts[item.id];
                const approvedVal = d.approvedAmount.trim();
                return {
                    ...item,
                    approvedAmount: approvedVal === '' ? null : Number(approvedVal),
                    remarks:        d.remarks,
                    status:         d.status,
                };
            }));
            setDirtyIds(new Set());
            showToast('success', 'Changes saved successfully.');
        } catch (err) {
            console.error('Save failed', err);
            showToast('error', 'Save failed. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    function handleSubChange(id: string) {
        const found = subAccounts.find(s => String(s.id) === id) ?? null;
        setSubAccount(found);
        setSelectedItem(null);
        setPrevItems([]);   // clear stale previous data when sub-account changes
    }

    // Fetch previous-year items whenever the panel is opened or sub-account changes
    useEffect(() => {
        if (!showPrevious || !subAccount || !unitId || !unitKind) {
            if (!showPrevious) setPrevItems([]);
            return;
        }
        setLoadingPrev(true);
        financeSvc
            .get('/abms/budget-review/previous-items', {
                params: {
                    sub_account_id: subAccount.id,
                    kind:           unitKind,
                    ...(unitKind === 'Department' ? { department_id: unitId } : { section_id: unitId }),
                    current_school_year,
                    proposed_school_year: proposal_school_year,
                },
            })
            .then(({ data }) => {
                const rows: BudgetItem[] = (data ?? []).map((r: any, i: number) => {
                    const statusMap: Record<string, BudgetItem['status']> = {
                        PENDING: 'PENDING', APPROVED: 'APPROVED', DISAPPROVED: 'DISAPPROVED',
                    };
                    return {
                        id:             r.id             ?? i + 1,
                        particulars:    r.particulars    ?? r.description ?? '—',
                        remarks:        r.remarks        ?? '',
                        amount:         Number(r.amount  ?? r.total_cost  ?? 0),
                        approvedAmount: r.approved_total_cost != null ? Number(r.approved_total_cost) : null,
                        status:         statusMap[r.status] ?? 'PENDING',
                        uom:            r.uom            ?? '',
                        unitCost:       Number(r.unit_cost   ?? 0),
                        qty:            Number(r.quantity    ?? 0),
                    };
                });
                setPrevItems(rows);
            })
            .catch(console.error)
            .finally(() => setLoadingPrev(false));
    }, [showPrevious, subAccount]);

    return (
        <div style={{ fontFamily: "'Sora', 'DM Sans', sans-serif" }}>

            {/* ── Toast notification ────────────────────────────── */}
            <div
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 18px',
                    borderRadius: '14px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
                    minWidth: '240px',
                    maxWidth: '340px',
                    background: toast.type === 'success'
                        ? 'rgba(5,150,105,0.96)'
                        : 'rgba(220,38,38,0.96)',
                    border: `1px solid ${toast.type === 'success' ? 'rgba(74,222,128,0.50)' : 'rgba(248,113,113,0.50)'}`,
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.01em',
                    backdropFilter: 'blur(8px)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                    opacity: toast.visible ? 1 : 0,
                    transform: toast.visible ? 'translateY(0)' : 'translateY(12px)',
                    pointerEvents: toast.visible ? 'auto' : 'none',
                }}
            >
                {toast.type === 'success'
                    ? <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
                    : <XCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                }
                {toast.message}
            </div>

            {/* Page title */}
            <div className="flex items-center gap-2.5 mb-5">
                <button
                    onClick={() => router.history.back()}
                    className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                    style={{ background: t.cardHeaderBg, border: `1px solid ${t.cardHeaderBorder}` }}
                >
                    <ArrowLeft className="w-4 h-4" style={{ color: t.cellBlue }} />
                </button>
                <FileSpreadsheet className="w-5 h-5" style={{ color: t.cellBlue }} />
                <div>
                    <h1 className="text-lg font-bold tracking-tight" style={{ color: t.titleColor }}>
                        {mainAccountName}
                    </h1>
                    <p className="text-[10px] tracking-widest uppercase" style={{ color: t.subColor }}>
                        Budget Review Details &mdash; {unitName} &mdash; SY {current_school_year} / {proposal_school_year}
                    </p>
                </div>
            </div>

            {/* ── Main layout: side-by-side when comparison is open ─── */}
            <div className={showPrevious ? 'flex gap-4 items-start' : ''}>

            {/* ── Previous year read-only card ──────────────────────── */}
            {showPrevious && (() => {
                const prevTotal         = prevItems.reduce((s, r) => s + r.amount, 0);
                const prevTotalApproved = prevItems.reduce((s, r) => s + (r.approvedAmount ?? 0), 0);
                return (
                    <div
                        className="rounded-2xl overflow-hidden flex-shrink-0"
                        style={{
                            width: '38%',
                            minWidth: '320px',
                            background: t.cardBg,
                            border: `1px solid ${t.cardBorder}`,
                            boxShadow: t.cardShadow,
                            opacity: loadingPrev ? 0.6 : 1,
                            transition: 'opacity 0.2s',
                        }}
                    >
                        {/* Previous card header */}
                        <div
                            className="px-5 py-4 flex items-center justify-between gap-3"
                            style={{ background: t.cardHeaderBg, borderBottom: `1px solid ${t.cardHeaderBorder}` }}
                        >
                            <div>
                                <span
                                    className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md mb-1"
                                    style={{ background: 'rgba(245,158,11,0.18)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)' }}
                                >
                                    <History className="w-3 h-3" />
                                    Previous Year
                                </span>
                                <p className="text-[11px] font-bold" style={{ color: t.titleColor }}>
                                    SY {current_school_year}
                                </p>
                                <p className="text-[9px] uppercase tracking-widest" style={{ color: t.subColor }}>
                                    {subAccount?.name ?? '—'} · Read-only
                                </p>
                            </div>
                            {loadingPrev && <Loader2 className="w-4 h-4 animate-spin" style={{ color: t.cellBlue }} />}
                        </div>

                        {/* Previous card table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr style={{ background: t.tableHeadBg }}>
                                        {['#', 'Description', 'Amount', 'Approved', 'Status'].map(h => (
                                            <th
                                                key={h}
                                                className="px-3 py-2.5 text-left font-bold uppercase tracking-widest whitespace-nowrap"
                                                style={{
                                                    fontSize: '9px',
                                                    color: '#fbbf24',
                                                    borderBottom: `2px solid ${t.tableHeadBorder}`,
                                                    borderRight: `1px solid ${t.tableHeadBorder}`,
                                                }}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {prevItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-xs" style={{ color: t.cellMuted }}>
                                                {loadingPrev ? 'Fetching previous year items…' : 'No items found for previous year.'}
                                            </td>
                                        </tr>
                                    ) : prevItems.map((row, i) => (
                                        <tr
                                            key={row.id}
                                            style={{
                                                background: i % 2 === 0 ? t.rowEvenBg : t.rowOddBg,
                                                borderBottom: `1px solid ${t.rowBorder}`,
                                                borderLeft: '3px solid transparent',
                                            }}
                                        >
                                            <td className="px-3 py-2" style={{ borderRight: `1px solid ${t.rowBorder}` }}>
                                                <span
                                                    className="px-2 py-0.5 rounded-md font-mono font-bold"
                                                    style={{
                                                        fontSize: '10px',
                                                        background: 'rgba(245,158,11,0.15)',
                                                        color: '#fbbf24',
                                                        border: '1px solid rgba(245,158,11,0.30)',
                                                    }}
                                                >
                                                    {i + 1}
                                                </span>
                                            </td>
                                            <td
                                                className="px-3 py-2 font-semibold"
                                                style={{ color: t.cellText, borderRight: `1px solid ${t.rowBorder}`, maxWidth: '160px' }}
                                            >
                                                <span className="block truncate" title={row.particulars}>{row.particulars}</span>
                                                {row.remarks && (
                                                    <span className="block text-[9px] mt-0.5 truncate" style={{ color: t.cellMuted }} title={row.remarks}>
                                                        {row.remarks}
                                                    </span>
                                                )}
                                            </td>
                                            <td
                                                className="px-3 py-2 text-right font-bold"
                                                style={{
                                                    color: t.cellGreen,
                                                    fontFamily: "'JetBrains Mono', monospace",
                                                    fontVariantNumeric: 'tabular-nums',
                                                    borderRight: `1px solid ${t.rowBorder}`,
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {fmt(row.amount)}
                                            </td>
                                            <td
                                                className="px-3 py-2 text-right font-bold"
                                                style={{
                                                    color: row.approvedAmount != null ? t.cellBlue : t.cellMuted,
                                                    fontFamily: "'JetBrains Mono', monospace",
                                                    fontVariantNumeric: 'tabular-nums',
                                                    borderRight: `1px solid ${t.rowBorder}`,
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {row.approvedAmount != null ? fmt(row.approvedAmount) : '—'}
                                            </td>
                                            <td className="px-3 py-2">
                                                <StatusBadge status={row.status} t={t} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Previous card summary footer */}
                        <div
                            className="px-5 py-3 flex flex-wrap items-center justify-between gap-3"
                            style={{ background: t.summaryBg, borderTop: `2px solid ${t.summaryBorder}` }}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.summaryLabelText }}>
                                {prevItems.length} item{prevItems.length !== 1 ? 's' : ''}
                            </span>
                            <div className="flex flex-col gap-1.5 ml-auto">
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.summaryLabelText }}>Total</span>
                                    <div
                                        className="px-3 py-1 rounded-lg text-xs font-bold text-right"
                                        style={{
                                            background: t.summaryValueBg,
                                            border: `1px solid ${t.summaryValueBorder}`,
                                            color: t.cellGreen,
                                            fontFamily: "'JetBrains Mono', monospace",
                                            minWidth: '110px',
                                        }}
                                    >
                                        {fmt(prevTotal)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.summaryLabelText }}>Approved</span>
                                    <div
                                        className="px-3 py-1 rounded-lg text-xs font-bold text-right"
                                        style={{
                                            background: t.summaryValueBg,
                                            border: `1px solid ${prevTotalApproved > 0 ? 'rgba(52,211,153,0.35)' : t.summaryValueBorder}`,
                                            color: prevTotalApproved > 0 ? t.cellBlue : t.cellMuted,
                                            fontFamily: "'JetBrains Mono', monospace",
                                            minWidth: '110px',
                                        }}
                                    >
                                        {prevTotalApproved > 0 ? fmt(prevTotalApproved) : '—'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── Main card ─────────────────────────────────────────── */}
            <div className={showPrevious ? 'flex-1 min-w-0' : ''}>
            {/* ── Single card ───────────────────────────────────── */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    boxShadow: t.cardShadow,
                }}
            >
                {/* Card header — Department Label + Sub Account Select + Save */}
                <div
                    className="px-5 py-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]"
                    style={{
                        background: t.cardHeaderBg,
                        borderBottom: `1px solid ${t.cardHeaderBorder}`,
                    }}
                >
                    {/* Read-Only Department / Section Display */}
                    <div>
                        <label
                            className="block text-[9px] font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: t.subColor }}
                        >
                            Department / Section
                        </label>
                        <div
                            className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2"
                            style={{
                                background: t.inputBg,
                                borderColor: t.inputBorder,
                                color: t.inputText,
                            }}
                        >
                            <span
                                className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md"
                                style={{
                                    background: unitKind === 'Department'
                                        ? 'rgba(37,99,235,0.20)'
                                        : 'rgba(5,150,105,0.20)',
                                    color: unitKind === 'Department' ? t.cellBlue : t.cellGreen,
                                }}
                            >
                                {unitKind === 'Department' ? 'Dept' : 'Sec'}
                            </span>
                            {unitName}
                        </div>
                    </div>

                    {/* Sub Account dropdown — driven by API */}
                    <div>
                        <label
                            className="block text-[9px] font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: t.subColor }}
                        >
                            Sub Account
                        </label>
                        <div className="relative">
                            <select
                                value={subAccount ? String(subAccount.id) : ''}
                                onChange={e => handleSubChange(e.target.value)}
                                disabled={loadingSubs || subAccounts.length === 0}
                                className="w-full appearance-none pl-3 pr-9 py-2.5 rounded-xl text-xs font-semibold border outline-none"
                                style={{
                                    background: t.inputBg,
                                    borderColor: t.inputBorder,
                                    color: t.inputText,
                                    cursor: loadingSubs ? 'wait' : 'pointer',
                                    opacity: loadingSubs ? 0.6 : 1,
                                }}
                            >
                                {loadingSubs && <option value="">Loading…</option>}
                                {!loadingSubs && subAccounts.length === 0 && (
                                    <option value="">No sub-accounts found</option>
                                )}
                                {subAccounts.map(s => (
                                    <option key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ color: t.subColor }}
                            />
                        </div>
                    </div>

                    {/* Save + Compare buttons */}
                    <div className="flex items-end gap-2">
                        <button
                            onClick={handleSave}
                            disabled={dirtyIds.size === 0 || saving}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-150"
                            style={{
                                background: dirtyIds.size === 0 || saving
                                    ? 'rgba(37,99,235,0.08)'
                                    : 'rgba(37,99,235,0.85)',
                                color: dirtyIds.size === 0 || saving ? '#4b6a9b' : '#ffffff',
                                border: `1px solid ${dirtyIds.size === 0 || saving ? 'rgba(99,155,255,0.12)' : 'rgba(99,155,255,0.70)'}`,
                                cursor: dirtyIds.size === 0 || saving ? 'not-allowed' : 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {saving
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>
                                : <><Save className="w-3.5 h-3.5" />Save{dirtyIds.size > 0 ? ` (${dirtyIds.size})` : ''}</>
                            }
                        </button>
                        {/* Compare toggle button */}
                        <button
                            onClick={() => setShowPrevious(p => !p)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-150"
                            style={{
                                background: showPrevious
                                    ? 'rgba(245,158,11,0.22)'
                                    : 'rgba(245,158,11,0.08)',
                                color: showPrevious ? '#fbbf24' : '#b58a2e',
                                border: `1px solid ${showPrevious ? 'rgba(245,158,11,0.55)' : 'rgba(245,158,11,0.20)'}`,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <History className="w-3.5 h-3.5" />
                            {showPrevious ? 'Hide Prev Year' : 'Compare Prev Year'}
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr style={{ background: t.tableHeadBg }}>
                                {['#', 'Description', 'Amount', 'Approved Amount', 'Remarks', 'Status', 'Action'].map(h => (
                                    <th
                                        key={h}
                                        className="px-4 py-2.5 text-left font-bold uppercase tracking-widest whitespace-nowrap"
                                        style={{
                                            fontSize: '9px',
                                            color: t.tableHeadText,
                                            borderBottom: `2px solid ${t.tableHeadBorder}`,
                                            borderRight: `1px solid ${t.tableHeadBorder}`,
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-xs" style={{ color: t.cellMuted }}>
                                        {loadingItems ? 'Fetching items…' : 'No items found for this sub-account.'}
                                    </td>
                                </tr>
                            ) : items.map((row, i) => {
                                const isSel = selectedItem?.id === row.id;
                                return (
                                    <tr
                                        key={row.id}
                                        onClick={() => setSelectedItem(row)}
                                        className="cursor-pointer transition-colors duration-100"
                                        style={{
                                            background: isSel
                                                ? t.rowSelectedBg
                                                : i % 2 === 0 ? t.rowEvenBg : t.rowOddBg,
                                            borderBottom: `1px solid ${t.rowBorder}`,
                                            borderLeft: isSel ? `3px solid ${t.cellBlue}` : '3px solid transparent',
                                        }}
                                    >
                                        <td className="px-4 py-2.5" style={{ borderRight: `1px solid ${t.rowBorder}` }}>
                                            <span
                                                className="px-2 py-0.5 rounded-md font-mono font-bold"
                                                style={{
                                                    fontSize: '10px',
                                                    background: t.pillBg,
                                                    color: t.pillText,
                                                    border: `1px solid ${t.pillBorder}`,
                                                }}
                                            >
                                                {i + 1}
                                            </span>
                                        </td>
                                        <td
                                            className="px-4 py-2.5 font-semibold"
                                            style={{ color: t.cellText, borderRight: `1px solid ${t.rowBorder}` }}
                                        >
                                            {row.particulars}
                                        </td>
                                        <td
                                            className="px-4 py-2.5 text-right font-bold"
                                            style={{
                                                color: t.cellGreen,
                                                fontFamily: "'JetBrains Mono', monospace",
                                                fontVariantNumeric: 'tabular-nums',
                                                borderRight: `1px solid ${t.rowBorder}`,
                                            }}
                                        >
                                            {fmt(row.amount)}
                                        </td>
                                        <td
                                            className="px-2 py-1.5"
                                            style={{ borderRight: `1px solid ${t.rowBorder}` }}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={drafts[row.id]?.approvedAmount ?? ''}
                                                onChange={e => handleApprovedChange(row.id, e.target.value)}
                                                placeholder="0.00"
                                                className="w-full rounded-lg px-2 py-1 text-xs font-bold text-right border outline-none"
                                                style={{
                                                    background: t.summaryValueBg,
                                                    borderColor: drafts[row.id]?.approvedAmount
                                                        ? 'rgba(52,211,153,0.45)'
                                                        : t.inputBorder,
                                                    color: t.cellBlue,
                                                    fontFamily: "'JetBrains Mono', monospace",
                                                    fontVariantNumeric: 'tabular-nums',
                                                    minWidth: '110px',
                                                }}
                                            />
                                        </td>
                                        <td
                                            className="px-2 py-1.5"
                                            style={{ color: t.cellMuted, borderRight: `1px solid ${t.rowBorder}` }}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <input
                                                type="text"
                                                value={drafts[row.id]?.remarks ?? ''}
                                                onChange={e => handleRemarksChange(row.id, e.target.value)}
                                                placeholder="—"
                                                className="w-full rounded-lg px-2 py-1 text-xs border outline-none"
                                                style={{
                                                    background: t.summaryValueBg,
                                                    borderColor: t.inputBorder,
                                                    color: t.cellText,
                                                    minWidth: '120px',
                                                }}
                                            />
                                        </td>
                                        <td className="px-4 py-2.5" style={{ borderRight: `1px solid ${t.rowBorder}` }}>
                                            <StatusBadge status={drafts[row.id]?.status ?? row.status} t={t} />
                                        </td>
                                        <td className="px-4 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                                            {(() => {
                                                const hasApproved = (drafts[row.id]?.approvedAmount ?? '').trim() !== '';
                                                return (
                                                    <button
                                                        onClick={() => handleDisapprove(row.id)}
                                                        disabled={hasApproved}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-opacity"
                                                        style={{
                                                            background: hasApproved ? 'rgba(220,38,38,0.05)' : 'rgba(220,38,38,0.15)',
                                                            color:      hasApproved ? 'rgba(248,113,113,0.35)' : '#f87171',
                                                            border:     `1px solid ${hasApproved ? 'rgba(220,38,38,0.12)' : 'rgba(220,38,38,0.35)'}`,
                                                            cursor:     hasApproved ? 'not-allowed' : 'pointer',
                                                        }}
                                                    >
                                                        <XCircle className="w-3 h-3" />
                                                        Disapprove
                                                    </button>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Summary footer */}
                <div
                    className="px-5 py-3 flex flex-wrap items-center gap-4"
                    style={{ background: t.summaryBg, borderTop: `2px solid ${t.summaryBorder}` }}
                >
                    {/* Left: item count */}
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.summaryLabelText }}>
                        {items.length} item{items.length !== 1 ? 's' : ''}
                    </span>

                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        {/* Description */}
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.summaryLabelText }}>Description</span>
                            <input
                                readOnly
                                value={selectedItem?.particulars ?? ''}
                                placeholder="Select a row…"
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold border outline-none"
                                style={{
                                    background: t.summaryValueBg,
                                    border: `1px solid ${t.summaryValueBorder}`,
                                    color: t.cellText,
                                    minWidth: '140px',
                                    cursor: 'default',
                                }}
                            />
                        </div>

                        {/* Unit of Measurement */}
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.summaryLabelText }}>Unit of Measurement</span>
                            <input
                                readOnly
                                value={selectedItem?.uom ?? ''}
                                placeholder="—"
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold border outline-none"
                                style={{
                                    background: t.summaryValueBg,
                                    border: `1px solid ${t.summaryValueBorder}`,
                                    color: t.cellText,
                                    minWidth: '100px',
                                    cursor: 'default',
                                }}
                            />
                        </div>

                        {/* Quantity */}
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.summaryLabelText }}>Quantity</span>
                            <input
                                readOnly
                                value={selectedItem != null ? selectedItem.qty : ''}
                                placeholder="—"
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold border outline-none"
                                style={{
                                    background: t.summaryValueBg,
                                    border: `1px solid ${t.summaryValueBorder}`,
                                    color: t.cellText,
                                    minWidth: '80px',
                                    cursor: 'default',
                                }}
                            />
                        </div>

                        {/* Unit Cost */}
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.summaryLabelText }}>Unit Cost</span>
                            <input
                                readOnly
                                value={selectedItem != null ? fmt(selectedItem.unitCost) : ''}
                                placeholder="—"
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold border outline-none"
                                style={{
                                    background: t.summaryValueBg,
                                    border: `1px solid ${t.summaryValueBorder}`,
                                    color: t.cellText,
                                    minWidth: '100px',
                                    cursor: 'default',
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            />
                        </div>
                    </div>

                    {/* Right: Total Amount + Total Approved Amount */}
                    <div className="flex items-center gap-4 ml-auto">
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.summaryLabelText }}>
                                Total Amount
                            </span>
                            <div
                                className="px-4 py-1.5 rounded-lg text-xs font-bold"
                                style={{
                                    background: t.summaryValueBg,
                                    border: `1px solid ${t.summaryValueBorder}`,
                                    color: t.cellGreen,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontVariantNumeric: 'tabular-nums',
                                    minWidth: '130px',
                                    textAlign: 'right',
                                }}
                            >
                                {fmt(total)}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.summaryLabelText }}>
                                Total Approved
                            </span>
                            <div
                                className="px-4 py-1.5 rounded-lg text-xs font-bold"
                                style={{
                                    background: t.summaryValueBg,
                                    border: `1px solid ${totalApproved > 0 ? 'rgba(52,211,153,0.35)' : t.summaryValueBorder}`,
                                    color: totalApproved > 0 ? t.cellBlue : t.cellMuted,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontVariantNumeric: 'tabular-nums',
                                    minWidth: '130px',
                                    textAlign: 'right',
                                }}
                            >
                                {totalApproved > 0 ? fmt(totalApproved) : '—'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>{/* end main card wrapper */}
            </div>{/* end side-by-side flex */}
        </div>
    );
}