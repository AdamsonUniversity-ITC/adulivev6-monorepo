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
        <div>
            {/* ── Page title row ─────────────────────────────────── */}
            <PageHeader
                className="mb-5"
                title="Requisition Process"
                description={`${role.label} View`}
                actions={canSwitch ? (
                    <button
                        onClick={onSwitchRole}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                            border: `1px solid ${t.btnRefresh.border}`,
                            background: t.btnRefresh.bg, color: t.btnRefresh.text,
                            cursor: 'pointer', transition: 'background .14s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = t.btnRefresh.hover)}
                        onMouseLeave={e => (e.currentTarget.style.background = t.btnRefresh.bg)}
                    >
                        <RefreshCw style={{ width: 11, height: 11 }} />
                        Switch Role
                    </button>
                ) : undefined}
            />

            {/* ── Unified card ───────────────────────────────────── */}
            <div style={{
                background: t.cardBg, border: `1px solid ${t.cardBorder}`,
                boxShadow: t.cardShadow, borderRadius: 14, overflow: 'hidden',
            }}>
                {/* Card header */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '14px 20px', background: t.cardHeaderBg,
                    borderBottom: `1px solid ${t.cardHeaderBorder}`,
                }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: `1px solid ${t.cardBorder}`, background: t.dropdownSelected,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <Icon style={{ width: 14, height: 14, color: t.accentColor }} />
                    </div>
                    <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: t.titleColor, margin: 0 }}>{role.label}</p>
                        <p style={{ fontSize: 10, color: t.cellMuted, margin: '2px 0 0' }}>Requisition slips assigned to this role</p>
                    </div>
                </div>

                {/* Filter panel — only if all three are provided */}
                {filterConfig && filterState && onFilterChange && (
                    <FilterPanel
                        config={filterConfig}
                        t={t}
                        isDark={isDark}
                        state={filterState}
                        onChange={onFilterChange}
                    />
                )}

                <div style={{ height: 1, background: t.cardHeaderBorder }} />

                {/* Table area — overflowX here, children owns the <table> */}
                <div style={{ overflowX: 'auto' }}>
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
            </div>
        </div>
    );
}
