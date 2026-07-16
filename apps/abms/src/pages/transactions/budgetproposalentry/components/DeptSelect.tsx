import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { DeptOption, ThemeTokens } from '../types';

interface DeptSelectProps {
    value: string;
    valueKind: 'Department' | 'Section' | '';
    onChange: (id: string, kind: 'Department' | 'Section') => void;
    departments: DeptOption[];
    sections: DeptOption[];
    t: ThemeTokens;
    isDark: boolean;
}

export function DeptSelect({ value, valueKind, onChange, departments, sections, t, isDark }: DeptSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const mergedList: DeptOption[] = [
        ...departments.map(d => ({ ...d, kind: 'Department' as const })),
        ...sections.map(s => ({ ...s, kind: 'Section' as const })),
    ].sort((a, b) => a.name.localeCompare(b.name));

    const selected = mergedList.find(o => o.id === value && o.kind === valueKind) ?? null;
    const filteredList = search.trim()
        ? mergedList.filter(o => o.name.toLowerCase().includes(search.trim().toLowerCase()))
        : mergedList;

    const handleSelect = (item: DeptOption) => {
        onChange(item.id, item.kind);
        setOpen(false);
        setSearch('');
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(prev => { if (prev) setSearch(''); return !prev; })}
                className="w-full flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-md text-sm font-semibold transition-all duration-150"
                style={{
                    background: t.inputBg,
                    border: `1px solid ${open ? (isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)') : t.inputBorder}`,
                    color: selected ? t.inputText : 'var(--abms-text-muted)',
                    backdropFilter: 'blur(6px)',
                }}
            >
                <span className="flex-1 text-left truncate">{selected?.name ?? 'Select department / section...'}</span>
                {selected && <DeptKindBadge kind={selected.kind} isDark={isDark} />}
                <ChevronDown
                    className="w-3.5 h-3.5 shrink-0 transition-transform duration-150"
                    style={{ color: isDark ? '#94a3b8' : '#64748b', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </button>

            {open && (
                <div
                    className="absolute top-full left-0 mt-1 z-50 rounded-xl overflow-hidden w-full min-w-[220px]"
                    style={{
                        background: isDark ? 'rgba(10, 18, 38, 0.98)' : 'rgba(255,255,255,0.99)',
                        border: `1px solid ${isDark ? 'rgba(99,155,255,0.30)' : 'rgba(37,99,235,0.20)'}`,
                        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.50)' : '0 8px 32px rgba(0,48,135,0.15)',
                    }}
                >
                    <div className="px-3 py-2" style={{ borderBottom: `1px solid ${isDark ? 'rgba(99,155,255,0.15)' : 'rgba(37,99,235,0.10)'}` }}>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
                            <input
                                type="text"
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search department / section..."
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all duration-150"
                                style={{
                                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)',
                                    border: `1px solid ${isDark ? 'rgba(99,155,255,0.20)' : 'rgba(37,99,235,0.15)'}`,
                                    color: isDark ? '#e2e8f0' : '#0f172a',
                                }}
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {filteredList.length === 0 ? (
                            <div className="flex items-center justify-center py-6">
                                <span className="text-xs" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>No results found.</span>
                            </div>
                        ) : (
                            filteredList.map((item, idx) => {
                                const isSelected = item.id === value && item.kind === valueKind;
                                return (
                                    <button
                                        key={`${item.kind}-${item.id}`}
                                        type="button"
                                        className="w-full text-left px-4 py-2 text-sm transition-all duration-100 flex items-center justify-between gap-3"
                                        style={{
                                            color: isSelected ? (isDark ? '#93c5fd' : '#1d4ed8') : (isDark ? '#e2e8f0' : '#0f172a'),
                                            background: isSelected ? (isDark ? 'rgba(37,99,235,0.20)' : 'rgba(219,234,254,0.80)') : 'transparent',
                                            fontWeight: isSelected ? 600 : 400,
                                            borderBottom: idx < filteredList.length - 1 ? `1px solid ${isDark ? 'rgba(99,155,255,0.10)' : 'rgba(37,99,235,0.08)'}` : 'none',
                                        }}
                                        onClick={() => handleSelect(item)}
                                        onMouseEnter={e => {
                                            if (!isSelected) (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(59,130,246,0.12)' : 'rgba(219,234,254,0.50)';
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                                        }}
                                    >
                                        <span className="truncate hover:whitespace-normal hover:overflow-visible">{item.name}</span>
                                        <DeptKindBadge kind={item.kind} isDark={isDark} />
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function DeptKindBadge({ kind, isDark }: { kind: 'Department' | 'Section'; isDark: boolean }) {
    return (
        <span
            className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md shrink-0"
            style={{
                background: kind === 'Department'
                    ? (isDark ? 'rgba(37,99,235,0.25)' : 'rgba(219,234,254,0.90)')
                    : (isDark ? 'rgba(5,150,105,0.25)' : 'rgba(209,250,229,0.90)'),
                color: kind === 'Department'
                    ? (isDark ? '#93c5fd' : '#1d4ed8')
                    : (isDark ? '#6ee7b7' : '#047857'),
            }}
        >
            {kind === 'Department' ? 'Dept' : 'Sec'}
        </span>
    );
}
