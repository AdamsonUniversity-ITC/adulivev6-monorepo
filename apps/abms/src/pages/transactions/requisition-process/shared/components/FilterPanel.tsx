import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronDown, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/popover';
import { FilterPanelConfig, FilterState, Theme, getDefaultStatusSelection, makeDefaultFilterState } from '../types';

const LEGENDS = { liquidation: '#eab308', reprocessed: '#8b5cf6', price: '#14b8a6' };
const same = (a: string[], b: string[]) => a.length === b.length && a.every(item => b.includes(item));

interface Props { config: FilterPanelConfig; t: Theme; isDark: boolean; state: FilterState; onChange: (patch: Partial<FilterState>) => void }

function Label({ children, t }: { children: React.ReactNode; t: Theme }) {
    return <span className="requisition-filter-label" style={{ color: t.labelColor }}>{children}</span>;
}

function StatusSelect({ config, value, apply, t }: {
    config: NonNullable<FilterPanelConfig['status']>; value: string[]; apply: (value: string[]) => void; t: Theme;
}) {
    const options = config.options.map(option => option.label);
    const all = options[0] ?? 'All';
    const defaultValues = getDefaultStatusSelection(config);
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(value);
    const summary = value.includes(all) ? 'All statuses' : value.length > 1 ? `${value[0]} +${value.length - 1}` : (value[0] ?? defaultValues[0] ?? all);
    const changeOpen = (next: boolean) => { setOpen(next); setDraft(value); };
    const toggle = (status: string) => {
        if (status === all) return setDraft([all]);
        const selected = draft.filter(item => item !== all);
        const next = selected.includes(status) ? selected.filter(item => item !== status) : [...selected, status];
        setDraft(next.length ? next : defaultValues);
    };
    return <Popover open={open} onOpenChange={changeOpen}>
        <PopoverTrigger asChild>
            <button type="button" className="requisition-filter-control" style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText }} aria-label={`Status filter: ${summary}`}>
                <span className="truncate">{summary}</span><ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(24rem,calc(100vw-2rem))] rounded-xl p-0" style={{ background: t.dropdownBg, borderColor: t.cardBorder, color: t.cellText }}>
            <div className="border-b px-4 py-3" style={{ borderColor: t.cardBorder }}>
                <p className="text-base font-semibold">Choose statuses</p>
                <p className="mt-0.5 text-[13px] leading-5" style={{ color: t.cellMuted }}>Apply to update the work queue filter.</p>
            </div>
            <div className="max-h-72 overflow-y-auto p-2" role="group" aria-label="Available statuses">
                {options.map(status => {
                    const checked = draft.includes(status);
                    return <label key={status} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[15px] hover:bg-primary/10">
                        <Checkbox checked={checked} onCheckedChange={() => toggle(status)} aria-label={status === all ? 'All statuses' : status} />
                        <span className="min-w-0 flex-1">{status === all ? 'All statuses' : status}</span>
                        {checked && <Check className="h-4 w-4" style={{ color: t.accentColor }} aria-hidden="true" />}
                    </label>;
                })}
            </div>
            <div className="flex items-center justify-between gap-2 border-t p-3" style={{ borderColor: t.cardBorder }}>
                <button type="button" className="requisition-filter-text-action" onClick={() => setDraft(defaultValues)}>Reset</button>
                <div className="flex gap-2">
                    <button type="button" className="requisition-filter-secondary-action" onClick={() => changeOpen(false)}>Cancel</button>
                    <button type="button" className="requisition-filter-primary-action" onClick={() => { apply(draft); setOpen(false); }}>Apply</button>
                </div>
            </div>
        </PopoverContent>
    </Popover>;
}

function DepartmentSelect({ config, state, onChange, t, isDark }: { config: NonNullable<FilterPanelConfig['department']>; state: FilterState; onChange: Props['onChange']; t: Theme; isDark: boolean }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const allOptions = config.deptOptions ?? (config.items ?? []).map((name, index) => ({ id: String(index), name, kind: 'Department' as const }));
    const sorted = useMemo(() => [...allOptions].sort((a, b) => a.name.localeCompare(b.name)), [allOptions]);
    const filtered = query.trim()
        ? sorted.filter(option => `${option.name} ${option.kind}`.toLowerCase().includes(query.trim().toLowerCase()))
        : sorted;
    const selected = sorted.find(option => option.id === state.selectedDeptId && option.kind === state.selectedDeptKind)
        ?? sorted.find(option => option.name === state.selectedDept)
        ?? null;

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', closeOnOutsideClick);
        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    }, []);

    const close = () => { setOpen(false); setQuery(''); };
    const selectItem = (item: typeof sorted[number]) => {
        onChange({ allDepts: false, selectedDept: item.name, selectedDeptId: item.id, selectedDeptKind: item.kind, deptQuery: item.name });
        close();
    };

    const kindStyle = (kind: 'Department' | 'Section') => ({
        background: kind === 'Department'
            ? (isDark ? 'rgba(37,99,235,0.28)' : 'rgba(219,234,254,0.90)')
            : (isDark ? 'rgba(5,150,105,0.28)' : 'rgba(209,250,229,0.90)'),
        color: kind === 'Department'
            ? (isDark ? '#93c5fd' : '#1d4ed8')
            : (isDark ? '#6ee7b7' : '#047857'),
    });

    return <div ref={rootRef} className="relative min-w-0">
        <button
            type="button"
            className="requisition-filter-control font-semibold"
            style={{ background: t.inputBg, borderColor: open ? t.accentColor : t.inputBorder, color: selected || state.allDepts ? t.inputText : t.inputPlaceholder }}
            onClick={() => {
                setOpen(previous => !previous);
                setQuery('');
                setTimeout(() => searchRef.current?.focus(), 50);
            }}
            aria-haspopup="listbox"
            aria-expanded={open}
            title={state.allDepts ? (config.allLabel ?? 'All departments') : (selected?.name ?? '')}
        >
            <span className="min-w-0 flex-1 truncate">{state.allDepts ? (config.allLabel ?? 'All departments') : (selected?.name ?? 'Choose department / section')}</span>
            {selected && !state.allDepts && <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={kindStyle(selected.kind)}>{selected.kind === 'Department' ? 'Dept' : 'Sec'}</span>}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform" style={{ color: t.cellMuted, transform: open ? 'rotate(180deg)' : undefined }} aria-hidden="true" />
        </button>
        {open && <div className="absolute left-0 top-full z-[200] mt-1 w-full min-w-[17rem] overflow-hidden rounded-xl border shadow-xl" style={{ background: t.dropdownBg, borderColor: t.cardBorder }}>
            <div className="border-b p-2.5" style={{ borderColor: t.cardBorder }}>
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: t.cellMuted }} aria-hidden="true" />
                    <input
                        ref={searchRef}
                        type="search"
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        onKeyDown={event => { if (event.key === 'Escape') close(); }}
                        placeholder="Search department / section..."
                        className="h-11 w-full rounded-lg border py-2 pl-10 pr-3 text-sm outline-none"
                        style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText }}
                        aria-label="Search department or section"
                    />
                </div>
            </div>
            <div className="max-h-72 overflow-y-auto" role="listbox" aria-label="Departments and sections">
                <button type="button" role="option" aria-selected={state.allDepts} className="flex min-h-11 w-full items-center px-4 py-2 text-left text-sm font-medium" style={{ color: state.allDepts ? t.accentColor : t.cellText, background: state.allDepts ? t.dropdownSelected : 'transparent' }} onClick={() => { onChange({ allDepts: true, selectedDept: null, selectedDeptId: null, selectedDeptKind: null, deptQuery: '' }); close(); }}>{config.allLabel ?? 'All departments'}</button>
                {filtered.map(item => {
                    const isSelected = !state.allDepts && item.id === selected?.id && item.kind === selected?.kind;
                    return <button key={`${item.kind}:${item.id}`} type="button" role="option" aria-selected={isSelected} className="group flex min-h-11 w-full items-start justify-between gap-3 border-t px-4 py-2 text-left text-sm" style={{ color: isSelected ? t.accentColor : t.cellText, background: isSelected ? t.dropdownSelected : 'transparent', borderColor: t.cardBorder, fontWeight: isSelected ? 600 : 400 }} onClick={() => selectItem(item)}>
                        <span className="min-w-0 flex-1 truncate leading-6 group-hover:whitespace-normal">{item.name}</span>
                        <span className="mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={kindStyle(item.kind)}>{item.kind === 'Department' ? 'Dept' : 'Sec'}</span>
                    </button>;
                })}
                {filtered.length === 0 && <p className="px-4 py-6 text-center text-sm" style={{ color: t.cellMuted }}>No departments or sections found.</p>}
            </div>
        </div>}
    </div>;
}

function Legend({ color, children }: { color: string; children: React.ReactNode }) {
    return <span className="inline-flex min-h-8 items-center gap-2 rounded-lg border px-2.5 text-[13px] font-semibold" style={{ borderColor: `${color}55`, background: `${color}14` }}>
        <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />{children}
    </span>;
}

export function FilterPanel({ config, t, isDark, state, onChange }: Props) {
    const defaults = useMemo(() => makeDefaultFilterState(config), [config]);
    const activeCount = [
        !same(state.activeStatuses, defaults.activeStatuses), state.allDepts || !!(state.selectedDept || state.selectedDeptId),
        state.searchEnabled && !!state.searchValue, state.schoolYearEnabled && !!state.schoolYear,
        state.paymentFormEnabled && !!state.paymentForm, state.dateRangeEnabled && !!(state.dateFrom || state.dateTo),
        state.sortBy !== defaults.sortBy || state.sortDir !== defaults.sortDir,
    ].filter(Boolean).length;
    const controlStyle: React.CSSProperties = { background: t.inputBg, borderColor: t.inputBorder, color: t.inputText };
    const setDate = (key: 'dateFrom' | 'dateTo', value: string) => {
        const from = key === 'dateFrom' ? value : state.dateFrom, to = key === 'dateTo' ? value : state.dateTo;
        onChange({ [key]: value, dateRangeEnabled: !!(from || to) });
    };
    return <section className="requisition-process-workspace mb-5 rounded-2xl border p-4 sm:p-5" style={{ background: t.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow }} aria-labelledby="requisition-filter-heading">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border" style={{ borderColor: t.cardBorder, background: t.dropdownSelected }}><SlidersHorizontal className="h-5 w-5" style={{ color: t.accentColor }} aria-hidden="true" /></span>
                <div><div className="flex flex-wrap items-center gap-2"><h2 id="requisition-filter-heading" className="text-lg font-bold" style={{ color: t.titleColor }}>Filter records</h2><span className="rounded-md px-2 py-0.5 text-[13px] font-semibold" style={{ background: t.dropdownSelected, color: t.accentColor }} aria-live="polite">{activeCount} active</span></div><p className="mt-0.5 text-[13px] leading-5" style={{ color: t.cellMuted }}>Narrow the work queue, then requery the records.</p></div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
                <Legend color={LEGENDS.liquidation}>For Liquidation</Legend>
                {config.showControllerReprocessedLegend && <Legend color={LEGENDS.reprocessed}>Reprocessed after approval</Legend>}
                {config.showControllerPriceReapprovalLegend && <Legend color={LEGENDS.price}>Price reapproval</Legend>}
                <button type="button" className="requisition-filter-text-action" onClick={() => onChange(defaults)}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Clear filters</button>
            </div>
        </header>
        <div className="requisition-compact-filter-grid">
            {config.status && <label className="requisition-filter-field"><Label t={t}>{config.status.sectionLabel ?? 'Status'}</Label><StatusSelect config={config.status} value={state.activeStatuses} apply={activeStatuses => onChange({ activeStatuses })} t={t} /></label>}
            {config.department && <div className="requisition-filter-field requisition-filter-department"><Label t={t}>{config.department.sectionLabel ?? 'Department / Section'}</Label><DepartmentSelect config={config.department} state={state} onChange={onChange} t={t} isDark={isDark} /></div>}
            {config.searchField && <label className="requisition-filter-field"><Label t={t}>Requisition number</Label><input className="requisition-filter-control tabular-nums" inputMode="numeric" maxLength={10} placeholder={config.searchField.placeholder ?? '10-digit RS number'} value={state.searchValue} onChange={event => { const searchValue = event.target.value.replace(/\D/g, '').slice(0, 10); onChange({ searchValue, searchEnabled: !!searchValue }); }} style={controlStyle} aria-invalid={!!state.searchValue && state.searchValue.length !== 10} />{state.searchValue && state.searchValue.length !== 10 && <span className="text-[13px] text-amber-700 dark:text-amber-300">Enter all 10 digits.</span>}</label>}
            {config.schoolYear && <label className="requisition-filter-field"><Label t={t}>School year</Label><select className="requisition-filter-control tabular-nums" value={state.schoolYear ?? ''} onChange={event => onChange({ schoolYear: event.target.value || null, schoolYearEnabled: !!event.target.value })} style={controlStyle}><option value="">Any school year</option>{(config.schoolYear.options ?? []).map(value => <option key={value} value={value}>{value}</option>)}</select></label>}
            {config.paymentForm && <label className="requisition-filter-field requisition-filter-payment"><Label t={t}>Payment form</Label><select className="requisition-filter-control" value={state.paymentForm ?? ''} onChange={event => onChange({ paymentForm: event.target.value || null, paymentFormEnabled: !!event.target.value })} style={controlStyle} title={state.paymentForm ?? ''}><option value="">Any payment form</option>{config.paymentForm.options.map(value => <option key={value} value={value}>{value}</option>)}</select></label>}
            {config.dateRange && <fieldset className="requisition-filter-field requisition-filter-dates"><legend className="requisition-filter-label" style={{ color: t.labelColor }}>Date range</legend><div className="grid grid-cols-2 gap-2"><label className="min-w-0"><span className="sr-only">From date</span><input className="requisition-filter-control tabular-nums" type="date" value={state.dateFrom} onChange={event => setDate('dateFrom', event.target.value)} style={{ ...controlStyle, colorScheme: isDark ? 'dark' : 'light' }} /></label><label className="min-w-0"><span className="sr-only">To date</span><input className="requisition-filter-control tabular-nums" type="date" value={state.dateTo} onChange={event => setDate('dateTo', event.target.value)} style={{ ...controlStyle, colorScheme: isDark ? 'dark' : 'light' }} /></label></div></fieldset>}
            {!!config.sortColumns?.length && <fieldset className="requisition-filter-field requisition-filter-sort"><legend className="requisition-filter-label" style={{ color: t.labelColor }}>Sort</legend><div className="grid grid-cols-[minmax(0,1fr)_3rem] gap-2"><select className="requisition-filter-control" value={state.sortBy} onChange={event => onChange({ sortBy: event.target.value })} style={controlStyle} aria-label="Sort column">{config.sortColumns.map(value => <option key={value} value={value}>{value}</option>)}</select><button type="button" className="requisition-filter-icon-action" onClick={() => onChange({ sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' })} style={controlStyle} aria-label={`Sort ${state.sortDir === 'asc' ? 'ascending' : 'descending'}`} title={state.sortDir === 'asc' ? 'Ascending' : 'Descending'}>{state.sortDir === 'asc' ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}</button></div></fieldset>}
            {!!config.actions?.length && <div className="requisition-filter-actions">{config.actions.map(({ label, icon: Icon, onClick }) => <button key={label} type="button" className="requisition-filter-primary-action w-full" onClick={onClick}><Icon className="h-5 w-5" aria-hidden="true" />{label}</button>)}</div>}
        </div>
    </section>;
}
