import React, { useState, useCallback } from 'react';
import { z } from 'zod';
import { financeSvc } from '@repo/axios-config/finance-service';
import { Theme, FilterState, makeDefaultFilterState, DeptOption } from '../shared/types';
import { ROLES, ROLE_FILTER_CONFIGS, ROLE_COLUMNS } from '../shared/constants';
import { RolePage } from '../shared/components/RolePage';

// ─────────────────────────────────────────────────────────────────────────────
// Zod — query schema
// ─────────────────────────────────────────────────────────────────────────────
const AccountingQuerySchema = z.object({
    role: z.literal('accounting-access'),
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
});

export type AccountingQuery = z.infer<typeof AccountingQuerySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Response row type
// ─────────────────────────────────────────────────────────────────────────────
export interface AccountingRow {
    date: string;
    requisition_no: string;
    department_section: string;
    requested_by: string;
    requested_by_empno: string;
    total_amount: number;
    status: string | null;
    location: string | null;
    from: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const ROLE = ROLES.find(r => r.key === 'accounting-access')!;
const FILTER_CFG = ROLE_FILTER_CONFIGS['accounting-access']!;
const COLUMNS = ROLE_COLUMNS['accounting-access'];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'for review':        { bg: 'rgba(251,191,36,0.15)',  text: '#b45309', border: 'rgba(251,191,36,0.40)'  },
    'for certification': { bg: 'rgba(96,165,250,0.15)',  text: '#1d4ed8', border: 'rgba(96,165,250,0.40)'  },
    'certified':         { bg: 'rgba(74,222,128,0.15)',  text: '#047857', border: 'rgba(74,222,128,0.40)'  },
    'unserved':          { bg: 'rgba(248,113,113,0.15)', text: '#b91c1c', border: 'rgba(248,113,113,0.40)' },
    'served':            { bg: 'rgba(167,243,208,0.15)', text: '#065f46', border: 'rgba(167,243,208,0.50)' },
};

function StatusBadge({ status }: { status: string | null }) {
    const colors = STATUS_COLORS[(status ?? '').toLowerCase()] ?? {
        bg: 'rgba(148,163,184,0.15)', text: '#64748b', border: 'rgba(148,163,184,0.35)',
    };
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
function buildQuery(fs: FilterState): AccountingQuery {
    return {
        role: 'accounting-access',
        statuses: fs.activeStatuses,
        department: fs.allDepts ? null : (fs.selectedDeptId ?? null),
        kind: fs.allDepts ? null : (fs.selectedDeptKind ?? null),
        allDepartments: fs.allDepts,
        sortBy: fs.sortBy,
        sortDir: fs.sortDir,
        requisitionNo: fs.searchEnabled && fs.searchValue.length === 10
            ? fs.searchValue
            : null,
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

// ─────────────────────────────────────────────────────────────────────────────
// AccountingView
// ─────────────────────────────────────────────────────────────────────────────
interface AccountingViewProps {
    t: Theme;
    isDark: boolean;
    canSwitch: boolean;
    onSwitchRole: () => void;
    departments?: DeptOption[];
    sections?: DeptOption[];
}

export function AccountingView({ t, isDark, canSwitch, onSwitchRole, departments = [], sections = [] }: AccountingViewProps) {
    const [filterState, setFilterState] = useState<FilterState>(
        () => makeDefaultFilterState(FILTER_CFG)
    );
    const [rows, setRows] = useState<AccountingRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [queried, setQueried] = useState(false);

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

        const parsed = AccountingQuerySchema.safeParse(buildQuery(filterState));
        if (!parsed.success) {
            setError(parsed.error?.errors?.map(e => e.message).join(' · ') ?? 'Validation error.');
            return;
        }

        setLoading(true);
        try {
            const res = await financeSvc.get('/abms/requisition-process/getrs', {
                params: parsed.data,
            });
            setRows(res.data.data ?? []);
            setQueried(true);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Failed to fetch data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [filterState]);

    const wiredFilterCfg = {
        ...FILTER_CFG,
        department: FILTER_CFG.department
            ? { ...FILTER_CFG.department, deptOptions }
            : undefined,
        actions: FILTER_CFG.actions?.map(a =>
            a.label === 'Requery' ? { ...a, onClick: handleRequery } : a
        ),
    };

    return (
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
                    {loading && (
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
                                    fontSize: 13, color: '#b91c1c', fontWeight: 600,
                                    background: 'rgba(248,113,113,0.10)',
                                    border: '1px solid rgba(248,113,113,0.30)',
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

                    {!loading && !error && rows.map((row, idx) => (
                        <tr
                            key={`${row.requisition_no}-${idx}`}
                            style={{ background: idx % 2 === 0 ? t.rowEvenBg : t.rowOddBg, transition: 'background .1s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = t.rowHoverBg)}
                            onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? t.rowEvenBg : t.rowOddBg)}
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
                            <td style={cellStyle(t, COLUMNS.length, 2)}>
                                {row.department_section}
                            </td>
                            <td style={cellStyle(t, COLUMNS.length, 3)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <img
                                        src={`https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${row.requested_by_empno}_2`}
                                        alt={row.requested_by}
                                        style={{
                                            width: 32, height: 32, borderRadius: '50%',
                                            objectFit: 'cover', flexShrink: 0,
                                            border: `1px solid ${t.rowBorder}`,
                                        }}
                                        onError={e => {
                                            (e.currentTarget as HTMLImageElement).src =
                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(row.requested_by)}&size=32&background=random`;
                                        }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <span style={{ fontSize: 13, color: t.cellText, fontWeight: 500 }}>
                                            {row.requested_by}
                                        </span>
                                        <span style={{ fontSize: 11, color: t.cellMuted, fontVariantNumeric: 'tabular-nums' }}>
                                            {row.requested_by_empno}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ ...cellStyle(t, COLUMNS.length, 4), fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                                {formatAmount(row.total_amount)}
                            </td>
                            <td style={cellStyle(t, COLUMNS.length, 5)}>
                                <StatusBadge status={row.status} />
                            </td>
                            <td style={cellStyle(t, COLUMNS.length, 6)}>
                                <span style={{ color: t.cellMuted, textTransform: 'uppercase' }}>{row.location ?? '—'}</span>
                            </td>
                            <td style={{ ...cellStyle(t, COLUMNS.length, 7), borderRight: 'none' }}>
                                <span style={{ color: t.cellMuted, textTransform: 'uppercase' }}>{row.from ?? '—'}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </RolePage>
    );
}