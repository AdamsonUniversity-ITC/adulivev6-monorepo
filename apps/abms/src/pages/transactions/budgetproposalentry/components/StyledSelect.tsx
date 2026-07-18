import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import type { AccountOption, ThemeTokens } from '../types';

interface StyledSelectProps { value: string; onChange: (v: string) => void; options: AccountOption[]; placeholder: string; disabled?: boolean; t: ThemeTokens; isDark: boolean; }

export function StyledSelect({ value, onChange, options, placeholder, disabled = false, t, isDark }: StyledSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const selected = options.find(option => option.value === value) ?? null;
    const filteredOptions = useMemo(() => { const query = search.trim().toLowerCase(); return query ? options.filter(option => option.label.toLowerCase().includes(query)) : options; }, [options, search]);
    const close = () => { setOpen(false); setSearch(''); };
    const selectOption = (nextValue: string) => { onChange(nextValue); close(); };

    return <div className="relative">
        <button type="button" role="combobox" aria-expanded={open} aria-haspopup="listbox" disabled={disabled} onClick={() => setOpen(current => { if (current) setSearch(''); return !current; })} onKeyDown={event => { if (event.key === 'Escape') close(); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-150" style={{ background: t.inputBg, border: `1px solid ${open ? (isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)') : t.inputBorder}`, color: selected ? t.inputText : 'var(--abms-text-muted)', backdropFilter: 'blur(6px)', opacity: disabled ? 0.72 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
            <span className="min-w-0 flex-1 truncate text-left">{selected?.label ?? placeholder}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform duration-150" style={{ color: isDark ? '#94a3b8' : '#64748b', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </button>
        {open && !disabled && <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[220px] overflow-hidden rounded-xl" style={{ background: isDark ? 'rgba(10, 18, 38, 0.98)' : 'rgba(255,255,255,0.99)', border: `1px solid ${isDark ? 'rgba(99,155,255,0.30)' : 'rgba(37,99,235,0.20)'}`, boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.50)' : '0 8px 32px rgba(0,48,135,0.15)' }}>
            <div className="px-3 py-2" style={{ borderBottom: `1px solid ${isDark ? 'rgba(99,155,255,0.15)' : 'rgba(37,99,235,0.10)'}` }}><div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
                <input type="search" autoFocus value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') close(); }} placeholder="Search accounts..." className="w-full rounded-lg py-1.5 pr-3 pl-8 text-xs outline-none transition-all duration-150" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)', border: `1px solid ${isDark ? 'rgba(99,155,255,0.20)' : 'rgba(37,99,235,0.15)'}`, color: isDark ? '#e2e8f0' : '#0f172a' }} onClick={event => event.stopPropagation()} />
            </div></div>
            <div role="listbox" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {!search && value && <button type="button" role="option" aria-selected={false} className="w-full px-4 py-2 text-left text-sm italic" style={{ color: isDark ? '#94a3b8' : '#64748b', borderBottom: `1px solid ${isDark ? 'rgba(99,155,255,0.10)' : 'rgba(37,99,235,0.08)'}` }} onClick={() => selectOption('')}>{placeholder}</button>}
                {filteredOptions.length === 0 ? <div className="flex items-center justify-center py-6"><span className="text-xs" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>No results found.</span></div> : filteredOptions.map((option, index) => {
                    const isSelected = option.value === value;
                    return <button key={option.value} type="button" role="option" aria-selected={isSelected} className="group flex w-full items-start gap-2 px-4 py-2 text-left text-sm transition-all duration-100" style={{ color: isSelected ? (isDark ? '#93c5fd' : '#1d4ed8') : (isDark ? '#e2e8f0' : '#0f172a'), background: isSelected ? (isDark ? 'rgba(37,99,235,0.20)' : 'rgba(219,234,254,0.80)') : 'transparent', fontWeight: isSelected ? 600 : 400, borderBottom: index < filteredOptions.length - 1 ? `1px solid ${isDark ? 'rgba(99,155,255,0.10)' : 'rgba(37,99,235,0.08)'}` : 'none' }} onClick={() => selectOption(option.value)} onMouseEnter={event => { if (!isSelected) event.currentTarget.style.background = isDark ? 'rgba(59,130,246,0.12)' : 'rgba(219,234,254,0.50)'; }} onMouseLeave={event => { if (!isSelected) event.currentTarget.style.background = 'transparent'; }}>
                        <span className="min-w-0 flex-1 truncate whitespace-nowrap group-hover:overflow-visible group-hover:whitespace-normal">{option.label}</span><Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                    </button>;
                })}
            </div>
        </div>}
    </div>;
}
