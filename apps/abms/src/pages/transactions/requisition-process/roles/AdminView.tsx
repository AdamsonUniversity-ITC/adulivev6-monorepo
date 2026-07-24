import React, { useState, useCallback, useRef, useEffect } from 'react';
import { z } from 'zod';
import { financeSvc } from '@repo/axios-config/finance-service';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { Theme, FilterState, makeDefaultFilterState, DeptOption } from '../shared/types';
import { ROLES, ROLE_FILTER_CONFIGS, ROLE_COLUMNS } from '../shared/constants';
import { RolePage } from '../shared/components/RolePage';
import { RSProcessModal, RSProcessRow } from '../shared/components/RSProcessModal';
import { AccountsViewModal, AccountRow } from '../shared/components/AccountsViewModal';
import { useRouteContext } from '@tanstack/react-router';

// ─────────────────────────────────────────────────────────────────────────────
// Zod — query schema
// ─────────────────────────────────────────────────────────────────────────────
const AdminQuerySchema = z.object({
    role: z.literal('admin-access'),
    statuses: z.array(z.string()).min(1, 'At least one status is required'),
    department: z.string().nullable(),
    kind: z.enum(['Department', 'Section']).nullable(),
    allDepartments: z.boolean(),
    sortBy: z.string().min(1, 'Sort column is required'),
    sortDir: z.enum(['asc', 'desc']),
    requisitionNo: z
        .string()
        .regex(/^\d{10}$/, 'Requisition No. must be exactly 10 digits')
        .nullable(),
    schoolYear: z.string().nullable(),
    paymentForm: z.string().nullable(),
    dateFrom: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date From must be a valid date')
        .nullable(),
    dateTo: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date To must be a valid date')
        .nullable(),
});

export type AdminQuery = z.infer<typeof AdminQuerySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// AdminRow — response type (no Zod on response)
// ─────────────────────────────────────────────────────────────────────────────
export interface AdminRow {
    id: number;
    date: string;
    requisition_no: string;
    department_id: number | string | null;
    section_id: number | string | null;
    kind: 'Department' | 'Section';
    department_section: string;
    requested_by: string;
    requested_by_empno: string;
    total_amount: number;
    status: string | null;
    location: string | null;
    from: string | null;
    note: string | null;
    for_liquidation?: boolean;
    is_cash_advance?: boolean;
    is_controlled?: number;
    /** RS type (e.g. "Cashier") — passed through from the API but not displayed in this table. */
    rstype?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const ROLE = ROLES.find(r => r.key === 'admin-access')!;
const FILTER_CFG = ROLE_FILTER_CONFIGS['admin-access']!;
const COLUMNS = ROLE_COLUMNS['admin-access'];

function getStatusColors(status: string | null, t: Theme, isDark: boolean) {
    if (isDark) {
        const map: Record<string, { bg: string; text: string; border: string }> = {
            'for review': { bg: `${t.cellAmber}26`, text: t.cellAmber, border: `${t.cellAmber}66` },
            'reprocess': { bg: 'rgba(216,180,254,0.14)', text: '#d8b4fe', border: 'rgba(216,180,254,0.42)' },
            'for certification': { bg: `${t.cellAmber}1a`, text: t.cellAmber, border: `${t.cellAmber}55` },
            'certified': { bg: `${t.cellGreen}26`, text: t.cellGreen, border: `${t.cellGreen}66` },
            'for pricing': { bg: `${t.cellAmber}1f`, text: t.cellAmber, border: `${t.cellAmber}59` },
            'disapproved': { bg: `${t.cellAmber}1a`, text: t.cellAmber, border: `${t.cellAmber}4d` },
            'cancelled': { bg: `${t.cellMuted}1a`, text: t.cellMuted, border: `${t.cellMuted}4d` },
            'served by wico': { bg: `${t.cellBlue}26`, text: t.cellBlue, border: `${t.cellBlue}66` },
            'for budget staff': { bg: `${t.cellBlue}1f`, text: t.cellBlue, border: `${t.cellBlue}55` },
            'for budget director': { bg: `${t.cellBlue}2e`, text: t.cellBlue, border: `${t.cellBlue}66` },
            'for purchase': { bg: `${t.cellBlue}1a`, text: t.cellBlue, border: `${t.cellBlue}4d` },
            'po on process': { bg: `${t.cellBlue}26`, text: t.cellBlue, border: `${t.cellBlue}59` },
            'unserved': { bg: `${t.cellAmber}1a`, text: t.cellAmber, border: `${t.cellAmber}55` },
            'served': { bg: `${t.cellGreen}1a`, text: t.cellGreen, border: `${t.cellGreen}55` },
        };
        return map[(status ?? '').toLowerCase()] ?? {
            bg: `${t.cellMuted}26`, text: t.cellMuted, border: `${t.cellMuted}59`,
        };
    }

    // Light mode — explicit, carefully tuned palette
    const map: Record<string, { bg: string; text: string; border: string }> = {
        'for review': { bg: 'rgba(253,230,138,0.50)', border: 'rgba(202,138,4,0.40)', text: '#92400e' },
        'reprocess': { bg: 'rgba(245,243,255,0.90)', border: 'rgba(124,58,237,0.32)', text: '#6d28d9' },
        'for certification': { bg: 'rgba(253,230,138,0.35)', border: 'rgba(202,138,4,0.28)', text: '#a16207' },
        'certified': { bg: 'rgba(187,247,208,0.55)', border: 'rgba(4,120,87,0.35)', text: '#065f46' },
        'for pricing': { bg: 'rgba(254,215,170,0.55)', border: 'rgba(194,65,12,0.32)', text: '#9a3412' },
        'disapproved': { bg: 'rgba(254,226,226,0.65)', border: 'rgba(220,38,38,0.32)', text: '#991b1b' },
        'cancelled': { bg: 'rgba(241,245,249,0.85)', border: 'rgba(148,163,184,0.38)', text: '#475569' },
        'served by wico': { bg: 'rgba(219,234,254,0.75)', border: 'rgba(29,78,216,0.30)', text: '#1e3a8a' },
        'for budget staff': { bg: 'rgba(237,233,254,0.70)', border: 'rgba(109,40,217,0.30)', text: '#5b21b6' },
        'for budget director': { bg: 'rgba(237,233,254,0.90)', border: 'rgba(109,40,217,0.40)', text: '#4c1d95' },
        'for purchase': { bg: 'rgba(207,250,254,0.65)', border: 'rgba(8,145,178,0.30)', text: '#155e75' },
        'po on process': { bg: 'rgba(207,250,254,0.85)', border: 'rgba(8,145,178,0.40)', text: '#0e4f63' },
        'unserved': { bg: 'rgba(253,230,138,0.35)', border: 'rgba(202,138,4,0.28)', text: '#a16207' },
        'served': { bg: 'rgba(187,247,208,0.55)', border: 'rgba(4,120,87,0.35)', text: '#065f46' },
    };
    return map[(status ?? '').toLowerCase()] ?? {
        bg: 'rgba(241,245,249,0.85)', text: '#475569', border: 'rgba(148,163,184,0.38)',
    };
}

function StatusBadge({ status, t, isDark }: { status: string | null; t: Theme; isDark: boolean }) {
    const colors = getStatusColors(status, t, isDark);
    return (
        <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 6,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
            textTransform: 'uppercase', whiteSpace: 'nowrap',
            background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
        }}>
            {status?.toUpperCase() ?? '—'}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function buildQuery(fs: FilterState): AdminQuery {
    return {
        role: 'admin-access',
        statuses: fs.activeStatuses.map(status =>
            status === 'For Budget Director' ? 'For Certification' : status
        ),
        department: fs.allDepts ? null : (fs.selectedDeptId ?? null),
        kind: fs.allDepts ? null : (fs.selectedDeptKind ?? null),
        allDepartments: fs.allDepts,
        sortBy: fs.sortBy,
        sortDir: fs.sortDir,
        requisitionNo: fs.searchEnabled && fs.searchValue.length === 10
            ? fs.searchValue
            : null,
        schoolYear: fs.schoolYearEnabled && fs.schoolYear ? fs.schoolYear : null,
        paymentForm:
            fs.paymentFormEnabled
                && fs.paymentForm
                ? fs.paymentForm
                : null,
        dateFrom: fs.dateRangeEnabled && fs.dateFrom ? fs.dateFrom : null,
        dateTo: fs.dateRangeEnabled && fs.dateTo ? fs.dateTo : null,
    };
}

function formatAmount(amount: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
    }).format(amount);
}

function cellStyle(t: Theme, total: number, i: number): React.CSSProperties {
    return {
        padding: '11px 16px', fontSize: 13, color: t.cellText,
        borderBottom: `1px solid ${t.rowBorder}`,
        borderRight: i < total - 1 ? `1px solid ${t.rowBorder}` : 'none',
        whiteSpace: 'nowrap',
    };
}

/** Row tint for entries tagged for_liquidation — distinct from status colors,
 *  since the tag is independent of the row's status. */
function liquidationRowBg(isDark: boolean): string {
    return isDark ? 'rgba(234,179,8,0.10)' : 'rgba(234,179,8,0.08)';
}
function liquidationRowHoverBg(isDark: boolean): string {
    return isDark ? 'rgba(234,179,8,0.16)' : 'rgba(234,179,8,0.13)';
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast — matches the BudgetView pattern for a uniform feel
// ─────────────────────────────────────────────────────────────────────────────
type ToastKind = 'success' | 'error' | 'info';
interface ToastItem { id: number; kind: ToastKind; message: string }

const TOAST_CFG: Record<ToastKind, {
    dark: { bg: string; border: string; text: string };
    light: { bg: string; border: string; text: string };
    Icon: React.ComponentType<{ className?: string }>;
}> = {
    success: {
        dark: { bg: 'rgba(2,44,20,0.98)', border: 'rgba(74,222,128,0.55)', text: '#4ade80' },
        light: { bg: 'rgba(240,253,244,1)', border: 'rgba(22,163,74,0.50)', text: '#15803d' },
        Icon: CheckCircle2,
    },
    error: {
        dark: { bg: 'rgba(60,7,7,0.98)', border: 'rgba(248,113,113,0.55)', text: '#f87171' },
        light: { bg: 'rgba(254,242,242,1)', border: 'rgba(239,68,68,0.50)', text: '#b91c1c' },
        Icon: AlertCircle,
    },
    info: {
        dark: { bg: 'rgba(7,19,54,0.98)', border: 'rgba(99,155,255,0.55)', text: '#60a5fa' },
        light: { bg: 'rgba(239,246,255,1)', border: 'rgba(37,99,235,0.45)', text: '#1d4ed8' },
        Icon: Info,
    },
};

function Toasts({
    items, isDark, onDismiss,
}: { items: ToastItem[]; isDark: boolean; onDismiss: (id: number) => void }) {
    if (items.length === 0) return null;
    return (
        <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5" style={{ maxWidth: 340 }}>
            <style>{`@keyframes toast-in{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>
            {items.map(item => {
                const cfg = TOAST_CFG[item.kind];
                const s = isDark ? cfg.dark : cfg.light;
                return (
                    <div
                        key={item.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold"
                        style={{
                            background: s.bg, border: `1px solid ${s.border}`, color: s.text,
                            animation: 'toast-in .22s ease-out',
                            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,.7)' : '0 4px 20px rgba(0,0,0,.12)',
                        }}
                    >
                        <cfg.Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1">{item.message}</span>
                        <button onClick={() => onDismiss(item.id)} style={{ opacity: .6 }} className="hover:opacity-100 transition-opacity">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminView
// ─────────────────────────────────────────────────────────────────────────────
interface AdminViewProps {
    t: Theme;
    isDark: boolean;
    canSwitch: boolean;
    onSwitchRole: () => void;
    departments?: DeptOption[];
    sections?: DeptOption[];
}

export function AdminView({ t, isDark, canSwitch, onSwitchRole, departments = [], sections = [] }: AdminViewProps) {
    const { user } = useRouteContext({ strict: false });
    const currentUser = user
        ? { id: user.username ?? '', name: user.name ?? user.username ?? '' }
        : { id: '', name: '' };

    const [filterState, setFilterState] = useState<FilterState>(() => makeDefaultFilterState(FILTER_CFG));
    const [rows, setRows] = useState<AdminRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [queried, setQueried] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [currentSchoolYear, setCurrentSchoolYear] = useState<string | null>(null);
    const [schoolYears, setSchoolYears] = useState<string[]>([]);

    // Unique school years for the School Year filter dropdown — fetched once
    useEffect(() => {
        financeSvc.get('/abms/requisition-process/school-years')
            .then(res => setSchoolYears(res.data?.data ?? []))
            .catch(() => { /* dropdown just stays empty on failure */ });
    }, []);

    // ── Modal state ───────────────────────────────────────────────────────────
    const [selectedRow, setSelectedRow] = useState<RSProcessRow | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    // ── Accounts modal state ────────────────────────────────────────────────
    const [accountsModalOpen, setAccountsModalOpen] = useState(false);
    const [accounts, setAccounts] = useState<AccountRow[]>([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [accountsError, setAccountsError] = useState<string | null>(null);

    // ── Toast state — matches BudgetView pattern ───────────────────────
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const toastCounter = useRef(0);

    const addToast = useCallback((kind: ToastKind, message: string) => {
        const id = ++toastCounter.current;
        setToasts(prev => [...prev, { id, kind, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const deptOptions: DeptOption[] = [
        ...departments.map(d => ({ ...d, kind: 'Department' as const })),
        ...sections.map(s => ({ ...s, kind: 'Section' as const })),
    ];

    const handleFilterChange = useCallback(
        (patch: Partial<FilterState>) => setFilterState(prev => ({ ...prev, ...patch })),
        []
    );

    const handleRequery = useCallback(async () => {
        setError(null);
        const parsed = AdminQuerySchema.safeParse(buildQuery(filterState));
        if (!parsed.success) {
            setError(parsed.error?.errors?.map(e => e.message).join(' · ') ?? 'Validation error.');
            return;
        }
        setLoading(true);
        try {
            const res = await financeSvc.get('/abms/requisition-process/getrs', {
                params: { ...parsed.data, per_page: 10 },
            });
            setRows(res.data.data ?? []);
            setNextCursor(res.data.meta?.next_cursor ?? null);
            setHasMore(res.data.meta?.has_more ?? false);
            setCurrentSchoolYear(res.data.meta?.current_school_year ?? null);
            setQueried(true);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Failed to fetch data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [filterState]);

    const handleLoadMore = useCallback(async () => {
        if (!nextCursor || loading) return;
        const parsed = AdminQuerySchema.safeParse(buildQuery(filterState));
        if (!parsed.success) return;
        setLoading(true);
        try {
            const res = await financeSvc.get('/abms/requisition-process/getrs', {
                params: { ...parsed.data, per_page: 10, cursor: nextCursor },
            });
            setRows(prev => [...prev, ...(res.data.data ?? [])]);
            setNextCursor(res.data.meta?.next_cursor ?? null);
            setHasMore(res.data.meta?.has_more ?? false);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Failed to fetch more data.');
        } finally {
            setLoading(false);
        }
    }, [filterState, nextCursor, loading]);

    // Handle row click — fetch line items then open modal
    const handleRowClick = useCallback(async (row: AdminRow) => {
        setModalError(null);
        setModalLoading(true);
        setSelectedRow(row as RSProcessRow);
        try {
            const res = await financeSvc.get('/abms/requisition-process/getrsitems', {
                params: { id: row.id },
            });
            const items = res.data.data ?? [];
            setSelectedRow({
                ...row,
                note: row.note ?? null,
                items,
            } as RSProcessRow);

        } catch (err: any) {
            setModalError(err?.response?.data?.message ?? 'Failed to load RS details.');
        } finally {
            setModalLoading(false);
        }
    }, []);

    // Admin's status-transition actions — one-way, close the modal and
    // requery after applying. Mirrors the ROLE_ACTIONS entry for
    // 'admin-access' in RSProcessModal ('Disapprove'), plus 'Reprocess RS'
    // which admin shares with budget-access via COMMON_ACTIONS, plus the
    // Forward-to… group ('Forward to Stockroom' and 'Forward to BAO' wired
    // so far — extend this list as each remaining destination's backend
    // mapping is added).
    //
    // NOTE: 'Approve RS' / 'Reject RS' were removed — no button in
    // RSProcessModal ever emits those action strings for admin-access (the
    // real button is labeled 'Disapprove'), so they were dead entries that
    // masked the fact that 'Disapprove' was never wired up.
    const STATUS_ACTIONS = ['Forward to Controller', 'Disapprove', 'Reprocess RS', 'Send RS to Staff', 'For Pricing', 'Forward to Stockroom', 'Forward to BAO', 'Forward to Accounting', 'Forward to Acctg. Director', 'Forward to HRMDO', 'Forward to Cash Management', 'For Purchase'];

    // Handle action button in modal
    const handleModalAction = useCallback(async (action: string, row: RSProcessRow) => {
        if (action === 'View Accounts') {
            setAccountsModalOpen(true);
            setAccountsError(null);
            setAccountsLoading(true);
            try {
                const res = await financeSvc.get('/abms/budget-request-entry/accounts', {
                    params: {
                        departmentId: row.kind === 'Department' ? row.department_id : null,
                        sectionId: row.kind === 'Section' ? row.section_id : null,
                        currentSchoolYear,
                    },
                });
                setAccounts(res.data.accounts ?? []);
            } catch (err: any) {
                setAccountsError(err?.response?.data?.message ?? 'Failed to load accounts.');
            } finally {
                setAccountsLoading(false);
            }
            return;
        }

        // 'For Liquidation' and 'Cash Advance' are revertible tags, not
        // one-way status transitions — keep the modal open and patch the row
        // in place instead of closing it like the STATUS_ACTIONS below.
        if (action === 'For Liquidation' || action === 'Cash Advance') {
            setModalError(null);
            setModalLoading(true);
            try {
                const res = await financeSvc.put(`/abms/requisition-process/${row.id}`, { action });
                if (action === 'For Liquidation') {
                    const updated = !!res.data?.data?.for_liquidation;
                    setSelectedRow(prev => prev ? { ...prev, for_liquidation: updated } : prev);
                    addToast('success', updated
                        ? `RS ${row.requisition_no} marked for liquidation.`
                        : `RS ${row.requisition_no} unmarked for liquidation.`);
                } else {
                    const updated = !!res.data?.data?.is_cash_advance;
                    setSelectedRow(prev => prev ? { ...prev, is_cash_advance: updated } : prev);
                    addToast('success', updated
                        ? `RS ${row.requisition_no} tagged as cash advance.`
                        : `RS ${row.requisition_no} untagged as cash advance.`);
                }
                await handleRequery();
            } catch (err: any) {
                const message = err?.response?.data?.message ?? 'Failed to update RS.';
                setModalError(message);
                addToast('error', message);
            } finally {
                setModalLoading(false);
            }
            return;
        }

        if (STATUS_ACTIONS.includes(action)) {
            setModalError(null);
            setModalLoading(true);
            try {
                await financeSvc.put(`/abms/requisition-process/${row.id}`, { action });
                setSelectedRow(null);
                addToast('success', `"${action}" applied to RS ${row.requisition_no}.`);
                await handleRequery();
            } catch (err: any) {
                const message = err?.response?.data?.message ?? 'Failed to update RS.';
                setModalError(message);
                addToast('error', message);
            } finally {
                setModalLoading(false);
            }
            return;
        }

        // 'Save Note' — modal already did the PATCH; just sync local state + toast.
        if (action === 'Save Note') {
            setSelectedRow(prev => prev ? { ...prev, note: row.note ?? null } : prev);
            setRows(prev => prev.map(r => r.id === row.id ? { ...r, note: row.note ?? null } : r));
            addToast('success', `Note saved for RS ${row.requisition_no}.`);
            return;
        }

        // 'Save Items' — modal already did the PUT to /items and recalculated
        // balances server-side; just sync local state (items + the new
        // total_amount) + toast. Unlike the STATUS_ACTIONS above, this never
        // changes status/location, so the modal stays open afterward.
        if (action === 'Save Items') {
            setSelectedRow(prev => prev ? { ...prev, items: row.items, total_amount: row.total_amount } : prev);
            setRows(prev => prev.map(r => r.id === row.id ? { ...r, total_amount: row.total_amount } : r));
            addToast('success', `Items updated for RS ${row.requisition_no}.`);
            return;
        }

        // 'Accept Quoted Prices' — modal already did the PUT to
        // /accept-quoted-prices and recalculated balances server-side.
        // Sync the updated items + total_amount into local state and toast.
        // The modal stays open so the admin can see the updated figures
        // and proceed with the next action (e.g. forward to stockroom).
        if (action === 'Accept Quoted Prices') {
            setSelectedRow(prev => prev ? { ...prev, items: row.items, total_amount: row.total_amount } : prev);
            setRows(prev => prev.map(r => r.id === row.id ? { ...r, total_amount: row.total_amount } : r));
            addToast('success', `Quoted prices accepted for RS ${row.requisition_no}. Costs and balances updated.`);
            return;
        }

        addToast('info', `"${action}" isn't wired up yet for this role.`);
    }, [currentSchoolYear, handleRequery, addToast]);


    const wiredFilterCfg = {
        ...FILTER_CFG,
        department: FILTER_CFG.department
            ? { ...FILTER_CFG.department, deptOptions }
            : undefined,
        schoolYear: FILTER_CFG.schoolYear
            ? { ...FILTER_CFG.schoolYear, options: schoolYears }
            : undefined,
        actions: FILTER_CFG.actions?.map(a =>
            a.label === 'Requery' ? { ...a, onClick: handleRequery } : a
        ),
    };

    return (
        <>
            {/* ── Toasts ──────────────────────────────────────────────── */}
            <Toasts
                items={toasts}
                isDark={isDark}
                onDismiss={id => setToasts(p => p.filter(t => t.id !== id))}
            />

            <RolePage
                role={ROLE}
                t={t}
                isDark={isDark}
                canSwitch={canSwitch}
                onSwitchRole={onSwitchRole}
                filterState={filterState}
                onFilterChange={handleFilterChange}
                filterConfigOverride={wiredFilterCfg}
            >
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                    <thead>
                        <tr style={{ background: t.tableHeadBg }}>
                            {COLUMNS.map((col, i) => (
                                <th key={col} style={{
                                    padding: '11px 16px',
                                    fontSize: 11, fontWeight: 700,
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                    color: t.tableHeadText,
                                    borderBottom: `2px solid ${t.tableHeadBorder}`,
                                    borderRight: i < COLUMNS.length - 1 ? `1px solid ${t.tableHeadBorder}` : 'none',
                                    textAlign: 'left', whiteSpace: 'nowrap',
                                }}>
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && rows.length === 0 && (
                            <tr>
                                <td colSpan={COLUMNS.length} style={{ padding: '52px 16px', textAlign: 'center', fontSize: 13, color: t.cellMuted }}>
                                    Loading…
                                </td>
                            </tr>
                        )}
                        {!loading && error && (
                            <tr>
                                <td colSpan={COLUMNS.length} style={{ padding: '32px 24px', textAlign: 'center' }}>
                                    <span style={{
                                        fontSize: 13, color: t.cellAmber, fontWeight: 600,
                                        background: `${t.cellAmber}1a`, border: `1px solid ${t.cellAmber}4d`,
                                        borderRadius: 8, padding: '8px 18px', display: 'inline-block',
                                    }}>
                                        {error}
                                    </span>
                                </td>
                            </tr>
                        )}
                        {!loading && !error && queried && rows.length === 0 && (
                            <tr>
                                <td colSpan={COLUMNS.length} style={{ padding: '52px 16px', textAlign: 'center', fontSize: 13, color: t.cellMuted }}>
                                    No records found.
                                </td>
                            </tr>
                        )}
                        {!loading && !error && !queried && (
                            <tr>
                                <td colSpan={COLUMNS.length} style={{ padding: '52px 16px', textAlign: 'center', fontSize: 13, color: t.cellMuted }}>
                                    Set your filters and press <strong>Requery</strong> to load records.
                                </td>
                            </tr>
                        )}

                        {/* ── Clickable data rows ── */}
                        {!error && rows.map((row, idx) => {
                            const tagged = !!row.for_liquidation;
                            const baseBg = tagged
                                ? liquidationRowBg(isDark)
                                : (idx % 2 === 0 ? t.rowEvenBg : t.rowOddBg);
                            const hoverBg = tagged ? liquidationRowHoverBg(isDark) : t.rowHoverBg;
                            return (
                                <tr
                                    key={`${row.requisition_no}-${idx}`}
                                    onClick={() => handleRowClick(row)}
                                    style={{
                                        background: baseBg,
                                        cursor: 'pointer',
                                        transition: 'background .1s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                                    onMouseLeave={e => (e.currentTarget.style.background = baseBg)}
                                >
                                    <td style={cellStyle(t, COLUMNS.length, 0)}>
                                        <span style={{ fontSize: 12, color: t.cellMuted, fontVariantNumeric: 'tabular-nums' }}>
                                            {row.date}
                                        </span>
                                    </td>
                                    <td style={cellStyle(t, COLUMNS.length, 1)}>
                                        <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.03em', color: t.cellBlue }}>
                                            {row.requisition_no}
                                        </span>
                                    </td>
                                    <td style={cellStyle(t, COLUMNS.length, 2)}>{row.department_section}</td>
                                    <td style={cellStyle(t, COLUMNS.length, 3)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <img
                                                src={`https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${row.requested_by_empno}_2`}
                                                alt={row.requested_by}
                                                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `1px solid ${t.rowBorder}` }}
                                                onError={e => {
                                                    (e.currentTarget as HTMLImageElement).src =
                                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(row.requested_by)}&size=32&background=random`;
                                                }}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <span style={{ fontSize: 13, color: t.cellText, fontWeight: 500 }}>{row.requested_by}</span>
                                                <span style={{ fontSize: 11, color: t.cellMuted, fontVariantNumeric: 'tabular-nums' }}>{row.requested_by_empno}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ ...cellStyle(t, COLUMNS.length, 4), fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                                        {formatAmount(row.total_amount)}
                                    </td>
                                    <td style={cellStyle(t, COLUMNS.length, 5)}>
                                        <StatusBadge status={row.status} t={t} isDark={isDark} />
                                    </td>
                                    <td style={cellStyle(t, COLUMNS.length, 6)}>
                                        <span style={{
                                            fontSize: 11, fontWeight: 700,
                                            color: Number(row.is_controlled ?? 0) === 1 ? t.cellGreen : Number(row.is_controlled ?? 0) === 2 ? t.cellAmber : t.cellMuted,
                                        }}>
                                            {Number(row.is_controlled ?? 0) === 1 ? 'APPROVED' : Number(row.is_controlled ?? 0) === 2 ? 'DISAPPROVED' : 'PENDING'}
                                        </span>
                                    </td>
                                    <td style={cellStyle(t, COLUMNS.length, 7)}>
                                        <span style={{ color: t.cellMuted, textTransform: 'uppercase' }}>{row.location ?? '—'}</span>
                                    </td>
                                    <td style={{ ...cellStyle(t, COLUMNS.length, 8), borderRight: 'none' }}>
                                        <span style={{ color: t.cellMuted, textTransform: 'uppercase' }}>{row.from ?? '—'}</span>
                                    </td>
                                </tr>
                            );
                        })}

                        {!loading && !error && hasMore && rows.length > 0 && (
                            <tr>
                                <td colSpan={COLUMNS.length} style={{ padding: '16px', textAlign: 'center' }}>
                                    <button
                                        onClick={handleLoadMore}
                                        style={{
                                            padding: '8px 20px', fontSize: 13, fontWeight: 600,
                                            color: t.cellBlue, background: 'transparent',
                                            border: `1px solid ${t.cellBlue}66`, borderRadius: 6,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Load More
                                    </button>
                                </td>
                            </tr>
                        )}
                        {loading && rows.length > 0 && (
                            <tr>
                                <td colSpan={COLUMNS.length} style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: t.cellMuted }}>
                                    Loading more…
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </RolePage>

            {/* ── RS Process Modal ───────────────────────────────────── */}
            {selectedRow && (
                <RSProcessModal
                    row={selectedRow}
                    roleKey="admin-access"
                    roleLabel="Administration"
                    t={t}
                    isDark={isDark}
                    isLoading={modalLoading}
                    error={modalError}
                    onClose={() => { setSelectedRow(null); setModalError(null); }}
                    onAction={handleModalAction}
                    currentUser={currentUser}
                />
            )}

            {/* ── Accounts View Modal ────────────────────────────────── */}
            {accountsModalOpen && (
                <AccountsViewModal
                    t={t}
                    isDark={isDark}
                    departmentSectionName={selectedRow?.department_section ?? ''}
                    accounts={accounts}
                    isLoading={accountsLoading}
                    error={accountsError}
                    onClose={() => { setAccountsModalOpen(false); setAccounts([]); setAccountsError(null); }}
                />
            )}
        </>
    );
}
