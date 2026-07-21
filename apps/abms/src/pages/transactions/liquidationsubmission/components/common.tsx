import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, Info, X } from 'lucide-react';
import type { DeptOption, ToastItem, ToastKind } from '../types';
import type { T } from '../theme';

const TOAST_CFG: Record<ToastKind, {
    dark:  { bg: string; border: string; text: string; sub: string };
    light: { bg: string; border: string; text: string; sub: string };
    Icon: React.ComponentType<{ className?: string }>;
}> = {
    success: {
        dark:  { bg: 'rgba(2,44,20,0.98)',   border: 'rgba(74,222,128,0.55)',  text: '#4ade80', sub: '#86efac' },
        light: { bg: 'rgba(240,253,244,1)',   border: 'rgba(22,163,74,0.50)',   text: '#15803d', sub: '#166534' },
        Icon: CheckCircle2,
    },
    error: {
        dark:  { bg: 'rgba(60,7,7,0.98)',    border: 'rgba(248,113,113,0.55)', text: '#f87171', sub: '#fca5a5' },
        light: { bg: 'rgba(254,242,242,1)',   border: 'rgba(239,68,68,0.50)',   text: '#b91c1c', sub: '#991b1b' },
        Icon: AlertCircle,
    },
    warning: {
        dark:  { bg: 'rgba(44,26,2,0.98)',   border: 'rgba(251,191,36,0.55)',  text: '#fbbf24', sub: '#fcd34d' },
        light: { bg: 'rgba(255,251,235,1)',   border: 'rgba(202,138,4,0.50)',   text: '#b45309', sub: '#92400e' },
        Icon: AlertCircle,
    },
    info: {
        dark:  { bg: 'rgba(7,19,54,0.98)',   border: 'rgba(99,155,255,0.55)',  text: '#60a5fa', sub: '#93c5fd' },
        light: { bg: 'rgba(239,246,255,1)',   border: 'rgba(37,99,235,0.45)',   text: '#1d4ed8', sub: '#1e40af' },
        Icon: Info,
    },
};

export function Toasts({
    items, isDark, onDismiss,
}: { items: ToastItem[]; isDark: boolean; onDismiss: (id: number) => void }) {
    if (items.length === 0) return null;
    return (
        <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5" style={{ maxWidth: 360 }}>
            <style>{`@keyframes toast-in{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>
            {items.map(item => {
                const cfg = TOAST_CFG[item.kind];
                const s = isDark ? cfg.dark : cfg.light;
                return (
                    <div
                        key={item.id}
                        className="flex items-start gap-3 px-4 py-3 rounded-xl"
                        style={{
                            background: s.bg,
                            border: `1px solid ${s.border}`,
                            animation: 'toast-in .22s ease-out',
                            boxShadow: isDark
                                ? '0 8px 32px rgba(0,0,0,.70)'
                                : '0 4px 20px rgba(0,0,0,.12)',
                        }}
                    >
                        <cfg.Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: s.text }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold m-0 leading-snug" style={{ color: s.text }}>
                                {item.title}
                            </p>
                            {item.description && (
                                <p className="text-xs m-0 mt-0.5 leading-snug" style={{ color: s.sub, opacity: 0.85 }}>
                                    {item.description}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => onDismiss(item.id)}
                            className="shrink-0 hover:opacity-100 transition-opacity mt-0.5"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.55, color: s.text, padding: 0 }}
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

export function Checkbox({
    checked, onChange, label, t, isDark,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; t: typeof T.dark; isDark: boolean }) {
    return (
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <div
                className="flex items-center justify-center rounded transition-all duration-150 shrink-0"
                style={{
                    width: 16, height: 16,
                    background: checked ? t.checkboxChecked : t.checkboxBg,
                    border: `1.5px solid ${checked ? (isDark ? '#3b82f6' : '#1d4ed8') : t.checkboxBorder}`,
                }}
                onClick={() => onChange(!checked)}
            >
                {checked && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.2 6L8 1" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>
            <span
                className="text-xs font-semibold"
                style={{ color: checked ? (isDark ? '#ddeeff' : '#0a1628') : t.cellMuted }}
                onClick={() => onChange(!checked)}
            >
                {label}
            </span>
        </label>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// DeptDropdown
// ─────────────────────────────────────────────────────────────────────────────
export function DeptDropdown({
    value, onChange, t, isDark, options,
}: { value: string; onChange: (id: string, kind: 'Department' | 'Section' | '') => void; options: DeptOption[]; t: typeof T.dark; isDark: boolean }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const sorted = [...options].sort((a, b) => a.name.localeCompare(b.name));
    const filtered = query.trim()
        ? sorted.filter(o => o.name.toLowerCase().includes(query.toLowerCase()))
        : sorted;
    const selected = sorted.find(o => o.id === value) ?? null;

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false); setQuery('');
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    function kindStyle(kind: 'Department' | 'Section') {
        return {
            background: kind === 'Department'
                ? (isDark ? 'rgba(37,99,235,0.28)' : 'rgba(219,234,254,0.90)')
                : (isDark ? 'rgba(5,150,105,0.28)' : 'rgba(209,250,229,0.90)'),
            color: kind === 'Department'
                ? (isDark ? '#93c5fd' : '#1d4ed8')
                : (isDark ? '#6ee7b7' : '#047857'),
        };
    }

    return (
        <div className="relative w-full" ref={ref}>
            <button
                type="button"
                onClick={() => { setOpen(p => !p); setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="flex w-full items-center gap-2 rounded-xl border py-2 pl-3 pr-2.5 text-xs font-semibold outline-none transition-all duration-150"
                style={{
                    background: t.inputBg,
                    borderColor: open ? (isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)') : t.inputBorder,
                    color: selected ? t.inputText : t.inputPlaceholder,
                    minWidth: 0,
                }}
            >
                <span className="flex-1 text-left truncate">
                    {selected?.name ?? 'All departments…'}
                </span>
                {selected && (
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md shrink-0" style={kindStyle(selected.kind)}>
                        {selected.kind === 'Department' ? 'Dept' : 'Sec'}
                    </span>
                )}
                <ChevronDown
                    className="w-3 h-3 shrink-0 transition-transform duration-150"
                    style={{ color: t.cellMuted, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </button>

            {open && (
                <div
                    className="absolute top-full left-0 mt-1 z-[200] rounded-xl overflow-hidden"
                    style={{
                        background: t.dropdownBg, border: `1px solid ${t.dropdownBorder}`,
                        boxShadow: t.dropdownShadow, width: '100%', minWidth: 240,
                        maxHeight: 240, overflowY: 'auto',
                    }}
                >
                    <div className="px-3 py-2" style={{ borderBottom: `1px solid ${t.dropdownDivider}` }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search…"
                            className="w-full bg-transparent outline-none text-xs"
                            style={{ color: t.inputText }}
                        />
                    </div>

                    {value && (
                        <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-xs transition-all duration-100"
                            style={{ color: t.cellMuted, borderBottom: `1px solid ${t.dropdownDivider}` }}
                            onClick={() => { onChange('', ''); setOpen(false); setQuery(''); }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.dropdownHover; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                            — All departments
                        </button>
                    )}

                    {filtered.map((item, idx) => {
                        const isSel = item.id === value;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className="group flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-xs transition-all duration-100"
                                style={{
                                    color: isSel ? t.dropdownSelectedText : t.dropdownText,
                                    background: isSel ? t.dropdownSelected : 'transparent',
                                    fontWeight: isSel ? 600 : 400,
                                    borderBottom: idx < filtered.length - 1 ? `1px solid ${t.dropdownDivider}` : 'none',
                                }}
                                onClick={() => { onChange(item.id, item.kind); setOpen(false); setQuery(''); }}
                                onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = t.dropdownHover; }}
                                onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                                <span className="min-w-0 flex-1 truncate leading-5 group-hover:overflow-visible group-hover:whitespace-normal group-hover:break-words">{item.name}</span>
                                <span className="mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest" style={kindStyle(item.kind)}>
                                    {item.kind === 'Department' ? 'Dept' : 'Sec'}
                                </span>
                            </button>
                        );
                    })}

                    {filtered.length === 0 && (
                        <p className="px-3 py-3 text-xs text-center" style={{ color: t.cellMuted }}>No results</p>
                    )}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────────────
export function StatusBadge({ status, isDark }: { status: string; isDark: boolean }) {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
        'for review':         { bg: isDark ? 'rgba(251,191,36,0.15)'   : 'rgba(253,230,138,0.50)', text: isDark ? '#fbbf24' : '#92400e', border: isDark ? 'rgba(251,191,36,0.40)'  : 'rgba(202,138,4,0.40)' },
        'for budget director':{ bg: isDark ? 'rgba(167,139,250,0.18)'  : 'rgba(237,233,254,0.90)', text: isDark ? '#c4b5fd' : '#4c1d95', border: isDark ? 'rgba(167,139,250,0.45)' : 'rgba(109,40,217,0.40)' },
        'certified':          { bg: isDark ? 'rgba(74,222,128,0.12)'   : 'rgba(187,247,208,0.55)', text: isDark ? '#4ade80' : '#065f46', border: isDark ? 'rgba(74,222,128,0.40)'  : 'rgba(4,120,87,0.35)' },
        'served':             { bg: isDark ? 'rgba(96,165,250,0.12)'   : 'rgba(219,234,254,0.75)', text: isDark ? '#60a5fa' : '#1e3a8a', border: isDark ? 'rgba(96,165,250,0.40)'  : 'rgba(29,78,216,0.30)' },
        'served by wico':     { bg: isDark ? 'rgba(96,165,250,0.12)'   : 'rgba(219,234,254,0.75)', text: isDark ? '#60a5fa' : '#1e3a8a', border: isDark ? 'rgba(96,165,250,0.40)'  : 'rgba(29,78,216,0.30)' },
        'cancelled':          { bg: isDark ? 'rgba(100,116,139,0.18)'  : 'rgba(241,245,249,0.85)', text: isDark ? '#94a3b8' : '#475569', border: isDark ? 'rgba(100,116,139,0.40)' : 'rgba(148,163,184,0.38)' },
        'disapproved':        { bg: isDark ? 'rgba(248,113,113,0.12)'  : 'rgba(254,226,226,0.65)', text: isDark ? '#f87171' : '#991b1b', border: isDark ? 'rgba(248,113,113,0.40)' : 'rgba(220,38,38,0.32)' },
        'p.o. on process':    { bg: isDark ? 'rgba(34,211,238,0.18)'   : 'rgba(207,250,254,0.85)', text: isDark ? '#67e8f9' : '#0e4f63', border: isDark ? 'rgba(34,211,238,0.40)'  : 'rgba(8,145,178,0.40)' },
    };
    const s = styles[status?.toLowerCase()] ?? {
        bg: isDark ? 'rgba(100,116,139,0.18)' : 'rgba(241,245,249,0.85)',
        text: isDark ? '#94a3b8' : '#475569',
        border: isDark ? 'rgba(100,116,139,0.40)' : 'rgba(148,163,184,0.38)',
    };
    return (
        <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 6,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
            textTransform: 'uppercase', whiteSpace: 'nowrap',
            background: s.bg, color: s.text, border: `1px solid ${s.border}`,
        }}>
            {status?.toUpperCase() ?? '—'}
        </span>
    );
}
