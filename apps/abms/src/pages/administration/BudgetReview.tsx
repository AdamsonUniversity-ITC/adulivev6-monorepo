import { useState, useEffect, useRef } from 'react';
import { useLoaderData, useNavigate } from '@tanstack/react-router';
import { financeSvc } from '@repo/axios-config';
import AdamsonBudgetLayout from '../../layouts/Screenlayout';
import ReviewSheetButton from './shared/ReviewSheetButton';
import {
    RefreshCw,
    CheckCircle,
    ChevronDown,
    TrendingUp,
    TrendingDown,
    Minus,
    X,
    AlertCircle,
    CheckCircle2,
    Search,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — mirrors the UserAccess palette exactly
// ─────────────────────────────────────────────────────────────────────────────
const T = {
    dark: {
        pageBg: 'transparent',
        titleColor: '#f8fafc',
        subColor: '#94a3b8',
        cardBg: 'rgba(15, 23, 42, 0.90)',
        cardBorder: 'rgba(99, 155, 255, 0.30)',
        cardShadow: '0 4px 40px rgba(37, 99, 235, 0.20)',
        cardHeaderBg: 'rgba(10, 18, 38, 0.95)',
        cardHeaderBorder: 'rgba(99, 155, 255, 0.20)',
        tableHeadBg: 'rgba(15, 30, 60, 0.85)',
        tableHeadText: '#93c5fd',
        tableHeadBorder: 'rgba(99, 155, 255, 0.25)',
        subHeadBg: 'rgba(10, 22, 50, 0.80)',
        subHeadText: '#60a5fa',
        rowBorder: 'rgba(99, 155, 255, 0.10)',
        rowEvenBg: 'rgba(15, 30, 60, 0.30)',
        rowOddBg: 'transparent',
        rowHoverBg: 'rgba(59, 130, 246, 0.12)',
        rowActiveBg: 'rgba(37, 99, 235, 0.10)',
        cellText: '#e2e8f0',
        cellMuted: '#64748b',
        cellZero: '#475569',
        cellGreen: '#34d399',
        cellAmber: '#fbbf24',
        cellRed: '#f87171',
        cellBlue: '#93c5fd',
        numBg: 'rgba(15, 30, 60, 0.60)',
        numText: '#64748b',
        pillBg: 'rgba(59, 130, 246, 0.20)',
        pillText: '#93c5fd',
        pillBorder: 'rgba(99, 155, 255, 0.40)',
        inputBg: 'rgba(15, 30, 60, 0.80)',
        inputBorder: 'rgba(99, 155, 255, 0.30)',
        inputBorderFocus: 'rgba(99, 155, 255, 0.70)',
        inputText: '#f1f5f9',
        dividerColor: 'rgba(99, 155, 255, 0.15)',
        // Buttons
        primaryBtnBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        primaryBtnText: '#ffffff',
        primaryBtnBorder: 'rgba(99, 155, 255, 0.50)',
        primaryBtnShadow: '0 2px 12px rgba(37, 99, 235, 0.40)',
        primaryBtnHoverBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        ghostBtnBg: 'rgba(15, 30, 60, 0.80)',
        ghostBtnBorder: 'rgba(99, 155, 255, 0.30)',
        ghostBtnText: '#93c5fd',
        ghostBtnHoverBg: 'rgba(59, 130, 246, 0.15)',
        dangerBtnBg: 'rgba(239, 68, 68, 0.15)',
        dangerBtnBorder: 'rgba(239, 68, 68, 0.40)',
        dangerBtnText: '#f87171',
        dangerBtnHoverBg: 'rgba(239, 68, 68, 0.25)',
        approveBtnBg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        approveBtnBorder: 'rgba(52, 211, 153, 0.40)',
        approveBtnShadow: '0 2px 12px rgba(5, 150, 105, 0.35)',
        approveBtnHoverBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        // Tab
        tabActiveBg: 'rgba(15, 30, 60, 0.60)',
        tabActiveText: '#93c5fd',
        tabActiveBorder: 'rgba(99, 155, 255, 0.35)',
        tabActiveAccent: '#3b82f6',
        tabInactiveBg: 'rgba(15, 30, 60, 0.30)',
        tabInactiveText: '#94a3b8',
        tabInactiveBorder: 'rgba(99, 155, 255, 0.12)',
        tabInactiveAccent: 'transparent',
        // Summary
        summaryBg: 'rgba(10, 18, 38, 0.95)',
        summaryBorder: 'rgba(99, 155, 255, 0.25)',
        summaryLabelText: '#64748b',
        summaryValueBg: 'rgba(15, 30, 60, 0.80)',
        summaryValueBorder: 'rgba(99, 155, 255, 0.20)',
        // Section headers
        currentSectionBg: 'rgba(37, 99, 235, 0.18)',
        currentSectionBorder: 'rgba(99, 155, 255, 0.30)',
        currentSectionText: '#93c5fd',
        proposeSectionBg: 'rgba(5, 150, 105, 0.15)',
        proposeSectionBorder: 'rgba(52, 211, 153, 0.30)',
        proposeSectionText: '#6ee7b7',
        // Status badges
        increasedBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        increasedText: '#ffffff',
        decreasedBg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        decreasedText: '#ffffff',
        neutralBg: 'rgba(100, 116, 139, 0.25)',
        neutralText: '#94a3b8',
    },
    light: {
        pageBg: 'transparent',
        titleColor: '#0f172a',
        subColor: '#475569',
        cardBg: 'rgba(255, 255, 255, 0.95)',
        cardBorder: 'rgba(37, 99, 235, 0.20)',
        cardShadow: '0 4px 32px rgba(0, 48, 135, 0.12)',
        cardHeaderBg: 'rgba(248, 250, 252, 0.98)',
        cardHeaderBorder: 'rgba(37, 99, 235, 0.15)',
        tableHeadBg: 'rgba(219, 234, 254, 0.90)',
        tableHeadText: '#1d4ed8',
        tableHeadBorder: 'rgba(37, 99, 235, 0.20)',
        subHeadBg: 'rgba(239, 246, 255, 0.80)',
        subHeadText: '#2563eb',
        rowBorder: 'rgba(37, 99, 235, 0.08)',
        rowEvenBg: 'rgba(241, 245, 249, 0.60)',
        rowOddBg: 'transparent',
        rowHoverBg: 'rgba(219, 234, 254, 0.70)',
        rowActiveBg: 'rgba(219, 234, 254, 0.40)',
        cellText: '#0f172a',
        cellMuted: '#64748b',
        cellZero: '#cbd5e1',
        cellGreen: '#059669',
        cellAmber: '#d97706',
        cellRed: '#dc2626',
        cellBlue: '#1d4ed8',
        numBg: 'rgba(241, 245, 249, 0.80)',
        numText: '#94a3b8',
        pillBg: 'rgba(37, 99, 235, 0.12)',
        pillText: '#1d4ed8',
        pillBorder: 'rgba(37, 99, 235, 0.30)',
        inputBg: 'rgba(241, 245, 249, 0.90)',
        inputBorder: 'rgba(37, 99, 235, 0.25)',
        inputBorderFocus: 'rgba(37, 99, 235, 0.60)',
        inputText: '#0f172a',
        dividerColor: 'rgba(37, 99, 235, 0.10)',
        // Buttons
        primaryBtnBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        primaryBtnText: '#ffffff',
        primaryBtnBorder: 'rgba(29, 78, 216, 0.40)',
        primaryBtnShadow: '0 2px 12px rgba(37, 99, 235, 0.30)',
        primaryBtnHoverBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        ghostBtnBg: 'rgba(241, 245, 249, 0.90)',
        ghostBtnBorder: 'rgba(37, 99, 235, 0.25)',
        ghostBtnText: '#1d4ed8',
        ghostBtnHoverBg: 'rgba(219, 234, 254, 0.80)',
        dangerBtnBg: 'rgba(254, 242, 242, 0.90)',
        dangerBtnBorder: 'rgba(239, 68, 68, 0.30)',
        dangerBtnText: '#dc2626',
        dangerBtnHoverBg: 'rgba(254, 226, 226, 0.90)',
        approveBtnBg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        approveBtnBorder: 'rgba(16, 185, 129, 0.35)',
        approveBtnShadow: '0 2px 12px rgba(5, 150, 105, 0.25)',
        approveBtnHoverBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        // Tab
        tabActiveBg: 'rgba(241, 245, 249, 0.90)',
        tabActiveText: '#1d4ed8',
        tabActiveBorder: 'rgba(37, 99, 235, 0.30)',
        tabActiveAccent: '#2563eb',
        tabInactiveBg: 'rgba(248, 250, 252, 0.60)',
        tabInactiveText: '#64748b',
        tabInactiveBorder: 'rgba(37, 99, 235, 0.12)',
        tabInactiveAccent: 'transparent',
        // Summary
        summaryBg: 'rgba(248, 250, 252, 0.98)',
        summaryBorder: 'rgba(37, 99, 235, 0.15)',
        summaryLabelText: '#64748b',
        summaryValueBg: 'rgba(241, 245, 249, 0.90)',
        summaryValueBorder: 'rgba(37, 99, 235, 0.15)',
        // Section headers
        currentSectionBg: 'rgba(219, 234, 254, 0.80)',
        currentSectionBorder: 'rgba(37, 99, 235, 0.20)',
        currentSectionText: '#1d4ed8',
        proposeSectionBg: 'rgba(209, 250, 229, 0.70)',
        proposeSectionBorder: 'rgba(16, 185, 129, 0.25)',
        proposeSectionText: '#047857',
        // Status badges
        increasedBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        increasedText: '#ffffff',
        decreasedBg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        decreasedText: '#ffffff',
        neutralBg: 'rgba(148, 163, 184, 0.20)',
        neutralText: '#64748b',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Types & data
// ─────────────────────────────────────────────────────────────────────────────
interface BudgetRow {
    id: number;
    account: string;
    approvedBudget: number;
    released: number;
    balance: number;
    proposed: number;
    approved: number;
}

interface UnitOption {
    id: string;
    name: string;
    kind: 'Department' | 'Section';
}



// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function BudgetReview() {
    const {
        proposal_school_year,
        current_school_year,
        departments,
        sections,
    } = useLoaderData({ strict: false });

    const navigate = useNavigate();

    const unitOptions: UnitOption[] = [
        ...(departments as UnitOption[]),
        ...(sections as UnitOption[]),
    ].sort((a, b) => a.name.localeCompare(b.name));

    const SESSION_KEY = 'budget-review-state';

    // ── Restore persisted state (survive navigation away and back) ────────────
    const persisted = (() => {
        try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null'); }
        catch { return null; }
    })();

    const [selectedUnit, setSelectedUnit] = useState<UnitOption | null>(
        persisted?.selectedUnit ?? unitOptions[0] ?? null
    );
    const [activeYear, setActiveYear] = useState<'current' | 'propose'>(
        persisted?.activeYear ?? 'current'
    );
    const [deptOpen, setDeptOpen] = useState(false);
    const [deptSearch, setDeptSearch] = useState('');
    const filteredUnitOptions = deptSearch.trim()
        ? unitOptions.filter(u => u.name.toLowerCase().includes(deptSearch.trim().toLowerCase()))
        : unitOptions;
    const [budgetData, setBudgetData] = useState<BudgetRow[]>(
        persisted?.budgetData ?? []
    );
    const [isLoading, setIsLoading] = useState(false);
    

    // Persist whenever any of the three pieces of state change
    useEffect(() => {
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({ selectedUnit, activeYear, budgetData }));
        } catch { /* quota exceeded — silently ignore */ }
    }, [selectedUnit, activeYear, budgetData]);

    // ── Toast ─────────────────────────────────────────────────────────────────
    type ToastState = { message: string; kind: 'success' | 'error'; visible: boolean };
    const [toast, setToast] = useState<ToastState>({ message: '', kind: 'success', visible: false });
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = (message: string, kind: 'success' | 'error') => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ message, kind, visible: true });
        toastTimer.current = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
    };

    useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

    const totalApproved = budgetData.reduce((acc, r) => acc + r.approvedBudget, 0);
    const totalReleased = budgetData.reduce((acc, r) => acc + r.released, 0);
    const totalBalance = budgetData.reduce((acc, r) => acc + r.balance, 0);
    const totalProposed = budgetData.reduce((acc, r) => acc + r.proposed, 0);
    const totalFinalApproved = budgetData.reduce((acc, r) => acc + r.approved, 0);

    const handleRequery = async () => {
        if (!selectedUnit) return;
        setIsLoading(true);
        try {
            const payload: Record<string, string> = {
                kind: selectedUnit.kind,
                current_school_year,
                proposed_school_year: proposal_school_year,
            };
            if (selectedUnit.kind === 'Department') {
                payload.department_id = selectedUnit.id;
            } else {
                payload.section_id = selectedUnit.id;
            }

            const { data } = await financeSvc.post('/abms/budget-review/requery', payload);
            // Null-coerce every money column to 0 — the API may return null for
            // rows where released/balance have not been recorded yet.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setBudgetData((data as any[]).map(row => ({
                ...row,
                approvedBudget: row.approvedBudget ?? 0,
                released: row.released ?? 0,
                balance: row.balance ?? 0,
                proposed: row.proposed ?? 0,
                approved: row.approved ?? 0,
            })));
            showToast(`Budget data loaded for ${selectedUnit.name}.`, 'success');
        } catch (err) {
            console.error('Requery failed:', err);
            showToast('Failed to load budget data. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };



    const status: 'INCREASED' | 'DECREASED' | 'NO CHANGE' =
        budgetData.length === 0 ? 'NO CHANGE' :
            totalProposed > totalApproved ? 'INCREASED' :
                totalProposed < totalApproved ? 'DECREASED' : 'NO CHANGE';

    return (
        <AdamsonBudgetLayout>
            {(isDark: boolean) => {
                const t = isDark ? T.dark : T.light;

                const CellAmount = ({ value, highlight }: { value: number; highlight?: 'balance' | 'proposed' | 'approved' }) => {
                    const isZero = value === 0;
                    let color = isZero ? t.cellZero : t.cellText;
                    if (!isZero && highlight === 'balance') color = t.cellAmber;
                    if (!isZero && highlight === 'proposed') color = t.cellBlue;
                    if (!isZero && highlight === 'approved') color = t.cellGreen;
                    return (
                        <span style={{ color, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
                            {isZero ? <span style={{ color: t.cellZero, opacity: 0.5 }}>—</span> : fmt(value)}
                        </span>
                    );
                };

                return (
                    <div className="max-w-7xl mx-auto space-y-5">

                        {/* ── Page Title ── */}
                        <div className="flex items-center gap-3">
                            <div>
                                <h1 className="text-lg font-bold tracking-tight" style={{ color: t.titleColor }}>
                                    Budget Review
                                </h1>
                                <p className="text-xs mt-0.5" style={{ color: t.subColor }}>
                                    Review and manage departmental budget allocations
                                </p>
                            </div>
                        </div>

                        {/* ── Main Card ── */}
                        <div
                            className="rounded-2xl overflow-hidden"
                            style={{
                                background: t.cardBg,
                                border: `1px solid ${t.cardBorder}`,
                                boxShadow: t.cardShadow,
                            }}
                        >
                            {/* ── Toolbar ── */}
                            <div
                                className="px-5 py-3 flex flex-wrap items-center gap-3"
                                style={{
                                    background: t.cardHeaderBg,
                                    borderBottom: `1px solid ${t.cardHeaderBorder}`,
                                }}
                            >
                                {/* Department / Section selector */}
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.subColor }}>
                                        Department / Section
                                    </label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setDeptOpen(prev => { if (prev) setDeptSearch(''); return !prev; })}
                                            className="flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 min-w-[200px]"
                                            style={{
                                                background: t.inputBg,
                                                border: `1px solid ${deptOpen ? t.inputBorderFocus : t.inputBorder}`,
                                                color: t.inputText,
                                            }}
                                        >
                                            <span className="flex-1 text-left truncate">{selectedUnit?.name ?? '—'}</span>
                                            {/* Show kind badge inline when something is selected */}
                                            {selectedUnit && (
                                                <span
                                                    className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md shrink-0"
                                                    style={{
                                                        background: selectedUnit.kind === 'Department'
                                                            ? (isDark ? 'rgba(37,99,235,0.25)' : 'rgba(219,234,254,0.90)')
                                                            : (isDark ? 'rgba(5,150,105,0.25)' : 'rgba(209,250,229,0.90)'),
                                                        color: selectedUnit.kind === 'Department' ? t.cellBlue : t.cellGreen,
                                                    }}
                                                >
                                                    {selectedUnit.kind === 'Department' ? 'Dept' : 'Sec'}
                                                </span>
                                            )}
                                            <ChevronDown
                                                className="w-3.5 h-3.5 shrink-0 transition-transform duration-150"
                                                style={{ color: t.subColor, transform: deptOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                            />
                                        </button>
                                        {deptOpen && (
                                            <div
                                                className="absolute top-full left-0 mt-1 z-50 rounded-xl overflow-hidden min-w-[220px]"
                                                style={{
                                                    background: isDark ? 'rgba(10, 18, 38, 0.98)' : 'rgba(255,255,255,0.99)',
                                                    border: `1px solid ${t.cardBorder}`,
                                                    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.50)' : '0 8px 32px rgba(0,48,135,0.15)',
                                                }}
                                            >
                                                {/* Search box — list can contain 100+ items */}
                                                <div
                                                    className="px-3 py-2"
                                                    style={{ borderBottom: `1px solid ${t.dividerColor}` }}
                                                >
                                                    <div className="relative">
                                                        <Search
                                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                                                            style={{ color: t.subColor }}
                                                        />
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            value={deptSearch}
                                                            onChange={e => setDeptSearch(e.target.value)}
                                                            placeholder="Search department / section…"
                                                            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all duration-150"
                                                            style={{
                                                                background: t.cardHeaderBg,
                                                                border: `1px solid ${t.inputBorder}`,
                                                                color: t.inputText,
                                                            }}
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                    </div>
                                                </div>

                                                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                                                    {filteredUnitOptions.length === 0 ? (
                                                        <div className="flex items-center justify-center py-6">
                                                            <span className="text-xs" style={{ color: t.subColor }}>
                                                                No results found.
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        filteredUnitOptions.map((unit, idx) => {
                                                            const isSelected = unit.id === selectedUnit?.id && unit.kind === selectedUnit?.kind;
                                                            return (
                                                                <button
                                                                    key={`${unit.kind}-${unit.id}`}
                                                                    className="w-full text-left px-4 py-2 text-sm transition-all duration-100 flex items-center justify-between gap-3"
                                                                    style={{
                                                                        color: isSelected ? t.pillText : t.cellText,
                                                                        background: isSelected
                                                                            ? (isDark ? 'rgba(37,99,235,0.20)' : 'rgba(219,234,254,0.80)')
                                                                            : 'transparent',
                                                                        fontWeight: isSelected ? 600 : 400,
                                                                        borderBottom: idx < filteredUnitOptions.length - 1 ? `1px solid ${t.dividerColor}` : 'none',
                                                                    }}
                                                                    onClick={() => { setSelectedUnit(unit); setDeptOpen(false); setDeptSearch(''); }}
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
                                                                    <span className="truncate">{unit.name}</span>
                                                                    {/* Kind badge */}
                                                                    <span
                                                                        className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md shrink-0"
                                                                        style={{
                                                                            background: unit.kind === 'Department'
                                                                                ? (isDark ? 'rgba(37,99,235,0.25)' : 'rgba(219,234,254,0.90)')
                                                                                : (isDark ? 'rgba(5,150,105,0.25)' : 'rgba(209,250,229,0.90)'),
                                                                            color: unit.kind === 'Department' ? t.cellBlue : t.cellGreen,
                                                                        }}
                                                                    >
                                                                        {unit.kind === 'Department' ? 'Dept' : 'Sec'}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Year tabs — display only */}
                                <div
                                    className="flex items-stretch self-end rounded-lg overflow-hidden"
                                    style={{
                                        border: `1px solid ${t.tabInactiveBorder}`,
                                    }}
                                >
                                    {([
                                        { key: 'current', label: current_school_year, sub: 'Current Year' },
                                        { key: 'propose', label: proposal_school_year, sub: 'Proposal Year' },
                                    ] as const).map((tab, idx) => {
                                        const isActive = activeYear === tab.key;
                                        return (
                                            <div
                                                key={tab.key}
                                                className="flex flex-col items-center justify-center px-5 py-2 text-xs relative"
                                                style={{
                                                    background: isActive ? t.tabActiveBg : t.tabInactiveBg,
                                                    color: isActive ? t.tabActiveText : t.tabInactiveText,
                                                    borderLeft: idx > 0 ? `1px solid ${t.tabInactiveBorder}` : 'none',
                                                    cursor: 'default',
                                                    minWidth: '110px',
                                                }}
                                            >
                                                {/* Top accent bar for active */}
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: '20%',
                                                        right: '20%',
                                                        height: '2px',
                                                        borderRadius: '0 0 2px 2px',
                                                        background: isActive ? t.tabActiveAccent : 'transparent',
                                                        transition: 'background 0.2s',
                                                    }}
                                                />
                                                <span
                                                    className="font-medium tracking-wide uppercase"
                                                    style={{
                                                        fontSize: '9px',
                                                        color: isActive ? t.tabActiveText : t.tabInactiveText,
                                                        opacity: isActive ? 0.75 : 0.55,
                                                        letterSpacing: '0.08em',
                                                    }}
                                                >
                                                    {tab.sub}
                                                </span>
                                                <span className="font-bold tracking-tight" style={{ fontSize: '12px', marginTop: '1px' }}>
                                                    {tab.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Requery button */}
                                <button
                                    onClick={handleRequery}
                                    disabled={isLoading || !selectedUnit}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold self-end transition-all duration-150"
                                    style={{
                                        background: t.primaryBtnBg,
                                        color: t.primaryBtnText,
                                        border: `1px solid ${t.primaryBtnBorder}`,
                                        boxShadow: t.primaryBtnShadow,
                                        opacity: isLoading || !selectedUnit ? 0.6 : 1,
                                        cursor: isLoading || !selectedUnit ? 'not-allowed' : 'pointer',
                                    }}
                                    onMouseEnter={e => { if (!isLoading && selectedUnit) (e.currentTarget as HTMLElement).style.background = t.primaryBtnHoverBg; }}
                                    onMouseLeave={e => { if (!isLoading && selectedUnit) (e.currentTarget as HTMLElement).style.background = t.primaryBtnBg; }}
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                                    {isLoading ? 'Loading...' : 'Requery'}
                                </button>

                                {/* Spacer */}
                                <div className="flex-1" />

                                {/* Review Sheet */}
                                <ReviewSheetButton
                                    ghostBtnStyle={{
                                        background: t.ghostBtnBg,
                                        color: t.ghostBtnText,
                                        border: `1px solid ${t.ghostBtnBorder}`,
                                    }}
                                    ghostBtnBg={t.ghostBtnBg}
                                    ghostBtnHoverBg={t.ghostBtnHoverBg}
                                    kind={selectedUnit?.kind}
                                    current_school_year={current_school_year}
                                    unitid = {selectedUnit?.id}
                                />
                            </div>

                            {/* ── Table ── */}
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        {/* Section group headers */}
                                        <tr>
                                            <th
                                                colSpan={2}
                                                className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest"
                                                style={{
                                                    background: t.tableHeadBg,
                                                    color: t.tableHeadText,
                                                    borderBottom: `1px solid ${t.tableHeadBorder}`,
                                                    borderRight: `1px solid ${t.tableHeadBorder}`,
                                                }}
                                            >
                                                Account
                                            </th>
                                            {/* Current section */}
                                            <th
                                                colSpan={3}
                                                className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-widest"
                                                style={{
                                                    background: t.currentSectionBg,
                                                    color: t.currentSectionText,
                                                    border: `1px solid ${t.currentSectionBorder}`,
                                                    borderLeft: 'none',
                                                }}
                                            >
                                                Current: {current_school_year}
                                            </th>
                                            {/* Propose section */}
                                            <th
                                                colSpan={2}
                                                className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-widest"
                                                style={{
                                                    background: t.proposeSectionBg,
                                                    color: t.proposeSectionText,
                                                    border: `1px solid ${t.proposeSectionBorder}`,
                                                    borderLeft: 'none',
                                                }}
                                            >
                                                Propose: {proposal_school_year}
                                            </th>
                                        </tr>

                                        {/* Column headers */}
                                        <tr style={{ background: t.subHeadBg }}>
                                            {/* # */}
                                            <th
                                                className="w-10 px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-widest"
                                                style={{ color: t.subHeadText, borderBottom: `1px solid ${t.tableHeadBorder}`, borderRight: `1px solid ${t.tableHeadBorder}` }}
                                            >
                                                #
                                            </th>
                                            {/* Account */}
                                            <th
                                                className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest"
                                                style={{ color: t.subHeadText, borderBottom: `1px solid ${t.tableHeadBorder}`, borderRight: `1px solid ${t.tableHeadBorder}` }}
                                            >
                                                Account
                                            </th>
                                            {/* Current cols */}
                                            {['Approved / Adjusted Budget', 'Released', 'Balance'].map(col => (
                                                <th
                                                    key={col}
                                                    className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest min-w-[140px]"
                                                    style={{
                                                        color: t.currentSectionText,
                                                        borderBottom: `1px solid ${t.tableHeadBorder}`,
                                                        borderRight: `1px solid ${t.tableHeadBorder}`,
                                                        background: isDark
                                                            ? 'rgba(37, 99, 235, 0.12)'
                                                            : 'rgba(219, 234, 254, 0.50)',
                                                    }}
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                            {/* Propose cols */}
                                            {['Proposed', 'Approved'].map((col, i) => (
                                                <th
                                                    key={col}
                                                    className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest min-w-[130px]"
                                                    style={{
                                                        color: t.proposeSectionText,
                                                        borderBottom: `1px solid ${t.tableHeadBorder}`,
                                                        borderRight: i === 0 ? `1px solid ${t.tableHeadBorder}` : 'none',
                                                        background: isDark
                                                            ? 'rgba(5, 150, 105, 0.08)'
                                                            : 'rgba(209, 250, 229, 0.40)',
                                                    }}
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {budgetData.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="px-4 py-10 text-center text-xs"
                                                    style={{ color: t.cellMuted }}
                                                >
                                                    {isLoading
                                                        ? 'Fetching data...'
                                                        : 'Select a department or section and click Requery to load data.'}
                                                </td>
                                            </tr>
                                        ) : budgetData.map((row, idx) => {
                                            const hasActivity = row.approvedBudget > 0 || row.proposed > 0;
                                            const isEven = idx % 2 === 0;
                                            const rowBg = hasActivity
                                                ? (isEven ? t.rowActiveBg : t.rowEvenBg)
                                                : (isEven ? t.rowEvenBg : t.rowOddBg);

                                            return (
                                                <tr
                                                    key={row.id}
                                                    style={{
                                                        background: rowBg,
                                                        borderBottom: `1px solid ${t.rowBorder}`,
                                                        cursor: 'pointer',
                                                        transition: 'background 0.12s',
                                                    }}
                                                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = t.rowHoverBg)}
                                                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = rowBg)}
                                                    onClick={() =>
                                                        navigate({
                                                            to: '/admin/budget-review/details',
                                                            state: {
                                                                mainAccountId: row.id,
                                                                mainAccountName: row.account,
                                                                unitId: selectedUnit!.id,
                                                                unitName: selectedUnit!.name,
                                                                unitKind: selectedUnit!.kind,
                                                                current_school_year,
                                                                proposal_school_year,
                                                            },
                                                        })
                                                    }
                                                >
                                                    {/* Row number */}
                                                    <td
                                                        className="px-3 py-2.5 text-center text-xs font-bold"
                                                        style={{
                                                            color: t.numText,
                                                            borderRight: `1px solid ${t.rowBorder}`,
                                                        }}
                                                    >
                                                        {row.id}
                                                    </td>

                                                    {/* Account name */}
                                                    <td
                                                        className="px-4 py-2.5 text-xs font-semibold"
                                                        style={{
                                                            color: hasActivity ? t.cellText : t.cellMuted,
                                                            borderRight: `1px solid ${t.rowBorder}`,
                                                            letterSpacing: '0.01em',
                                                        }}
                                                    >
                                                        {row.account}
                                                    </td>

                                                    {/* Approved Budget */}
                                                    <td
                                                        className="px-4 py-2.5 text-right text-xs"
                                                        style={{ borderRight: `1px solid ${t.rowBorder}` }}
                                                    >
                                                        <CellAmount value={row.approvedBudget} />
                                                    </td>

                                                    {/* Released */}
                                                    <td
                                                        className="px-4 py-2.5 text-right text-xs"
                                                        style={{ borderRight: `1px solid ${t.rowBorder}` }}
                                                    >
                                                        <CellAmount value={row.released} />
                                                    </td>

                                                    {/* Balance */}
                                                    <td
                                                        className="px-4 py-2.5 text-right text-xs"
                                                        style={{ borderRight: `1px solid ${t.rowBorder}` }}
                                                    >
                                                        <CellAmount value={row.balance} highlight="balance" />
                                                    </td>

                                                    {/* Proposed */}
                                                    <td
                                                        className="px-4 py-2.5 text-right text-xs"
                                                        style={{ borderRight: `1px solid ${t.rowBorder}` }}
                                                    >
                                                        <CellAmount value={row.proposed} highlight="proposed" />
                                                    </td>

                                                    {/* Approved (final) */}
                                                    <td className="px-4 py-2.5 text-right text-xs">
                                                        <CellAmount value={row.approved} highlight="approved" />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Summary footer ── */}
                            <div
                                className="px-5 py-4 flex flex-wrap items-center gap-4"
                                style={{
                                    background: t.summaryBg,
                                    borderTop: `2px solid ${t.summaryBorder}`,
                                }}
                            >
                                {/* Status badge */}
                                <div
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm tracking-widest uppercase"
                                    style={{
                                        background: status === 'INCREASED' ? t.increasedBg
                                            : status === 'DECREASED' ? t.decreasedBg
                                                : t.neutralBg,
                                        color: status === 'INCREASED' ? t.increasedText
                                            : status === 'DECREASED' ? t.decreasedText
                                                : t.neutralText,
                                        boxShadow: status === 'INCREASED' ? t.primaryBtnShadow
                                            : status === 'DECREASED' ? '0 2px 12px rgba(220,38,38,0.35)'
                                                : 'none',
                                        letterSpacing: '0.10em',
                                    }}
                                >
                                    {status === 'INCREASED' && <TrendingUp className="w-4 h-4" />}
                                    {status === 'DECREASED' && <TrendingDown className="w-4 h-4" />}
                                    {status === 'NO CHANGE' && <Minus className="w-4 h-4" />}
                                    {status}
                                </div>

                                <div className="flex flex-wrap gap-4 ml-auto">
                                    {([
                                        { label: 'Approved / Adj. Budget', value: totalApproved, color: t.cellText },
                                        { label: 'Released', value: totalReleased, color: t.cellText },
                                        { label: 'Balance', value: totalBalance, color: t.cellAmber },
                                        { label: 'Proposed', value: totalProposed, color: t.cellBlue },
                                        { label: 'Approved', value: totalFinalApproved, color: t.cellGreen },
                                    ] as const).map(({ label, value, color }) => (
                                        <div key={label} className="flex flex-col items-end gap-0.5">
                                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.summaryLabelText }}>
                                                {label}
                                            </span>
                                            <div
                                                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                                                style={{
                                                    background: t.summaryValueBg,
                                                    border: `1px solid ${t.summaryValueBorder}`,
                                                    color,
                                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                                    fontVariantNumeric: 'tabular-nums',
                                                    minWidth: '130px',
                                                    textAlign: 'right',
                                                }}
                                            >
                                                {fmt(value)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Toast notification (fixed: lower-right) ── */}
                        <div
                            role="status"
                            aria-live="polite"
                            style={{
                                position: 'fixed',
                                bottom: '28px',
                                right: '28px',
                                zIndex: 9999,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                minWidth: '280px',
                                maxWidth: '400px',
                                backdropFilter: 'blur(12px)',
                                boxShadow: isDark
                                    ? '0 8px 32px rgba(0,0,0,0.55)'
                                    : '0 8px 32px rgba(0,48,135,0.18)',
                                border: `1px solid ${toast.kind === 'success'
                                    ? (isDark ? 'rgba(52,211,153,0.35)' : 'rgba(16,185,129,0.30)')
                                    : (isDark ? 'rgba(248,113,113,0.35)' : 'rgba(220,38,38,0.25)')}`,
                                background: toast.kind === 'success'
                                    ? (isDark ? 'rgba(5,46,37,0.92)' : 'rgba(236,253,245,0.97)')
                                    : (isDark ? 'rgba(69,10,10,0.92)' : 'rgba(254,242,242,0.97)'),
                                opacity: toast.visible ? 1 : 0,
                                transform: toast.visible ? 'translateY(0)' : 'translateY(12px)',
                                pointerEvents: toast.visible ? 'auto' : 'none',
                                transition: 'opacity 0.22s ease, transform 0.22s ease',
                            }}
                        >
                            {toast.kind === 'success'
                                ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: isDark ? '#34d399' : '#059669' }} />
                                : <AlertCircle className="w-4 h-4 shrink-0" style={{ color: isDark ? '#f87171' : '#dc2626' }} />
                            }
                            <span
                                className="flex-1 text-xs font-medium leading-snug"
                                style={{
                                    color: toast.kind === 'success'
                                        ? (isDark ? '#6ee7b7' : '#065f46')
                                        : (isDark ? '#fca5a5' : '#991b1b'),
                                }}
                            >
                                {toast.message}
                            </span>
                            <button
                                onClick={() => setToast(prev => ({ ...prev, visible: false }))}
                                className="shrink-0 rounded-md p-0.5 transition-colors duration-100"
                                style={{
                                    color: toast.kind === 'success'
                                        ? (isDark ? '#34d399' : '#059669')
                                        : (isDark ? '#f87171' : '#dc2626'),
                                    opacity: 0.65,
                                }}
                                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '0.65')}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                    </div>
                );
            }}
        </AdamsonBudgetLayout>
    );
}