import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, ChevronDown, Eye, Info, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import type { BtnToken, DeptOption, ThemeTokens, ToastItem, Status, ToastKind } from '../types';

export const TOAST_CFG: Record<ToastKind, {
    dark: { bg: string; border: string; text: string };
    light: { bg: string; border: string; text: string };
    Icon: React.ComponentType<{ className?: string }>;
}> = {
    success: {
        dark: { bg: 'rgba(2,44,20,0.98)', border: 'rgba(74,222,128,0.55)', text: '#4ade80' },
        light: { bg: 'rgba(240,253,244,1)', border: 'rgba(22,163,74,0.50)', text: '#15803d' },
        Icon: CheckCircle2,
    },
    error: {
        dark: { bg: 'rgba(60,7,7,0.98)', border: 'rgba(248,113,113,0.55)', text: '#f87171' },
        light: { bg: 'rgba(254,242,242,1)', border: 'rgba(239,68,68,0.50)', text: '#b91c1c' },
        Icon: AlertCircle,
    },
    info: {
        dark: { bg: 'rgba(7,19,54,0.98)', border: 'rgba(99,155,255,0.55)', text: '#60a5fa' },
        light: { bg: 'rgba(239,246,255,1)', border: 'rgba(37,99,235,0.45)', text: '#1d4ed8' },
        Icon: Info,
    },
};

export function Toasts({
    items, isDark, onDismiss,
}: { items: ToastItem[]; isDark: boolean; onDismiss: (id: number) => void }) {
    if (items.length === 0) return null;
    return (
        <div className="fixed bottom-3 left-3 right-3 z-[99999] flex flex-col gap-2.5 sm:bottom-5 sm:left-auto sm:right-5" style={{ maxWidth: 340 }}>
            <style>{`@keyframes toast-in{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>
            {items.map(item => {
                const cfg = TOAST_CFG[item.kind];
                const s = isDark ? cfg.dark : cfg.light;
                return (
                    <div
                        key={item.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold"
                        style={{
                            background: s.bg, border: `1px solid ${s.border}`, color: s.text,
                            animation: 'toast-in .22s ease-out',
                            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,.7)' : '0 4px 20px rgba(0,0,0,.12)',
                        }}
                    >
                        <cfg.Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1">{item.message}</span>
                        <button onClick={() => onDismiss(item.id)} style={{ opacity: .6 }} className="hover:opacity-100 transition-opacity">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toolbar button
// ─────────────────────────────────────────────────────────────────────────────
export type BtnToken = { bg: string; border: string; text: string; hover: string };

export function Btn({
    token, icon, label, onClick, disabled = false, t, className = '',
}: {
    token: BtnToken; icon: React.ReactNode; label: string;
    onClick?: () => void; disabled?: boolean; t: ThemeTokens; className?: string;
}) {
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={!disabled ? onClick : undefined}
            onMouseEnter={() => !disabled && setHov(true)}
            onMouseLeave={() => setHov(false)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap ${className}`}
            style={{
                background: disabled ? t.btnDisBg : hov ? token.hover : token.bg,
                borderColor: disabled ? t.btnDisBorder : token.border,
                color: disabled ? t.btnDisText : token.text,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.55 : 1,
            }}
        >
            {icon}{label}
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkbox
// ─────────────────────────────────────────────────────────────────────────────
export function Checkbox({
    checked, onChange, label, t, isDark,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; t: ThemeTokens; isDark: boolean }) {
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
// Department dropdown (searchable)
// ─────────────────────────────────────────────────────────────────────────────
export function DeptDropdown({
    value, onChange, t, isDark, options,
}: { value: string; onChange: (id: string) => void; options: DeptOption[]; t: ThemeTokens; isDark: boolean }) {
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
                        boxShadow: t.dropdownShadow, width: '100%', minWidth: 220,
                        maxHeight: 240, overflowY: 'auto',
                    }}
                >
                    {/* Search */}
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

                    {/* Clear option */}
                    {value && (
                        <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-xs transition-all duration-100"
                            style={{ color: t.cellMuted, borderBottom: `1px solid ${t.dropdownDivider}` }}
                            onClick={() => { onChange(''); setOpen(false); setQuery(''); }}
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
                                onClick={() => { onChange(item.id); setOpen(false); setQuery(''); }}
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
// ActionsMenu — portal triple-dot menu (exact pattern from BudgetAdjustmentEntry)
// ─────────────────────────────────────────────────────────────────────────────
export function ActionsMenu({
    t, isDark, onView, onEdit, onDelete,
}: {
    t: ThemeTokens; isDark: boolean;
    onView: () => void; onEdit: () => void; onDelete: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                btnRef.current && !btnRef.current.contains(e.target as Node)
            ) setOpen(false);
        }
        function onScroll() { setOpen(false); }
        document.addEventListener('mousedown', onDown);
        window.addEventListener('scroll', onScroll, true);
        return () => {
            document.removeEventListener('mousedown', onDown);
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [open]);

    function handleToggle() {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        setMenuPos({
            top: rect.bottom + window.scrollY + 4,
            left: rect.right + window.scrollX - 136,
        });
        setOpen(prev => !prev);
    }

    const menuItems = [
        { icon: <Eye className="w-3.5 h-3.5" />, label: 'View', color: t.cellMuted, action: () => { setOpen(false); onView(); } },
        { icon: <Pencil className="w-3.5 h-3.5" />, label: 'Edit', color: t.cellBlue, action: () => { setOpen(false); onEdit(); } },
        { icon: <Trash2 className="w-3.5 h-3.5" />, label: 'Delete', color: t.cellRed, action: () => { setOpen(false); onDelete(); } },
    ];

    const portal = open ? createPortal(
        <div
            ref={menuRef}
            style={{
                position: 'absolute',
                top: menuPos.top,
                left: menuPos.left,
                zIndex: 99999,
                background: t.actionMenuBg,
                border: `1px solid ${t.actionMenuBorder}`,
                boxShadow: t.actionMenuShadow,
                minWidth: '136px',
                borderRadius: '12px',
                overflow: 'hidden',
            }}
        >
            {menuItems.map((item, idx) => (
                <button
                    key={item.label}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-all duration-100"
                    style={{
                        color: item.color,
                        background: 'transparent',
                        borderBottom: idx < menuItems.length - 1 ? `1px solid ${t.rowBorder}` : 'none',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background =
                            isDark ? 'rgba(99,155,255,0.09)' : 'rgba(37,99,235,0.06)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                    onClick={item.action}
                >
                    {item.icon}
                    {item.label}
                </button>
            ))}
        </div>,
        document.body,
    ) : null;

    return (
        <div className="flex justify-center">
            <button
                ref={btnRef}
                type="button"
                onClick={handleToggle}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 border"
                style={{
                    background: open
                        ? (isDark ? 'rgba(99,155,255,0.18)' : 'rgba(37,99,235,0.12)')
                        : 'transparent',
                    borderColor: open
                        ? (isDark ? 'rgba(99,155,255,0.40)' : 'rgba(37,99,235,0.30)')
                        : 'transparent',
                    color: t.cellMuted,
                }}
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>
            {portal}
        </div>
    );
}

export function StatusBadge({ status, t }: { status: Status; t: ThemeTokens }) {
    const token = ((): typeof t.statusForReview => {
        switch (status) {
            case 'unsaved': return t.statusUnsaved ?? t.statusForReview;
            case 'reprocess': return t.statusReprocess ?? t.statusForReview;
            case 'for review': return t.statusForReview;
            case 'for certification': return t.statusForCertification;
            case 'certified': return t.statusCertified;
            case 'for pricing': return t.statusForPricing;
            case 'disapproved': return t.statusDisapproved;
            case 'cancelled': return t.statusCancelled;
            case 'served by wico': return t.statusServedByWico;
            case 'for budget staff': return t.statusForBudgetStaff;
            case 'for budget director': return t.statusForBudgetDir;
            case 'for purchase': return t.statusForPurchase;
            case 'po on process': return t.statusPOOnProcess;
            case 'on process': return t.statusOnProcess;
            case 'for approval': return t.statusForApproval;
            default: return t.statusForReview;
        }
    })();

    return (
        <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
            style={{ background: token.bg, border: `1px solid ${token.border}`, color: token.text }}
        >
            {status}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Supply list — API types
