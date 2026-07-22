import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Theme, FilterPanelConfig, FilterState, DeptOption } from '../types';
import { FilterCheckbox } from './FilterCheckbox';
import { FilterSortDropdown, FilterActionButton } from './FilterControls';

// ─────────────────────────────────────────────────────────────────────────────
// For Liquidation accent — kept in sync with RSProcessModal.tsx / BudgetView.tsx.
// If you change one, change all three.
// ─────────────────────────────────────────────────────────────────────────────
const LIQUIDATION_COLOR = '#eab308';

// ─────────────────────────────────────────────────────────────────────────────
// InlineDeptSelect — badge-style dept+section dropdown used when deptOptions
// is provided on the config. Mirrors DeptSelect from BudgetProposalEntry.
// ─────────────────────────────────────────────────────────────────────────────
function InlineDeptSelect({
    options,
    value,
    onChange,
    placeholder,
    t,
    isDark,
}: {
    options: DeptOption[];
    value: string | null;
    onChange: (item: DeptOption) => void;
    placeholder?: string;
    t: Theme;
    isDark: boolean;
}) {
    const [open, setOpen] = useState(false);

    const sorted = [...options].sort((a, b) => a.name.localeCompare(b.name));
    const selected = sorted.find(o => o.id === value) ?? null;

    const handleSelect = (item: DeptOption) => {
        onChange(item);
        setOpen(false);
    };

    const kindBadgeStyle = (kind: 'Department' | 'Section') => ({
        background: kind === 'Department'
            ? (isDark ? 'rgba(37,99,235,0.25)' : 'rgba(219,234,254,0.90)')
            : (isDark ? 'rgba(5,150,105,0.25)' : 'rgba(209,250,229,0.90)'),
        color: kind === 'Department'
            ? (isDark ? '#93c5fd' : '#1d4ed8')
            : (isDark ? '#6ee7b7' : '#047857'),
        fontSize: 9, fontWeight: 700 as const,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.09em',
        padding: '2px 6px',
        borderRadius: 5,
        flexShrink: 0 as const,
    });

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    borderRadius: 7,
                    fontSize: 11,
                    fontWeight: selected ? 600 : 400,
                    background: t.inputBg,
                    border: `1px solid ${open
                        ? (isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)')
                        : t.inputBorder}`,
                    color: selected ? t.inputText : t.cellMuted,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color .15s ease',
                }}
            >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected?.name ?? placeholder ?? 'Select department / section…'}
                </span>
                {selected && (
                    <span style={kindBadgeStyle(selected.kind)}>
                        {selected.kind === 'Department' ? 'Dept' : 'Sec'}
                    </span>
                )}
                <ChevronDown style={{
                    width: 12, height: 12, color: t.cellMuted, flexShrink: 0,
                    transform: `rotate(${open ? 180 : 0}deg)`,
                    transition: 'transform .15s ease',
                    pointerEvents: 'none',
                }} />
            </button>

            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: isDark ? 'rgba(10,18,38,0.98)' : 'rgba(255,255,255,0.99)',
                    border: `1px solid ${isDark ? 'rgba(99,155,255,0.30)' : 'rgba(37,99,235,0.20)'}`,
                    borderRadius: 8,
                    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.50)' : '0 8px 32px rgba(0,48,135,0.15)',
                    maxHeight: 220,
                    overflowY: 'auto',
                    zIndex: 50,
                }}>
                    {sorted.map((item, idx) => {
                        const isSel = item.id === value;
                        return (
                            <button
                                key={`${item.kind}-${item.id}`}
                                type="button"
                                className="group"
                                onMouseDown={() => handleSelect(item)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    gap: 10,
                                    padding: '7px 12px',
                                    fontSize: 11,
                                    fontWeight: isSel ? 600 : 400,
                                    textAlign: 'left',
                                    background: isSel
                                        ? (isDark ? 'rgba(37,99,235,0.20)' : 'rgba(219,234,254,0.80)')
                                        : 'transparent',
                                    color: isSel
                                        ? (isDark ? '#93c5fd' : '#1d4ed8')
                                        : (isDark ? '#e2e8f0' : '#0f172a'),
                                    borderBottom: idx < sorted.length - 1
                                        ? `1px solid ${isDark ? 'rgba(99,155,255,0.10)' : 'rgba(37,99,235,0.08)'}`
                                        : 'none',
                                    cursor: 'pointer',
                                    transition: 'background .1s',
                                }}
                                onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(59,130,246,0.12)' : 'rgba(219,234,254,0.50)'; }}
                                onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                                <span className="min-w-0 flex-1 truncate leading-5 group-hover:overflow-visible group-hover:whitespace-normal group-hover:break-words">
                                    {item.name}
                                </span>
                                <span style={{ ...kindBadgeStyle(item.kind), marginTop: 2 }}>
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

interface FilterPanelProps {
    config: FilterPanelConfig;
    t: Theme;
    isDark: boolean;
    // Controlled state + updater from parent
    state: FilterState;
    onChange: (patch: Partial<FilterState>) => void;
}

export function FilterPanel({ config, t, isDark, state, onChange }: FilterPanelProps) {
    const [deptOpen, setDeptOpen] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);

    const statusOptions = config.status?.options ?? [];
    const allSentinel = statusOptions[0]?.label ?? 'All';
    const deptItems = config.department?.items ?? [];
    const deptOptions = config.department?.deptOptions;
    const sortColumns = config.sortColumns ?? [];

    const filteredDepts = deptItems.filter(d =>
        d.toLowerCase().includes(state.deptQuery.toLowerCase())
    );

    // ── Handlers ─────────────────────────────────────────────────────────────
    const toggleStatus = (label: string) => {
        if (label === allSentinel) { onChange({ activeStatuses: [allSentinel] }); return; }
        const without = state.activeStatuses.filter(s => s !== allSentinel);
        if (without.includes(label)) {
            const next = without.filter(s => s !== label);
            onChange({ activeStatuses: next.length === 0 ? [allSentinel] : next });
        } else {
            onChange({ activeStatuses: [...without, label] });
        }
    };

    // Legacy plain-string dept select (FilterCombobox mode)
    const handleDeptSelect = (dept: string) => {
        onChange({ selectedDept: dept, deptQuery: dept, allDepts: false });
        setDeptOpen(false);
    };

    // Rich DeptOption select
    const handleDeptOptionSelect = (item: DeptOption) => {
        onChange({
            selectedDept: item.name,
            selectedDeptId: item.id,
            selectedDeptKind: item.kind,
            allDepts: false,
        });
    };

    const handleAllDepts = (checked: boolean) => {
        onChange({
            allDepts: checked,
            ...(checked ? { selectedDept: null, selectedDeptId: null, selectedDeptKind: null, deptQuery: '' } : {}),
        });
    };

    // ── Style helpers ─────────────────────────────────────────────────────────
    const sectionLabel: React.CSSProperties = {
        fontSize: 11, fontWeight: 700, letterSpacing: '0.10em',
        textTransform: 'uppercase', color: t.labelColor, whiteSpace: 'nowrap',
    };
    const colStack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10 };
    const filterCard: React.CSSProperties = {
        ...colStack,
        minWidth: 0,
        padding: 16,
        borderRadius: 12,
        border: `1px solid ${t.inputBorder}`,
        background: t.inputBg,
    };

    const hasDept = !!config.department;
    const hasSearch = !!config.searchField;
    const hasSchoolYear = !!config.schoolYear;
    const hasPaymentForm = !!config.paymentForm;
    const hasDateRange = !!config.dateRange;
    const hasSort = sortColumns.length > 0;
    const hasActions = (config.actions?.length ?? 0) > 0;
    const hasLeftCluster = hasDept || hasSort || hasActions || hasSchoolYear || hasPaymentForm || hasDateRange;
    const hasRow2 = hasLeftCluster || hasSearch;

    const rsAccent = isDark ? '#60a5fa' : '#1d4ed8';
    const rsGlow = isDark
        ? '0 0 0 3px rgba(96,165,250,0.18), 0 0 18px rgba(96,165,250,0.12)'
        : '0 0 0 3px rgba(29,78,216,0.12), 0 0 12px rgba(29,78,216,0.08)';

    return (
        <>
            {/* ── Row 1: Status pills ───────────────────────────────── */}
            {config.status && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    flexWrap: 'wrap', padding: 16, margin: 16, marginBottom: 0,
                    borderRadius: 12, border: `1px solid ${t.inputBorder}`,
                    background: isDark ? 'rgba(10,20,48,0.40)' : 'rgba(232,242,255,0.45)',
                }}>
                    <span style={sectionLabel}>{config.status.sectionLabel ?? 'Status'}</span>
                    <div style={{ width: 1, height: 18, background: t.dividerInlineColor, flexShrink: 0 }} />
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {statusOptions.map(opt => {
                            const isActive = state.activeStatuses.includes(opt.label);
                            return (
                                <button
                                    key={opt.label}
                                    onClick={() => toggleStatus(opt.label)}
                                    style={{
                                        padding: '7px 16px', borderRadius: 8,
                                        fontSize: 13, fontWeight: isActive ? 700 : 500,
                                        border: `1.5px solid ${isActive ? t.accentColor : t.cardBorder}`,
                                        background: isActive ? t.dropdownSelected : 'transparent',
                                        color: isActive ? t.accentColor : t.cellText,
                                        cursor: 'pointer', transition: 'all .14s ease', whiteSpace: 'nowrap',
                                    }}
                                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = t.dropdownHover; }}
                                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {config.status && hasRow2 && (
                <div style={{ height: 1, background: t.sectionDividerColor }} />
            )}

            {/* ── Row 2: Left cluster  ║  RS No. hero field ─────────── */}
            {hasRow2 && (
                <div style={{ display: 'grid', gridTemplateColumns: hasSearch && hasLeftCluster ? 'minmax(0, 2fr) minmax(280px, 1fr)' : 'minmax(0, 1fr)', alignItems: 'stretch', padding: 16, gap: 12 }}>

                    {hasLeftCluster && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', alignItems: 'stretch', gap: 12, minWidth: 0 }}>

                            {hasDept && (
                                <>
                                    <div style={filterCard}>
                                        <span style={sectionLabel}>{config.department!.sectionLabel ?? 'Department'}</span>

                                        {/* Rich mode: DeptOption[] with Dept/Sec badges */}
                                        {deptOptions ? (
                                            <InlineDeptSelect
                                                options={deptOptions}
                                                value={state.selectedDeptId ?? null}
                                                onChange={handleDeptOptionSelect}
                                                placeholder={config.department!.placeholder}
                                                t={t}
                                                isDark={isDark}
                                            />
                                        ) : (
                                            /* Legacy mode: plain string list with text search */
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    style={{
                                                        background: t.inputBg,
                                                        border: `1px solid ${t.inputBorder}`,
                                                        borderRadius: 7,
                                                        padding: '6px 30px 6px 10px',
                                                        fontSize: 11,
                                                        color: t.inputText,
                                                        outline: 'none',
                                                        width: '100%',
                                                        cursor: 'text',
                                                        boxSizing: 'border-box',
                                                    }}
                                                    placeholder={config.department!.placeholder ?? 'Search department…'}
                                                    value={state.deptQuery}
                                                    onChange={e => { onChange({ deptQuery: e.target.value, allDepts: false }); setDeptOpen(true); }}
                                                    onFocus={() => setDeptOpen(true)}
                                                    onBlur={() => setTimeout(() => setDeptOpen(false), 150)}
                                                />
                                                {deptOpen && filteredDepts.length > 0 && (
                                                    <div style={{
                                                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                                                        background: t.dropdownBg, border: `1px solid ${t.cardBorder}`,
                                                        borderRadius: 8, zIndex: 50, maxHeight: 180, overflowY: 'auto',
                                                        boxShadow: t.cardShadow,
                                                    }}>
                                                        {filteredDepts.map(item => (
                                                            <div
                                                                key={item}
                                                                onMouseDown={() => handleDeptSelect(item)}
                                                                style={{
                                                                    padding: '7px 12px', fontSize: 11,
                                                                    color: state.selectedDept === item ? t.accentColor : t.cellText,
                                                                    background: state.selectedDept === item ? t.dropdownSelected : 'transparent',
                                                                    cursor: 'pointer', transition: 'background .1s',
                                                                }}
                                                                onMouseEnter={e => (e.currentTarget.style.background = t.dropdownHover)}
                                                                onMouseLeave={e => (e.currentTarget.style.background = state.selectedDept === item ? t.dropdownSelected : 'transparent')}
                                                            >
                                                                {item}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <FilterCheckbox
                                            id="all-depts"
                                            checked={state.allDepts}
                                            onChange={handleAllDepts}
                                            label={config.department!.allLabel ?? 'All Departments'}
                                            t={t}
                                        />
                                    </div>
                                </>
                            )}

                            {hasSort && (
                                <>
                                    <div style={filterCard}>
                                        <span style={sectionLabel}>Sort Options</span>
                                        <FilterSortDropdown
                                            columns={sortColumns}
                                            value={state.sortBy}
                                            open={sortOpen}
                                            onToggle={() => setSortOpen(p => !p)}
                                            onSelect={col => { onChange({ sortBy: col }); setSortOpen(false); }}
                                            t={t}
                                        />
                                        <div style={{ display: 'flex', gap: 16 }}>
                                            <FilterCheckbox id="sort-asc" checked={state.sortDir === 'asc'} onChange={() => onChange({ sortDir: 'asc' })} label="Ascending" t={t} />
                                            <FilterCheckbox id="sort-desc" checked={state.sortDir === 'desc'} onChange={() => onChange({ sortDir: 'desc' })} label="Descending" t={t} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* School Year filter — its own bounded column, same pattern as
                                Department/Sort Options, so it doesn't spill into the action
                                row and wrap unpredictably. Checkbox gates the dropdown; only
                                contributes to the requery query when checked. */}
                            {hasSchoolYear && (
                                <>
                                    <div style={filterCard}>
                                        <span style={sectionLabel}>School Year</span>
                                        <FilterCheckbox
                                            id="schoolyear-toggle"
                                            checked={state.schoolYearEnabled}
                                            onChange={v => onChange({ schoolYearEnabled: v, ...(v ? {} : { schoolYear: null }) })}
                                            label={config.schoolYear!.checkboxLabel ?? 'Filter by School Year'}
                                            t={t}
                                        />
                                        <select
                                            value={state.schoolYear ?? ''}
                                            onChange={e => onChange({ schoolYear: e.target.value || null })}
                                            disabled={!state.schoolYearEnabled}
                                            style={{
                                                background: t.inputBg,
                                                border: `1px solid ${t.inputBorder}`,
                                                borderRadius: 7,
                                                padding: '6px 8px',
                                                fontSize: 11,
                                                color: t.inputText,
                                                outline: 'none',
                                                width: '100%',
                                                opacity: state.schoolYearEnabled ? 1 : 0.4,
                                                cursor: state.schoolYearEnabled ? 'pointer' : 'not-allowed',
                                            }}
                                        >
                                            <option value="">{config.schoolYear!.placeholder ?? 'Select school year…'}</option>
                                            {(config.schoolYear!.options ?? []).map(sy => (
                                                <option key={sy} value={sy}>{sy}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Payment Form */}
                            {hasPaymentForm && (
                                <div style={filterCard}>
                                    <span style={sectionLabel}>
                                        Payment Form
                                    </span>

                                    <FilterCheckbox
                                        id="payment-form-toggle"
                                        checked={state.paymentFormEnabled}
                                        onChange={enabled =>
                                            onChange({
                                                paymentFormEnabled: enabled,
                                                ...(enabled
                                                    ? {}
                                                    : { paymentForm: null }),
                                            })
                                        }
                                        label={
                                            config.paymentForm?.checkboxLabel
                                            ?? 'Filter by Payment Form'
                                        }
                                        t={t}
                                    />

                                    <select
                                        value={state.paymentForm ?? ''}
                                        onChange={event =>
                                            onChange({
                                                paymentForm:
                                                    event.target.value || null,
                                            })
                                        }
                                        disabled={!state.paymentFormEnabled}
                                        style={{
                                            width: '100%',
                                            background: t.inputBg,
                                            border: `1px solid ${t.inputBorder}`,
                                            borderRadius: 7,
                                            padding: '6px 8px',
                                            fontSize: 11,
                                            color: t.inputText,
                                            outline: 'none',
                                            opacity: state.paymentFormEnabled ? 1 : 0.4,
                                            cursor: state.paymentFormEnabled
                                                ? 'pointer'
                                                : 'not-allowed',
                                        }}
                                    >
                                        <option value="">
                                            {config.paymentForm?.placeholder
                                                ?? 'Select payment form…'}
                                        </option>

                                        {(config.paymentForm?.options ?? []).map(
                                            paymentForm => (
                                                <option
                                                    key={paymentForm}
                                                    value={paymentForm}
                                                >
                                                    {paymentForm}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            )}

                            {/* Date Range filter — own bounded column, same reasoning as
                                School Year above. Checkbox gates the from/to inputs; only
                                contributes to the requery query when checked. */}
                            {hasDateRange && (
                                <>
                                    <div style={filterCard}>
                                        <span style={sectionLabel}>Date Range</span>
                                        <FilterCheckbox
                                            id="daterange-toggle"
                                            checked={state.dateRangeEnabled}
                                            onChange={v => onChange({ dateRangeEnabled: v, ...(v ? {} : { dateFrom: '', dateTo: '' }) })}
                                            label={config.dateRange!.checkboxLabel ?? 'Filter by Date Range'}
                                            t={t}
                                        />
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'auto minmax(0, 1fr)',
                                            alignItems: 'center',
                                            gap: '6px 8px',
                                            minWidth: 0,
                                        }}>
                                            <span style={{ fontSize: 10, color: t.cellMuted }}>From</span>
                                            <input
                                                type="date"
                                                aria-label="From date"
                                                value={state.dateFrom}
                                                onChange={e => onChange({ dateFrom: e.target.value })}
                                                disabled={!state.dateRangeEnabled}
                                                style={{
                                                    background: t.inputBg,
                                                    border: `1px solid ${t.inputBorder}`,
                                                    borderRadius: 7,
                                                    padding: '5px 6px',
                                                    fontSize: 11,
                                                    color: t.inputText,
                                                    outline: 'none',
                                                    width: '100%',
                                                    minWidth: 0,
                                                    boxSizing: 'border-box',
                                                    colorScheme: isDark ? 'dark' : 'light',
                                                    opacity: state.dateRangeEnabled ? 1 : 0.4,
                                                    cursor: state.dateRangeEnabled ? 'text' : 'not-allowed',
                                                }}
                                            />
                                            <span style={{ fontSize: 10, color: t.cellMuted }}>To</span>
                                            <input
                                                type="date"
                                                aria-label="To date"
                                                value={state.dateTo}
                                                onChange={e => onChange({ dateTo: e.target.value })}
                                                disabled={!state.dateRangeEnabled}
                                                style={{
                                                    background: t.inputBg,
                                                    border: `1px solid ${t.inputBorder}`,
                                                    borderRadius: 7,
                                                    padding: '5px 6px',
                                                    fontSize: 11,
                                                    color: t.inputText,
                                                    outline: 'none',
                                                    width: '100%',
                                                    minWidth: 0,
                                                    boxSizing: 'border-box',
                                                    colorScheme: isDark ? 'dark' : 'light',
                                                    opacity: state.dateRangeEnabled ? 1 : 0.4,
                                                    cursor: state.dateRangeEnabled ? 'text' : 'not-allowed',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {hasActions && (
                                <div style={{ ...filterCard, justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {config.actions!.map(action => (
                                            <FilterActionButton
                                                key={action.label}
                                                label={action.label}
                                                icon={action.icon}
                                                variant={action.variant ?? 'secondary'}
                                                onClick={action.onClick}
                                                t={t}
                                            />
                                        ))}
                                    </div>
                                    {/* For Liquidation legend — explains the yellow row
                                        highlight in the results table beside it. Static,
                                        not an action: it's just a key for the user. */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '5px 12px', borderRadius: 8,
                                        border: `1px solid ${LIQUIDATION_COLOR}55`,
                                        background: isDark ? `${LIQUIDATION_COLOR}1a` : `${LIQUIDATION_COLOR}14`,
                                    }}>
                                        <span style={{
                                            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                                            background: LIQUIDATION_COLOR, flexShrink: 0,
                                        }} />
                                        <span style={{
                                            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                                            color: isDark ? '#fde047' : '#854d0e', whiteSpace: 'nowrap',
                                        }}>
                                            For Liquidation
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {hasSearch && (
                        <div style={{ ...filterCard, minWidth: 280, justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                <FilterCheckbox
                                    id="search-toggle"
                                    checked={state.searchEnabled}
                                    onChange={v => onChange({ searchEnabled: v })}
                                    label={config.searchField!.checkboxLabel ?? 'Search by Requisition No.'}
                                    t={t}
                                />
                                <span style={{
                                    fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
                                    textTransform: 'uppercase',
                                    color: state.searchEnabled ? rsAccent : t.labelColor,
                                    background: state.searchEnabled
                                        ? (isDark ? 'rgba(96,165,250,0.12)' : 'rgba(29,78,216,0.08)')
                                        : (isDark ? 'rgba(100,160,255,0.06)' : 'rgba(37,99,235,0.05)'),
                                    border: `1px solid ${state.searchEnabled
                                        ? (isDark ? 'rgba(96,165,250,0.35)' : 'rgba(29,78,216,0.25)')
                                        : t.dividerColor}`,
                                    borderRadius: 5, padding: '3px 8px', flexShrink: 0, transition: 'all .2s ease',
                                }}>
                                    Primary Key
                                </span>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <input
                                    style={{
                                        background: state.searchEnabled
                                            ? (isDark ? 'rgba(13,26,58,0.95)' : 'rgba(224,236,255,0.95)')
                                            : t.inputBg,
                                        border: `2px solid ${searchFocused && state.searchEnabled ? rsAccent
                                                : state.searchEnabled
                                                    ? (isDark ? 'rgba(96,165,250,0.55)' : 'rgba(29,78,216,0.45)')
                                                    : t.inputBorder
                                            }`,
                                        borderRadius: 10, padding: '12px 16px 12px 44px',
                                        fontSize: 16, fontWeight: 700, letterSpacing: '0.08em',
                                        color: t.inputText, outline: 'none', width: '100%',
                                        opacity: state.searchEnabled ? 1 : 0.4,
                                        cursor: state.searchEnabled ? 'text' : 'not-allowed',
                                        pointerEvents: state.searchEnabled ? 'auto' : 'none',
                                        transition: 'all .2s ease', boxSizing: 'border-box',
                                        boxShadow: searchFocused && state.searchEnabled ? rsGlow : 'none',
                                    }}
                                    placeholder={config.searchField!.placeholder ?? 'e.g. 2026100000'}
                                    value={state.searchValue}
                                    onChange={e => onChange({ searchValue: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                    inputMode="numeric"
                                    maxLength={10}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                    disabled={!state.searchEnabled}
                                />
                                <Search style={{
                                    position: 'absolute', left: 14, top: '50%',
                                    transform: 'translateY(-50%)', width: 17, height: 17,
                                    color: state.searchEnabled ? rsAccent : t.cellMuted,
                                    pointerEvents: 'none', transition: 'color .2s ease',
                                }} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
