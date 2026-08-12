import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouteContext } from '@tanstack/react-router';
import { financeSvc } from '@repo/axios-config/finance-service';
import { toast, Toaster } from 'sonner';
import { z } from 'zod';
import { Theme, FilterState, makeDefaultFilterState, DeptOption } from '../shared/types';
import { ROLES, ROLE_FILTER_CONFIGS, ROLE_COLUMNS } from '../shared/constants';
import { RolePage } from '../shared/components/RolePage';
import { RSProcessModal, RSProcessRow } from '../shared/components/RSProcessModal';
import { InfiniteScrollSentinel } from '../../../../components/InfiniteScrollSentinel';

const AccountingQuerySchema = z.object({
    role: z.literal('accounting-access'),
    statuses: z.array(z.string()).min(1, 'At least one status is required'),
    department: z.string().nullable(),
    kind: z.enum(['Department', 'Section']).nullable(),
    allDepartments: z.boolean(),
    sortBy: z.string().min(1, 'Sort column is required'),
    sortDir: z.enum(['asc', 'desc']),
    requisitionNo: z.string().regex(/^\d{10}$/, 'Requisition No. must be exactly 10 digits').nullable(),
    schoolYear: z.string().nullable(),
    paymentForm: z.string().nullable(),
    dateFrom: z.string().nullable(),
    dateTo: z.string().nullable(),
});

type AccountingQuery = z.infer<typeof AccountingQuerySchema>;

interface AccountingRow extends RSProcessRow {
    department_id: number | string | null;
    section_id: number | string | null;
    kind: 'Department' | 'Section';
}

interface AccountingViewProps {
    t: Theme;
    isDark: boolean;
    canSwitch: boolean;
    onSwitchRole: () => void;
    departments?: DeptOption[];
    sections?: DeptOption[];
}

const ROLE = ROLES.find(role => role.key === 'accounting-access')!;
const FILTER_CFG = ROLE_FILTER_CONFIGS['accounting-access']!;
const COLUMNS = ROLE_COLUMNS['accounting-access'];

function buildQuery(filters: FilterState): AccountingQuery {
    return {
        role: 'accounting-access',
        statuses: filters.activeStatuses,
        department: filters.allDepts ? null : (filters.selectedDeptId ?? null),
        kind: filters.allDepts ? null : (filters.selectedDeptKind ?? null),
        allDepartments: filters.allDepts,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
        requisitionNo: filters.searchEnabled && filters.searchValue.length === 10 ? filters.searchValue : null,
        schoolYear: filters.schoolYearEnabled && filters.schoolYear ? filters.schoolYear : null,
        paymentForm: filters.paymentFormEnabled && filters.paymentForm ? filters.paymentForm : null,
        dateFrom: filters.dateRangeEnabled && filters.dateFrom ? filters.dateFrom : null,
        dateTo: filters.dateRangeEnabled && filters.dateTo ? filters.dateTo : null,
    };
}

function formatAmount(amount: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
    }).format(amount);
}

function apiErrorMessage(error: unknown, fallback: string): string {
    return (error as { response?: { data?: { message?: string } } })
        .response?.data?.message ?? fallback;
}

function cellStyle(t: Theme, total: number, index: number): React.CSSProperties {
    return {
        padding: '11px 16px', fontSize: 13, color: t.cellText,
        borderBottom: `1px solid ${t.rowBorder}`,
        borderRight: index < total - 1 ? `1px solid ${t.rowBorder}` : 'none',
        whiteSpace: 'nowrap',
    };
}

function StatusBadge({ status, t }: { status: string | null; t: Theme }) {
    const certified = (status ?? '').trim().toLowerCase() === 'certified';
    const color = certified ? t.cellGreen : t.cellMuted;
    return (
        <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 6,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
            textTransform: 'uppercase', whiteSpace: 'nowrap',
            background: `${color}1f`, color, border: `1px solid ${color}66`,
        }}>
            {status?.toUpperCase() ?? '—'}
        </span>
    );
}

export function AccountingView({ t, isDark, canSwitch, onSwitchRole, departments = [], sections = [] }: AccountingViewProps) {
    const { user } = useRouteContext({ strict: false });
    const currentUser = user
        ? { id: user.username ?? '', name: user.name ?? user.username ?? '' }
        : { id: '', name: '' };
    const [filterState, setFilterState] = useState<FilterState>(() => makeDefaultFilterState(FILTER_CFG));
    const [rows, setRows] = useState<AccountingRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const loadMoreInFlightRef = useRef(false);
    const [error, setError] = useState<string | null>(null);
    const [queried, setQueried] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [schoolYears, setSchoolYears] = useState<string[]>([]);
    const [selectedRow, setSelectedRow] = useState<RSProcessRow | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    useEffect(() => {
        financeSvc.get('/abms/requisition-process/school-years')
            .then(response => setSchoolYears(response.data?.data ?? []))
            .catch(() => undefined);
    }, []);

    const deptOptions: DeptOption[] = [
        ...departments.map(department => ({ ...department, kind: 'Department' as const })),
        ...sections.map(section => ({ ...section, kind: 'Section' as const })),
    ];

    const handleFilterChange = useCallback((patch: Partial<FilterState>) => {
        setFilterState(previous => ({ ...previous, ...patch }));
    }, []);

    const handleRequery = useCallback(async () => {
        setError(null);
        const parsed = AccountingQuerySchema.safeParse(buildQuery(filterState));
        if (!parsed.success) {
            setError(parsed.error.errors.map(item => item.message).join(' · '));
            return;
        }
        setLoading(true);
        setNextCursor(null);
        setHasMore(false);
        setRows([]);
        try {
            const response = await financeSvc.get('/abms/requisition-process/getrs', {
                params: { ...parsed.data, per_page: 10 },
            });
            setRows(response.data?.data ?? []);
            setNextCursor(response.data?.meta?.next_cursor ?? null);
            setHasMore(!!response.data?.meta?.has_more);
            setQueried(true);
        } catch (requestError: unknown) {
            setError(apiErrorMessage(requestError, 'Failed to fetch data. Please try again.'));
        } finally {
            setLoading(false);
        }
    }, [filterState]);

    const handleLoadMore = useCallback(async () => {
        if (!nextCursor || loading || loadingMore || loadMoreInFlightRef.current) return false;
        const parsed = AccountingQuerySchema.safeParse(buildQuery(filterState));
        if (!parsed.success) return false;
        loadMoreInFlightRef.current = true;
        setLoadingMore(true);
        try {
            const response = await financeSvc.get('/abms/requisition-process/getrs', {
                params: { ...parsed.data, per_page: 10, cursor: nextCursor },
            });
            setRows(previous => {
                const existingIds = new Set(previous.map(row => row.id));
                return [...previous, ...(response.data?.data ?? []).filter((row: AccountingRow) => !existingIds.has(row.id))];
            });
            setNextCursor(response.data?.meta?.next_cursor ?? null);
            setHasMore(!!response.data?.meta?.has_more);
            return true;
        } catch {
            return false;
        } finally {
            loadMoreInFlightRef.current = false;
            setLoadingMore(false);
        }
    }, [filterState, loading, loadingMore, nextCursor]);

    const handleRowClick = useCallback(async (row: AccountingRow) => {
        setSelectedRow(row);
        setModalError(null);
        setModalLoading(true);
        try {
            const response = await financeSvc.get('/abms/requisition-process/getrsitems', { params: { id: row.id } });
            setSelectedRow({ ...row, items: response.data?.data ?? [] });
        } catch (requestError: unknown) {
            setModalError(apiErrorMessage(requestError, 'Failed to load RS details.'));
        } finally {
            setModalLoading(false);
        }
    }, []);

    const handleModalAction = useCallback(async (action: string, row: RSProcessRow) => {
        if (action !== 'Return to Administration') {
            return;
        }
        setModalError(null);
        setModalLoading(true);
        try {
            await financeSvc.put(`/abms/requisition-process/${row.id}`, { action });
            setSelectedRow(null);
            toast.success(`RS ${row.requisition_no} returned to Budget for correction.`);
            await handleRequery();
        } catch (requestError: unknown) {
            const message = apiErrorMessage(requestError, 'Failed to return the RS to Budget.');
            setModalError(message);
            toast.error(message);
        } finally {
            setModalLoading(false);
        }
    }, [handleRequery]);

    const wiredFilterCfg = {
        ...FILTER_CFG,
        department: FILTER_CFG.department ? { ...FILTER_CFG.department, deptOptions } : undefined,
        schoolYear: FILTER_CFG.schoolYear ? { ...FILTER_CFG.schoolYear, options: schoolYears } : undefined,
        actions: FILTER_CFG.actions?.map(action => action.label === 'Requery'
            ? { ...action, onClick: handleRequery }
            : action),
    };

    return (
        <>
            <Toaster richColors position="top-right" />
            <RolePage
                role={ROLE} t={t} isDark={isDark} canSwitch={canSwitch}
                onSwitchRole={onSwitchRole} filterState={filterState}
                onFilterChange={handleFilterChange} filterConfigOverride={wiredFilterCfg}
            >
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                    <thead>
                        <tr style={{ background: t.tableHeadBg }}>
                            {COLUMNS.map((column, index) => (
                                <th key={column} style={{
                                    padding: '11px 16px', fontSize: 11, fontWeight: 700,
                                    textTransform: 'uppercase', letterSpacing: '0.08em', color: t.tableHeadText,
                                    borderBottom: `2px solid ${t.tableHeadBorder}`,
                                    borderRight: index < COLUMNS.length - 1 ? `1px solid ${t.tableHeadBorder}` : 'none',
                                    textAlign: 'left', whiteSpace: 'nowrap',
                                }}>{column}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && rows.length === 0 && <tr><td colSpan={COLUMNS.length} style={{ padding: 52, textAlign: 'center', color: t.cellMuted }}>Loading…</td></tr>}
                        {!loading && error && <tr><td colSpan={COLUMNS.length} style={{ padding: 32, textAlign: 'center', color: t.cellAmber }}>{error}</td></tr>}
                        {!loading && !error && queried && rows.length === 0 && <tr><td colSpan={COLUMNS.length} style={{ padding: 52, textAlign: 'center', color: t.cellMuted }}>No records found.</td></tr>}
                        {!loading && !error && !queried && <tr><td colSpan={COLUMNS.length} style={{ padding: 52, textAlign: 'center', color: t.cellMuted }}>Set your filters and press <strong>Requery</strong> to load records.</td></tr>}
                        {!error && rows.map((row, rowIndex) => {
                            const baseBackground = rowIndex % 2 === 0 ? t.rowEvenBg : t.rowOddBg;
                            return (
                                <tr
                                    key={row.id} onClick={() => handleRowClick(row)}
                                    style={{ background: baseBackground, cursor: 'pointer', transition: 'background .1s' }}
                                    onMouseEnter={event => { event.currentTarget.style.background = t.rowHoverBg; }}
                                    onMouseLeave={event => { event.currentTarget.style.background = baseBackground; }}
                                >
                                    <td style={cellStyle(t, COLUMNS.length, 0)}>{row.date}</td>
                                    <td style={{ ...cellStyle(t, COLUMNS.length, 1), color: t.cellBlue, fontWeight: 700 }}>{row.requisition_no}</td>
                                    <td style={cellStyle(t, COLUMNS.length, 2)}>{row.department_section}</td>
                                    <td style={cellStyle(t, COLUMNS.length, 3)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <img
                                                src={`https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${row.requested_by_empno}_2`}
                                                alt={row.requested_by}
                                                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${t.rowBorder}` }}
                                            />
                                            <div><div>{row.requested_by}</div><small style={{ color: t.cellMuted }}>{row.requested_by_empno}</small></div>
                                        </div>
                                    </td>
                                    <td style={{ ...cellStyle(t, COLUMNS.length, 4), fontWeight: 600 }}>{formatAmount(row.total_amount)}</td>
                                    <td style={cellStyle(t, COLUMNS.length, 5)}><StatusBadge status={row.status} t={t} /></td>
                                    <td style={{ ...cellStyle(t, COLUMNS.length, 6), textTransform: 'uppercase', color: t.cellMuted }}>{row.location ?? '—'}</td>
                                    <td style={{ ...cellStyle(t, COLUMNS.length, 7), textTransform: 'uppercase', color: t.cellMuted }}>{row.from ?? '—'}</td>
                                </tr>
                            );
                        })}
                        {!error && hasMore && rows.length > 0 && (
                            <tr><td colSpan={COLUMNS.length} style={{ padding: 16, textAlign: 'center', color: t.cellMuted }}>
                                <InfiniteScrollSentinel hasMore={hasMore} loading={loadingMore} loadKey={nextCursor} onLoadMore={handleLoadMore} />
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </RolePage>
            {selectedRow && (
                <RSProcessModal
                    row={selectedRow} roleKey="accounting-access" roleLabel="Accounting"
                    t={t} isDark={isDark} isLoading={modalLoading} error={modalError}
                    onClose={() => { setSelectedRow(null); setModalError(null); }}
                    onAction={handleModalAction} currentUser={currentUser}
                />
            )}
        </>
    );
}
