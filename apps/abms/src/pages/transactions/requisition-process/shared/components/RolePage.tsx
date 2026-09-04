import React, { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Theme, FilterState, FilterPanelConfig } from '../types';
import { ROLES, ROLE_COLUMNS, ROLE_FILTER_CONFIGS } from '../constants';
import { FilterPanel } from './FilterPanel';
import { PageHeader } from '../../../../../components/ui/Page';

interface RolePageProps {
    role: typeof ROLES[number];
    t: Theme;
    isDark: boolean;
    canSwitch: boolean;
    onSwitchRole: () => void;
    // Controlled filter — parent owns state + can override config (e.g. wire onClick)
    filterState?: FilterState;
    onFilterChange?: (patch: Partial<FilterState>) => void;
    filterConfigOverride?: FilterPanelConfig;
    children?: ReactNode;
}

export function RolePage({
    role, t, isDark, canSwitch, onSwitchRole,
    filterState, onFilterChange, filterConfigOverride,
    children,
}: RolePageProps) {
    const Icon         = role.icon;
    const columns      = ROLE_COLUMNS[role.key];
    const filterConfig = filterConfigOverride ?? ROLE_FILTER_CONFIGS[role.key];

    return (
        <div className="requisition-process-page w-full min-w-0">
            <PageHeader
                className="mb-5"
                title="Requisition Process"
                description="Manage and process requisition slips assigned to your office."
                actions={(
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <div
                            className="flex min-h-11 items-center gap-3 rounded-xl border px-4 py-2"
                            style={{ background: t.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow }}
                        >
                            <span
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                                style={{ background: t.dropdownSelected, borderColor: t.cardBorder }}
                            >
                                <Icon className="h-4 w-4" style={{ color: t.accentColor }} />
                            </span>
                            <span className="text-left">
                                <span className="requisition-process-role-label block text-xs font-bold uppercase tracking-[0.12em]" style={{ color: t.cellMuted }}>Active view</span>
                                <span className="requisition-process-role-name block text-base font-semibold" style={{ color: t.titleColor }}>{role.label}</span>
                            </span>
                        </div>
                        {canSwitch && (
                            <button
                                type="button"
                                onClick={onSwitchRole}
                                className="requisition-process-action inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
                                style={{
                                    borderColor: t.btnRefresh.border,
                                    background: t.btnRefresh.bg,
                                    color: t.btnRefresh.text,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = t.btnRefresh.hover)}
                                onMouseLeave={e => (e.currentTarget.style.background = t.btnRefresh.bg)}
                            >
                                <RefreshCw className="h-4 w-4" />
                                Switch Role
                            </button>
                        )}
                    </div>
                )}
            />

            {filterConfig && filterState && onFilterChange && (
                <FilterPanel
                    config={filterConfig}
                    t={t}
                    isDark={isDark}
                    state={filterState}
                    onChange={onFilterChange}
                />
            )}

            <section
                className="overflow-hidden rounded-2xl"
                style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}
                aria-label={`${role.label} requisition records`}
            >
                <header
                    className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5"
                    style={{ background: t.cardHeaderBg, borderBottom: `1px solid ${t.cardHeaderBorder}` }}
                >
                    <div className="min-w-0">
                        <h2 className="m-0 text-base font-bold" style={{ color: t.titleColor }}>Requisition records</h2>
                        <p className="mt-1 text-sm" style={{ color: t.cellMuted }}>{role.label} work queue</p>
                    </div>
                    <span
                        className="shrink-0 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.1em]"
                        style={{ background: t.dropdownSelected, borderColor: t.cardBorder, color: t.accentColor }}
                    >
                        {role.label}
                    </span>
                </header>
                <div className="overflow-x-auto">
                    {children ?? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                            <thead>
                                <tr style={{ background: t.tableHeadBg }}>
                                    {columns.map((col, i) => (
                                        <th key={col} style={{
                                            padding: '11px 16px',
                                            fontSize: 11, fontWeight: 700,
                                            textTransform: 'uppercase', letterSpacing: '0.08em',
                                            color: t.tableHeadText,
                                            borderBottom: `2px solid ${t.tableHeadBorder}`,
                                            borderRight: i < columns.length - 1 ? `1px solid ${t.tableHeadBorder}` : 'none',
                                            textAlign: 'left', whiteSpace: 'nowrap',
                                        }}>
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan={columns.length} style={{ padding: '52px 16px', textAlign: 'center', fontSize: 13, color: t.cellMuted }}>
                                        No records found.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </div>
    );
}
