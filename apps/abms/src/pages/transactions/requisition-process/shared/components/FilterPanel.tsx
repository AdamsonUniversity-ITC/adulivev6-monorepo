import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Theme, FilterPanelConfig } from '../types';
import { FilterCheckbox } from './FilterCheckbox';
import { FilterCombobox } from './FilterCombobox';
import { FilterSortDropdown, FilterActionButton } from './FilterControls';

interface FilterPanelProps {
    config: FilterPanelConfig;
    t: Theme;
    isDark: boolean;
}

export function FilterPanel({ config, t, isDark }: FilterPanelProps) {
    // ── Status state ─────────────────────────────────────────────────────────
    const statusOptions = config.status?.options ?? [];
    const allSentinel = statusOptions[0]?.label ?? 'All';
    const [activeStatuses, setActiveStatuses] = useState<string[]>([allSentinel]);

    const toggleStatus = (label: string) => {
        if (label === allSentinel) { setActiveStatuses([allSentinel]); return; }
        setActiveStatuses(prev => {
            const without = prev.filter(s => s !== allSentinel);
            if (without.includes(label)) {
                const next = without.filter(s => s !== label);
                return next.length === 0 ? [allSentinel] : next;
            }
            return [...without, label];
        });
    };

    // ── Department state ─────────────────────────────────────────────────────
    const deptItems = config.department?.items ?? [];
    const [deptQuery, setDeptQuery] = useState('');
    const [deptOpen, setDeptOpen] = useState(false);
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [allDepts, setAllDepts] = useState(false);

    const filteredDepts = deptItems.filter(d =>
        d.toLowerCase().includes(deptQuery.toLowerCase())
    );

    const handleDeptSelect = (dept: string) => {
        setSelectedDept(dept);
        setDeptQuery(dept);
        setDeptOpen(false);
        setAllDepts(false);
    };

    const handleAllDepts = (checked: boolean) => {
        setAllDepts(checked);
        if (checked) { setSelectedDept(null); setDeptQuery(''); }
    };

    // ── Search field state ───────────────────────────────────────────────────
    const [searchEnabled, setSearchEnabled] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);

    // ── Sort state ───────────────────────────────────────────────────────────
    const sortColumns = config.sortColumns ?? [];
    const [sortBy, setSortBy] = useState(sortColumns[0] ?? '');
    const [sortOpen, setSortOpen] = useState(false);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    // ── Shared style helpers ─────────────────────────────────────────────────
    const sectionLabel: React.CSSProperties = {
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: t.labelColor,
        whiteSpace: 'nowrap',
    };

    const colStack: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    };

    const vDivider: React.CSSProperties = {
        width: 1,
        background: t.dividerColor,
        alignSelf: 'stretch',
        flexShrink: 0,
    };

    const hasDept    = !!config.department;
    const hasSearch  = !!config.searchField;
    const hasSort    = sortColumns.length > 0;
    const hasActions = (config.actions?.length ?? 0) > 0;
    const hasLeftCluster = hasDept || hasSort || hasActions;
    const hasRow2    = hasLeftCluster || hasSearch;

    const rsAccent = isDark ? '#60a5fa' : '#1d4ed8';
    const rsGlow   = isDark
        ? '0 0 0 3px rgba(96,165,250,0.18), 0 0 18px rgba(96,165,250,0.12)'
        : '0 0 0 3px rgba(29,78,216,0.12), 0 0 12px rgba(29,78,216,0.08)';

    return (
        <>
            {/* ── Row 1: Status checkboxes ──────────────────────────── */}
            {config.status && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '14px 20px' }}>
                    <span style={sectionLabel}>{config.status.sectionLabel ?? 'Status'}</span>
                    <div style={{ width: 1, height: 14, background: t.dividerInlineColor, flexShrink: 0 }} />
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        {statusOptions.map(opt => (
                            <FilterCheckbox
                                key={opt.label}
                                id={`status-${opt.label}`}
                                checked={activeStatuses.includes(opt.label)}
                                onChange={() => toggleStatus(opt.label)}
                                label={opt.label}
                                t={t}
                            />
                        ))}
                    </div>
                </div>
            )}

            {config.status && hasRow2 && (
                <div style={{ height: 1, background: t.sectionDividerColor, marginLeft: 20, marginRight: 20 }} />
            )}

            {/* ── Row 2: Left cluster  ║  RS No. hero field ─────────── */}
            {hasRow2 && (
                <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, padding: '14px 20px', flexWrap: 'wrap' }}>

                    {hasLeftCluster && (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', flex: '1 1 0', minWidth: 0 }}>

                            {hasDept && (
                                <>
                                    <div style={{ ...colStack, minWidth: 180, maxWidth: 240, flex: '1 1 180px' }}>
                                        <span style={sectionLabel}>{config.department!.sectionLabel ?? 'Department'}</span>
                                        <FilterCombobox
                                            items={filteredDepts}
                                            value={deptQuery}
                                            selected={selectedDept}
                                            open={deptOpen}
                                            placeholder={config.department!.placeholder ?? 'Search department…'}
                                            onInputChange={v => { setDeptQuery(v); setDeptOpen(true); setAllDepts(false); }}
                                            onFocus={() => setDeptOpen(true)}
                                            onBlur={() => setTimeout(() => setDeptOpen(false), 150)}
                                            onSelect={handleDeptSelect}
                                            t={t}
                                            minWidth={160}
                                            maxWidth={240}
                                        />
                                        <div style={{ marginTop: -2 }}>
                                            <FilterCheckbox
                                                id="all-depts"
                                                checked={allDepts}
                                                onChange={handleAllDepts}
                                                label={config.department!.allLabel ?? 'All Departments'}
                                                t={t}
                                            />
                                        </div>
                                    </div>
                                    {(hasSort || hasActions) && <div style={vDivider} />}
                                </>
                            )}

                            {hasSort && (
                                <>
                                    <div style={colStack}>
                                        <span style={sectionLabel}>Sort Options</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <FilterSortDropdown
                                                columns={sortColumns}
                                                value={sortBy}
                                                open={sortOpen}
                                                onToggle={() => setSortOpen(p => !p)}
                                                onSelect={col => { setSortBy(col); setSortOpen(false); }}
                                                t={t}
                                            />
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <FilterCheckbox
                                                    id="sort-asc"
                                                    checked={sortDir === 'asc'}
                                                    onChange={() => setSortDir('asc')}
                                                    label="Ascending"
                                                    t={t}
                                                />
                                                <FilterCheckbox
                                                    id="sort-desc"
                                                    checked={sortDir === 'desc'}
                                                    onChange={() => setSortDir('desc')}
                                                    label="Descending"
                                                    t={t}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {hasActions && <div style={vDivider} />}
                                </>
                            )}

                            {hasActions && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
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
                            )}
                        </div>
                    )}

                    {hasSearch && hasLeftCluster && (
                        <div style={{
                            width: 1,
                            background: t.dividerColor,
                            margin: '0 20px',
                            flexShrink: 0,
                            alignSelf: 'stretch',
                        }} />
                    )}

                    {hasSearch && (
                        <div style={{
                            ...colStack,
                            flexShrink: 0,
                            width: 260,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <FilterCheckbox
                                    id="search-toggle"
                                    checked={searchEnabled}
                                    onChange={setSearchEnabled}
                                    label={config.searchField!.checkboxLabel ?? 'Search by Requisition No.'}
                                    t={t}
                                />
                                <span style={{
                                    fontSize: 8,
                                    fontWeight: 700,
                                    letterSpacing: '0.10em',
                                    textTransform: 'uppercase',
                                    color: searchEnabled ? rsAccent : t.labelColor,
                                    background: searchEnabled
                                        ? (isDark ? 'rgba(96,165,250,0.12)' : 'rgba(29,78,216,0.08)')
                                        : (isDark ? 'rgba(100,160,255,0.06)' : 'rgba(37,99,235,0.05)'),
                                    border: `1px solid ${searchEnabled ? (isDark ? 'rgba(96,165,250,0.35)' : 'rgba(29,78,216,0.25)') : t.dividerColor}`,
                                    borderRadius: 4,
                                    padding: '2px 6px',
                                    flexShrink: 0,
                                    transition: 'all .2s ease',
                                }}>
                                    Primary Key
                                </span>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <input
                                    style={{
                                        background: searchEnabled
                                            ? (isDark ? 'rgba(13,26,58,0.95)' : 'rgba(224,236,255,0.95)')
                                            : t.inputBg,
                                        border: `1.5px solid ${
                                            searchFocused && searchEnabled
                                                ? rsAccent
                                                : searchEnabled
                                                    ? (isDark ? 'rgba(96,165,250,0.55)' : 'rgba(29,78,216,0.45)')
                                                    : t.inputBorder
                                        }`,
                                        borderRadius: 9,
                                        padding: '10px 14px 10px 38px',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        letterSpacing: '0.04em',
                                        color: t.inputText,
                                        outline: 'none',
                                        width: '100%',
                                        opacity: searchEnabled ? 1 : 0.4,
                                        cursor: searchEnabled ? 'text' : 'not-allowed',
                                        pointerEvents: searchEnabled ? 'auto' : 'none',
                                        transition: 'all .2s ease',
                                        boxSizing: 'border-box',
                                        boxShadow: searchFocused && searchEnabled ? rsGlow : 'none',
                                    }}
                                    placeholder={config.searchField!.placeholder ?? 'e.g. RS-2024-00123'}
                                    value={searchValue}
                                    onChange={e => setSearchValue(e.target.value)}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                    disabled={!searchEnabled}
                                />
                                <Search
                                    style={{
                                        position: 'absolute', left: 12, top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: 14, height: 14,
                                        color: searchEnabled ? rsAccent : t.cellMuted,
                                        pointerEvents: 'none',
                                        transition: 'color .2s ease',
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}