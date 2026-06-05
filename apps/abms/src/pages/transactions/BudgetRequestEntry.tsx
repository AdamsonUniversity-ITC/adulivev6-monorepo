import React, { useState, useRef, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { financeSvc } from '@repo/axios-config/finance-service';
import { createPortal } from 'react-dom';
import AdamsonBudgetLayout from '../../layouts/Screenlayout';
import {
    RefreshCw, FilePlus, Copy, Eye, Pencil, Trash2,
    ChevronDown, Search, ClipboardList, MoreHorizontal,
    CheckCircle2, AlertCircle, Info, X,
    Save, Printer, MessageSquare, Plus, StickyNote,
    Check, ArrowRight, User,
} from 'lucide-react';
import { budgetrequestentryRoute } from '../../router';
import { useRouteContext } from '@tanstack/react-router';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same rich palette as BudgetAdjustmentEntry
// ─────────────────────────────────────────────────────────────────────────────
const T = {
    dark: {
        titleColor: '#f0f6ff',
        subColor: '#a8c4f0',

        cardBg: 'rgba(11,19,40,0.96)',
        cardBorder: 'rgba(100,160,255,0.30)',
        cardShadow: '0 4px 40px rgba(37,99,235,0.22)',
        cardHeaderBg: 'rgba(7,14,32,0.98)',
        cardHeaderBorder: 'rgba(100,160,255,0.22)',
        sectionDivider: 'rgba(100,160,255,0.14)',

        inputBg: 'rgba(13,26,58,0.85)',
        inputBorder: 'rgba(100,160,255,0.32)',
        inputText: '#e8f0fe',
        inputPlaceholder: '#5a7ca8',

        tableHeadBg: 'rgba(10,22,50,0.90)',
        tableHeadText: '#7eb8ff',
        tableHeadBorder: 'rgba(100,160,255,0.26)',
        rowBorder: 'rgba(100,160,255,0.11)',
        rowEvenBg: 'rgba(13,26,58,0.32)',
        rowOddBg: 'transparent',
        rowHoverBg: 'rgba(59,130,246,0.09)',

        cellText: '#ddeeff',
        cellMuted: '#7a9cc4',
        cellBlue: '#60a5fa',
        cellGreen: '#4ade80',
        cellAmber: '#fbbf24',
        cellRed: '#f87171',

        pillBg: 'rgba(59,130,246,0.25)',
        pillText: '#93c5fd',
        pillBorder: 'rgba(100,160,255,0.45)',

        checkboxBorder: 'rgba(100,160,255,0.45)',
        checkboxBg: 'rgba(13,26,58,0.85)',
        checkboxChecked: '#2563eb',

        statusForReview: { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.40)', text: '#fbbf24' },
        statusForCertification: { bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.30)', text: '#fcd34d' },
        statusCertified: { bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.35)', text: '#4ade80' },
        statusForPricing: { bg: 'rgba(251,146,60,0.13)', border: 'rgba(251,146,60,0.38)', text: '#fb923c' },
        statusDisapproved: { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)', text: '#f87171' },
        statusCancelled: { bg: 'rgba(100,116,139,0.18)', border: 'rgba(100,116,139,0.38)', text: '#94a3b8' },
        statusServedByWico: { bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)', text: '#60a5fa' },
        statusForBudgetStaff: { bg: 'rgba(167,139,250,0.13)', border: 'rgba(167,139,250,0.38)', text: '#a78bfa' },
        statusForBudgetDir: { bg: 'rgba(167,139,250,0.18)', border: 'rgba(167,139,250,0.45)', text: '#c4b5fd' },
        statusForPurchase: { bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.35)', text: '#22d3ee' },
        statusPOOnProcess: { bg: 'rgba(34,211,238,0.18)', border: 'rgba(34,211,238,0.42)', text: '#67e8f9' },

        btnRefresh: { bg: 'rgba(59,130,246,0.18)', border: 'rgba(100,160,255,0.45)', text: '#7eb8ff', hover: 'rgba(59,130,246,0.30)' },
        btnNew: { bg: 'rgba(22,163,74,0.15)', border: 'rgba(74,222,128,0.40)', text: '#4ade80', hover: 'rgba(22,163,74,0.26)' },
        btnPrevSY: { bg: 'rgba(124,58,237,0.18)', border: 'rgba(167,139,250,0.42)', text: '#a78bfa', hover: 'rgba(124,58,237,0.30)' },

        btnDisBg: 'rgba(20,30,60,0.50)',
        btnDisBorder: 'rgba(60,80,120,0.30)',
        btnDisText: '#3a5070',

        totalBg: 'rgba(10,22,50,0.90)',
        totalBorder: 'rgba(100,160,255,0.22)',
        totalLabel: '#7eb8ff',

        dropdownBg: 'rgba(10,18,38,0.98)',
        dropdownBorder: 'rgba(99,155,255,0.30)',
        dropdownShadow: '0 8px 32px rgba(0,0,0,0.55)',
        dropdownHover: 'rgba(59,130,246,0.12)',
        dropdownSelected: 'rgba(37,99,235,0.22)',
        dropdownSelectedText: '#93c5fd',
        dropdownText: '#e2e8f0',
        dropdownDivider: 'rgba(99,155,255,0.09)',

        // Actions menu (triple-dot)
        actionMenuBg: 'rgba(9,16,36,0.98)',
        actionMenuBorder: 'rgba(100,160,255,0.28)',
        actionMenuShadow: '0 8px 28px rgba(0,0,0,0.55)',
    },
    light: {
        titleColor: '#0a1628',
        subColor: '#2d4a7a',

        cardBg: 'rgba(255,255,255,0.99)',
        cardBorder: 'rgba(37,99,235,0.22)',
        cardShadow: '0 4px 32px rgba(0,48,135,0.12)',
        cardHeaderBg: 'rgba(240,246,255,0.99)',
        cardHeaderBorder: 'rgba(37,99,235,0.18)',
        sectionDivider: 'rgba(37,99,235,0.10)',

        inputBg: 'rgba(232,242,255,0.95)',
        inputBorder: 'rgba(37,99,235,0.28)',
        inputText: '#0a1628',
        inputPlaceholder: '#7a9cc4',

        tableHeadBg: 'rgba(210,228,255,0.95)',
        tableHeadText: '#1440a8',
        tableHeadBorder: 'rgba(37,99,235,0.22)',
        rowBorder: 'rgba(37,99,235,0.09)',
        rowEvenBg: 'rgba(232,242,255,0.60)',
        rowOddBg: 'transparent',
        rowHoverBg: 'rgba(219,234,254,0.55)',

        cellText: '#0a1628',
        cellMuted: '#2d4a7a',
        cellBlue: '#1440a8',
        cellGreen: '#047857',
        cellAmber: '#b45309',
        cellRed: '#dc2626',

        pillBg: 'rgba(37,99,235,0.12)',
        pillText: '#1440a8',
        pillBorder: 'rgba(37,99,235,0.32)',

        checkboxBorder: 'rgba(37,99,235,0.40)',
        checkboxBg: 'rgba(232,242,255,0.95)',
        checkboxChecked: '#1d4ed8',

        statusForReview: { bg: 'rgba(253,230,138,0.50)', border: 'rgba(202,138,4,0.40)', text: '#92400e' },
        statusForCertification: { bg: 'rgba(253,230,138,0.35)', border: 'rgba(202,138,4,0.28)', text: '#a16207' },
        statusCertified: { bg: 'rgba(187,247,208,0.55)', border: 'rgba(4,120,87,0.35)', text: '#065f46' },
        statusForPricing: { bg: 'rgba(254,215,170,0.55)', border: 'rgba(194,65,12,0.32)', text: '#9a3412' },
        statusDisapproved: { bg: 'rgba(254,226,226,0.65)', border: 'rgba(220,38,38,0.32)', text: '#991b1b' },
        statusCancelled: { bg: 'rgba(241,245,249,0.85)', border: 'rgba(148,163,184,0.38)', text: '#475569' },
        statusServedByWico: { bg: 'rgba(219,234,254,0.75)', border: 'rgba(29,78,216,0.30)', text: '#1e3a8a' },
        statusForBudgetStaff: { bg: 'rgba(237,233,254,0.70)', border: 'rgba(109,40,217,0.30)', text: '#5b21b6' },
        statusForBudgetDir: { bg: 'rgba(237,233,254,0.90)', border: 'rgba(109,40,217,0.40)', text: '#4c1d95' },
        statusForPurchase: { bg: 'rgba(207,250,254,0.65)', border: 'rgba(8,145,178,0.30)', text: '#155e75' },
        statusPOOnProcess: { bg: 'rgba(207,250,254,0.85)', border: 'rgba(8,145,178,0.40)', text: '#0e4f63' },

        btnRefresh: { bg: 'rgba(37,99,235,0.10)', border: 'rgba(37,99,235,0.35)', text: '#1d4ed8', hover: 'rgba(37,99,235,0.18)' },
        btnNew: { bg: 'rgba(4,120,87,0.10)', border: 'rgba(4,120,87,0.35)', text: '#047857', hover: 'rgba(4,120,87,0.18)' },
        btnPrevSY: { bg: 'rgba(109,40,217,0.10)', border: 'rgba(109,40,217,0.32)', text: '#6d28d9', hover: 'rgba(109,40,217,0.18)' },

        btnDisBg: 'rgba(241,245,249,0.80)',
        btnDisBorder: 'rgba(203,213,225,0.60)',
        btnDisText: '#94a3b8',

        totalBg: 'rgba(210,228,255,0.80)',
        totalBorder: 'rgba(37,99,235,0.20)',
        totalLabel: '#1440a8',

        dropdownBg: 'rgba(255,255,255,0.99)',
        dropdownBorder: 'rgba(37,99,235,0.20)',
        dropdownShadow: '0 8px 32px rgba(0,48,135,0.16)',
        dropdownHover: 'rgba(219,234,254,0.55)',
        dropdownSelected: 'rgba(219,234,254,0.85)',
        dropdownSelectedText: '#1d4ed8',
        dropdownText: '#0f172a',
        dropdownDivider: 'rgba(37,99,235,0.08)',

        // Actions menu (triple-dot)
        actionMenuBg: 'rgba(255,255,255,0.99)',
        actionMenuBorder: 'rgba(37,99,235,0.20)',
        actionMenuShadow: '0 8px 28px rgba(0,48,135,0.14)',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────
type Status =
    | 'for review'
    | 'for certification'
    | 'certified'
    | 'for pricing'
    | 'disapproved'
    | 'cancelled'
    | 'served by wico'
    | 'for budget staff'
    | 'for budget director'
    | 'for purchase'
    | 'p.o. on process';

interface DeptOption { id: string; name: string; kind: 'Department' | 'Section' }

interface RSRecord {
    id: number; date: string; requisitionNo: string;
    payee: string;
    requestedBy: string;
    requestedByName: string;
    totalAmount: number; status: Status;
}




const fmt = (n: number) =>
    n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─────────────────────────────────────────────────────────────────────────────
// Toast — matches BudgetAdjustmentEntry pattern
// ─────────────────────────────────────────────────────────────────────────────
type ToastKind = 'success' | 'error' | 'info';
interface ToastItem { id: number; kind: ToastKind; message: string }

const TOAST_CFG: Record<ToastKind, {
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

function Toasts({
    items, isDark, onDismiss,
}: { items: ToastItem[]; isDark: boolean; onDismiss: (id: number) => void }) {
    if (items.length === 0) return null;
    return (
        <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5" style={{ maxWidth: 340 }}>
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
type BtnToken = { bg: string; border: string; text: string; hover: string };

function Btn({
    token, icon, label, onClick, disabled = false, t,
}: {
    token: BtnToken; icon: React.ReactNode; label: string;
    onClick?: () => void; disabled?: boolean; t: typeof T.dark;
}) {
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={!disabled ? onClick : undefined}
            onMouseEnter={() => !disabled && setHov(true)}
            onMouseLeave={() => setHov(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
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
function Checkbox({
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
// Department dropdown (searchable)
// ─────────────────────────────────────────────────────────────────────────────
function DeptDropdown({
    value, onChange, t, isDark, options,
}: { value: string; onChange: (id: string) => void; options: DeptOption[]; t: typeof T.dark; isDark: boolean }) {
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
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => { setOpen(p => !p); setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-xl text-xs font-semibold border outline-none transition-all duration-150"
                style={{
                    background: t.inputBg,
                    borderColor: open ? (isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)') : t.inputBorder,
                    color: selected ? t.inputText : t.inputPlaceholder,
                    minWidth: 200,
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
                                className="w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition-all duration-100"
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
                                <span className="truncate">{item.name}</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md shrink-0" style={kindStyle(item.kind)}>
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
function ActionsMenu({
    t, isDark, onView, onEdit, onDelete,
}: {
    t: typeof T.dark; isDark: boolean;
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

// ─────────────────────────────────────────────────────────────────────────────
// Supply list — API types
// ─────────────────────────────────────────────────────────────────────────────
interface SupplyItem {
    id: number; item_code: string; item_name: string;
    unit_measurement: string; unit_cost: string;
}

interface SupplyPage {
    data: SupplyItem[];
    next_cursor: string | null;
    prev_cursor: string | null;
    per_page: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SupplyListPanel — read-only table, fetched from /abms/office-supplies
// ─────────────────────────────────────────────────────────────────────────────
function SupplyListPanel({
    t, isDark, onClose,
}: { t: typeof T.dark; isDark: boolean; onClose: () => void }) {
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<SupplyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSupplies = useCallback(async (q: string) => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = {};
            if (q) params.search = q;
            const res = await financeSvc.get('/abms/office-supplies', { params });
            const raw = res.data;
            setItems(Array.isArray(raw) ? raw : (raw?.data ?? []));
        } catch {
            setError('Failed to load supply list. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // No delay on initial empty search, debounce only when user is typing
        const delay = search.trim() === '' ? 0 : 350;
        const timer = setTimeout(() => fetchSupplies(search), delay);
        return () => clearTimeout(timer);
    }, [search, fetchSupplies]);

    const COLS = ['Item Code', 'Item Name', 'Unit', 'Unit Cost'];

    return (

        <div
            style={{
                width: '100%', maxWidth: '520px',
                background: t.cardBg,
                border: `1px solid ${t.cardBorder}`,
                borderRadius: '16px',
                boxShadow: t.cardShadow,
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                maxHeight: '82vh',
            }}
        >
            {/* Header */}
            <div
                style={{
                    background: t.cardHeaderBg,
                    borderBottom: `1px solid ${t.cardHeaderBorder}`,
                    padding: '14px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0,
                }}
            >
                <div>
                    <h2 className="text-sm font-bold tracking-tight" style={{ color: t.titleColor }}>
                        Stockable / Inventoriable Items
                    </h2>
                    <p className="text-[11px] mt-0.5" style={{ color: t.cellMuted }}>
                        WICO / Stockroom supply list — read only
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-150"
                    style={{ background: 'transparent', borderColor: t.cardBorder, color: t.cellMuted }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)';
                        (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(248,113,113,0.40)' : 'rgba(220,38,38,0.30)';
                        (e.currentTarget as HTMLElement).style.color = t.cellRed;
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.borderColor = t.cardBorder;
                        (e.currentTarget as HTMLElement).style.color = t.cellMuted;
                    }}
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Search bar */}
            <div
                style={{
                    padding: '10px 16px',
                    background: t.cardHeaderBg,
                    borderBottom: `1px solid ${t.cardHeaderBorder}`,
                    flexShrink: 0,
                }}
            >
                <div className="relative">
                    <Search
                        className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: t.cellMuted }}
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search code, name, unit…"
                        className="w-full pl-8 pr-3 py-2 rounded-xl text-[11px] font-semibold border outline-none transition-all duration-150"
                        style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText }}
                        onFocus={e => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)'; }}
                        onBlur={e => { (e.target as HTMLElement).style.borderColor = t.inputBorder; }}
                    />
                </div>
            </div>

            {/* Table — scrollable */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr style={{ background: t.tableHeadBg }}>
                            {COLS.map((col, i) => (
                                <th
                                    key={col}
                                    style={{
                                        padding: '9px 14px',
                                        fontSize: '9px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '.08em',
                                        color: t.tableHeadText,
                                        textAlign: i === COLS.length - 1 ? 'right' : 'left',
                                        borderBottom: `2px solid ${t.tableHeadBorder}`,
                                        borderRight: i < COLS.length - 1 ? `1px solid ${t.tableHeadBorder}` : 'none',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    style={{ padding: '40px 16px', textAlign: 'center', fontSize: '11px', color: t.cellMuted }}
                                >
                                    <RefreshCw
                                        className="w-4 h-4 mx-auto mb-2 opacity-50"
                                        style={{ color: t.cellMuted, animation: 'spin 1s linear infinite' }}
                                    />
                                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                                    Loading supply list…
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    style={{ padding: '40px 16px', textAlign: 'center', fontSize: '11px', color: t.cellRed }}
                                >
                                    <AlertCircle className="w-4 h-4 mx-auto mb-2 opacity-70" style={{ color: t.cellRed }} />
                                    {error}
                                    <button
                                        onClick={() => fetchSupplies(search)}
                                        className="block mx-auto mt-2 text-[10px] font-bold underline"
                                        style={{ color: t.cellBlue }}
                                    >
                                        Retry
                                    </button>
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    style={{ padding: '40px 16px', textAlign: 'center', fontSize: '11px', color: t.cellMuted }}
                                >
                                    {search ? <>No items match &ldquo;{search}&rdquo;.</> : 'No supply items found.'}
                                </td>
                            </tr>
                        ) : items.map((row, i) => (
                            <tr
                                key={row.id}
                                style={{
                                    background: i % 2 === 0 ? t.rowEvenBg : t.rowOddBg,
                                    borderBottom: `1px solid ${t.rowBorder}`,
                                    transition: 'background .12s ease',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.rowHoverBg; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? t.rowEvenBg : t.rowOddBg; }}
                            >
                                <td style={{ padding: '8px 14px', fontSize: '11px', fontWeight: 700, color: t.cellBlue, borderRight: `1px solid ${t.rowBorder}`, whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
                                    {row.item_code}
                                </td>
                                <td style={{ padding: '8px 14px', fontSize: '11px', color: t.cellText, borderRight: `1px solid ${t.rowBorder}` }}>
                                    {row.item_name}
                                </td>
                                <td style={{ padding: '8px 14px', fontSize: '11px', color: t.cellMuted, borderRight: `1px solid ${t.rowBorder}`, whiteSpace: 'nowrap' }}>
                                    {row.unit_measurement}
                                </td>
                                <td style={{ padding: '8px 14px', fontSize: '11px', fontWeight: 700, color: t.cellGreen, textAlign: 'right', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
                                    ₱ {parseFloat(row.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer count */}
            <div
                style={{
                    padding: '8px 16px',
                    background: t.cardHeaderBg,
                    borderTop: `1px solid ${t.cardHeaderBorder}`,
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center',
                }}
            >
                <span
                    className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md"
                    style={{ background: t.pillBg, color: t.pillText, border: `1px solid ${t.pillBorder}` }}
                >
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// PayeeDetailsModal — payee form for specific payment forms
// ─────────────────────────────────────────────────────────────────────────────
const PAYEE_REQUIRED_FORMS = ['Payment for Supplier/Water', 'Payment for Honorarium'] as const;

interface PayeeDetails {
    payee: string;
    tinNo: string;
    aduEmployee: boolean;
    nonVatRegistered: boolean;
    vatRegistered: boolean;
    mopCheque: boolean;
    mopBankTransfer: boolean;
    bankName: string;
    accountName: string;
    accountNumber: string;
    bankAddress: string;
}

const EMPTY_PAYEE: PayeeDetails = {
    payee: '',
    tinNo: '',
    aduEmployee: false,
    nonVatRegistered: false,
    vatRegistered: false,
    mopCheque: false,
    mopBankTransfer: false,
    bankName: '',
    accountName: '',
    accountNumber: '',
    bankAddress: '',
};

const BANK_OPTIONS = ['PNB', 'BDO', 'Metrobank', 'BPI'];

function PayeeDetailsModal({
    open, onClose, onConfirm, t, isDark,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: (details: PayeeDetails) => void;
    t: typeof T.dark;
    isDark: boolean;
}) {
    const [form, setForm] = useState<PayeeDetails>(EMPTY_PAYEE);

    useEffect(() => {
        if (open) setForm(EMPTY_PAYEE);
    }, [open]);

    if (!open) return null;

    function set<K extends keyof PayeeDetails>(key: K, val: PayeeDetails[K]) {
        setForm(prev => ({ ...prev, [key]: val }));
    }

    const isValid = form.payee.trim() !== '' && (form.mopCheque || form.mopBankTransfer) &&
        (!form.mopBankTransfer || (form.bankName !== '' && form.accountName.trim() !== '' && form.accountNumber.trim() !== ''));

    const labelStyle: React.CSSProperties = {
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
        color: t.tableHeadText, marginBottom: 5, display: 'block',
    };
    const inputStyle: React.CSSProperties = {
        width: '100%', borderRadius: 8, fontSize: 11, fontWeight: 600,
        padding: '7px 11px', border: `1px solid ${t.inputBorder}`,
        background: t.inputBg, color: t.inputText, outline: 'none',
        boxSizing: 'border-box' as const,
    };
    const sectionHead: React.CSSProperties = {
        fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em',
        color: t.tableHeadText, marginBottom: 8, paddingBottom: 5,
        borderBottom: `1px solid ${t.sectionDivider}`,
    };

    function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
        return (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 6 }}>
                <div
                    onClick={() => onChange(!checked)}
                    style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `1.5px solid ${checked ? (isDark ? '#60a5fa' : '#3b82f6') : t.inputBorder}`,
                        background: checked ? (isDark ? 'rgba(96,165,250,0.18)' : 'rgba(59,130,246,0.10)') : t.inputBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .12s',
                    }}
                >
                    {checked && <Check style={{ width: 10, height: 10, color: isDark ? '#60a5fa' : '#3b82f6', strokeWidth: 3 }} />}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: t.inputText }}>{label}</span>
            </label>
        );
    }

    return createPortal(
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(0,20,60,0.45)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                style={{
                    width: '100%', maxWidth: 480,
                    borderRadius: 16,
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.60)' : '0 16px 48px rgba(0,20,60,0.18)',
                    animation: 'modal-in .18s ease both',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '14px 20px 12px',
                    borderBottom: `1px solid ${t.sectionDivider}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <User style={{ width: 15, height: 15, color: isDark ? '#60a5fa' : '#3b82f6' }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: t.cardTitle }}>Payee Details</span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.cellMuted, display: 'flex', padding: 2 }}
                    >
                        <X style={{ width: 15, height: 15 }} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '18px 20px 20px', maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>

                    {/* Payee */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Payee <span style={{ color: '#f87171' }}>*</span></label>
                        <input
                            style={inputStyle}
                            value={form.payee}
                            onChange={e => set('payee', e.target.value)}
                            placeholder="Enter payee name"
                        />
                    </div>

                    {/* TIN No. */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>TIN No.</label>
                        <input
                            style={inputStyle}
                            value={form.tinNo}
                            onChange={e => {
                                const v = e.target.value.replace(/\D/g, '');
                                set('tinNo', v);
                            }}
                            placeholder="Enter TIN number"
                            inputMode="numeric"
                        />
                    </div>

                    {/* Classification checkboxes */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={sectionHead}>Classification</div>
                        <CheckRow
                            checked={form.aduEmployee}
                            onChange={v => set('aduEmployee', v)}
                            label="AdU Employee"
                        />
                        <CheckRow
                            checked={form.nonVatRegistered}
                            onChange={v => {
                                set('nonVatRegistered', v);
                                if (v) set('vatRegistered', false);
                            }}
                            label="Non-VAT Registered"
                        />
                        <CheckRow
                            checked={form.vatRegistered}
                            onChange={v => {
                                set('vatRegistered', v);
                                if (v) set('nonVatRegistered', false);
                            }}
                            label="VAT Registered"
                        />
                    </div>

                    {/* Mode of Payment */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={sectionHead}>Mode of Payment <span style={{ color: '#f87171' }}>*</span></div>
                        {(['cheque', 'bank_transfer'] as const).map(opt => {
                            const isSelected = opt === 'cheque' ? form.mopCheque : form.mopBankTransfer;
                            const label = opt === 'cheque' ? 'Cheque' : 'Bank Transfer';
                            return (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 6 }}>
                                    <div
                                        onClick={() => {
                                            set('mopCheque', opt === 'cheque');
                                            set('mopBankTransfer', opt === 'bank_transfer');
                                        }}
                                        style={{
                                            width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                                            border: `1.5px solid ${isSelected ? (isDark ? '#60a5fa' : '#3b82f6') : t.inputBorder}`,
                                            background: isSelected ? (isDark ? 'rgba(96,165,250,0.18)' : 'rgba(59,130,246,0.10)') : t.inputBg,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all .12s',
                                        }}
                                    >
                                        {isSelected && (
                                            <div style={{
                                                width: 7, height: 7, borderRadius: '50%',
                                                background: isDark ? '#60a5fa' : '#3b82f6',
                                            }} />
                                        )}
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: t.inputText }}>{label}</span>
                                </label>
                            );
                        })}
                    </div>

                    {/* Bank Transfer fields */}
                    {form.mopBankTransfer && (
                        <div
                            style={{
                                borderRadius: 10,
                                border: `1px solid ${t.cardBorder}`,
                                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                padding: '14px 14px 10px',
                                marginBottom: 4,
                            }}
                        >
                            <div style={{ ...sectionHead, marginBottom: 12 }}>Bank Transfer Details</div>

                            {/* Bank Name */}
                            <div style={{ marginBottom: 12 }}>
                                <label style={labelStyle}>Bank Name <span style={{ color: '#f87171' }}>*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        value={form.bankName}
                                        onChange={e => set('bankName', e.target.value)}
                                        style={{
                                            ...inputStyle,
                                            appearance: 'none', WebkitAppearance: 'none',
                                            paddingRight: 28,
                                            color: form.bankName ? t.inputText : t.inputPlaceholder,
                                            colorScheme: isDark ? 'dark' : 'light',
                                        }}
                                    >
                                        <option value="">— Select Bank —</option>
                                        {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <ChevronDown style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: t.cellMuted, pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Account Name */}
                            <div style={{ marginBottom: 12 }}>
                                <label style={labelStyle}>Account Name <span style={{ color: '#f87171' }}>*</span></label>
                                <input
                                    style={inputStyle}
                                    value={form.accountName}
                                    onChange={e => set('accountName', e.target.value)}
                                    placeholder="Enter account name"
                                />
                            </div>

                            {/* Account Number */}
                            <div style={{ marginBottom: 12 }}>
                                <label style={labelStyle}>Account Number <span style={{ color: '#f87171' }}>*</span></label>
                                <input
                                    style={inputStyle}
                                    value={form.accountNumber}
                                    onChange={e => set('accountNumber', e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter account number"
                                    inputMode="numeric"
                                />
                            </div>

                            {/* Bank Address */}
                            <div>
                                <label style={labelStyle}>Bank Address</label>
                                <input
                                    style={inputStyle}
                                    value={form.bankAddress}
                                    onChange={e => set('bankAddress', e.target.value)}
                                    placeholder="Enter bank address"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 20px',
                    borderTop: `1px solid ${t.sectionDivider}`,
                    display: 'flex', justifyContent: 'flex-end', gap: 8,
                }}>
                    <Btn token={t.btnRefresh} icon={<X className="w-3.5 h-3.5" />} label="Cancel" onClick={onClose} t={t} />
                    <Btn
                        token={t.btnNew}
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                        label="Proceed"
                        onClick={() => { if (isValid) onConfirm(form); }}
                        disabled={!isValid}
                        t={t}
                    />
                </div>
            </div>
        </div>,
        document.body,
    );
}

// NewRSModal — Budget Requisition Entry type-selection modal
// ─────────────────────────────────────────────────────────────────────────────
type RSType = 'stockroom' | 'logistics' | 'cashier' | null;

const PAYMENT_FORMS = [
    'Payment for Supplier/Water',
    'Reimbursement/Replenishment',
    'Payment for Honorarium',
    'Payment for Employee Benefits(Maternal Leave, Magna Carta, etc.)',
    'Request for Cash Advance',
    'PNB Credit Card Payment',
    
];

interface RSTypeOption {
    id: RSType;
    label: string;
    note: string;
}

const RS_TYPES: RSTypeOption[] = [
    {
        id: 'stockroom',
        label: 'For Office Supplies / Stockable Items / Inventoriable Items (WICO / Stockroom)',
        note: 'Will be served by WICO within 2 working days after Budget Office certifies the RS.',
    },
    {
        id: 'logistics',
        label: 'For Purchase (Logistics Office)',
        note: 'Will be PO\'d by Logistics within 10 working days after Budget Office certifies the RS.',
    },
    {
        id: 'cashier',
        label: 'For Cash Valued Items / Cash Advance / Payments (Accounting / Cashier)',
        note: 'For signed check release within 5 working days after Budget Office certifies the RS.',
    },
];

function NewRSModal({
    open, onClose, onConfirm, isLoading = false, t, isDark,
}: {
    open: boolean; onClose: () => void;
    onConfirm: (type: RSType, paymentForm: string, payeeDetails: PayeeDetails | null) => void;
    isLoading?: boolean;
    t: typeof T.dark; isDark: boolean;
}) {
    const [selected, setSelected] = useState<RSType>('stockroom');
    const [paymentForm, setPaymentForm] = useState('');
    const [showSupplyList, setShowSupplyList] = useState(false);
    const [showPayeeModal, setShowPayeeModal] = useState(false);
    const [pendingType, setPendingType] = useState<RSType>(null);

    useEffect(() => {
        if (open) { setSelected('stockroom'); setPaymentForm(''); setShowSupplyList(false); setShowPayeeModal(false); setPendingType(null); }
    }, [open]);

    function handleConfirm() {
        if (!selected || isLoading) return;
        const needsPayee = PAYEE_REQUIRED_FORMS.includes(paymentForm as typeof PAYEE_REQUIRED_FORMS[number]);
        if (selected === 'cashier' && needsPayee) {
            setPendingType(selected);
            setShowPayeeModal(true);
        } else {
            onConfirm(selected, paymentForm, null);
        }
    }

    if (!open) return null;

    const portal = createPortal(
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 99998,
                background: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,20,60,0.40)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '16px',
                padding: '20px',
                overflowX: 'auto',
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <style>{`
                @keyframes modal-in {
                    from { opacity: 0; transform: scale(0.97) translateY(8px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0);   }
                }
            `}</style>

            {/* Supply list panel — shown to the left when toggled */}
            {showSupplyList && (
                <SupplyListPanel
                    t={t}
                    isDark={isDark}
                    onClose={() => setShowSupplyList(false)}
                />
            )}

            {/* Modal card — same shape as the page card */}
            <div
                style={{
                    width: '100%', maxWidth: '580px',
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    borderRadius: '16px',
                    boxShadow: t.cardShadow,
                    overflow: 'hidden',
                    animation: 'modal-in .20s cubic-bezier(.22,1,.36,1)',
                }}
            >
                {/* ── Header — same style as the page card header ── */}
                <div
                    style={{
                        background: t.cardHeaderBg,
                        borderBottom: `1px solid ${t.cardHeaderBorder}`,
                        padding: '14px 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <h2
                            className="text-sm font-bold tracking-tight"
                            style={{ color: t.titleColor }}
                        >
                            New Requisition Slip
                        </h2>
                        <p className="text-[11px] mt-0.5" style={{ color: t.cellMuted }}>
                            Select the type of budget request to proceed.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-150"
                        style={{
                            background: 'transparent',
                            borderColor: t.cardBorder,
                            color: t.cellMuted,
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)';
                            (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(248,113,113,0.40)' : 'rgba(220,38,38,0.30)';
                            (e.currentTarget as HTMLElement).style.color = t.cellRed;
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.borderColor = t.cardBorder;
                            (e.currentTarget as HTMLElement).style.color = t.cellMuted;
                        }}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* ── Body ── */}
                <div style={{ padding: '20px' }}>

                    {/* RS Type options */}
                    <p
                        className="text-[10px] font-bold uppercase tracking-widest mb-3"
                        style={{ color: t.tableHeadText }}
                    >
                        Request Type
                    </p>

                    <div
                        className="rounded-xl overflow-hidden mb-4"
                        style={{ border: `1px solid ${t.cardBorder}` }}
                    >
                        {RS_TYPES.map((opt, i) => {
                            const isSel = selected === opt.id;
                            return (
                                <div
                                    key={opt.id}
                                    style={{
                                        borderBottom: i < RS_TYPES.length - 1
                                            ? `1px solid ${t.sectionDivider}` : 'none',
                                    }}
                                >
                                    {/* Clickable row */}
                                    <div
                                        onClick={() => setSelected(opt.id)}
                                        className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-150"
                                        style={{
                                            background: isSel
                                                ? (isDark ? 'rgba(37,99,235,0.14)' : 'rgba(219,234,254,0.60)')
                                                : 'transparent',
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSel)
                                                (e.currentTarget as HTMLElement).style.background = t.rowHoverBg;
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSel)
                                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                        }}
                                    >
                                        {/* Radio dot */}
                                        <div
                                            className="mt-0.5 shrink-0 flex items-center justify-center rounded-full transition-all duration-150"
                                            style={{
                                                width: 15, height: 15,
                                                border: `2px solid ${isSel
                                                    ? (isDark ? '#3b82f6' : '#1d4ed8')
                                                    : t.checkboxBorder}`,
                                                background: isSel
                                                    ? (isDark ? '#3b82f6' : '#1d4ed8')
                                                    : t.checkboxBg,
                                            }}
                                        >
                                            {isSel && (
                                                <div style={{
                                                    width: 5, height: 5,
                                                    borderRadius: '50%',
                                                    background: '#fff',
                                                }} />
                                            )}
                                        </div>

                                        {/* Text */}
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className="text-[11px] font-semibold leading-snug"
                                                style={{
                                                    color: isSel
                                                        ? (isDark ? t.cellText : '#0a1628')
                                                        : t.cellMuted,
                                                }}
                                            >
                                                {opt.label}
                                            </p>
                                            <p
                                                className="text-[10px] mt-1 leading-snug"
                                                style={{ color: isDark ? t.cellAmber : '#b45309' }}
                                            >
                                                {opt.note}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Payment Form — always shown, enabled only for cashier */}
                    <div className="mb-4">
                        <label
                            className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: t.tableHeadText }}
                        >
                            Payment Form
                        </label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={paymentForm}
                                onChange={e => setPaymentForm(e.target.value)}
                                disabled={selected !== 'cashier'}
                                className="w-full rounded-lg text-[11px] font-semibold px-3 py-2 border outline-none transition-all duration-150"
                                style={{
                                    background: selected === 'cashier' ? t.inputBg : (isDark ? 'rgba(10,18,42,0.4)' : 'rgba(241,245,249,0.8)'),
                                    borderColor: t.inputBorder,
                                    color: paymentForm ? t.inputText : t.inputPlaceholder,
                                    opacity: selected === 'cashier' ? 1 : 0.45,
                                    cursor: selected === 'cashier' ? 'default' : 'not-allowed',
                                    appearance: 'none', WebkitAppearance: 'none',
                                    colorScheme: isDark ? 'dark' : 'light',
                                    paddingRight: 28,
                                }}
                            >
                                <option value="">— Select —</option>
                                {PAYMENT_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <ChevronDown
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={{
                                    width: 13, height: 13,
                                    color: t.cellMuted,
                                    opacity: selected === 'cashier' ? 1 : 0.4,
                                }}
                            />
                        </div>
                    </div>

                    {/* Data Privacy notice */}
                    <div
                        className="rounded-xl px-4 py-3 mb-4 text-[10px] leading-relaxed"
                        style={{
                            background: t.inputBg,
                            border: `1px solid ${t.cardBorder}`,
                            color: t.cellMuted,
                        }}
                    >
                        In compliance with the Data Privacy Act, we would like to secure your consent on the general use and sharing of information
                        obtained from you in the course of transactions with any employee of the AdU Finance department. These data, which includes
                        your sensitive or personal information, may be collected, processed or stored in accordance with AdU retention and disposal
                        policies for legitimate purposes, and to comply with AdU internal policies and its reporting obligations to government
                        authorities under applicable laws.
                    </div>

                    {/* NOTE — visible only for stockroom */}
                    {selected === 'stockroom' && (
                        <div
                            className="rounded-xl px-4 py-3 mb-4"
                            style={{
                                background: isDark ? 'rgba(251,191,36,0.07)' : 'rgba(253,230,138,0.30)',
                                border: `1px solid ${isDark ? 'rgba(251,191,36,0.22)' : 'rgba(202,138,4,0.30)'}`,
                            }}
                        >
                            <p
                                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                                style={{ color: isDark ? t.cellAmber : '#b45309' }}
                            >
                                Note
                            </p>
                            <p className="text-[10px] leading-relaxed" style={{ color: isDark ? '#e5c97a' : '#92400e' }}>
                                For Office Supplies / Stockable / Inventoriable Items (WICO / Stockroom) — you may search
                                for the item(s) using the button below to check availability in WICO / Stockroom.
                                If not available, you may request the item(s) through the Logistics Office under For Purchase.
                            </p>
                        </div>
                    )}

                    {/* Check/Search button — stockroom only */}
                    {selected === 'stockroom' && (
                        <div className="mb-5">
                            <Btn
                                token={showSupplyList ? t.btnPrevSY : t.btnRefresh}
                                icon={<Search className="w-3.5 h-3.5" />}
                                label={showSupplyList ? 'Hide Supply List' : 'Check / Search Stockable / Inventoriable Items'}
                                onClick={() => setShowSupplyList(prev => !prev)}
                                t={t}
                            />
                        </div>
                    )}

                    {/* Divider */}
                    <div style={{ height: 1, background: t.sectionDivider, marginBottom: 16 }} />

                    {/* Footer actions */}
                    <div className="flex items-center justify-end gap-2">
                        <Btn
                            token={t.btnRefresh}
                            icon={<X className="w-3.5 h-3.5" />}
                            label="Cancel"
                            onClick={onClose}
                            t={t}
                        />
                        <Btn
                            token={t.btnNew}
                            icon={isLoading
                                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                : <FilePlus className="w-3.5 h-3.5" />
                            }
                            label={isLoading ? 'Creating…' : 'Confirm & Proceed'}
                            onClick={handleConfirm}
                            disabled={isLoading}
                            t={t}
                        />
                    </div>

                </div>
            </div>
        </div>,
        document.body,
    );

    return (
        <>
            {portal}
            <PayeeDetailsModal
                open={showPayeeModal}
                onClose={() => setShowPayeeModal(false)}
                onConfirm={(details) => {
                    setShowPayeeModal(false);
                    onConfirm(pendingType, paymentForm, details);
                }}
                t={t}
                isDark={isDark}
            />
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SelectSupplyModal — clickable supply list; replaces AddItemModal temporarily
// ─────────────────────────────────────────────────────────────────────────────
function SelectSupplyModal({
    open, onClose, onSelect, t, isDark,
}: {
    open: boolean;
    onClose: () => void;
    onSelect: (item: SupplyItem) => void;
    t: typeof T.dark;
    isDark: boolean;
}) {
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<SupplyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    const fetchSupplies = useCallback(async (q: string) => {
        setLoading(true); setError(null);
        try {
            const params: Record<string, string> = {};
            if (q) params.search = q;
            const res = await financeSvc.get('/abms/office-supplies', { params });
            const raw = res.data;
            setItems(Array.isArray(raw) ? raw : (raw?.data ?? []));
        } catch {
            setError('Failed to load supply list. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        setSearch(''); setItems([]); setLoading(true); setError(null);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const delay = search.trim() === '' ? 0 : 350;
        const timer = setTimeout(() => fetchSupplies(search), delay);
        return () => clearTimeout(timer);
    }, [search, fetchSupplies, open]);

    if (!open) return null;

    const COLS = ['Item Code', 'Item Name', 'Unit', 'Unit Cost'];

    const portal = createPortal(
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 100001,
                background: isDark ? 'rgba(0,0,0,0.78)' : 'rgba(0,20,60,0.50)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px 16px',
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <style>{`
                @keyframes supply-in {
                    from { opacity: 0; transform: scale(0.96) translateY(12px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                .supply-row:hover { cursor: pointer; }
            `}</style>

            <div
                style={{
                    width: '100%', maxWidth: '560px',
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    borderRadius: 18,
                    boxShadow: t.cardShadow,
                    overflow: 'hidden',
                    animation: 'supply-in .20s cubic-bezier(.22,1,.36,1)',
                    display: 'flex', flexDirection: 'column',
                    maxHeight: '80vh',
                }}
            >
                {/* Header */}
                <div style={{ background: t.cardHeaderBg, borderBottom: `1px solid ${t.cardHeaderBorder}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div>
                        <h2 style={{ fontSize: 13, fontWeight: 700, color: t.titleColor, margin: 0 }}>
                            Select Supply Item
                        </h2>
                        <p style={{ fontSize: 10, color: t.cellMuted, margin: '2px 0 0' }}>
                            Click a row to auto-fill the item details.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.cellMuted, cursor: 'pointer', transition: 'all .12s ease', flexShrink: 0 }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)';
                            (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(248,113,113,0.40)' : 'rgba(220,38,38,0.30)';
                            (e.currentTarget as HTMLElement).style.color = t.cellRed;
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.borderColor = t.cardBorder;
                            (e.currentTarget as HTMLElement).style.color = t.cellMuted;
                        }}
                    >
                        <X style={{ width: 14, height: 14 }} />
                    </button>
                </div>

                {/* Search */}
                <div style={{ padding: '10px 16px', background: t.cardHeaderBg, borderBottom: `1px solid ${t.cardHeaderBorder}`, flexShrink: 0 }}>
                    <div style={{ position: 'relative' }}>
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.cellMuted }} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search code, name, unit…"
                            autoFocus
                            className="w-full pl-8 pr-3 py-2 rounded-xl text-[11px] font-semibold border outline-none"
                            style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText }}
                            onFocus={e => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)'; }}
                            onBlur={e => { (e.target as HTMLElement).style.borderColor = t.inputBorder; }}
                        />
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr style={{ background: t.tableHeadBg }}>
                                {COLS.map((col, i) => (
                                    <th key={col} style={{
                                        padding: '9px 14px', fontSize: 9, fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: '.08em',
                                        color: t.tableHeadText,
                                        textAlign: i === COLS.length - 1 ? 'right' : 'left',
                                        borderBottom: `2px solid ${t.tableHeadBorder}`,
                                        borderRight: i < COLS.length - 1 ? `1px solid ${t.tableHeadBorder}` : 'none',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '40px 16px', textAlign: 'center', fontSize: 11, color: t.cellMuted }}>
                                        <RefreshCw className="w-4 h-4 mx-auto mb-2 opacity-50" style={{ color: t.cellMuted, animation: 'spin 1s linear infinite' }} />
                                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                                        Loading supply list…
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '40px 16px', textAlign: 'center', fontSize: 11, color: t.cellRed }}>
                                        <AlertCircle className="w-4 h-4 mx-auto mb-2 opacity-70" style={{ color: t.cellRed }} />
                                        {error}
                                        <button onClick={() => fetchSupplies(search)} className="block mx-auto mt-2 text-[10px] font-bold underline" style={{ color: t.cellBlue }}>Retry</button>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '40px 16px', textAlign: 'center', fontSize: 11, color: t.cellMuted }}>
                                        {search ? <>No items match &ldquo;{search}&rdquo;.</> : 'No supply items found.'}
                                    </td>
                                </tr>
                            ) : items.map((row, i) => (
                                <tr
                                    key={row.id}
                                    className="supply-row"
                                    onClick={() => onSelect(row)}
                                    onMouseEnter={() => setHoveredId(row.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    style={{
                                        background: hoveredId === row.id
                                            ? (isDark ? 'rgba(59,130,246,0.18)' : 'rgba(219,234,254,0.75)')
                                            : i % 2 === 0 ? t.rowEvenBg : t.rowOddBg,
                                        borderBottom: `1px solid ${t.rowBorder}`,
                                        cursor: 'pointer',
                                        transition: 'background .10s ease',
                                        outline: hoveredId === row.id
                                            ? `2px solid ${isDark ? 'rgba(99,155,255,0.35)' : 'rgba(37,99,235,0.25)'}`
                                            : 'none',
                                        outlineOffset: -2,
                                    }}
                                >
                                    <td style={{ padding: '9px 14px', fontSize: 11, fontWeight: 700, color: t.cellBlue, borderRight: `1px solid ${t.rowBorder}`, whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
                                        {row.item_code}
                                    </td>
                                    <td style={{ padding: '9px 14px', fontSize: 11, color: t.cellText, borderRight: `1px solid ${t.rowBorder}` }}>
                                        {row.item_name}
                                    </td>
                                    <td style={{ padding: '9px 14px', fontSize: 11, color: t.cellMuted, borderRight: `1px solid ${t.rowBorder}`, whiteSpace: 'nowrap' }}>
                                        {row.unit_measurement}
                                    </td>
                                    <td style={{ padding: '9px 14px', fontSize: 11, fontWeight: 700, color: t.cellGreen, textAlign: 'right', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
                                        ₱ {parseFloat(row.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div style={{ padding: '8px 16px', background: t.cardHeaderBg, borderTop: `1px solid ${t.cardHeaderBorder}`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md" style={{ background: t.pillBg, color: t.pillText, border: `1px solid ${t.pillBorder}` }}>
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                    <span style={{ fontSize: 10, color: t.cellMuted }}>
                        Click a row to select it
                    </span>
                </div>
            </div>
        </div>,
        document.body,
    );

    return <>{portal}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// SelectAccountModal — picks an account from the API
// ─────────────────────────────────────────────────────────────────────────────
interface AccountOption {
    account_code: string;
    account_name: string;
    balance: number;
}

function SelectAccountModal({
    open, onClose, onSelect, t, isDark,
    departmentId, sectionId, currentSchoolYear,
}: {
    open: boolean;
    onClose: () => void;
    onSelect: (item: AccountOption) => void;
    t: typeof T.dark;
    isDark: boolean;
    departmentId: string;
    sectionId: string;
    currentSchoolYear: string;
}) {
    const [items, setItems] = useState<AccountOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [hoveredCode, setHoveredCode] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setSearch(''); setItems([]); setLoading(true); setError(null);
        const params: Record<string, string> = { currentSchoolYear };
        if (departmentId) params.departmentId = departmentId;
        else params.sectionId = sectionId;

        financeSvc.get('/abms/budget-request-entry/accounts', { params })
            .then(({ data }) => setItems(data?.accounts ?? []))
            .catch(() => setError('Failed to load accounts. Please try again.'))
            .finally(() => setLoading(false));
    }, [open, departmentId, sectionId, currentSchoolYear]);

    if (!open) return null;

    const filtered = search.trim()
        ? items.filter(i =>
            i.account_code.toLowerCase().includes(search.toLowerCase()) ||
            i.account_name.toLowerCase().includes(search.toLowerCase()),
        )
        : items;

    const COLS = ['Account Code', 'Account Name', 'Balance'];

    const portal = createPortal(
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 100002,
                background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(0,20,60,0.52)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px 16px',
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <style>{`
                @keyframes acct-in {
                    from { opacity: 0; transform: scale(0.96) translateY(12px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>

            <div
                style={{
                    width: '100%', maxWidth: '560px',
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    borderRadius: 18,
                    boxShadow: t.cardShadow,
                    overflow: 'hidden',
                    animation: 'acct-in .20s cubic-bezier(.22,1,.36,1)',
                    display: 'flex', flexDirection: 'column',
                    maxHeight: '78vh',
                }}
            >
                {/* Header */}
                <div style={{ background: t.cardHeaderBg, borderBottom: `1px solid ${t.cardHeaderBorder}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div>
                        <h2 style={{ fontSize: 13, fontWeight: 700, color: t.titleColor, margin: 0 }}>
                            Select Account
                        </h2>
                        <p style={{ fontSize: 10, color: t.cellMuted, margin: '2px 0 0' }}>
                            Click a row to fill in the account details.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.cellMuted, cursor: 'pointer', transition: 'all .12s ease', flexShrink: 0 }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)';
                            (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(248,113,113,0.40)' : 'rgba(220,38,38,0.30)';
                            (e.currentTarget as HTMLElement).style.color = t.cellRed;
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.borderColor = t.cardBorder;
                            (e.currentTarget as HTMLElement).style.color = t.cellMuted;
                        }}
                    >
                        <X style={{ width: 14, height: 14 }} />
                    </button>
                </div>

                {/* Search */}
                <div style={{ padding: '10px 16px', background: t.cardHeaderBg, borderBottom: `1px solid ${t.cardHeaderBorder}`, flexShrink: 0 }}>
                    <div style={{ position: 'relative' }}>
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.cellMuted }} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search code or name…"
                            autoFocus
                            className="w-full pl-8 pr-3 py-2 rounded-xl text-[11px] font-semibold border outline-none"
                            style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText }}
                            onFocus={e => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)'; }}
                            onBlur={e => { (e.target as HTMLElement).style.borderColor = t.inputBorder; }}
                        />
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr style={{ background: t.tableHeadBg }}>
                                {COLS.map((col, i) => (
                                    <th key={col} style={{
                                        padding: '9px 14px', fontSize: 9, fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: '.08em',
                                        color: t.tableHeadText,
                                        textAlign: i === COLS.length - 1 ? 'right' : 'left',
                                        borderBottom: `2px solid ${t.tableHeadBorder}`,
                                        borderRight: i < COLS.length - 1 ? `1px solid ${t.tableHeadBorder}` : 'none',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={3} style={{ padding: '40px 16px', textAlign: 'center', fontSize: 11, color: t.cellMuted }}>
                                        <RefreshCw className="w-4 h-4 mx-auto mb-2 opacity-50" style={{ color: t.cellMuted, animation: 'spin 1s linear infinite' }} />
                                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                                        Loading accounts…
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={3} style={{ padding: '40px 16px', textAlign: 'center', fontSize: 11, color: t.cellRed }}>
                                        <AlertCircle className="w-4 h-4 mx-auto mb-2 opacity-70" style={{ color: t.cellRed }} />
                                        {error}
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={3} style={{ padding: '40px 16px', textAlign: 'center', fontSize: 11, color: t.cellMuted }}>
                                        {search ? <>No accounts match &ldquo;{search}&rdquo;.</> : 'No accounts found.'}
                                    </td>
                                </tr>
                            ) : filtered.map((row, i) => (
                                <tr
                                    key={row.account_code}
                                    onClick={() => onSelect(row)}
                                    onMouseEnter={() => setHoveredCode(row.account_code)}
                                    onMouseLeave={() => setHoveredCode(null)}
                                    style={{
                                        background: hoveredCode === row.account_code
                                            ? (isDark ? 'rgba(59,130,246,0.18)' : 'rgba(219,234,254,0.75)')
                                            : i % 2 === 0 ? t.rowEvenBg : t.rowOddBg,
                                        borderBottom: `1px solid ${t.rowBorder}`,
                                        cursor: 'pointer',
                                        transition: 'background .10s ease',
                                        outline: hoveredCode === row.account_code
                                            ? `2px solid ${isDark ? 'rgba(99,155,255,0.35)' : 'rgba(37,99,235,0.25)'}`
                                            : 'none',
                                        outlineOffset: -2,
                                    }}
                                >
                                    <td style={{ padding: '9px 14px', fontSize: 11, fontWeight: 700, color: t.cellBlue, borderRight: `1px solid ${t.rowBorder}`, whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
                                        {row.account_code}
                                    </td>
                                    <td style={{ padding: '9px 14px', fontSize: 11, color: t.cellText, borderRight: `1px solid ${t.rowBorder}` }}>
                                        {row.account_name}
                                    </td>
                                    <td style={{ padding: '9px 14px', fontSize: 11, fontWeight: 700, color: t.cellGreen, textAlign: 'right', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
                                        ₱ {fmtCurrency(Number(row.balance))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div style={{ padding: '8px 16px', background: t.cardHeaderBg, borderTop: `1px solid ${t.cardHeaderBorder}`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md" style={{ background: t.pillBg, color: t.pillText, border: `1px solid ${t.pillBorder}` }}>
                        {filtered.length} {filtered.length === 1 ? 'account' : 'accounts'}
                    </span>
                    <span style={{ fontSize: 10, color: t.cellMuted }}>Click a row to select it</span>
                </div>
            </div>
        </div>,
        document.body,
    );

    return <>{portal}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// AddItemModal — opened when "New Item" is clicked inside RSFormModal
// ─────────────────────────────────────────────────────────────────────────────
interface AddItemFormState {
    accountNo: string;
    accountName: string;
    balance: string;
    itemDescription: string;
    unitCost: string;
    quantity: string;
    unitOfMeasurement: string;
}

const EMPTY_ITEM_FORM: AddItemFormState = {
    accountNo: '',
    accountName: '',
    balance: '',
    itemDescription: '',
    unitCost: '',
    quantity: '',
    unitOfMeasurement: '',
};

// ── Zod schema for AddItemModal client-side validation ────────────────────────
// balance_cap is not a form field — it's validated contextually inside handleSave
const addItemSchema = z.object({
    accountNo: z.string().min(1, 'Please select an account first.'),
    accountName: z.string(),
    balance: z.string(),
    itemDescription: z.string().min(1, 'Item description is required.'),
    unitCost: z.coerce
        .number({ invalid_type_error: 'Unit cost must be a number.' })
        .positive('Enter a valid unit cost greater than 0.'),
    quantity: z.coerce
        .number({ invalid_type_error: 'Quantity must be a number.' })
        .positive('Enter a valid quantity greater than 0.')
        .int('Quantity must be a whole number.'),
    unitOfMeasurement: z.string().min(1, 'Unit of measurement is required.'),
});

type AddItemSchemaErrors = Partial<Record<keyof AddItemFormState | 'balance_cap', string>>;

function AddItemModal({
    open, onClose, onSave, t, isDark,
    departmentId, sectionId, currentSchoolYear, rsHeaderId,
}: {
    open: boolean;
    onClose: () => void;
    onSave: (item: RSFormItem) => void;
    t: typeof T.dark;
    isDark: boolean;
    departmentId: string;
    sectionId: string;
    currentSchoolYear: string;
    rsHeaderId: number | null;
}) {
    const [form, setForm] = useState<AddItemFormState>(EMPTY_ITEM_FORM);
    // Preserved form while pickers are open
    const savedFormRef = useRef<AddItemFormState>(EMPTY_ITEM_FORM);
    const [showSupplyPicker, setShowSupplyPicker] = useState(false);
    const [showAccountPicker, setShowAccountPicker] = useState(false);
    const [itemFromSupply, setItemFromSupply] = useState(false);
    const [errors, setErrors] = useState<AddItemSchemaErrors>({});

    // Derived: account has been chosen
    const accountSelected = !!form.accountNo;

    useEffect(() => {
        if (open) {
            setForm(EMPTY_ITEM_FORM);
            setShowSupplyPicker(false);
            setShowAccountPicker(false);
            setItemFromSupply(false);
            setErrors({});
        }
    }, [open]);

    // When "Get Items" is clicked: save current form state, hide AddItem, show supply picker
    function handleOpenSupplyPicker() {
        savedFormRef.current = form;
        setShowSupplyPicker(true);
    }

    // When user selects a supply item: close picker, restore form + fill fields
    function handleSupplySelect(item: SupplyItem) {
        setForm({
            ...savedFormRef.current,
            itemDescription: item.item_name,
            unitCost: item.unit_cost,
            unitOfMeasurement: item.unit_measurement,
        });
        setItemFromSupply(true);
        setShowSupplyPicker(false);
    }

    // When picker is closed without selection: restore form, hide picker
    function handleSupplyClose() {
        setForm(savedFormRef.current);
        setItemFromSupply(false);
        setShowSupplyPicker(false);
    }

    // Account picker handlers
    function handleOpenAccountPicker() {
        savedFormRef.current = form;
        setShowAccountPicker(true);
    }

    function handleAccountSelect(item: AccountOption) {
        setForm(prev => ({
            ...prev,
            accountNo: item.account_code,
            accountName: item.account_name,
            balance: String(item.balance),
        }));
        // Clear account-related errors and the balance cap error when a new account is picked
        setErrors(prev => {
            const next = { ...prev };
            delete next.accountNo;
            delete next.balance_cap;
            return next;
        });
        setShowAccountPicker(false);
    }

    const uc = parseFloat(form.unitCost) || 0;
    const qty = parseFloat(form.quantity) || 0;
    const totalAmount = uc * qty;

    function set(field: keyof AddItemFormState, value: string) {
        setForm(prev => ({ ...prev, [field]: value }));
        // Clear the error for this field as the user types
        setErrors(prev => { const next = { ...prev }; delete next[field]; delete next.balance_cap; return next; });
    }

    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        const result = addItemSchema.safeParse(form);

        if (!result.success) {
            const fieldErrors: AddItemSchemaErrors = {};
            for (const issue of result.error.issues) {
                const field = issue.path[0] as keyof AddItemFormState;
                if (!fieldErrors[field]) fieldErrors[field] = issue.message;
            }
            setErrors(fieldErrors);
            return;
        }

        // Balance cap — contextual check not expressible as a pure field rule
        const balance = parseFloat(form.balance) || 0;
        if (totalAmount > balance) {
            setErrors({
                balance_cap: `Total amount (₱ ${fmtCurrency(totalAmount)}) exceeds the account balance of ₱ ${fmtCurrency(balance)}.`,
            });
            return;
        }

        setIsSaving(true);
        try {
            const res = await financeSvc.post('/abms/budget-request-entry/items', {
                budget_request_entry_id: rsHeaderId,
                account_code: form.accountNo,
                description: form.itemDescription,
                unit_cost: parseFloat(form.unitCost),
                quantity: parseInt(form.quantity, 10),
                total_cost: totalAmount,
            });

            const saved = res.data.item;
            const newItem: RSFormItem = {
                id: saved.id,
                accountNo: saved.account_code,
                itemDescription: saved.description,
                unitCost: String(saved.unit_cost),
                quantity: String(saved.quantity),
                unitOfMeasurement: form.unitOfMeasurement,
                totalCost: parseFloat(saved.total_cost),
            };
            onSave(newItem);
            onClose();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setErrors({
                balance_cap: axiosErr?.response?.data?.message ?? 'Failed to save item. Please try again.',
            });
        } finally {
            setIsSaving(false);
        }
    }

    // ── Shared field components ──────────────────────────────────────────────
    const displayOnlyField = (label: string, value: string, mono = false, color?: string) => (
        <div>
            <span style={{ display: 'block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: t.tableHeadText, marginBottom: 4 }}>
                {label}
            </span>
            <div style={{
                padding: '7px 12px', borderRadius: 8,
                background: isDark ? 'rgba(10,22,50,0.55)' : 'rgba(220,234,255,0.55)',
                border: `1px solid ${t.sectionDivider}`,
                fontSize: 11, fontWeight: 600,
                color: color ?? t.cellText,
                minHeight: 34,
                fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
                fontVariantNumeric: mono ? 'tabular-nums' : 'normal',
            }}>
                {value || <span style={{ color: t.cellMuted, fontStyle: 'italic', fontWeight: 400 }}>—</span>}
            </div>
        </div>
    );

    const inputField = (
        label: string,
        value: string,
        onChange: (v: string) => void,
        opts?: { type?: string; placeholder?: string; mono?: boolean; readOnly?: boolean; disabled?: boolean; error?: string },
    ) => {
        const hasError = !!opts?.error;
        const isDisabled = !!opts?.disabled;
        return (
            <div>
                <span style={{ display: 'block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: hasError ? t.cellRed : t.tableHeadText, marginBottom: 4 }}>
                    {label}
                </span>
                <input
                    type={opts?.type ?? 'text'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    readOnly={opts?.readOnly || isDisabled}
                    placeholder={isDisabled ? '' : (opts?.placeholder ?? '')}
                    style={{
                        width: '100%', padding: '7px 12px',
                        borderRadius: 8,
                        background: (opts?.readOnly || isDisabled)
                            ? (isDark ? 'rgba(10,22,50,0.40)' : 'rgba(220,234,255,0.45)')
                            : t.inputBg,
                        border: `1px solid ${hasError ? t.cellRed : t.inputBorder}`,
                        fontSize: 11, fontWeight: 600, color: isDisabled ? t.cellMuted : t.inputText,
                        outline: 'none', transition: 'border-color .15s ease',
                        fontFamily: opts?.mono ? "'JetBrains Mono', monospace" : 'inherit',
                        fontVariantNumeric: opts?.mono ? 'tabular-nums' : 'normal',
                        cursor: (opts?.readOnly || isDisabled) ? 'default' : 'text',
                        opacity: isDisabled ? 0.5 : 1,
                    }}
                    onFocus={e => { if (!opts?.readOnly && !isDisabled) (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)'; }}
                    onBlur={e => { (e.target as HTMLElement).style.borderColor = hasError ? t.cellRed : t.inputBorder; }}
                />
                {hasError && (
                    <span style={{ display: 'block', fontSize: 9, color: t.cellRed, marginTop: 3, fontWeight: 600 }}>
                        {opts!.error}
                    </span>
                )}
            </div>
        );
    };

    const sectionLabel = (text: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px' }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.10em', color: t.tableHeadText }}>
                {text}
            </span>
            <div style={{ flex: 1, height: 1, background: t.sectionDivider }} />
        </div>
    );

    // Supply picker — rendered at z-index above everything, shown instead of AddItem
    const supplyPicker = (
        <SelectSupplyModal
            open={showSupplyPicker}
            onClose={handleSupplyClose}
            onSelect={handleSupplySelect}
            t={t}
            isDark={isDark}
        />
    );

    // Account picker — rendered above AddItem
    const accountPicker = (
        <SelectAccountModal
            open={showAccountPicker}
            onClose={() => setShowAccountPicker(false)}
            onSelect={handleAccountSelect}
            t={t}
            isDark={isDark}
            departmentId={departmentId}
            sectionId={sectionId}
            currentSchoolYear={currentSchoolYear}
        />
    );

    // Hide the AddItem modal while supply picker is open (one modal at a time)
    if (!open) return <>{supplyPicker}{accountPicker}</>;

    const portal = createPortal(
        <>
            {/* AddItem backdrop — hidden when supply picker is open */}
            {!showSupplyPicker && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 100000,
                        background: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(0,20,60,0.45)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '24px 16px',
                        overflowY: 'auto',
                    }}
                    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
                >
                    <style>{`
                        @keyframes additem-in {
                            from { opacity: 0; transform: scale(0.96) translateY(12px); }
                            to   { opacity: 1; transform: scale(1) translateY(0); }
                        }
                    `}</style>

                    <div
                        style={{
                            width: '100%', maxWidth: '500px',
                            background: t.cardBg,
                            border: `1px solid ${t.cardBorder}`,
                            borderRadius: 18,
                            boxShadow: t.cardShadow,
                            overflow: 'hidden',
                            animation: 'additem-in .20s cubic-bezier(.22,1,.36,1)',
                            display: 'flex', flexDirection: 'column',
                        }}
                    >
                        {/* ── Header ── */}
                        <div style={{ background: t.cardHeaderBg, borderBottom: `1px solid ${t.cardHeaderBorder}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-.01em', color: t.titleColor, margin: 0 }}>
                                    Add New Item
                                </h2>
                                <p style={{ fontSize: 10, color: t.cellMuted, margin: '2px 0 0' }}>
                                    Fill in the item details to add to the requisition slip.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.cellMuted, cursor: 'pointer', transition: 'all .12s ease', flexShrink: 0 }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)';
                                    (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(248,113,113,0.40)' : 'rgba(220,38,38,0.30)';
                                    (e.currentTarget as HTMLElement).style.color = t.cellRed;
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    (e.currentTarget as HTMLElement).style.borderColor = t.cardBorder;
                                    (e.currentTarget as HTMLElement).style.color = t.cellMuted;
                                }}
                            >
                                <X style={{ width: 14, height: 14 }} />
                            </button>
                        </div>

                        {/* ── Body ── */}
                        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

                            {/* Account section */}
                            {sectionLabel('Account Information')}

                            {/* Get Account button */}
                            <button
                                onClick={handleOpenAccountPicker}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '7px 14px', borderRadius: 8,
                                    background: t.btnRefresh.bg, border: `1px solid ${errors.accountNo ? t.cellRed : t.btnRefresh.border}`,
                                    color: t.btnRefresh.text, fontSize: 11, fontWeight: 700,
                                    cursor: 'pointer', alignSelf: 'flex-start', transition: 'background .12s ease',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.btnRefresh.hover; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = t.btnRefresh.bg; }}
                            >
                                <Search style={{ width: 13, height: 13 }} />
                                Get Account
                            </button>
                            {errors.accountNo && (
                                <span style={{ fontSize: 9, color: t.cellRed, fontWeight: 600, marginTop: -8 }}>
                                    {errors.accountNo}
                                </span>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {displayOnlyField('Account No.', form.accountNo, true, t.cellBlue)}
                                {displayOnlyField('Account Name', form.accountName)}
                            </div>
                            {displayOnlyField(
                                'Balance',
                                form.balance ? `₱ ${fmtCurrency(parseFloat(form.balance))}` : '',
                                true,
                                t.cellGreen,
                            )}

                            {/* Item section — locked until account is selected */}
                            {sectionLabel('Item Details')}

                            {!accountSelected && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    padding: '8px 12px', borderRadius: 8,
                                    background: isDark ? 'rgba(251,191,36,0.08)' : 'rgba(253,230,138,0.35)',
                                    border: `1px solid ${isDark ? 'rgba(251,191,36,0.28)' : 'rgba(202,138,4,0.35)'}`,
                                    fontSize: 10, color: isDark ? '#fbbf24' : '#92400e', fontWeight: 600,
                                }}>
                                    <AlertCircle style={{ width: 13, height: 13, flexShrink: 0 }} />
                                    Select an account above before filling in the item details.
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                    {inputField('Item Description', form.itemDescription, v => set('itemDescription', v), {
                                        placeholder: accountSelected ? 'e.g. Ballpen, black, 12pcs/box…' : '',
                                        readOnly: itemFromSupply,
                                        disabled: !accountSelected,
                                        error: errors.itemDescription,
                                    })}
                                </div>
                                <button
                                    onClick={accountSelected ? handleOpenSupplyPicker : undefined}
                                    disabled={!accountSelected}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                        padding: '7px 12px', borderRadius: 8, flexShrink: 0,
                                        background: !accountSelected ? t.btnDisBg : t.btnPrevSY.bg,
                                        border: `1px solid ${!accountSelected ? t.btnDisBorder : t.btnPrevSY.border}`,
                                        color: !accountSelected ? t.btnDisText : t.btnPrevSY.text,
                                        fontSize: 11, fontWeight: 700,
                                        cursor: !accountSelected ? 'not-allowed' : 'pointer',
                                        transition: 'background .12s ease',
                                        whiteSpace: 'nowrap',
                                        opacity: !accountSelected ? 0.55 : 1,
                                    }}
                                    onMouseEnter={e => { if (accountSelected) (e.currentTarget as HTMLElement).style.background = t.btnPrevSY.hover; }}
                                    onMouseLeave={e => { if (accountSelected) (e.currentTarget as HTMLElement).style.background = t.btnPrevSY.bg; }}
                                >
                                    <ClipboardList style={{ width: 13, height: 13 }} />
                                    Get Items
                                </button>
                            </div>

                            {/* Pricing section */}
                            {sectionLabel('Pricing & Quantity')}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                {inputField('Unit Cost', form.unitCost, v => set('unitCost', v), {
                                    type: 'number', placeholder: accountSelected ? '0.00' : '',
                                    mono: true, readOnly: itemFromSupply,
                                    disabled: !accountSelected,
                                    error: errors.unitCost,
                                })}
                                {inputField('Quantity', form.quantity, v => set('quantity', v), {
                                    type: 'number', placeholder: accountSelected ? '0' : '',
                                    mono: true,
                                    disabled: !accountSelected,
                                    error: errors.quantity,
                                })}
                                {inputField('Unit of Measurement', form.unitOfMeasurement, v => set('unitOfMeasurement', v), {
                                    placeholder: accountSelected ? 'pcs, box, ream…' : '',
                                    readOnly: itemFromSupply,
                                    disabled: !accountSelected,
                                    error: errors.unitOfMeasurement,
                                })}
                            </div>

                            {/* Balance cap error */}
                            {errors.balance_cap && (
                                <div style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 7,
                                    padding: '8px 12px', borderRadius: 8,
                                    background: isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,226,226,0.55)',
                                    border: `1px solid ${isDark ? 'rgba(248,113,113,0.38)' : 'rgba(220,38,38,0.30)'}`,
                                    fontSize: 10, color: t.cellRed, fontWeight: 600,
                                }}>
                                    <AlertCircle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
                                    {errors.balance_cap}
                                </div>
                            )}

                            {/* Total Amount — display only */}
                            {(() => {
                                const balance = parseFloat(form.balance) || 0;
                                const overBudget = accountSelected && totalAmount > 0 && totalAmount > balance;
                                return (
                                    <div
                                        style={{
                                            padding: '10px 16px', borderRadius: 10,
                                            background: overBudget
                                                ? (isDark ? 'rgba(248,113,113,0.08)' : 'rgba(254,226,226,0.55)')
                                                : (isDark ? 'rgba(10,22,50,0.80)' : 'rgba(210,228,255,0.70)'),
                                            border: `1px solid ${overBudget
                                                ? (isDark ? 'rgba(248,113,113,0.38)' : 'rgba(220,38,38,0.30)')
                                                : (isDark ? 'rgba(74,222,128,0.22)' : 'rgba(4,120,87,0.20)')}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        }}
                                    >
                                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: overBudget ? t.cellRed : t.totalLabel }}>
                                            Total Amount{overBudget ? ' — Exceeds Balance' : ''}
                                        </span>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: overBudget ? t.cellRed : t.cellGreen, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
                                            ₱ {fmtCurrency(totalAmount)}
                                        </span>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* ── Footer actions ── */}
                        <div style={{ padding: '12px 20px', background: t.cardHeaderBg, borderTop: `1px solid ${t.cardHeaderBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                                onClick={onClose}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '7px 16px', borderRadius: 8,
                                    background: isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,226,226,0.60)',
                                    border: `1px solid ${isDark ? 'rgba(248,113,113,0.35)' : 'rgba(220,38,38,0.28)'}`,
                                    color: isDark ? t.cellRed : '#b91c1c',
                                    fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'background .12s ease',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.20)' : 'rgba(254,226,226,0.90)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,226,226,0.60)'; }}
                            >
                                <X style={{ width: 13, height: 13 }} />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '7px 18px', borderRadius: 8,
                                    background: isSaving ? t.btnDisBg : t.btnNew.bg,
                                    border: `1px solid ${isSaving ? t.btnDisBorder : t.btnNew.border}`,
                                    color: isSaving ? t.btnDisText : t.btnNew.text,
                                    fontSize: 11, fontWeight: 700,
                                    cursor: isSaving ? 'not-allowed' : 'pointer',
                                    opacity: isSaving ? 0.6 : 1,
                                    transition: 'background .12s ease',
                                }}
                                onMouseEnter={e => { if (!isSaving) (e.currentTarget as HTMLElement).style.background = t.btnNew.hover; }}
                                onMouseLeave={e => { if (!isSaving) (e.currentTarget as HTMLElement).style.background = t.btnNew.bg; }}
                            >
                                {isSaving
                                    ? <RefreshCw style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                                    : <Save style={{ width: 13, height: 13 }} />
                                }
                                {isSaving ? 'Saving…' : 'Save Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Supply picker — overlays on top when active */}
            {supplyPicker}

            {/* Account picker — overlays on top when active */}
            {accountPicker}
        </>,
        document.body,
    );

    return <>{portal}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// RSFormModal — shown after Confirm & Proceed from NewRSModal
// ─────────────────────────────────────────────────────────────────────────────
interface RSFormItem {
    id: number;
    accountNo: string;
    itemDescription: string;
    unitCost: string;
    quantity: string;
    unitOfMeasurement: string;
    totalCost: number;
}

const RS_HEADER_MAP: Record<NonNullable<RSType>, { title: string; sub: string }> = {
    stockroom: {
        title: 'FOR OFFICE SUPPLIES / STOCKABLES (STOCKROOM)',
        sub: 'WICO / Stockroom — Office Supplies & Inventoriable Items',
    },
    logistics: {
        title: 'FOR PURCHASE (LOGISTICS OFFICE)',
        sub: 'Logistics Office — Purchase Requisition',
    },
    cashier: {
        title: 'FOR CASH VALUED ITEMS / CASH ADVANCE / PAYMENTS',
        sub: 'Accounting / Cashier — Cash or Check Release',
    },
};

function getCurrentSchoolYear(): string {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed; June = 5
    const year = now.getFullYear();
    // School year starts in June
    const syStart = month >= 5 ? year : year - 1;
    return `${syStart}–${syStart + 1}`;
}

function formatCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

const fmtCurrency = (n: number) =>
    n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function RSFormModal({
    open, rsType, rsHeaderId, rsHeaderData, department, onClose, onDiscard, onSaveSuccess, t, isDark,
    departmentId, sectionId, currentSchoolYear,
}: {
    open: boolean;
    rsType: RSType;
    rsHeaderId: number | null;
    rsHeaderData: {
        id: number;
        requisition_number: string;
        department: string;
        school_year: string;
        created_at: string;
        payee: string | null;
        payeeFromModal: boolean;
    } | null;
    department: string;
    onClose: () => void;
    onDiscard: () => Promise<void>;
    onSaveSuccess: (rsNumber: string) => void;
    t: typeof T.dark;
    isDark: boolean;
    departmentId: string;
    sectionId: string;
    currentSchoolYear: string;
}) {
    const [items, setItems] = useState<RSFormItem[]>([]);
    const [note, setNote] = useState('');
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [showAddItem, setShowAddItem] = useState(false);
    const [isSavingRS, setIsSavingRS] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [payeeInput, setPayeeInput] = useState('');

    useEffect(() => {
        if (open) {
            setItems([]);
            setNote('');
            setShowAddItem(false);
            setIsSavingRS(false);
            setIsSaved(false);
            setPayeeInput(rsHeaderData?.payee ?? '');
        }
    }, [open]);

    if (!open || !rsType) return null;

    const header = RS_HEADER_MAP[rsType];
    const schoolYear = currentSchoolYear || getCurrentSchoolYear();
    const currentDate = formatCurrentDate();

    function handleSaveItem(item: RSFormItem) {
        setItems(prev => [...prev, item]);
    }

    async function removeItem(id: number) {
        try {
            await financeSvc.delete(`/abms/budget-request-entry/items/${id}`);
        } catch {
            // item may not yet be persisted (edge case); proceed with local removal
        }
        setItems(prev => prev.filter(item => item.id !== id));
    }

    const grandTotal = items.reduce((s, item) => s + item.totalCost, 0);

    async function handleSaveRS() {
        if (!rsHeaderId || isSavingRS || isSaved || items.length === 0) return;
        setIsSavingRS(true);
        try {
            const res = await financeSvc.patch(`/abms/budget-request-entry/${rsHeaderId}/save`, {
                total_amount: grandTotal,
                ...(!rsHeaderData?.payeeFromModal && payeeInput.trim()
                    ? { payee: payeeInput.trim() }
                    : {}),
            });
            setIsSaved(true);
            onSaveSuccess(res.data.requisition_number ?? String(rsHeaderId));
        } catch {
            // surface error — re-enable button so user can retry
        } finally {
            setIsSavingRS(false);
        }
    }

    // Shared display field style
    const displayField = (label: string, value: string) => (
        <div>
            <span
                className="block text-[9px] font-bold uppercase tracking-widest mb-0.5"
                style={{ color: t.tableHeadText }}
            >
                {label}
            </span>
            <div
                className="px-3 py-2 rounded-lg text-[11px] font-semibold"
                style={{
                    background: isDark ? 'rgba(10,22,50,0.60)' : 'rgba(220,234,255,0.60)',
                    border: `1px solid ${t.sectionDivider}`,
                    color: t.cellText,
                    minHeight: 32,
                }}
            >
                {value || <span style={{ color: t.cellMuted, fontStyle: 'italic' }}>—</span>}
            </div>
        </div>
    );

    const iconBtn = (
        icon: React.ReactNode,
        label: string,
        onClick: () => void,
        color: { bg: string; border: string; text: string; hover: string },
    ) => {
        return (
            <button
                onClick={onClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                style={{ background: color.bg, borderColor: color.border, color: color.text }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = color.hover; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = color.bg; }}
            >
                {icon}{label}
            </button>
        );
    };

    const portal = createPortal(
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: isDark ? 'rgba(0,0,0,0.70)' : 'rgba(0,20,60,0.42)',
                backdropFilter: 'blur(5px)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                padding: '24px 16px',
                overflowY: 'auto',
            }}
            onClick={e => { if (e.target === e.currentTarget) isSaved ? onClose() : onDiscard(); }}
        >
            <style>{`
                @keyframes rsform-in {
                    from { opacity: 0; transform: scale(0.97) translateY(10px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>

            <div
                style={{
                    width: '100%', maxWidth: '860px',
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    borderRadius: '18px',
                    boxShadow: t.cardShadow,
                    overflow: 'hidden',
                    animation: 'rsform-in .22s cubic-bezier(.22,1,.36,1)',
                    display: 'flex', flexDirection: 'column',
                }}
            >
                {/* ── Header ── */}
                <div
                    style={{
                        background: t.cardHeaderBg,
                        borderBottom: `1px solid ${t.cardHeaderBorder}`,
                        padding: '16px 22px',
                    }}
                >
                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span
                                    className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                                    style={{ background: t.pillBg, color: t.pillText, border: `1px solid ${t.pillBorder}` }}
                                >
                                    Requisition Slip
                                </span>
                            </div>
                            <h2
                                className="text-sm font-bold tracking-tight mt-1.5 leading-snug"
                                style={{ color: t.titleColor }}
                            >
                                {header.title}
                            </h2>
                            <p className="text-[10px] mt-0.5" style={{ color: t.cellMuted }}>
                                {header.sub}
                            </p>
                        </div>
                        {/* Close button */}
                        <button
                            onClick={isSaved ? onClose : onDiscard}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-150 shrink-0"
                            style={{ background: 'transparent', borderColor: t.cardBorder, color: t.cellMuted }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)';
                                (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(248,113,113,0.40)' : 'rgba(220,38,38,0.30)';
                                (e.currentTarget as HTMLElement).style.color = t.cellRed;
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                (e.currentTarget as HTMLElement).style.borderColor = t.cardBorder;
                                (e.currentTarget as HTMLElement).style.color = t.cellMuted;
                            }}
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Meta info row */}
                    <div
                        className="grid gap-3 mt-4"
                        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
                    >
                        {/* RS No. — enlarged + highlighted */}
                        <div>
                            <span
                                className="block text-[9px] font-bold uppercase tracking-widest mb-0.5"
                                style={{ color: t.tableHeadText }}
                            >
                                Requisition Slip No.
                            </span>
                            <div
                                style={{
                                    padding: '7px 12px', borderRadius: 8,
                                    background: isDark ? 'rgba(37,99,235,0.18)' : 'rgba(219,234,254,0.80)',
                                    border: `1.5px solid ${isDark ? 'rgba(99,155,255,0.55)' : 'rgba(37,99,235,0.45)'}`,
                                    color: isDark ? '#93c5fd' : '#1d4ed8',
                                    fontSize: 16, fontWeight: 700,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontVariantNumeric: 'tabular-nums',
                                    letterSpacing: '0.04em',
                                    minHeight: 40,
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    boxShadow: isDark
                                        ? '0 0 0 3px rgba(59,130,246,0.12)'
                                        : '0 0 0 3px rgba(37,99,235,0.08)',
                                }}
                            >
                                <ClipboardList style={{ width: 14, height: 14, opacity: 0.7, flexShrink: 0 }} />
                                {rsHeaderData?.requisition_number ?? '0'}
                            </div>
                        </div>
                        {displayField('Department / Section', rsHeaderData?.department ?? department ?? '—')}
                        {displayField('Date', rsHeaderData?.created_at
                            ? new Date(rsHeaderData.created_at).toLocaleDateString('en-US', {
                                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                            })
                            : currentDate
                        )}
                        {displayField('School Year', rsHeaderData?.school_year ?? schoolYear)}
                    </div>

                    {/* Action buttons row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 14 }}>
                        <button
                            onClick={handleSaveRS}
                            disabled={isSavingRS || isSaved || items.length === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                            style={{
                                background: isSaved
                                    ? (isDark ? 'rgba(34,197,94,0.15)' : 'rgba(220,252,231,0.80)')
                                    : items.length === 0
                                        ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)')
                                        : t.btnNew.bg,
                                borderColor: isSaved
                                    ? (isDark ? 'rgba(34,197,94,0.40)' : 'rgba(22,163,74,0.35)')
                                    : items.length === 0
                                        ? (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)')
                                        : t.btnNew.border,
                                color: isSaved
                                    ? (isDark ? '#4ade80' : '#15803d')
                                    : items.length === 0
                                        ? (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)')
                                        : t.btnNew.text,
                                opacity: isSavingRS ? 0.6 : 1,
                                cursor: (isSavingRS || isSaved || items.length === 0) ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={e => { if (!isSavingRS && !isSaved && items.length > 0) (e.currentTarget as HTMLElement).style.background = t.btnNew.hover; }}
                            onMouseLeave={e => { if (!isSavingRS && !isSaved && items.length > 0) (e.currentTarget as HTMLElement).style.background = isSaved ? (isDark ? 'rgba(34,197,94,0.15)' : 'rgba(220,252,231,0.80)') : t.btnNew.bg; }}
                        >
                            {isSavingRS
                                ? <RefreshCw className="w-3.5 h-3.5" style={{ animation: 'spin 1s linear infinite' }} />
                                : isSaved
                                    ? <CheckCircle2 className="w-3.5 h-3.5" />
                                    : <Save className="w-3.5 h-3.5" />
                            }
                            {isSavingRS ? 'Saving…' : isSaved ? 'RS Saved' : 'Create / Save RS'}
                        </button>
                        {iconBtn(
                            <Plus className="w-3.5 h-3.5" />,
                            'New Item',
                            () => setShowAddItem(true),
                            t.btnRefresh,
                        )}
                        {iconBtn(
                            <Printer className="w-3.5 h-3.5" />,
                            'Print RS',
                            () => { },
                            t.btnPrevSY,
                        )}
                        {iconBtn(
                            <MessageSquare className="w-3.5 h-3.5" />,
                            'Chat / Message',
                            () => { },
                            {
                                bg: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(253,230,138,0.35)',
                                border: isDark ? 'rgba(251,191,36,0.38)' : 'rgba(202,138,4,0.35)',
                                text: isDark ? t.cellAmber : '#92400e',
                                hover: isDark ? 'rgba(251,191,36,0.22)' : 'rgba(253,230,138,0.60)',
                            },
                        )}
                        <div style={{ flex: 1 }} />
                        {iconBtn(
                            <X className="w-3.5 h-3.5" />,
                            isSaved ? 'Close' : 'Discard / Close',
                            isSaved ? onClose : onDiscard,
                            {
                                bg: isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,226,226,0.60)',
                                border: isDark ? 'rgba(248,113,113,0.35)' : 'rgba(220,38,38,0.28)',
                                text: isDark ? t.cellRed : '#b91c1c',
                                hover: isDark ? 'rgba(248,113,113,0.20)' : 'rgba(254,226,226,0.90)',
                            },
                        )}
                    </div>
                </div>

                {/* ── Items Table ── */}
                <div style={{ flex: 1, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                        <thead>
                            <tr style={{ background: t.tableHeadBg }}>
                                {[
                                    { label: '#', w: '36px', align: 'center' },
                                    { label: 'Account No.', w: '120px', align: 'left' },
                                    { label: 'Item Description', w: 'auto', align: 'left' },
                                    { label: 'Unit', w: '80px', align: 'left' },
                                    { label: 'Unit Cost', w: '110px', align: 'right' },
                                    { label: 'Qty', w: '70px', align: 'right' },
                                    { label: 'Total Cost', w: '120px', align: 'right' },
                                    { label: '', w: '38px', align: 'center' },
                                ].map((col, i, arr) => (
                                    <th
                                        key={col.label || `col-${i}`}
                                        style={{
                                            padding: '9px 12px',
                                            fontSize: '9px', fontWeight: 700,
                                            textTransform: 'uppercase', letterSpacing: '.08em',
                                            color: t.tableHeadText,
                                            textAlign: col.align as 'left' | 'right' | 'center',
                                            borderBottom: `2px solid ${t.tableHeadBorder}`,
                                            borderRight: i < arr.length - 1 ? `1px solid ${t.tableHeadBorder}` : 'none',
                                            width: col.w, whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        style={{ padding: '44px 16px', textAlign: 'center', fontSize: '11px', color: t.cellMuted }}
                                    >
                                        <Plus className="w-6 h-6 mx-auto mb-2 opacity-25" style={{ color: t.cellMuted }} />
                                        No items yet. Click{' '}
                                        <button
                                            onClick={() => setShowAddItem(true)}
                                            style={{ color: t.cellBlue, fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
                                        >
                                            New Item
                                        </button>{' '}
                                        to add a line.
                                    </td>
                                </tr>
                            ) : items.map((item, i) => (
                                <tr
                                    key={item.id}
                                    onMouseEnter={() => setHoveredRow(item.id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                    style={{
                                        background: hoveredRow === item.id ? t.rowHoverBg : i % 2 === 0 ? t.rowEvenBg : t.rowOddBg,
                                        borderBottom: `1px solid ${t.rowBorder}`,
                                        transition: 'background .12s ease',
                                    }}
                                >
                                    {/* Row # */}
                                    <td style={{ padding: '7px 10px', fontSize: 10, color: t.cellMuted, textAlign: 'center', borderRight: `1px solid ${t.rowBorder}`, fontFamily: "'JetBrains Mono', monospace" }}>
                                        {i + 1}
                                    </td>
                                    {/* Account No. */}
                                    <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, color: t.cellBlue, borderRight: `1px solid ${t.rowBorder}`, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                                        {item.accountNo || <span style={{ color: t.cellMuted, fontWeight: 400, fontStyle: 'italic' }}>—</span>}
                                    </td>
                                    {/* Item Description */}
                                    <td style={{ padding: '7px 12px', fontSize: 11, color: t.cellText, borderRight: `1px solid ${t.rowBorder}` }}>
                                        {item.itemDescription || <span style={{ color: t.cellMuted, fontStyle: 'italic' }}>—</span>}
                                    </td>
                                    {/* Unit of Measurement */}
                                    <td style={{ padding: '7px 12px', fontSize: 11, color: t.cellMuted, borderRight: `1px solid ${t.rowBorder}`, whiteSpace: 'nowrap' }}>
                                        {item.unitOfMeasurement || '—'}
                                    </td>
                                    {/* Unit Cost */}
                                    <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600, color: t.cellText, textAlign: 'right', borderRight: `1px solid ${t.rowBorder}`, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                        ₱ {fmtCurrency(parseFloat(item.unitCost) || 0)}
                                    </td>
                                    {/* Quantity */}
                                    <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600, color: t.cellText, textAlign: 'right', borderRight: `1px solid ${t.rowBorder}`, fontFamily: "'JetBrains Mono', monospace" }}>
                                        {item.quantity || '0'}
                                    </td>
                                    {/* Total Cost */}
                                    <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, color: t.cellGreen, textAlign: 'right', borderRight: `1px solid ${t.rowBorder}`, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                        ₱ {fmtCurrency(item.totalCost)}
                                    </td>
                                    {/* Delete */}
                                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            title="Remove item"
                                            style={{ width: 24, height: 24, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: t.cellMuted, transition: 'all .12s ease' }}
                                            onMouseEnter={e => {
                                                (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.14)' : 'rgba(254,226,226,0.70)';
                                                (e.currentTarget as HTMLElement).style.color = t.cellRed;
                                            }}
                                            onMouseLeave={e => {
                                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                                (e.currentTarget as HTMLElement).style.color = t.cellMuted;
                                            }}
                                        >
                                            <X style={{ width: 12, height: 12 }} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── Grand Total row ── */}
                {items.length > 0 && (
                    <div
                        style={{
                            padding: '10px 22px',
                            background: t.totalBg,
                            borderTop: `1px solid ${t.totalBorder}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12,
                        }}
                    >
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: t.totalLabel }}>
                            Grand Total
                        </span>
                        <div
                            style={{
                                padding: '6px 18px', borderRadius: 8,
                                background: t.cardHeaderBg, border: `1px solid ${t.cardBorder}`,
                                fontSize: 12, fontWeight: 700, color: t.cellGreen,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontVariantNumeric: 'tabular-nums',
                                minWidth: 150, textAlign: 'right',
                            }}
                        >
                            ₱ {fmtCurrency(grandTotal)}
                        </div>
                    </div>
                )}

                {/* ── Footer: Payee + Note ── */}
                <div
                    style={{
                        padding: '14px 22px',
                        background: t.cardHeaderBg,
                        borderTop: `1px solid ${t.cardHeaderBorder}`,
                        display: 'flex', flexDirection: 'column', gap: 14,
                    }}
                >
                    {/* Payee */}
                    <div>
                        <label
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: '.08em', color: t.tableHeadText, marginBottom: 6,
                            }}
                        >
                            <User style={{ width: 12, height: 12 }} />
                            Payee
                            {!rsHeaderData?.payeeFromModal && (
                                <span style={{ color: t.cellAmber, textTransform: 'none', fontSize: 9, fontWeight: 600, marginLeft: 2 }}>
                                    (optional)
                                </span>
                            )}
                        </label>
                        {rsHeaderData?.payeeFromModal ? (
                            <div
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '8px 12px', borderRadius: 10,
                                    background: isDark ? 'rgba(10,22,50,0.60)' : 'rgba(220,234,255,0.60)',
                                    border: `1px solid ${t.sectionDivider}`,
                                    fontSize: 12, fontWeight: 600, color: t.cellText,
                                    minHeight: 36,
                                }}
                            >
                                <CheckCircle2 style={{ width: 13, height: 13, color: isDark ? '#4ade80' : '#15803d', flexShrink: 0 }} />
                                <span>{rsHeaderData.payee || <span style={{ color: t.cellMuted, fontStyle: 'italic', fontWeight: 400 }}>—</span>}</span>
                                <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: isDark ? '#4ade80' : '#15803d', opacity: 0.8 }}>
                                    from payee details
                                </span>
                            </div>
                        ) : (
                            <input
                                value={payeeInput}
                                onChange={e => setPayeeInput(e.target.value)}
                                disabled={isSaved}
                                placeholder="Enter payee name…"
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: isSaved
                                        ? (isDark ? 'rgba(10,22,50,0.40)' : 'rgba(220,234,255,0.40)')
                                        : t.inputBg,
                                    border: `1px solid ${t.inputBorder}`,
                                    borderRadius: 10, padding: '8px 12px',
                                    fontSize: 12, fontWeight: 600, color: t.inputText,
                                    outline: 'none', transition: 'border-color .15s ease',
                                    fontFamily: 'inherit',
                                    cursor: isSaved ? 'not-allowed' : 'text',
                                    minHeight: 36,
                                }}
                                onFocus={e => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)'; }}
                                onBlur={e => { (e.target as HTMLElement).style.borderColor = t.inputBorder; }}
                            />
                        )}
                    </div>

                    {/* Note */}
                    <div>
                        <label
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: '.08em', color: t.tableHeadText, marginBottom: 6,
                            }}
                        >
                            <StickyNote style={{ width: 12, height: 12 }} />
                            Note
                        </label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            rows={2}
                            placeholder="Add any remarks or special instructions for this requisition slip…"
                            style={{
                                width: '100%', resize: 'vertical',
                                background: t.inputBg,
                                border: `1px solid ${t.inputBorder}`,
                                borderRadius: 10, padding: '8px 12px',
                                fontSize: 11, color: t.inputText,
                                outline: 'none', transition: 'border-color .15s ease',
                                fontFamily: 'inherit',
                            }}
                            onFocus={e => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)'; }}
                            onBlur={e => { (e.target as HTMLElement).style.borderColor = t.inputBorder; }}
                        />
                    </div>
                </div>
            </div>

            {/* Add Item Modal — rendered inside same portal overlay context */}
            <AddItemModal
                open={showAddItem}
                onClose={() => setShowAddItem(false)}
                onSave={handleSaveItem}
                t={t}
                isDark={isDark}
                departmentId={departmentId}
                sectionId={sectionId}
                currentSchoolYear={currentSchoolYear}
                rsHeaderId={rsHeaderId}
            />
        </div>,
        document.body,
    );

    return <>{portal}</>;
}


// ─────────────────────────────────────────────────────────────────────────────
// RSViewModal — full overview of an existing RS; editable if status = 'for review'
// ─────────────────────────────────────────────────────────────────────────────
interface RSViewHeader {
    id: number;
    requisition_number: string;
    rstype: string;
    payee: string;
    requested_by: string;
    requested_by_name: string;
    department: string;
    department_id: string | null;
    section_id: string | null;
    school_year: string;
    status: string;
    total_amount: number;
    created_at: string;
}

function RSViewModal({
    open, recordId, onClose, onUpdated, t, isDark,
}: {
    open: boolean;
    recordId: number | null;
    onClose: () => void;
    onUpdated: () => void;
    t: typeof T.dark;
    isDark: boolean;
}) {
    const [header, setHeader] = useState<RSViewHeader | null>(null);
    const [items, setItems] = useState<RSFormItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [showAddItem, setShowAddItem] = useState(false);
    const [isResaving, setIsResaving] = useState(false);
    const [dirty, setDirty] = useState(false); // items changed since load

    const canEdit = header?.status === 'for review';

    useEffect(() => {
        if (!open || !recordId) return;
        setHeader(null);
        setItems([]);
        setError(null);
        setDirty(false);
        setShowAddItem(false);
        setLoading(true);
        financeSvc.get(`/abms/budget-request-entry/${recordId}`)
            .then(res => {
                setHeader(res.data.header);
                setItems(res.data.items ?? []);
            })
            .catch(() => setError('Failed to load requisition slip details.'))
            .finally(() => setLoading(false));
    }, [open, recordId]);

    if (!open) return null;

    const grandTotal = items.reduce((s, item) => s + item.totalCost, 0);

    function handleAddItem(item: RSFormItem) {
        setItems(prev => {
            const next = [...prev, item];
            const newTotal = next.reduce((s, i) => s + i.totalCost, 0);
            // fire-and-forget: persist the updated total immediately
            if (header) {
                financeSvc.patch(`/abms/budget-request-entry/${header.id}/save`, {
                    total_amount: newTotal,
                }).then(() => onUpdated()).catch(() => {});
            }
            return next;
        });
        setDirty(false);
    }

    async function handleDeleteItem(itemId: number) {
        if (items.length <= 1) return; // must keep at least 1 item
        try {
            await financeSvc.delete(`/abms/budget-request-entry/items/${itemId}`);
        } catch {
            // balance restoration failed — still remove locally
        }
        setItems(prev => {
            const next = prev.filter(i => i.id !== itemId);
            const newTotal = next.reduce((s, i) => s + i.totalCost, 0);
            if (header && next.length > 0) {
                financeSvc.patch(`/abms/budget-request-entry/${header.id}/save`, {
                    total_amount: newTotal,
                }).then(() => onUpdated()).catch(() => {});
            }
            return next;
        });
        setDirty(false);
    }

    async function handleResave(overrideTotal?: number) {
        if (!header || isResaving || items.length === 0) return;
        setIsResaving(true);
        try {
            await financeSvc.patch(`/abms/budget-request-entry/${header.id}/save`, {
                total_amount: overrideTotal ?? grandTotal,
            });
            setDirty(false);
            onUpdated();
        } catch {
            // keep dirty so user can retry
        } finally {
            setIsResaving(false);
        }
    }

    // Shared display field
    const displayField = (label: string, value: string, mono = false, color?: string) => (
        <div>
            <span style={{ display: 'block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: t.tableHeadText, marginBottom: 4 }}>
                {label}
            </span>
            <div style={{
                padding: '7px 12px', borderRadius: 8,
                background: isDark ? 'rgba(10,22,50,0.60)' : 'rgba(220,234,255,0.60)',
                border: `1px solid ${t.sectionDivider}`,
                fontSize: 11, fontWeight: 600,
                color: color ?? t.cellText,
                minHeight: 32,
                fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
                fontVariantNumeric: mono ? 'tabular-nums' : 'normal',
            }}>
                {value || <span style={{ color: t.cellMuted, fontStyle: 'italic', fontWeight: 400 }}>—</span>}
            </div>
        </div>
    );

    const rsTypeLabel: Record<string, string> = {
        stockroom: 'FOR OFFICE SUPPLIES / STOCKABLES (STOCKROOM)',
        logistics: 'FOR PURCHASE (LOGISTICS OFFICE)',
        cashier: 'FOR CASH VALUED ITEMS / CASH ADVANCE / PAYMENTS',
    };

    const portal = createPortal(
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: isDark ? 'rgba(0,0,0,0.70)' : 'rgba(0,20,60,0.42)',
                backdropFilter: 'blur(5px)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                padding: '24px 16px',
                overflowY: 'auto',
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <style>{`
                @keyframes rsview-in {
                    from { opacity: 0; transform: scale(0.97) translateY(10px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>

            <div
                style={{
                    width: '100%', maxWidth: '900px',
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    borderRadius: 18,
                    boxShadow: t.cardShadow,
                    overflow: 'hidden',
                    animation: 'rsview-in .22s cubic-bezier(.22,1,.36,1)',
                    display: 'flex', flexDirection: 'column',
                    marginBottom: 24,
                }}
            >
                {/* ── Header ── */}
                <div style={{ background: t.cardHeaderBg, borderBottom: `1px solid ${t.cardHeaderBorder}`, padding: '16px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span
                                    className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                                    style={{ background: t.pillBg, color: t.pillText, border: `1px solid ${t.pillBorder}` }}
                                >
                                    Requisition Slip
                                </span>
                                {header && <StatusBadge status={normalizeStatus(header.status)} t={t} />}
                                {canEdit && (
                                    <span
                                        className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                                        style={{
                                            background: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(253,230,138,0.40)',
                                            border: `1px solid ${isDark ? 'rgba(251,191,36,0.35)' : 'rgba(202,138,4,0.35)'}`,
                                            color: isDark ? t.cellAmber : '#92400e',
                                        }}
                                    >
                                        Editable
                                    </span>
                                )}
                            </div>
                            <h2 className="text-sm font-bold tracking-tight mt-1.5 leading-snug" style={{ color: t.titleColor }}>
                                {header ? rsTypeLabel[header.rstype] ?? header.rstype.toUpperCase() : 'Loading…'}
                            </h2>
                            <p className="text-[10px] mt-0.5" style={{ color: t.cellMuted }}>
                                {header ? `RS No. ${header.requisition_number}` : ''}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-150 shrink-0"
                            style={{ background: 'transparent', borderColor: t.cardBorder, color: t.cellMuted }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)';
                                (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(248,113,113,0.40)' : 'rgba(220,38,38,0.30)';
                                (e.currentTarget as HTMLElement).style.color = t.cellRed;
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                (e.currentTarget as HTMLElement).style.borderColor = t.cardBorder;
                                (e.currentTarget as HTMLElement).style.color = t.cellMuted;
                            }}
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Meta info grid */}
                    {header && (
                        <div className="grid gap-3 mt-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                            {/* RS No. — enlarged + highlighted */}
                            <div>
                                <span style={{ display: 'block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: t.tableHeadText, marginBottom: 4 }}>
                                    RS No.
                                </span>
                                <div style={{
                                    padding: '7px 12px', borderRadius: 8,
                                    background: isDark ? 'rgba(37,99,235,0.18)' : 'rgba(219,234,254,0.80)',
                                    border: `1.5px solid ${isDark ? 'rgba(99,155,255,0.55)' : 'rgba(37,99,235,0.45)'}`,
                                    color: isDark ? '#93c5fd' : '#1d4ed8',
                                    fontSize: 16, fontWeight: 700,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontVariantNumeric: 'tabular-nums',
                                    letterSpacing: '0.04em',
                                    minHeight: 40,
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    boxShadow: isDark
                                        ? '0 0 0 3px rgba(59,130,246,0.12)'
                                        : '0 0 0 3px rgba(37,99,235,0.08)',
                                }}>
                                    <ClipboardList style={{ width: 14, height: 14, opacity: 0.7, flexShrink: 0 }} />
                                    {header.requisition_number}
                                </div>
                            </div>
                            {displayField('Department / Section', header.department)}
                            {displayField('School Year', header.school_year)}
                            {displayField('Date', header.created_at
                                ? new Date(header.created_at).toLocaleDateString('en-US', {
                                    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
                                })
                                : '—'
                            )}
                            {displayField('Requested By', header.requested_by_name)}
                            {displayField('Payee', header.payee)}
                            {displayField('Total Amount', `₱ ${fmtCurrency(grandTotal)}`, true, t.cellGreen)}
                        </div>
                    )}

                    {/* Action row — only when editable */}
                    {canEdit && header && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 14 }}>
                            <button
                                onClick={handleResave}
                                disabled={isResaving || !dirty || items.length === 0}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                                style={{
                                    background: (!dirty || items.length === 0) ? t.btnDisBg : t.btnNew.bg,
                                    borderColor: (!dirty || items.length === 0) ? t.btnDisBorder : t.btnNew.border,
                                    color: (!dirty || items.length === 0) ? t.btnDisText : t.btnNew.text,
                                    opacity: isResaving ? 0.6 : 1,
                                    cursor: (isResaving || !dirty || items.length === 0) ? 'not-allowed' : 'pointer',
                                }}
                                onMouseEnter={e => { if (dirty && !isResaving && items.length > 0) (e.currentTarget as HTMLElement).style.background = t.btnNew.hover; }}
                                onMouseLeave={e => { if (dirty && !isResaving && items.length > 0) (e.currentTarget as HTMLElement).style.background = t.btnNew.bg; }}
                            >
                                {isResaving
                                    ? <RefreshCw className="w-3.5 h-3.5" style={{ animation: 'spin 1s linear infinite' }} />
                                    : <Save className="w-3.5 h-3.5" />
                                }
                                {isResaving ? 'Saving…' : items.length === 0 ? 'No Items' : dirty ? 'Save Changes' : 'No Changes'}
                            </button>
                            <button
                                onClick={() => setShowAddItem(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                                style={{ background: t.btnRefresh.bg, borderColor: t.btnRefresh.border, color: t.btnRefresh.text }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.btnRefresh.hover; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = t.btnRefresh.bg; }}
                            >
                                <Plus className="w-3.5 h-3.5" />
                                New Item
                            </button>
                            <div style={{ flex: 1 }} />
                            <button
                                onClick={onClose}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                                style={{
                                    background: isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,226,226,0.60)',
                                    borderColor: isDark ? 'rgba(248,113,113,0.35)' : 'rgba(220,38,38,0.28)',
                                    color: isDark ? t.cellRed : '#b91c1c',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.20)' : 'rgba(254,226,226,0.90)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,226,226,0.60)'; }}
                            >
                                <X className="w-3.5 h-3.5" />
                                Close
                            </button>
                        </div>
                    )}

                    {/* Read-only close row */}
                    {!canEdit && header && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                            <button
                                onClick={onClose}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                                style={{
                                    background: isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,226,226,0.60)',
                                    borderColor: isDark ? 'rgba(248,113,113,0.35)' : 'rgba(220,38,38,0.28)',
                                    color: isDark ? t.cellRed : '#b91c1c',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.20)' : 'rgba(254,226,226,0.90)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,226,226,0.60)'; }}
                            >
                                <X className="w-3.5 h-3.5" />
                                Close
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Body: loading / error / items table ── */}
                {loading ? (
                    <div style={{ padding: '60px 24px', textAlign: 'center', color: t.cellMuted }}>
                        <RefreshCw className="w-6 h-6 mx-auto mb-3 opacity-40" style={{ animation: 'spin 1s linear infinite', color: t.cellMuted }} />
                        <p style={{ fontSize: 11 }}>Loading requisition slip…</p>
                    </div>
                ) : error ? (
                    <div style={{ padding: '60px 24px', textAlign: 'center', color: t.cellRed }}>
                        <AlertCircle className="w-6 h-6 mx-auto mb-3 opacity-60" style={{ color: t.cellRed }} />
                        <p style={{ fontSize: 11 }}>{error}</p>
                    </div>
                ) : (
                    <>
                        {/* Items table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: canEdit ? 760 : 720 }}>
                                <thead>
                                    <tr style={{ background: t.tableHeadBg }}>
                                        {[
                                            { label: '#', w: '36px', align: 'center' },
                                            { label: 'Account No.', w: '120px', align: 'left' },
                                            { label: 'Item Description', w: 'auto', align: 'left' },
                                            { label: 'Unit', w: '80px', align: 'left' },
                                            { label: 'Unit Cost', w: '110px', align: 'right' },
                                            { label: 'Qty', w: '70px', align: 'right' },
                                            { label: 'Total Cost', w: '120px', align: 'right' },
                                            ...(canEdit ? [{ label: '', w: '38px', align: 'center' }] : []),
                                        ].map((col, i, arr) => (
                                            <th key={col.label || `col-${i}`} style={{
                                                padding: '9px 12px', fontSize: 9, fontWeight: 700,
                                                textTransform: 'uppercase', letterSpacing: '.08em',
                                                color: t.tableHeadText,
                                                textAlign: col.align as 'left' | 'right' | 'center',
                                                borderBottom: `2px solid ${t.tableHeadBorder}`,
                                                borderRight: i < arr.length - 1 ? `1px solid ${t.tableHeadBorder}` : 'none',
                                                width: col.w, whiteSpace: 'nowrap',
                                            }}>
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={canEdit ? 8 : 7}
                                                style={{ padding: '44px 16px', textAlign: 'center', fontSize: 11, color: t.cellMuted }}
                                            >
                                                {canEdit ? (
                                                    <>
                                                        <Plus className="w-6 h-6 mx-auto mb-2 opacity-25" style={{ color: t.cellMuted }} />
                                                        No items yet. Click{" "}
                                                        <button
                                                            onClick={() => setShowAddItem(true)}
                                                            style={{ color: t.cellBlue, fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
                                                        >
                                                            New Item
                                                        </button>{" "}
                                                        to add a line.
                                                    </>
                                                ) : 'No items on this requisition slip.'}
                                            </td>
                                        </tr>
                                    ) : items.map((item, i) => (
                                        <tr
                                            key={item.id}
                                            onMouseEnter={() => setHoveredRow(item.id)}
                                            onMouseLeave={() => setHoveredRow(null)}
                                            style={{
                                                background: hoveredRow === item.id ? t.rowHoverBg : i % 2 === 0 ? t.rowEvenBg : t.rowOddBg,
                                                borderBottom: `1px solid ${t.rowBorder}`,
                                                transition: 'background .12s ease',
                                            }}
                                        >
                                            <td style={{ padding: '7px 10px', fontSize: 10, color: t.cellMuted, textAlign: 'center', borderRight: `1px solid ${t.rowBorder}`, fontFamily: "'JetBrains Mono', monospace" }}>
                                                {i + 1}
                                            </td>
                                            <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, color: t.cellBlue, borderRight: `1px solid ${t.rowBorder}`, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                                                {item.accountNo || <span style={{ color: t.cellMuted, fontWeight: 400, fontStyle: 'italic' }}>—</span>}
                                            </td>
                                            <td style={{ padding: '7px 12px', fontSize: 11, color: t.cellText, borderRight: `1px solid ${t.rowBorder}` }}>
                                                {item.itemDescription || <span style={{ color: t.cellMuted, fontStyle: 'italic' }}>—</span>}
                                            </td>
                                            <td style={{ padding: '7px 12px', fontSize: 11, color: t.cellMuted, borderRight: `1px solid ${t.rowBorder}`, whiteSpace: 'nowrap' }}>
                                                {item.unitOfMeasurement || '—'}
                                            </td>
                                            <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600, color: t.cellText, textAlign: 'right', borderRight: `1px solid ${t.rowBorder}`, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                                ₱ {fmtCurrency(parseFloat(item.unitCost) || 0)}
                                            </td>
                                            <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600, color: t.cellText, textAlign: 'right', borderRight: `1px solid ${t.rowBorder}`, fontFamily: "'JetBrains Mono', monospace" }}>
                                                {item.quantity || '0'}
                                            </td>
                                            <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, color: t.cellGreen, textAlign: 'right', borderRight: canEdit ? `1px solid ${t.rowBorder}` : 'none', fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                                ₱ {fmtCurrency(item.totalCost)}
                                            </td>
                                            {canEdit && (
                                                <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        disabled={items.length <= 1}
                                                        title={items.length <= 1 ? 'Cannot remove the only item' : 'Remove item'}
                                                        style={{ width: 24, height: 24, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: items.length <= 1 ? 'not-allowed' : 'pointer', color: items.length <= 1 ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)') : t.cellMuted, transition: 'all .12s ease' }}
                                                        onMouseEnter={e => {
                                                            if (items.length <= 1) return;
                                                            (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.14)' : 'rgba(254,226,226,0.70)';
                                                            (e.currentTarget as HTMLElement).style.color = t.cellRed;
                                                        }}
                                                        onMouseLeave={e => {
                                                            if (items.length <= 1) return;
                                                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                                                            (e.currentTarget as HTMLElement).style.color = t.cellMuted;
                                                        }}
                                                    >
                                                        <X style={{ width: 12, height: 12 }} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Grand total */}
                        {items.length > 0 && (
                            <div style={{
                                padding: '10px 22px',
                                background: t.totalBg,
                                borderTop: `1px solid ${t.totalBorder}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12,
                            }}>
                                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: t.totalLabel }}>
                                    Grand Total
                                </span>
                                <div style={{
                                    padding: '6px 18px', borderRadius: 8,
                                    background: t.cardHeaderBg, border: `1px solid ${t.cardBorder}`,
                                    fontSize: 12, fontWeight: 700, color: t.cellGreen,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontVariantNumeric: 'tabular-nums',
                                    minWidth: 150, textAlign: 'right',
                                }}>
                                    ₱ {fmtCurrency(grandTotal)}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* AddItemModal — only mounted when canEdit */}
            {canEdit && header && (
                <AddItemModal
                    open={showAddItem}
                    onClose={() => setShowAddItem(false)}
                    onSave={handleAddItem}
                    t={t}
                    isDark={isDark}
                    departmentId={header.department_id ?? ''}
                    sectionId={header.section_id ?? ''}
                    currentSchoolYear={header.school_year}
                    rsHeaderId={header.id}
                    rsType={header.rstype as RSType}
                />
            )}
        </div>,
        document.body,
    );

    return <>{portal}</>;
}

// Normalises raw DB strings → Status union (lowercased, trimmed)
function normalizeStatus(raw: string | null | undefined): Status {
    if (!raw) return 'for review';
    const s = raw.toLowerCase().trim() as Status;
    const valid: Status[] = [
        'for review', 'for certification', 'certified', 'for pricing',
        'disapproved', 'cancelled', 'served by wico',
        'for budget staff', 'for budget director', 'for purchase', 'p.o. on process',
    ];
    return valid.includes(s) ? s : 'for review';
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status, t }: { status: Status; t: typeof T.dark }) {
    const token = ((): typeof t.statusForReview => {
        switch (status) {
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
            case 'p.o. on process': return t.statusPOOnProcess;
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
// Inner page — receives isDark from the layout render-prop (no MutationObserver)
// ─────────────────────────────────────────────────────────────────────────────
function BudgetRequestEntryInner({
    t, isDark,
}: { t: typeof T.dark; isDark: boolean }) {

    const { departments, sections, current_school_year: currentSchoolYear } = budgetrequestentryRoute.useLoaderData();
    const { user } = useRouteContext({ strict: false });


    const deptOptions: DeptOption[] = [
        ...departments.map((d: { id: string; name: string }) => ({
            id: d.id,
            name: d.name,
            kind: 'Department' as const,
        })),
        ...sections.map((s: { id: string; name: string }) => ({
            id: s.id,
            name: s.name,
            kind: 'Section' as const,
        })),
    ];
    // ── Filter state ──────────────────────────────────────────────────────────
    const [viewAll, setViewAll] = useState(true);
    const [viewServedByWico, setViewServedByWico] = useState(false);
    const [filterByDate, setFilterByDate] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedDept, setSelectedDept] = useState('');
    const [search, setSearch] = useState('');

    // ── Table state ───────────────────────────────────────────────────────────
    const [records, setRecords] = useState<RSRecord[]>([]);
    const [isLoadingRecords, setIsLoadingRecords] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [hovered, setHovered] = useState<number | null>(null);

    // ── Cursor pagination state ────────────────────────────────────────────────
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const perPage = 50;

    // ── Modal state ───────────────────────────────────────────────────────────
    const [showNewRS, setShowNewRS] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewModalId, setViewModalId] = useState<number | null>(null);
    const [showRSForm, setShowRSForm] = useState(false);
    const [rsFormType, setRSFormType] = useState<RSType>(null);
    const [rsHeaderId, setRsHeaderId] = useState<number | null>(null);
    const [isCreatingRS, setIsCreatingRS] = useState(false);

    // Stores the full header data returned by the store endpoint
    interface RSHeaderData {
        id: number;
        requisition_number: string;
        department: string;
        school_year: string;
        created_at: string;
        payee: string | null;
        payeeFromModal: boolean;
    }
    const [rsHeaderData, setRsHeaderData] = useState<RSHeaderData | null>(null);

    // ── Toast state ───────────────────────────────────────────────────────────
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const toastCounter = useRef(0);

    function addToast(kind: ToastKind, message: string) {
        const id = ++toastCounter.current;
        setToasts(prev => [...prev, { id, kind, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }

    // ── School-year toggle ────────────────────────────────────────────────────
    const [usePrevSY, setUsePrevSY] = useState(false);

    // Derive the active school year from the loader value
    // currentSchoolYear format: "2024–2025"
    const activeSchoolYear = (() => {
        if (!usePrevSY) return currentSchoolYear ?? '';
        // Shift both years back by 1: "2024–2025" → "2023–2024"
        const match = (currentSchoolYear ?? '').match(/(\d{4})[–\-](\d{4})/);
        if (!match) return currentSchoolYear ?? '';
        return `${parseInt(match[1]) - 1}–${parseInt(match[2]) - 1}`;
    })();

    // Reset loaded state when the scope (dept/section or school year) changes
    // so the "click Refresh" hint reappears
    useEffect(() => {
        setRecords([]);
        setHasLoaded(false);
    }, [selectedDept, activeSchoolYear]);

    function handleToggleSY() {
        const next = !usePrevSY;
        setUsePrevSY(next);
        if (next) {
            // Compute what the prev SY label will be
            const match = (currentSchoolYear ?? '').match(/(\d{4})[–\-](\d{4})/);
            const prevLabel = match
                ? `${parseInt(match[1]) - 1}–${parseInt(match[2]) - 1}`
                : 'previous school year';
            addToast('info', `Switched to previous school year: ${prevLabel}`);
        } else {
            addToast('success', `Switched back to current school year: ${currentSchoolYear ?? ''}`);
        }
    }

    // ── Handlers ──────────────────────────────────────────────────────────────
    const buildParams = (cursor?: string | null) => {
        const selectedOpt = deptOptions.find(d => d.id === selectedDept);
        const params: Record<string, string> = {
            schoolYear: activeSchoolYear,
            perPage: String(perPage),
        };
        if (selectedOpt?.kind === 'Department') params.departmentId = selectedOpt.id;
        else if (selectedOpt?.kind === 'Section') params.sectionId = selectedOpt.id;
        if (filterByDate && dateFrom) params.dateFrom = dateFrom;
        if (filterByDate && dateTo) params.dateTo = dateTo;
        if (viewServedByWico) params.viewServedByWico = 'true';
        if (search.trim()) params.search = search.trim();
        if (cursor) params.cursor = cursor;
        return params;
    };

    const handleRefresh = async () => {
        if (!selectedDept) {
            addToast('info', 'Select a Department or Section first before refreshing.');
            return;
        }
        setIsLoadingRecords(true);
        setNextCursor(null);
        setHasMore(false);
        try {
            const res = await financeSvc.get('/abms/budget-request-entry/entries', { params: buildParams() });
            const raw: Array<{
                id: number; date: string; requisitionNo: string;
                payee: string; requestedBy: string; requestedByName: string;
                totalAmount: number; status: string;
            }> = res.data?.entries ?? [];

            const mapped: RSRecord[] = raw.map(e => ({
                id: e.id, date: e.date, requisitionNo: e.requisitionNo,
                payee: e.payee, requestedBy: e.requestedBy,
                requestedByName: e.requestedByName,
                totalAmount: e.totalAmount, status: normalizeStatus(e.status),
            }));
            setRecords(mapped);
            setNextCursor(res.data?.next_cursor ?? null);
            setHasMore(res.data?.has_more ?? false);
            setHasLoaded(true);
            addToast('success', `${mapped.length} ${mapped.length === 1 ? 'record' : 'records'} loaded.`);
        } catch {
            addToast('error', 'Failed to load records. Please try again.');
        } finally {
            setIsLoadingRecords(false);
        }
    };

    const handleLoadMore = async () => {
        if (!nextCursor || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const res = await financeSvc.get('/abms/budget-request-entry/entries', {
                params: buildParams(nextCursor),
            });
            const raw: Array<{
                id: number; date: string; requisitionNo: string;
                payee: string; requestedBy: string; requestedByName: string;
                totalAmount: number; status: string;
            }> = res.data?.entries ?? [];
            const mapped: RSRecord[] = raw.map(e => ({
                id: e.id, date: e.date, requisitionNo: e.requisitionNo,
                payee: e.payee, requestedBy: e.requestedBy,
                requestedByName: e.requestedByName,
                totalAmount: e.totalAmount, status: normalizeStatus(e.status),
            }));
            setRecords(prev => [...prev, ...mapped]);
            setNextCursor(res.data?.next_cursor ?? null);
            setHasMore(res.data?.has_more ?? false);
        } catch {
            addToast('error', 'Failed to load more records. Please try again.');
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleDelete = async (id: number) => {
        const rec = records.find(r => r.id === id);
        try {
            await financeSvc.delete(`/abms/budget-request-entry/${id}`);
            setRecords(prev => prev.filter(r => r.id !== id));
            if (rec) addToast('success', `"${rec.requisitionNo}" deleted.`);
        } catch {
            addToast('error', 'Failed to delete the record. Please try again.');
        }
    };

    // ── Derived rows — all filtering is server-side; display records as-is ───
    const displayed = records;

    const grandTotal = displayed.reduce((s, r) => s + r.totalAmount, 0);

    const COLS = [
        { label: 'Date', width: '116px', align: 'left' as const },
        { label: 'Requisition No.', width: '172px', align: 'left' as const },
        { label: 'Payee', width: 'auto', align: 'left' as const },
        { label: 'Requested By', width: '220px', align: 'left' as const },
        { label: 'Total Amount', width: '164px', align: 'right' as const },
        { label: 'Status', width: '160px', align: 'left' as const },
    ];

    return (
        <>
            {/* RS View Modal */}
            <RSViewModal
                open={showViewModal}
                recordId={viewModalId}
                onClose={() => { setShowViewModal(false); setViewModalId(null); }}
                onUpdated={() => { handleRefresh(); }}
                t={t}
                isDark={isDark}
            />

            {/* Toasts */}
            <Toasts
                items={toasts}
                isDark={isDark}
                onDismiss={id => setToasts(p => p.filter(t => t.id !== id))}
            />

            {/* New RS Modal */}
            <NewRSModal
                open={showNewRS}
                onClose={() => setShowNewRS(false)}
                onConfirm={async (type, paymentForm, payeeDetails) => {
                    if (!type) return;
                    setIsCreatingRS(true);
                    try {
                        const selectedOpt = deptOptions.find(d => d.id === selectedDept);
                        const res = await financeSvc.post('/abms/budget-request-entry', {
                            rstype: type,
                            department_id: selectedOpt?.kind === 'Department' ? selectedOpt.id : null,
                            section_id: selectedOpt?.kind === 'Section' ? selectedOpt.id : null,
                            requested_by: user?.username ?? null,
                            school_year: activeSchoolYear,
                            payment_form: paymentForm || null,
                            payee_details: payeeDetails ? {
                                payee:             payeeDetails.payee,
                                tin:               payeeDetails.tinNo || null,
                                is_adu_employee:   payeeDetails.aduEmployee,
                                is_vat_registered: payeeDetails.vatRegistered,
                                is_cheque:         payeeDetails.mopCheque,
                                is_bank:           payeeDetails.mopBankTransfer,
                                bank_name:         payeeDetails.bankName || null,
                                account_name:      payeeDetails.accountName || null,
                                account_number:    payeeDetails.accountNumber || null,
                                bank_address:      payeeDetails.bankAddress || null,
                            } : null,
                        });
                        setShowNewRS(false);
                        setRSFormType(type);
                        setRsHeaderId(res.data.id);
                        setRsHeaderData({
                            id: res.data.id,
                            requisition_number: String(res.data.requisition_number),
                            department: selectedOpt?.name ?? '—',
                            school_year: res.data.school_year,
                            created_at: res.data.created_at,
                            payee: payeeDetails?.payee ?? null,
                            payeeFromModal: payeeDetails !== null,
                        });
                        setShowRSForm(true);
                    } catch {
                        addToast('error', 'Failed to create Requisition Slip. Please try again.');
                    } finally {
                        setIsCreatingRS(false);
                    }
                }}
                isLoading={isCreatingRS}
                t={t}
                isDark={isDark}
            />

            {/* RS Form Modal */}
            <RSFormModal
                open={showRSForm}
                rsType={rsFormType}
                rsHeaderId={rsHeaderId}
                rsHeaderData={rsHeaderData}
                department={
                    deptOptions.find(d => d.id === selectedDept)?.name ?? '—'
                }
                onClose={() => setShowRSForm(false)}
                onSaveSuccess={(rsNumber) => {
                    setShowRSForm(false);
                    setRsHeaderId(null);
                    setRsHeaderData(null);
                    setRSFormType(null);
                    addToast('success', `Requisition Slip ${rsNumber} saved successfully.`);
                    // Auto-refresh so the new RS appears in the table
                    handleRefresh();
                }}
                onDiscard={async () => {
                    if (rsHeaderId !== null) {
                        try {
                            await financeSvc.delete(`/abms/budget-request-entry/${rsHeaderId}`);
                        } catch {
                            addToast('error', 'Failed to discard the Requisition Slip. Please try again.');
                            return;
                        }
                    }
                    setShowRSForm(false);
                    setRsHeaderId(null);
                    setRsHeaderData(null);
                    setRSFormType(null);
                }}
                t={t}
                isDark={isDark}
                departmentId={deptOptions.find(d => d.id === selectedDept && d.kind === 'Department')?.id ?? ''}
                sectionId={deptOptions.find(d => d.id === selectedDept && d.kind === 'Section')?.id ?? ''}
                currentSchoolYear={activeSchoolYear}
            />

            {/* ── Page title ─────────────────────────────────────────────── */}
            <div className="mb-5">
                <h1 className="text-lg font-bold tracking-tight" style={{ color: t.titleColor }}>
                    Budget Request Entry
                </h1>
                <p className="text-[11px] mt-0.5" style={{ color: t.cellMuted }}>
                    Manage and track Requisition Slips (RS) across departments and sections.
                </p>
            </div>

            {/* ── Single card ────────────────────────────────────────────── */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    boxShadow: t.cardShadow,
                }}
            >

                {/* ══ ROW 1 — Filters + action buttons ══════════════════════ */}
                <div
                    className="px-5 py-3.5 flex flex-wrap items-center gap-x-5 gap-y-3"
                    style={{
                        background: t.cardHeaderBg,
                        borderBottom: `1px solid ${t.cardHeaderBorder}`,
                    }}
                >
                    {/* View-option checkboxes */}
                    <div className="flex items-center gap-4 shrink-0">
                        <Checkbox
                            checked={viewAll}
                            onChange={v => { setViewAll(v); if (v) setViewServedByWico(false); }}
                            label="View All"
                            t={t} isDark={isDark}
                        />
                        <div className="h-4 w-px" style={{ background: t.sectionDivider }} />
                        <Checkbox
                            checked={viewServedByWico}
                            onChange={v => { setViewServedByWico(v); if (v) setViewAll(false); }}
                            label="View Served by WICO"
                            t={t} isDark={isDark}
                        />
                    </div>

                    <div className="h-6 w-px hidden md:block shrink-0" style={{ background: t.sectionDivider }} />

                    {/* Date filter */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <Checkbox
                            checked={filterByDate}
                            onChange={v => { setFilterByDate(v); if (!v) { setDateFrom(''); setDateTo(''); } }}
                            label="Filter by Date"
                            t={t} isDark={isDark}
                        />
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            disabled={!filterByDate}
                            className="rounded-lg text-[11px] font-semibold px-2.5 py-1.5 border outline-none transition-all duration-150"
                            style={{
                                background: t.inputBg,
                                borderColor: t.inputBorder,
                                color: dateFrom ? t.inputText : t.inputPlaceholder,
                                colorScheme: isDark ? 'dark' : 'light',
                                opacity: filterByDate ? 1 : 0.38,
                                cursor: filterByDate ? 'default' : 'not-allowed',
                            }}
                        />
                        <span className="text-[10px] font-bold shrink-0" style={{ color: t.cellMuted }}>to</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            disabled={!filterByDate}
                            className="rounded-lg text-[11px] font-semibold px-2.5 py-1.5 border outline-none transition-all duration-150"
                            style={{
                                background: t.inputBg,
                                borderColor: t.inputBorder,
                                color: dateTo ? t.inputText : t.inputPlaceholder,
                                colorScheme: isDark ? 'dark' : 'light',
                                opacity: filterByDate ? 1 : 0.38,
                                cursor: filterByDate ? 'default' : 'not-allowed',
                            }}
                        />
                    </div>

                    <div className="h-6 w-px hidden md:block shrink-0" style={{ background: t.sectionDivider }} />

                    {/* Department dropdown */}
                    <DeptDropdown value={selectedDept} onChange={setSelectedDept} options={deptOptions} t={t} isDark={isDark} />

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Btn token={t.btnRefresh} icon={<RefreshCw className={`w-3.5 h-3.5${isLoadingRecords ? ' animate-spin' : ''}`} />} label={isLoadingRecords ? 'Loading…' : 'Refresh'} onClick={handleRefresh} disabled={isLoadingRecords} t={t} />
                        <div title={!selectedDept ? 'Please select a Department or Section first' : ''} style={{ display: 'inline-flex' }}>
                            <Btn token={t.btnNew} icon={<FilePlus className="w-3.5 h-3.5" />} label="New RS" onClick={() => setShowNewRS(true)} disabled={!selectedDept} t={t} />
                        </div>
                        <Btn
                            token={usePrevSY ? t.btnNew : t.btnPrevSY}
                            icon={usePrevSY
                                ? <RefreshCw className="w-3.5 h-3.5" />
                                : <Copy className="w-3.5 h-3.5" />
                            }
                            label={usePrevSY ? 'Use Current School Year' : 'Use Previous School Year'}
                            onClick={handleToggleSY}
                            t={t}
                        />
                    </div>
                </div>

                {/* ══ ROW 2 — Search + count pill ═══════════════════════════ */}
                <div
                    className="px-5 py-2.5 flex items-center gap-3"
                    style={{
                        background: t.cardHeaderBg,
                        borderBottom: `1px solid ${t.cardHeaderBorder}`,
                    }}
                >
                    {/* Count pill */}
                    <span
                        className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shrink-0"
                        style={{ background: t.pillBg, color: t.pillText, border: `1px solid ${t.pillBorder}` }}
                    >
                        {displayed.length} {displayed.length === 1 ? 'record' : 'records'}{hasMore ? '+' : ''}
                    </span>

                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                        <Search
                            className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ color: t.cellMuted }}
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by RS number, payee, or requested by…"
                            className="w-full pl-8 pr-3 py-2 rounded-xl text-[11px] font-semibold border outline-none transition-all duration-150"
                            style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText }}
                            onFocus={e => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)'; }}
                            onBlur={e => { (e.target as HTMLElement).style.borderColor = t.inputBorder; }}
                        />
                    </div>

                    {/* Active filter indicator */}
                    {(viewServedByWico || (filterByDate && (dateFrom || dateTo)) || selectedDept) && (
                        <span className="text-[10px] font-semibold ml-auto" style={{ color: t.cellAmber }}>
                            {[
                                viewServedByWico ? 'Served by WICO only' : null,
                                filterByDate && (dateFrom || dateTo)
                                    ? `${dateFrom || '—'} → ${dateTo || '—'}`
                                    : null,
                                selectedDept
                                    ? deptOptions.find(d => d.id === selectedDept)?.name
                                    : null,
                            ].filter(Boolean).join(' · ')}
                        </span>
                    )}
                </div>

                {/* ══ Table ════════════════════════════════════════════════ */}
                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr style={{ background: t.tableHeadBg }}>
                                {COLS.map(col => (
                                    <th
                                        key={col.label}
                                        className="px-4 py-3 font-bold uppercase tracking-widest whitespace-nowrap"
                                        style={{
                                            fontSize: '11px',
                                            color: t.tableHeadText,
                                            textAlign: col.align,
                                            width: col.width,
                                            borderBottom: `2px solid ${t.tableHeadBorder}`,
                                            borderRight: col.label !== 'Status'
                                                ? `1px solid ${t.tableHeadBorder}`
                                                : 'none',
                                        }}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {isLoadingRecords ? (
                                <tr>
                                    <td
                                        colSpan={COLS.length}
                                        className="px-4 py-16 text-center text-xs"
                                        style={{ color: t.cellMuted }}
                                    >
                                        <RefreshCw className="w-8 h-8 mx-auto mb-2.5 opacity-30" style={{ color: t.cellMuted, animation: 'spin 1s linear infinite' }} />
                                        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                                        Loading records…
                                    </td>
                                </tr>
                            ) : displayed.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={COLS.length}
                                        className="px-4 py-16 text-center text-xs"
                                        style={{ color: t.cellMuted }}
                                    >
                                        <ClipboardList className="w-8 h-8 mx-auto mb-2.5 opacity-30" style={{ color: t.cellMuted }} />
                                        {search.trim()
                                            ? <>No records match <strong style={{ color: t.cellBlue }}>"{search}"</strong>.</>
                                            : hasLoaded
                                                ? 'No requisition slips found for the selected filters.'
                                                : 'Select a Department or Section, then click Refresh to load records.'
                                        }
                                    </td>
                                </tr>
                            ) : displayed.map((row, i) => (
                                <tr
                                    key={row.id}
                                    onClick={() => { setViewModalId(row.id); setShowViewModal(true); }}
                                    onMouseEnter={() => setHovered(row.id)}
                                    onMouseLeave={() => setHovered(null)}
                                    style={{
                                        background: hovered === row.id
                                            ? t.rowHoverBg
                                            : i % 2 === 0 ? t.rowEvenBg : t.rowOddBg,
                                        borderBottom: `1px solid ${t.rowBorder}`,
                                        transition: 'background 0.12s ease',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {/* Date */}
                                    <td
                                        className="px-4 py-4 font-mono text-[14px] whitespace-nowrap"
                                        style={{
                                            color: t.cellMuted,
                                            borderRight: `1px solid ${t.rowBorder}`,
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        {new Date(row.date).toLocaleDateString('en-PH', {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                        })}
                                    </td>

                                    {/* Requisition No. */}
                                    <td
                                        className="px-4 py-4 font-mono font-bold text-[15px] whitespace-nowrap"
                                        style={{ color: t.cellBlue, borderRight: `1px solid ${t.rowBorder}` }}
                                    >
                                        {row.requisitionNo}
                                    </td>

                                    {/* Payee */}
                                    <td
                                        className="px-4 py-4 text-[15px] font-semibold"
                                        style={{ color: t.cellText, borderRight: `1px solid ${t.rowBorder}` }}
                                    >
                                        {row.payee}
                                    </td>

                                    {/* Requested By — avatar + name + employee no */}
                                    <td
                                        className="px-4 py-3"
                                        style={{ borderRight: `1px solid ${t.rowBorder}` }}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            {row.requestedBy && row.requestedBy !== '—' ? (
                                                <img
                                                    src={`https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${row.requestedBy}_2`}
                                                    alt={row.requestedByName}
                                                    className="rounded-full shrink-0 object-cover"
                                                    style={{
                                                        width: 42, height: 42,
                                                        border: `2px solid ${isDark ? 'rgba(100,160,255,0.30)' : 'rgba(37,99,235,0.20)'}`,
                                                    }}
                                                    onError={e => {
                                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                        const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                                                        if (sib) sib.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            {/* Fallback initials avatar */}
                                            <div
                                                className="rounded-full shrink-0 items-center justify-center font-bold text-[13px] select-none"
                                                style={{
                                                    width: 42, height: 42,
                                                    background: isDark ? 'rgba(59,130,246,0.22)' : 'rgba(219,234,254,0.80)',
                                                    border: `2px solid ${isDark ? 'rgba(100,160,255,0.35)' : 'rgba(37,99,235,0.25)'}`,
                                                    color: isDark ? '#93c5fd' : '#1d4ed8',
                                                    display: (row.requestedBy && row.requestedBy !== '—') ? 'none' : 'flex',
                                                }}
                                            >
                                                {row.requestedByName !== '—'
                                                    ? row.requestedByName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                                                    : row.requestedBy.slice(0, 2).toUpperCase()
                                                }
                                            </div>
                                            {/* Name + employee no */}
                                            <div className="min-w-0">
                                                <p
                                                    className="text-[15px] font-semibold truncate leading-snug"
                                                    style={{ color: t.cellText }}
                                                >
                                                    {row.requestedByName}
                                                </p>
                                                <p
                                                    className="text-[12px] font-mono mt-0.5 truncate"
                                                    style={{ color: t.cellMuted }}
                                                >
                                                    {row.requestedBy}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Total Amount */}
                                    <td
                                        className="px-4 py-4 text-right font-bold font-mono text-[15px] whitespace-nowrap"
                                        style={{
                                            color: t.cellGreen,
                                            borderRight: `1px solid ${t.rowBorder}`,
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        ₱ {fmt(row.totalAmount)}
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-4">
                                        <StatusBadge status={row.status} t={t} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ══ Load More ════════════════════════════════════════════ */}
                {hasMore && (
                    <div
                        className="px-5 py-3 flex items-center justify-center"
                        style={{
                            background: t.cardHeaderBg,
                            borderTop: `1px solid ${t.cardHeaderBorder}`,
                        }}
                    >
                        <button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-[12px] font-bold border transition-all duration-150 select-none"
                            style={{
                                background: isLoadingMore ? t.btnDisBg : t.btnRefresh.bg,
                                borderColor: isLoadingMore ? t.btnDisBorder : t.btnRefresh.border,
                                color: isLoadingMore ? t.btnDisText : t.btnRefresh.text,
                                cursor: isLoadingMore ? 'not-allowed' : 'pointer',
                                opacity: isLoadingMore ? 0.6 : 1,
                            }}
                            onMouseEnter={e => { if (!isLoadingMore) (e.currentTarget as HTMLElement).style.background = t.btnRefresh.hover; }}
                            onMouseLeave={e => { if (!isLoadingMore) (e.currentTarget as HTMLElement).style.background = t.btnRefresh.bg; }}
                        >
                            <RefreshCw className={`w-3.5 h-3.5${isLoadingMore ? ' animate-spin' : ''}`} />
                            {isLoadingMore ? 'Loading more…' : `Load more (showing ${records.length})`}
                        </button>
                    </div>
                )}

                {/* ══ Footer — grand total ═══════════════════════════════════ */}
                {displayed.length > 0 && (
                    <div
                        className="px-5 py-3 flex flex-wrap items-center gap-4"
                        style={{
                            background: t.cardHeaderBg,
                            borderTop: `2px solid ${t.cardHeaderBorder}`,
                        }}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.cellMuted }}>
                            {displayed.length} {displayed.length === 1 ? 'record' : 'records'}
                        </span>

                        <div className="flex items-center gap-3 ml-auto">
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.totalLabel }}>
                                Grand Total
                            </span>
                            <div
                                className="px-5 py-1.5 rounded-lg text-xs font-bold text-right"
                                style={{
                                    background: t.totalBg,
                                    border: `1px solid ${t.totalBorder}`,
                                    color: t.cellGreen,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontVariantNumeric: 'tabular-nums',
                                    minWidth: '160px',
                                }}
                            >
                                ₱ {fmt(grandTotal)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export — render-prop pattern (same as BudgetAdjustmentEntry)
// isDark comes directly from the layout's useTheme(); no MutationObserver needed
// ─────────────────────────────────────────────────────────────────────────────
export default function BudgetRequestEntry() {
    return (
        <AdamsonBudgetLayout>
            {(isDark: boolean) => {
                const t = isDark ? T.dark : T.light;
                return <BudgetRequestEntryInner t={t} isDark={isDark} />;
            }}
        </AdamsonBudgetLayout>
    );
}