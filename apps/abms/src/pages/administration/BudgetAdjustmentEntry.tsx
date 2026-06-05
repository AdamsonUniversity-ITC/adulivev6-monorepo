import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { z } from 'zod';
import AdamsonBudgetLayout from '../../layouts/Screenlayout';
import {
    Plus, ChevronDown, MoreHorizontal, Pencil, Eye, Trash2,
    X, Search, Loader2, CheckSquare2, Square, CheckCircle2,
    AlertCircle, AlertTriangle, Info,
} from 'lucide-react';
import { budgetadjustmententryRoute } from '../../router.tsx';
import { financeSvc } from '@repo/axios-config';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
const T = {
    dark: {
        titleColor: '#f0f6ff', subColor: '#a8c4f0',
        cardBg: 'rgba(11,19,40,0.96)', cardBorder: 'rgba(100,160,255,0.30)', cardShadow: '0 4px 40px rgba(37,99,235,0.22)',
        cardHeaderBg: 'rgba(7,14,32,0.98)', cardHeaderBorder: 'rgba(100,160,255,0.22)',
        inputBg: 'rgba(13,26,58,0.85)', inputBorder: 'rgba(100,160,255,0.32)', inputText: '#e8f0fe',
        tableHeadBg: 'rgba(10,22,50,0.90)', tableHeadText: '#7eb8ff', tableHeadBorder: 'rgba(100,160,255,0.26)',
        rowBorder: 'rgba(100,160,255,0.11)', rowEvenBg: 'rgba(13,26,58,0.32)', rowOddBg: 'transparent',
        cellText: '#ddeeff', cellMuted: '#7a9cc4', cellGreen: '#4ade80', cellRed: '#f87171', cellBlue: '#60a5fa',
        pillBg: 'rgba(59,130,246,0.25)', pillText: '#93c5fd', pillBorder: 'rgba(100,160,255,0.45)',
        modalOverlay: 'rgba(0,0,0,0.72)',
        modalBg: 'rgba(9,16,36,0.99)', modalBorder: 'rgba(100,160,255,0.32)', modalShadow: '0 24px 80px rgba(0,0,0,0.70)',
        divider: 'rgba(100,160,255,0.12)',
        dropdownBg: 'rgba(10,18,38,0.98)', dropdownBorder: 'rgba(99,155,255,0.30)', dropdownShadow: '0 8px 32px rgba(0,0,0,0.50)',
        dropdownHover: 'rgba(59,130,246,0.12)', dropdownSelected: 'rgba(37,99,235,0.20)',
        dropdownSelectedText: '#93c5fd', dropdownText: '#e2e8f0',
        actionMenuBg: 'rgba(9,16,36,0.98)', actionMenuBorder: 'rgba(100,160,255,0.28)', actionMenuShadow: '0 8px 28px rgba(0,0,0,0.55)',
    },
    light: {
        titleColor: '#0a1628', subColor: '#2d4a7a',
        cardBg: 'rgba(255,255,255,0.98)', cardBorder: 'rgba(37,99,235,0.22)', cardShadow: '0 4px 32px rgba(0,48,135,0.12)',
        cardHeaderBg: 'rgba(240,246,255,0.99)', cardHeaderBorder: 'rgba(37,99,235,0.18)',
        inputBg: 'rgba(232,242,255,0.95)', inputBorder: 'rgba(37,99,235,0.28)', inputText: '#0a1628',
        tableHeadBg: 'rgba(210,228,255,0.95)', tableHeadText: '#1440a8', tableHeadBorder: 'rgba(37,99,235,0.22)',
        rowBorder: 'rgba(37,99,235,0.09)', rowEvenBg: 'rgba(232,242,255,0.60)', rowOddBg: 'transparent',
        cellText: '#0a1628', cellMuted: '#2d4a7a', cellGreen: '#047857', cellRed: '#dc2626', cellBlue: '#1440a8',
        pillBg: 'rgba(37,99,235,0.14)', pillText: '#1440a8', pillBorder: 'rgba(37,99,235,0.35)',
        modalOverlay: 'rgba(0,20,60,0.45)',
        modalBg: 'rgba(255,255,255,0.99)', modalBorder: 'rgba(37,99,235,0.22)', modalShadow: '0 24px 80px rgba(0,48,135,0.20)',
        divider: 'rgba(37,99,235,0.10)',
        dropdownBg: 'rgba(255,255,255,0.99)', dropdownBorder: 'rgba(37,99,235,0.20)', dropdownShadow: '0 8px 32px rgba(0,48,135,0.15)',
        dropdownHover: 'rgba(219,234,254,0.50)', dropdownSelected: 'rgba(219,234,254,0.80)',
        dropdownSelectedText: '#1d4ed8', dropdownText: '#0f172a',
        actionMenuBg: 'rgba(255,255,255,0.99)', actionMenuBorder: 'rgba(37,99,235,0.20)', actionMenuShadow: '0 8px 28px rgba(0,48,135,0.14)',
    },
};

const fmt = (n: number) =>
    n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─────────────────────────────────────────────────────────────────────────────
// Toast system
// ─────────────────────────────────────────────────────────────────────────────
type ToastKind = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
    id:       number;
    kind:     ToastKind;
    title:    string;
    message?: string;
}

const TOAST_STYLES: Record<ToastKind, {
    darkBg: string; darkBorder: string; darkTitle: string; darkMsg: string;
    lightBg: string; lightBorder: string; lightTitle: string; lightMsg: string;
}> = {
    success: {
        darkBg:     'rgba(2,44,20,0.98)',   darkBorder:  'rgba(74,222,128,0.55)',
        darkTitle:  '#4ade80',              darkMsg:     '#86efac',
        lightBg:    'rgba(240,253,244,1)',  lightBorder: 'rgba(22,163,74,0.50)',
        lightTitle: '#15803d',              lightMsg:    '#166534',
    },
    error: {
        darkBg:     'rgba(60,7,7,0.98)',    darkBorder:  'rgba(248,113,113,0.55)',
        darkTitle:  '#f87171',              darkMsg:     '#fca5a5',
        lightBg:    'rgba(254,242,242,1)',  lightBorder: 'rgba(239,68,68,0.50)',
        lightTitle: '#b91c1c',              lightMsg:    '#991b1b',
    },
    warning: {
        darkBg:     'rgba(60,30,2,0.98)',   darkBorder:  'rgba(251,191,36,0.55)',
        darkTitle:  '#fbbf24',              darkMsg:     '#fcd34d',
        lightBg:    'rgba(255,251,235,1)',  lightBorder: 'rgba(245,158,11,0.55)',
        lightTitle: '#b45309',              lightMsg:    '#92400e',
    },
    info: {
        darkBg:     'rgba(7,19,54,0.98)',   darkBorder:  'rgba(99,155,255,0.55)',
        darkTitle:  '#60a5fa',              darkMsg:     '#93c5fd',
        lightBg:    'rgba(239,246,255,1)',  lightBorder: 'rgba(37,99,235,0.45)',
        lightTitle: '#1d4ed8',              lightMsg:    '#1e40af',
    },
};

const TOAST_ICONS: Record<ToastKind, React.ReactNode> = {
    success: <CheckCircle2  className="w-4 h-4 shrink-0" />,
    error:   <AlertCircle   className="w-4 h-4 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 shrink-0" />,
    info:    <Info          className="w-4 h-4 shrink-0" />,
};

function ToastContainer({
    toasts,
    isDark,
    onDismiss,
}: {
    toasts:    ToastItem[];
    isDark:    boolean;
    onDismiss: (id: number) => void;
}) {
    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5"
            style={{ maxWidth: '360px', width: 'calc(100vw - 2.5rem)' }}
        >
            {toasts.map(toast => {
                const s = TOAST_STYLES[toast.kind];
                const bg     = isDark ? s.darkBg     : s.lightBg;
                const border = isDark ? s.darkBorder  : s.lightBorder;
                const titleC = isDark ? s.darkTitle   : s.lightTitle;
                const msgC   = isDark ? s.darkMsg     : s.lightMsg;

                return (
                    <div
                        key={toast.id}
                        className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
                        style={{
                            background: bg,
                            border:     `1px solid ${border}`,
                            boxShadow:  isDark
                                ? '0 8px 32px rgba(0,0,0,0.70)'
                                : '0 4px 24px rgba(0,0,0,0.14)',
                            animation: 'toast-in 0.22s cubic-bezier(0.22,1,0.36,1)',
                        }}
                    >
                        <span style={{ color: titleC, marginTop: '1px' }}>
                            {TOAST_ICONS[toast.kind]}
                        </span>

                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-snug" style={{ color: titleC }}>
                                {toast.title}
                            </p>
                            {toast.message && (
                                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: msgC }}>
                                    {toast.message}
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => onDismiss(toast.id)}
                            className="shrink-0 w-5 h-5 flex items-center justify-center rounded-md transition-all duration-150"
                            style={{ color: msgC, opacity: 0.7 }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0.7'; }}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                );
            })}

            {/* Keyframe injection */}
            <style>{`
                @keyframes toast-in {
                    from { opacity: 0; transform: translateX(24px) scale(0.97); }
                    to   { opacity: 1; transform: translateX(0)     scale(1);    }
                }
            `}</style>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface UnitOption {
    id: string;
    name: string;
    kind: 'Department' | 'Section';
}

interface Account {
    id: number;
    account_code: string;
    account_name: string;
    parent_id: number | null;
}

interface AdjustmentEntry {
    id: number;
    created_at: string;
    description: string;
    additional: string | number;
    deduction: string | number;
    school_year: string | null;
    department: { cid: string; dep_name: string } | null;
    section:    { cid: string; sec_name: string } | null;
    main_account: Account | null;
    sub_account:  Account | null;
}

interface CursorPage<T> {
    data:          T[];
    next_cursor:   string | null;
    prev_cursor:   string | null;
    next_page_url: string | null;
    prev_page_url: string | null;
    per_page:      number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SearchableDropdown — reusable searchable select
// ─────────────────────────────────────────────────────────────────────────────
interface DropdownOption {
    id: string;
    label: string;
    code?: string;
    kind?: 'Department' | 'Section';
}

function SearchableDropdown({
    options,
    value,
    onChange,
    placeholder,
    t,
    isDark,
    showKindBadge = false,
    showCode = false,
    disabled = false,
    hasError = false,
}: {
    options: DropdownOption[];
    value: string;
    onChange: (id: string) => void;
    placeholder: string;
    t: typeof T.dark;
    isDark: boolean;
    showKindBadge?: boolean;
    showCode?: boolean;
    disabled?: boolean;
    hasError?: boolean;
}) {
    const [open, setOpen]   = useState(false);
    const [query, setQuery] = useState('');
    const containerRef      = useRef<HTMLDivElement>(null);
    const inputRef          = useRef<HTMLInputElement>(null);

    const selected = options.find(o => o.id === value) ?? null;

    const filtered = query.trim()
        ? options.filter(o =>
            o.label.toLowerCase().includes(query.toLowerCase()) ||
            (o.code ?? '').toLowerCase().includes(query.toLowerCase()))
        : options;

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    function handleOpen() {
        if (disabled) return;
        setOpen(prev => !prev);
        setQuery('');
        setTimeout(() => inputRef.current?.focus(), 50);
    }

    function handleSelect(id: string) {
        onChange(id);
        setOpen(false);
        setQuery('');
    }

    const kindStyle = (kind?: 'Department' | 'Section') => ({
        background: kind === 'Department'
            ? (isDark ? 'rgba(37,99,235,0.25)' : 'rgba(219,234,254,0.90)')
            : (isDark ? 'rgba(5,150,105,0.25)' : 'rgba(209,250,229,0.90)'),
        color: kind === 'Department'
            ? (isDark ? '#93c5fd' : '#1d4ed8')
            : (isDark ? '#6ee7b7' : '#047857'),
    });

    const errorBorder = isDark ? 'rgba(248,113,113,0.70)' : 'rgba(220,38,38,0.60)';

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={handleOpen}
                className="w-full flex items-center gap-2 pl-3 pr-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 border outline-none"
                style={{
                    background:  disabled
                        ? (isDark ? 'rgba(13,26,58,0.40)' : 'rgba(232,242,255,0.50)')
                        : t.inputBg,
                    borderColor: open
                        ? (isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)')
                        : (hasError ? errorBorder : t.inputBorder),
                    color:   disabled ? t.cellMuted : (selected ? t.inputText : t.cellMuted),
                    cursor:  disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1,
                }}
            >
                <span className="flex-1 text-left truncate">
                    {selected
                        ? (showCode && selected.code ? `[${selected.code}] ${selected.label}` : selected.label)
                        : placeholder}
                </span>
                {showKindBadge && selected?.kind && (
                    <span
                        className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md shrink-0"
                        style={kindStyle(selected.kind)}
                    >
                        {selected.kind === 'Department' ? 'Dept' : 'Sec'}
                    </span>
                )}
                <ChevronDown
                    className="w-3.5 h-3.5 shrink-0 transition-transform duration-150"
                    style={{ color: t.subColor, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </button>

            {open && (
                <div
                    className="absolute top-full left-0 mt-1 z-[200] rounded-xl overflow-hidden w-full min-w-[240px]"
                    style={{
                        background: t.dropdownBg,
                        border:     `1px solid ${t.dropdownBorder}`,
                        boxShadow:  t.dropdownShadow,
                    }}
                >
                    <div className="px-3 pt-2.5 pb-1.5" style={{ borderBottom: `1px solid ${t.rowBorder}` }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search…"
                            className="w-full px-2.5 py-1.5 rounded-lg text-[11px] border outline-none"
                            style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText }}
                        />
                    </div>

                    <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {filtered.length === 0 ? (
                            <div className="px-4 py-4 text-[11px] text-center" style={{ color: t.cellMuted }}>
                                No results found.
                            </div>
                        ) : filtered.map((item, idx) => {
                            const isSelected = item.id === value;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    className="w-full text-left px-4 py-2 text-xs transition-all duration-100 flex items-center justify-between gap-3"
                                    style={{
                                        color:      isSelected ? t.dropdownSelectedText : t.dropdownText,
                                        background: isSelected ? t.dropdownSelected     : 'transparent',
                                        fontWeight: isSelected ? 600 : 400,
                                        borderBottom: idx < filtered.length - 1
                                            ? `1px solid ${t.rowBorder}` : 'none',
                                    }}
                                    onClick={() => handleSelect(item.id)}
                                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = t.dropdownHover; }}
                                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                >
                                    <span className="truncate">
                                        {showCode && item.code
                                            ? <><span className="font-mono opacity-60 mr-1">[{item.code}]</span>{item.label}</>
                                            : item.label}
                                    </span>
                                    {showKindBadge && item.kind && (
                                        <span
                                            className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md shrink-0"
                                            style={kindStyle(item.kind)}
                                        >
                                            {item.kind === 'Department' ? 'Dept' : 'Sec'}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Row actions triple-dot menu — portal-rendered to escape overflow:hidden table
// ─────────────────────────────────────────────────────────────────────────────
function ActionsMenu({
    t,
    isDark,
    onView,
    onEdit,
    onDelete,
}: {
    t:        typeof T.dark;
    isDark:   boolean;
    onView:   () => void;
    onEdit:   () => void;
    onDelete: () => void;
}) {
    const [open, setOpen]       = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const btnRef                = useRef<HTMLButtonElement>(null);
    const menuRef               = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                btnRef.current  && !btnRef.current.contains(e.target as Node)
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
            top:  rect.bottom + window.scrollY + 4,
            left: rect.right  + window.scrollX - 136,
        });
        setOpen(prev => !prev);
    }

    const menuItems = [
        { icon: <Pencil className="w-3.5 h-3.5" />, label: 'Edit',   color: t.cellBlue,                     action: () => { setOpen(false); onEdit(); } },
        { icon: <Eye    className="w-3.5 h-3.5" />, label: 'View',   color: t.cellMuted,                    action: () => { setOpen(false); onView(); } },
        { icon: <Trash2 className="w-3.5 h-3.5" />, label: 'Delete', color: isDark ? '#f87171' : '#dc2626', action: () => { setOpen(false); onDelete(); } },
    ];

    const portal = open ? createPortal(
        <div
            ref={menuRef}
            style={{
                position:     'absolute',
                top:          menuPos.top,
                left:         menuPos.left,
                zIndex:       99999,
                background:   t.actionMenuBg,
                border:       `1px solid ${t.actionMenuBorder}`,
                boxShadow:    t.actionMenuShadow,
                minWidth:     '136px',
                borderRadius: '12px',
                overflow:     'hidden',
            }}
        >
            {menuItems.map((item, idx) => (
                <button
                    key={item.label}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-all duration-100"
                    style={{
                        color:        item.color,
                        background:   'transparent',
                        borderBottom: idx < menuItems.length - 1 ? `1px solid ${t.rowBorder}` : 'none',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(99,155,255,0.09)' : 'rgba(37,99,235,0.06)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
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
                    background:  open ? (isDark ? 'rgba(99,155,255,0.18)' : 'rgba(37,99,235,0.12)') : 'transparent',
                    borderColor: open ? (isDark ? 'rgba(99,155,255,0.40)' : 'rgba(37,99,235,0.30)') : 'transparent',
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
// Delete confirmation modal
// ─────────────────────────────────────────────────────────────────────────────
function DeleteConfirmModal({
    entry,
    t,
    isDark,
    onCancel,
    onConfirm,
    deleting,
}: {
    entry:     AdjustmentEntry;
    t:         typeof T.dark;
    isDark:    boolean;
    onCancel:  () => void;
    onConfirm: () => void;
    deleting:  boolean;
}) {
    const redBorder = isDark ? 'rgba(248,113,113,0.45)' : 'rgba(220,38,38,0.35)';
    const redText   = isDark ? '#f87171' : '#dc2626';

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            style={{ background: t.modalOverlay, backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget && !deleting) onCancel(); }}
        >
            <div
                className="relative w-full max-w-sm rounded-2xl overflow-hidden"
                style={{ background: t.modalBg, border: `1px solid ${redBorder}`, boxShadow: t.modalShadow }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-3 px-6 py-4"
                    style={{ borderBottom: `1px solid ${t.cardHeaderBorder}`, background: t.cardHeaderBg }}
                >
                    <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: isDark ? 'rgba(248,113,113,0.15)' : 'rgba(220,38,38,0.10)', border: `1px solid ${redBorder}` }}
                    >
                        <Trash2 className="w-4 h-4" style={{ color: redText }} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold" style={{ color: t.titleColor }}>Delete Entry</h2>
                        <p className="text-[10px]" style={{ color: t.cellMuted }}>This action cannot be undone.</p>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 flex flex-col gap-3">
                    <p className="text-xs leading-relaxed" style={{ color: t.cellText }}>
                        Are you sure you want to delete this adjustment entry?
                    </p>
                    <div
                        className="rounded-xl px-4 py-3 text-xs"
                        style={{ background: isDark ? 'rgba(248,113,113,0.07)' : 'rgba(220,38,38,0.05)', border: `1px solid ${redBorder}` }}
                    >
                        <p className="font-bold truncate" style={{ color: t.cellText }}>{entry.description}</p>
                        {(Number(entry.additional) > 0 || Number(entry.deduction) > 0) && (
                            <p className="text-[10px] mt-1">
                                {Number(entry.additional) > 0 && <span style={{ color: isDark ? '#4ade80' : '#047857' }}>+&#8369;{fmt(Number(entry.additional))}</span>}
                                {Number(entry.additional) > 0 && Number(entry.deduction) > 0 && <span className="mx-1.5" style={{ color: t.cellMuted }}>·</span>}
                                {Number(entry.deduction)  > 0 && <span style={{ color: redText }}>−&#8369;{fmt(Number(entry.deduction))}</span>}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="flex items-center justify-end gap-2.5 px-6 py-4"
                    style={{ borderTop: `1px solid ${t.cardHeaderBorder}`, background: t.cardHeaderBg }}
                >
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={deleting}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase border transition-all duration-150"
                        style={{
                            background:  'transparent',
                            borderColor: t.inputBorder,
                            color:       t.cellMuted,
                            opacity:     deleting ? 0.5 : 1,
                            cursor:      deleting ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={deleting}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-150"
                        style={{
                            background: deleting ? 'rgba(220,38,38,0.50)' : 'rgba(220,38,38,0.85)',
                            border:     `1px solid ${redBorder}`,
                            color:      '#ffffff',
                            cursor:     deleting ? 'not-allowed' : 'pointer',
                            minWidth:   '108px',
                        }}
                        onMouseEnter={e => { if (!deleting) (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,1.00)'; }}
                        onMouseLeave={e => { if (!deleting) (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.85)'; }}
                    >
                        {deleting
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting…</>
                            : <><Trash2  className="w-3.5 h-3.5" /> Delete</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Zod schema for the Add Adjustment form
// ─────────────────────────────────────────────────────────────────────────────
const adjustmentSchema = z.object({
    unitId:      z.string().min(1, 'Department / Section is required'),
    mainAccId:   z.string().min(1, 'Main account is required'),
    subAccId:    z.string().min(1, 'Sub account is required'),
    description: z.string().min(1, 'Description is required').max(500, 'Max 500 characters'),
    additional:  z.string().optional(),
    deduction:   z.string().optional(),
}).superRefine((data, ctx) => {
    const add = parseFloat(data.additional ?? '') || 0;
    const ded = parseFloat(data.deduction  ?? '') || 0;
    if (add <= 0 && ded <= 0) {
        ctx.addIssue({
            code:    z.ZodIssueCode.custom,
            message: 'Enter an additional or deduction amount greater than 0',
            path:    ['additional'],
        });
    }
});

type FormErrors = Partial<Record<keyof z.infer<typeof adjustmentSchema> | 'root', string>>;
// ─────────────────────────────────────────────────────────────────────────────
// Zod schema + types for the Edit Adjustment form
// ─────────────────────────────────────────────────────────────────────────────
const editAdjustmentSchema = z.object({
    description: z.string().min(1, 'Description is required').max(500, 'Max 500 characters'),
    additional:  z.string().optional(),
    deduction:   z.string().optional(),
}).superRefine((data, ctx) => {
    const add = parseFloat(data.additional ?? '') || 0;
    const ded = parseFloat(data.deduction  ?? '') || 0;
    if (add <= 0 && ded <= 0) {
        ctx.addIssue({
            code:    z.ZodIssueCode.custom,
            message: 'Enter an additional or deduction amount greater than 0',
            path:    ['additional'],
        });
    }
});

interface EditForm { description: string; additional: string; deduction: string; }
type EditErrors = Partial<Record<keyof EditForm | 'root', string>>;


// ─────────────────────────────────────────────────────────────────────────────
// Add Adjustment Entry Modal
// ─────────────────────────────────────────────────────────────────────────────
interface ModalForm {
    unitId:      string;
    mainAccId:   string;
    subAccId:    string;
    description: string;
    additional:  string;
    deduction:   string;
}

const EMPTY_FORM: ModalForm = {
    unitId:      '',
    mainAccId:   '',
    subAccId:    '',
    description: '',
    additional:  '',
    deduction:   '',
};

function AddAdjustmentModal({
    onClose,
    onSuccess,
    t,
    isDark,
    units,
    mainAccounts,
    subAccounts,
    proposalSchoolYear,
    currentSchoolYear,
}: {
    onClose:            () => void;
    onSuccess:          (entry: AdjustmentEntry) => void;
    t:                  typeof T.dark;
    isDark:             boolean;
    units:              UnitOption[];
    mainAccounts:       Account[];
    subAccounts:        Account[];
    proposalSchoolYear: string | null;
    currentSchoolYear:  string | null;
}) {
    const [form,                setForm]                = useState<ModalForm>(EMPTY_FORM);
    const [errors,              setErrors]              = useState<FormErrors>({});
    const [submitting,          setSubmitting]          = useState(false);
    const [usePreviousSchoolYear, setUsePreviousSchoolYear] = useState(false);

    // Derived school year shown to the user
    const effectiveSchoolYear = usePreviousSchoolYear
        ? (currentSchoolYear  ?? '—')
        : (proposalSchoolYear ?? '—');

    function patch<K extends keyof ModalForm>(key: K, val: ModalForm[K]) {
        setForm(prev => ({ ...prev, [key]: val }));
        // Clear field error on change
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
    }

    function handleMainAccChange(val: string) {
        setForm(prev => ({ ...prev, mainAccId: val, subAccId: '' }));
        if (errors.mainAccId) setErrors(prev => ({ ...prev, mainAccId: undefined }));
        if (errors.subAccId)  setErrors(prev => ({ ...prev, subAccId:  undefined }));
    }

    const filteredSubAccounts = form.mainAccId
        ? subAccounts.filter(a => a.parent_id === Number(form.mainAccId))
        : [];

    const unitOptions: DropdownOption[] = units.map(u => ({
        id:    u.id,
        label: u.name,
        kind:  u.kind,
    }));

    const mainAccOptions: DropdownOption[] = mainAccounts.map(a => ({
        id:    String(a.id),
        label: a.account_name,
        code:  a.account_code,
    }));

    const subAccOptions: DropdownOption[] = filteredSubAccounts.map(a => ({
        id:    String(a.id),
        label: a.account_name,
        code:  a.account_code,
    }));

    async function handleSubmit() {
        // ── Client-side validation (Zod)
        const result = adjustmentSchema.safeParse(form);
        if (!result.success) {
            const fieldErrors: FormErrors = {};
            for (const issue of result.error.issues) {
                const key = issue.path[0] as keyof FormErrors;
                if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
            }
            setErrors(fieldErrors);
            return;
        }

        setErrors({});
        setSubmitting(true);

        try {
            const selectedUnit = units.find(u => u.id === form.unitId);

            const payload = {
                department_id:   selectedUnit?.kind === 'Department' ? form.unitId : null,
                section_id:      selectedUnit?.kind === 'Section'    ? form.unitId : null,
                main_account_id: form.mainAccId,
                sub_account_id:  form.subAccId,
                description:     form.description.trim(),
                additional:      parseFloat(form.additional) || 0,
                deduction:       parseFloat(form.deduction)  || 0,
                school_year:     usePreviousSchoolYear
                    ? currentSchoolYear
                    : proposalSchoolYear,
            };

            const { data } = await financeSvc.post('/abms/budget-adjustment-entry', payload);

            onSuccess(data.entry as AdjustmentEntry);
            onClose();
        } catch (err: any) {
            const serverErrors = err?.response?.data?.errors as Record<string, string[]> | undefined;
            const serverMsg    = err?.response?.data?.message as string | undefined;

            if (serverErrors) {
                const mapped: FormErrors = {};
                for (const [key, msgs] of Object.entries(serverErrors)) {
                    const formKey = key === 'unit' ? 'unitId' : key as keyof FormErrors;
                    mapped[formKey] = msgs[0];
                }
                setErrors(mapped);
            } else {
                setErrors({ root: serverMsg ?? 'Something went wrong. Please try again.' });
            }
        } finally {
            setSubmitting(false);
        }
    }

    function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget && !submitting) onClose();
    }

    const errStyle = { color: isDark ? '#f87171' : '#dc2626', fontSize: '9px', marginTop: '3px', fontWeight: 600 };
    const errorBorderC = isDark ? 'rgba(248,113,113,0.70)' : 'rgba(220,38,38,0.60)';

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            style={{ background: t.modalOverlay, backdropFilter: 'blur(4px)' }}
            onClick={handleBackdrop}
        >
            <div
                className="relative w-full max-w-lg rounded-2xl overflow-hidden"
                style={{ background: t.modalBg, border: `1px solid ${t.modalBorder}`, boxShadow: t.modalShadow }}
            >
                {/* ── Header */}
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: `1px solid ${t.cardHeaderBorder}`, background: t.cardHeaderBg }}
                >
                    <div>
                        <h2 className="text-sm font-bold" style={{ color: t.titleColor }}>
                            Add Adjustment Entry
                        </h2>
                        <p className="text-[10px] mt-0.5" style={{ color: t.cellMuted }}>
                            Fill in the fields below to create a new budget adjustment.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 border"
                        style={{ borderColor: t.cardHeaderBorder, color: t.cellMuted, background: 'transparent' }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)';
                            (e.currentTarget as HTMLElement).style.color = isDark ? '#f87171' : '#dc2626';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = t.cellMuted;
                        }}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* ── Body */}
                <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>

                    {/* Root / server error banner */}
                    {errors.root && (
                        <div
                            className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-xs"
                            style={{
                                background: isDark ? 'rgba(60,7,7,0.85)' : 'rgba(254,242,242,1)',
                                border:     `1px solid ${errorBorderC}`,
                                color:      isDark ? '#f87171' : '#b91c1c',
                            }}
                        >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                            <span className="font-semibold">{errors.root}</span>
                        </div>
                    )}

                    {/* ── School Year toggle */}
                    <div
                        className="flex items-center justify-between px-3.5 py-3 rounded-xl"
                        style={{
                            background: isDark ? 'rgba(13,26,58,0.60)' : 'rgba(232,242,255,0.70)',
                            border:     `1px solid ${t.divider}`,
                        }}
                    >
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.subColor }}>
                                School Year
                            </p>
                            <p className="text-xs font-bold mt-0.5" style={{ color: t.cellBlue }}>
                                {effectiveSchoolYear}
                            </p>
                            <p className="text-[9px] mt-0.5" style={{ color: t.cellMuted }}>
                                {usePreviousSchoolYear ? 'Using current school year' : 'Using proposal school year (default)'}
                            </p>
                        </div>

                        {/* Checkbox */}
                        <button
                            type="button"
                            onClick={() => setUsePreviousSchoolYear(prev => !prev)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 border"
                            style={{
                                background:  usePreviousSchoolYear
                                    ? (isDark ? 'rgba(37,99,235,0.22)' : 'rgba(219,234,254,0.90)')
                                    : 'transparent',
                                borderColor: usePreviousSchoolYear
                                    ? (isDark ? 'rgba(99,155,255,0.55)' : 'rgba(37,99,235,0.45)')
                                    : t.inputBorder,
                                color: usePreviousSchoolYear
                                    ? (isDark ? '#60a5fa' : '#1d4ed8')
                                    : t.cellMuted,
                            }}
                        >
                            {usePreviousSchoolYear
                                ? <CheckSquare2 className="w-3.5 h-3.5" />
                                : <Square       className="w-3.5 h-3.5" />
                            }
                            <span className="text-[10px] font-bold whitespace-nowrap">
                                Use previous school year
                            </span>
                        </button>
                    </div>

                    {/* Department / Section */}
                    <div>
                        <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: t.subColor }}>
                            Department / Section <span style={{ color: isDark ? '#f87171' : '#dc2626' }}>*</span>
                        </label>
                        <SearchableDropdown
                            options={unitOptions}
                            value={form.unitId}
                            onChange={val => patch('unitId', val)}
                            placeholder="Select department / section…"
                            t={t}
                            isDark={isDark}
                            showKindBadge
                            hasError={!!errors.unitId}
                        />
                        {errors.unitId && <p style={errStyle}>{errors.unitId}</p>}
                    </div>

                    {/* Main Account */}
                    <div>
                        <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: t.subColor }}>
                            Main Account <span style={{ color: isDark ? '#f87171' : '#dc2626' }}>*</span>
                        </label>
                        <SearchableDropdown
                            options={mainAccOptions}
                            value={form.mainAccId}
                            onChange={handleMainAccChange}
                            placeholder="Select main account…"
                            t={t}
                            isDark={isDark}
                            showCode
                            hasError={!!errors.mainAccId}
                        />
                        {errors.mainAccId && <p style={errStyle}>{errors.mainAccId}</p>}
                    </div>

                    {/* Sub Account */}
                    <div>
                        <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: t.subColor }}>
                            Sub Account <span style={{ color: isDark ? '#f87171' : '#dc2626' }}>*</span>
                        </label>
                        <SearchableDropdown
                            options={subAccOptions}
                            value={form.subAccId}
                            onChange={val => patch('subAccId', val)}
                            placeholder={form.mainAccId ? 'Select sub account…' : 'Select a main account first…'}
                            t={t}
                            isDark={isDark}
                            showCode
                            disabled={!form.mainAccId}
                            hasError={!!errors.subAccId}
                        />
                        {errors.subAccId && <p style={errStyle}>{errors.subAccId}</p>}
                        {form.mainAccId && subAccOptions.length === 0 && !errors.subAccId && (
                            <p className="text-[9px] mt-1" style={{ color: isDark ? '#f87171' : '#dc2626' }}>
                                No sub accounts found for the selected main account.
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: t.subColor }}>
                            Description <span style={{ color: isDark ? '#f87171' : '#dc2626' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={e => patch('description', e.target.value)}
                            placeholder="Enter description…"
                            className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all duration-150"
                            style={{
                                background:  t.inputBg,
                                borderColor: errors.description ? errorBorderC : t.inputBorder,
                                color:       t.inputText,
                            }}
                            onFocus={e => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)'; }}
                            onBlur={e  => { (e.target as HTMLElement).style.borderColor = errors.description ? errorBorderC : t.inputBorder; }}
                        />
                        {errors.description && <p style={errStyle}>{errors.description}</p>}
                    </div>

                    {/* Additional + Deduction */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Additional */}
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: t.subColor }}>
                                Additional
                            </label>
                            <div className="relative">
                                <span
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold select-none"
                                    style={{ color: isDark ? '#4ade80' : '#047857' }}
                                >
                                    ₱
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.additional}
                                    onChange={e => patch('additional', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-7 pr-3 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all duration-150 text-right"
                                    style={{
                                        background:         t.inputBg,
                                        borderColor:        errors.additional ? errorBorderC : t.inputBorder,
                                        color:              isDark ? '#4ade80' : '#047857',
                                        fontFamily:         "'JetBrains Mono', monospace",
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                    onFocus={e => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(74,222,128,0.50)' : 'rgba(4,120,87,0.45)'; }}
                                    onBlur={e  => { (e.target as HTMLElement).style.borderColor = errors.additional ? errorBorderC : t.inputBorder; }}
                                />
                            </div>
                            {errors.additional
                                ? <p style={errStyle}>{errors.additional}</p>
                                : <p className="text-[9px] mt-1 font-semibold" style={{ color: isDark ? '#4ade80' : '#047857' }}>
                                    Amount in Philippine Peso (₱)
                                  </p>
                            }
                        </div>

                        {/* Deduction */}
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: t.subColor }}>
                                Deduction
                            </label>
                            <div className="relative">
                                <span
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold select-none"
                                    style={{ color: isDark ? '#f87171' : '#dc2626' }}
                                >
                                    ₱
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.deduction}
                                    onChange={e => patch('deduction', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-7 pr-3 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all duration-150 text-right"
                                    style={{
                                        background:         t.inputBg,
                                        borderColor:        t.inputBorder,
                                        color:              isDark ? '#f87171' : '#dc2626',
                                        fontFamily:         "'JetBrains Mono', monospace",
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                    onFocus={e => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(248,113,113,0.50)' : 'rgba(220,38,38,0.40)'; }}
                                    onBlur={e  => { (e.target as HTMLElement).style.borderColor = t.inputBorder; }}
                                />
                            </div>
                            <p className="text-[9px] mt-1 font-semibold" style={{ color: isDark ? '#f87171' : '#dc2626' }}>
                                Amount in Philippine Peso (₱)
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Footer */}
                <div
                    className="flex items-center justify-end gap-2.5 px-6 py-4"
                    style={{ borderTop: `1px solid ${t.cardHeaderBorder}`, background: t.cardHeaderBg }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase border transition-all duration-150"
                        style={{
                            background:  'transparent',
                            borderColor: t.inputBorder,
                            color:       t.cellMuted,
                            opacity:     submitting ? 0.5 : 1,
                            cursor:      submitting ? 'not-allowed' : 'pointer',
                        }}
                        onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.55)' : 'rgba(37,99,235,0.50)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = t.inputBorder; }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-150"
                        style={{
                            background: submitting ? 'rgba(37,99,235,0.55)' : 'rgba(37,99,235,0.85)',
                            border:     '1px solid rgba(99,155,255,0.70)',
                            color:      '#ffffff',
                            cursor:     submitting ? 'not-allowed' : 'pointer',
                            minWidth:   '108px',
                        }}
                        onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,1.00)'; }}
                        onMouseLeave={e => { if (!submitting) (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.85)'; }}
                    >
                        {submitting
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                            : <><Plus    className="w-3.5 h-3.5" /> Add Entry</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// View Adjustment Entry Modal — read-only, shows all fields including school year
// ─────────────────────────────────────────────────────────────────────────────
function ViewAdjustmentModal({
    entry,
    onClose,
    t,
    isDark,
}: {
    entry:   AdjustmentEntry;
    onClose: () => void;
    t:       typeof T.dark;
    isDark:  boolean;
}) {
    const unitName = entry.department?.dep_name ?? entry.section?.sec_name ?? '—';
    const unitKind: 'Department' | 'Section' | null = entry.department
        ? 'Department'
        : entry.section ? 'Section' : null;

    const hasAdditional = Number(entry.additional) > 0;
    const hasDeduction  = Number(entry.deduction)  > 0;

    const divider = <div style={{ height: '1px', background: t.divider }} />;

    function Row({ label, children }: { label: string; children: React.ReactNode }) {
        return (
            <div className="flex items-start gap-3">
                <span
                    className="text-[9px] font-bold uppercase tracking-widest shrink-0 pt-0.5"
                    style={{ color: t.cellMuted, width: '96px' }}
                >
                    {label}
                </span>
                <div className="flex-1 min-w-0">{children}</div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            style={{ background: t.modalOverlay, backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="relative w-full max-w-md rounded-2xl overflow-hidden"
                style={{ background: t.modalBg, border: `1px solid ${t.modalBorder}`, boxShadow: t.modalShadow }}
            >
                {/* ── Header */}
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: `1px solid ${t.cardHeaderBorder}`, background: t.cardHeaderBg }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                                background: isDark ? 'rgba(96,165,250,0.15)' : 'rgba(37,99,235,0.10)',
                                border:     `1px solid ${isDark ? 'rgba(99,155,255,0.35)' : 'rgba(37,99,235,0.25)'}`,
                            }}
                        >
                            <Eye className="w-4 h-4" style={{ color: isDark ? '#60a5fa' : '#1d4ed8' }} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold" style={{ color: t.titleColor }}>
                                View Adjustment Entry
                            </h2>
                            <p className="text-[10px] mt-0.5" style={{ color: t.cellMuted }}>
                                Read-only details for this entry.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 border"
                        style={{ borderColor: t.cardHeaderBorder, color: t.cellMuted, background: 'transparent' }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)';
                            (e.currentTarget as HTMLElement).style.color = isDark ? '#f87171' : '#dc2626';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = t.cellMuted;
                        }}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* ── Body */}
                <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>

                    {/* ── School Year badge */}
                    <div
                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{
                            background: isDark ? 'rgba(37,99,235,0.12)' : 'rgba(219,234,254,0.70)',
                            border:     `1px solid ${isDark ? 'rgba(99,155,255,0.28)' : 'rgba(37,99,235,0.22)'}`,
                        }}
                    >
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.subColor }}>
                                School Year
                            </p>
                            <p className="text-sm font-bold mt-0.5" style={{ color: isDark ? '#60a5fa' : '#1d4ed8' }}>
                                {entry.school_year ?? '—'}
                            </p>
                        </div>
                        <div
                            className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg"
                            style={{
                                background: isDark ? 'rgba(37,99,235,0.25)' : 'rgba(219,234,254,0.90)',
                                border:     `1px solid ${isDark ? 'rgba(99,155,255,0.40)' : 'rgba(37,99,235,0.30)'}`,
                                color:      isDark ? '#93c5fd' : '#1d4ed8',
                            }}
                        >
                            S.Y.
                        </div>
                    </div>

                    {/* ── Info rows */}
                    <div
                        className="rounded-xl px-4 py-4 flex flex-col gap-3"
                        style={{
                            background: isDark ? 'rgba(13,26,58,0.60)' : 'rgba(232,242,255,0.70)',
                            border:     `1px solid ${t.divider}`,
                        }}
                    >
                        {/* Date */}
                        <Row label="Date">
                            <span
                                className="text-xs font-mono"
                                style={{ color: t.cellMuted, fontVariantNumeric: 'tabular-nums' }}
                            >
                                {entry.created_at?.slice(0, 10) ?? '—'}
                            </span>
                        </Row>

                        {divider}

                        {/* Unit */}
                        <Row label="Department / Section">
                            <div className="flex items-center gap-2">
                                {unitKind && (
                                    <span
                                        className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md shrink-0"
                                        style={{
                                            background: unitKind === 'Department'
                                                ? (isDark ? 'rgba(37,99,235,0.25)' : 'rgba(219,234,254,0.90)')
                                                : (isDark ? 'rgba(5,150,105,0.25)' : 'rgba(209,250,229,0.90)'),
                                            color: unitKind === 'Department'
                                                ? (isDark ? '#93c5fd' : '#1d4ed8')
                                                : (isDark ? '#6ee7b7' : '#047857'),
                                        }}
                                    >
                                        {unitKind === 'Department' ? 'Dept' : 'Sec'}
                                    </span>
                                )}
                                <span className="text-xs font-semibold" style={{ color: t.cellText }}>
                                    {unitName}
                                </span>
                            </div>
                        </Row>

                        {divider}

                        {/* Main Account */}
                        <Row label="Main Account">
                            <div className="flex flex-col gap-0.5">
                                {entry.main_account?.account_code && (
                                    <span className="text-[9px] font-mono font-bold" style={{ color: t.cellMuted }}>
                                        [{entry.main_account.account_code}]
                                    </span>
                                )}
                                <span className="text-xs font-semibold" style={{ color: t.cellText }}>
                                    {entry.main_account?.account_name ?? '—'}
                                </span>
                            </div>
                        </Row>

                        {divider}

                        {/* Sub Account */}
                        <Row label="Sub Account">
                            <div className="flex flex-col gap-0.5">
                                {entry.sub_account?.account_code && (
                                    <span className="text-[9px] font-mono font-bold" style={{ color: t.cellMuted }}>
                                        [{entry.sub_account.account_code}]
                                    </span>
                                )}
                                <span className="text-xs font-semibold" style={{ color: t.cellText }}>
                                    {entry.sub_account?.account_name ?? '—'}
                                </span>
                            </div>
                        </Row>

                        {divider}

                        {/* Description */}
                        <Row label="Description">
                            <span className="text-xs font-semibold leading-relaxed" style={{ color: t.cellText }}>
                                {entry.description || '—'}
                            </span>
                        </Row>
                    </div>

                    {/* ── Amount cards */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Additional */}
                        <div
                            className="rounded-xl px-4 py-3.5 flex flex-col gap-1"
                            style={{
                                background: isDark ? 'rgba(4,47,30,0.55)' : 'rgba(240,253,244,0.90)',
                                border:     `1px solid ${isDark ? 'rgba(74,222,128,0.22)' : 'rgba(22,163,74,0.22)'}`,
                            }}
                        >
                            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: isDark ? '#4ade80' : '#047857' }}>
                                Additional
                            </p>
                            <p
                                className="text-base font-bold"
                                style={{
                                    color:              hasAdditional ? (isDark ? '#4ade80' : '#047857') : t.cellMuted,
                                    fontFamily:         "'JetBrains Mono', monospace",
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                {hasAdditional ? `₱ ${fmt(Number(entry.additional))}` : '—'}
                            </p>
                        </div>

                        {/* Deduction */}
                        <div
                            className="rounded-xl px-4 py-3.5 flex flex-col gap-1"
                            style={{
                                background: isDark ? 'rgba(60,7,7,0.55)' : 'rgba(254,242,242,0.90)',
                                border:     `1px solid ${isDark ? 'rgba(248,113,113,0.22)' : 'rgba(220,38,38,0.22)'}`,
                            }}
                        >
                            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: isDark ? '#f87171' : '#dc2626' }}>
                                Deduction
                            </p>
                            <p
                                className="text-base font-bold"
                                style={{
                                    color:              hasDeduction ? (isDark ? '#f87171' : '#dc2626') : t.cellMuted,
                                    fontFamily:         "'JetBrains Mono', monospace",
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                {hasDeduction ? `₱ ${fmt(Number(entry.deduction))}` : '—'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Footer */}
                <div
                    className="flex items-center justify-end px-6 py-4"
                    style={{ borderTop: `1px solid ${t.cardHeaderBorder}`, background: t.cardHeaderBg }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold tracking-wide uppercase border transition-all duration-150"
                        style={{
                            background:  'transparent',
                            borderColor: t.inputBorder,
                            color:       t.cellMuted,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.55)' : 'rgba(37,99,235,0.50)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = t.inputBorder; }}
                    >
                        <X className="w-3.5 h-3.5" /> Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Adjustment Entry Modal — only description, additional, deduction
// ─────────────────────────────────────────────────────────────────────────────
function EditAdjustmentModal({
    entry,
    onClose,
    onSuccess,
    t,
    isDark,
}: {
    entry:     AdjustmentEntry;
    onClose:   () => void;
    onSuccess: (updated: AdjustmentEntry) => void;
    t:         typeof T.dark;
    isDark:    boolean;
}) {
    const [form, setForm]         = useState<EditForm>({
        description: entry.description ?? '',
        additional:  Number(entry.additional) > 0 ? String(Number(entry.additional)) : '',
        deduction:   Number(entry.deduction)  > 0 ? String(Number(entry.deduction))  : '',
    });
    const [errors,     setErrors]     = useState<EditErrors>({});
    const [submitting, setSubmitting] = useState(false);

    const errorBorderC = isDark ? 'rgba(248,113,113,0.70)' : 'rgba(220,38,38,0.60)';
    const errStyle     = { color: isDark ? '#f87171' : '#dc2626', fontSize: '9px', marginTop: '3px', fontWeight: 600 };

    function patch<K extends keyof EditForm>(key: K, val: string) {
        setForm(prev => ({ ...prev, [key]: val }));
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
    }

    async function handleSubmit() {
        const result = editAdjustmentSchema.safeParse(form);
        if (!result.success) {
            const fieldErrors: EditErrors = {};
            for (const issue of result.error.issues) {
                const key = issue.path[0] as keyof EditErrors;
                if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
            }
            setErrors(fieldErrors);
            return;
        }

        setErrors({});
        setSubmitting(true);

        try {
            const payload = {
                description: form.description.trim(),
                additional:  parseFloat(form.additional) || 0,
                deduction:   parseFloat(form.deduction)  || 0,
            };

            const { data } = await financeSvc.put(
                `/abms/budget-adjustment-entry/${entry.id}`,
                payload,
            );

            onSuccess(data.entry as AdjustmentEntry);
            onClose();
        } catch (err: any) {
            const serverErrors = err?.response?.data?.errors as Record<string, string[]> | undefined;
            const serverMsg    = err?.response?.data?.message as string | undefined;

            if (serverErrors) {
                const mapped: EditErrors = {};
                for (const [key, msgs] of Object.entries(serverErrors)) {
                    mapped[key as keyof EditErrors] = msgs[0];
                }
                setErrors(mapped);
            } else {
                setErrors({ root: serverMsg ?? 'Something went wrong. Please try again.' });
            }
        } finally {
            setSubmitting(false);
        }
    }

    // ── Read-only info about the entry (unit + accounts)
    const unitName = entry.department?.dep_name ?? entry.section?.sec_name ?? '—';
    const unitKind: 'Department' | 'Section' | null = entry.department
        ? 'Department'
        : entry.section ? 'Section' : null;

    const mainAccName = entry.main_account?.account_name ?? '—';
    const subAccName  = entry.sub_account?.account_name  ?? '—';

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            style={{ background: t.modalOverlay, backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget && !submitting) onClose(); }}
        >
            <div
                className="relative w-full max-w-lg rounded-2xl overflow-hidden"
                style={{ background: t.modalBg, border: `1px solid ${t.modalBorder}`, boxShadow: t.modalShadow }}
            >
                {/* ── Header */}
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: `1px solid ${t.cardHeaderBorder}`, background: t.cardHeaderBg }}
                >
                    <div>
                        <h2 className="text-sm font-bold" style={{ color: t.titleColor }}>
                            Edit Adjustment Entry
                        </h2>
                        <p className="text-[10px] mt-0.5" style={{ color: t.cellMuted }}>
                            Update description and amount fields.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 border"
                        style={{ borderColor: t.cardHeaderBorder, color: t.cellMuted, background: 'transparent' }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)';
                            (e.currentTarget as HTMLElement).style.color = isDark ? '#f87171' : '#dc2626';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = t.cellMuted;
                        }}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* ── Body */}
                <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>

                    {/* Root error banner */}
                    {errors.root && (
                        <div
                            className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-xs"
                            style={{
                                background: isDark ? 'rgba(60,7,7,0.85)' : 'rgba(254,242,242,1)',
                                border:     `1px solid ${errorBorderC}`,
                                color:      isDark ? '#f87171' : '#b91c1c',
                            }}
                        >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                            <span className="font-semibold">{errors.root}</span>
                        </div>
                    )}

                    {/* ── Read-only info block */}
                    <div
                        className="rounded-xl px-4 py-3.5 flex flex-col gap-2.5"
                        style={{
                            background: isDark ? 'rgba(13,26,58,0.60)' : 'rgba(232,242,255,0.70)',
                            border:     `1px solid ${t.divider}`,
                        }}
                    >
                        <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.subColor }}>
                            Read-only fields
                        </p>

                        {/* Unit */}
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest w-24 shrink-0" style={{ color: t.cellMuted }}>
                                Department / Section
                            </span>
                            <div className="flex items-center gap-2">
                                {unitKind && (
                                    <span
                                        className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md shrink-0"
                                        style={{
                                            background: unitKind === 'Department'
                                                ? (isDark ? 'rgba(37,99,235,0.25)' : 'rgba(219,234,254,0.90)')
                                                : (isDark ? 'rgba(5,150,105,0.25)' : 'rgba(209,250,229,0.90)'),
                                            color: unitKind === 'Department'
                                                ? (isDark ? '#93c5fd' : '#1d4ed8')
                                                : (isDark ? '#6ee7b7' : '#047857'),
                                        }}
                                    >
                                        {unitKind === 'Department' ? 'Dept' : 'Sec'}
                                    </span>
                                )}
                                <span className="text-xs font-semibold" style={{ color: t.cellText }}>{unitName}</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1px', background: t.divider }} />

                        {/* Main Account */}
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest w-24 shrink-0" style={{ color: t.cellMuted }}>
                                Main Acct
                            </span>
                            <span className="text-xs font-semibold" style={{ color: t.cellText }}>{mainAccName}</span>
                        </div>

                        {/* Sub Account */}
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest w-24 shrink-0" style={{ color: t.cellMuted }}>
                                Sub Acct
                            </span>
                            <span className="text-xs font-semibold" style={{ color: t.cellText }}>{subAccName}</span>
                        </div>
                    </div>

                    {/* ── Description */}
                    <div>
                        <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: t.subColor }}>
                            Description <span style={{ color: isDark ? '#f87171' : '#dc2626' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={e => patch('description', e.target.value)}
                            placeholder="Enter description…"
                            className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all duration-150"
                            style={{
                                background:  t.inputBg,
                                borderColor: errors.description ? errorBorderC : t.inputBorder,
                                color:       t.inputText,
                            }}
                            onFocus={e => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)'; }}
                            onBlur={e  => { (e.target as HTMLElement).style.borderColor = errors.description ? errorBorderC : t.inputBorder; }}
                        />
                        {errors.description && <p style={errStyle}>{errors.description}</p>}
                    </div>

                    {/* ── Additional + Deduction */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Additional */}
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: t.subColor }}>
                                Additional
                            </label>
                            <div className="relative">
                                <span
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold select-none"
                                    style={{ color: isDark ? '#4ade80' : '#047857' }}
                                >
                                    &#8369;
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.additional}
                                    onChange={e => patch('additional', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-7 pr-3 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all duration-150 text-right"
                                    style={{
                                        background:         t.inputBg,
                                        borderColor:        errors.additional ? errorBorderC : t.inputBorder,
                                        color:              isDark ? '#4ade80' : '#047857',
                                        fontFamily:         "'JetBrains Mono', monospace",
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                    onFocus={e => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(74,222,128,0.50)' : 'rgba(4,120,87,0.45)'; }}
                                    onBlur={e  => { (e.target as HTMLElement).style.borderColor = errors.additional ? errorBorderC : t.inputBorder; }}
                                />
                            </div>
                            {errors.additional
                                ? <p style={errStyle}>{errors.additional}</p>
                                : <p className="text-[9px] mt-1 font-semibold" style={{ color: isDark ? '#4ade80' : '#047857' }}>Amount in Philippine Peso (&#8369;)</p>
                            }
                        </div>

                        {/* Deduction */}
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: t.subColor }}>
                                Deduction
                            </label>
                            <div className="relative">
                                <span
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold select-none"
                                    style={{ color: isDark ? '#f87171' : '#dc2626' }}
                                >
                                    &#8369;
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.deduction}
                                    onChange={e => patch('deduction', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-7 pr-3 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all duration-150 text-right"
                                    style={{
                                        background:         t.inputBg,
                                        borderColor:        errors.deduction ? errorBorderC : t.inputBorder,
                                        color:              isDark ? '#f87171' : '#dc2626',
                                        fontFamily:         "'JetBrains Mono', monospace",
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                    onFocus={e => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(248,113,113,0.50)' : 'rgba(220,38,38,0.40)'; }}
                                    onBlur={e  => { (e.target as HTMLElement).style.borderColor = errors.deduction ? errorBorderC : t.inputBorder; }}
                                />
                            </div>
                            <p className="text-[9px] mt-1 font-semibold" style={{ color: isDark ? '#f87171' : '#dc2626' }}>
                                Amount in Philippine Peso (&#8369;)
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Footer */}
                <div
                    className="flex items-center justify-end gap-2.5 px-6 py-4"
                    style={{ borderTop: `1px solid ${t.cardHeaderBorder}`, background: t.cardHeaderBg }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase border transition-all duration-150"
                        style={{
                            background:  'transparent',
                            borderColor: t.inputBorder,
                            color:       t.cellMuted,
                            opacity:     submitting ? 0.5 : 1,
                            cursor:      submitting ? 'not-allowed' : 'pointer',
                        }}
                        onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.55)' : 'rgba(37,99,235,0.50)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = t.inputBorder; }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-150"
                        style={{
                            background: submitting ? 'rgba(37,99,235,0.55)' : 'rgba(37,99,235,0.85)',
                            border:     '1px solid rgba(99,155,255,0.70)',
                            color:      '#ffffff',
                            cursor:     submitting ? 'not-allowed' : 'pointer',
                            minWidth:   '108px',
                        }}
                        onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,1.00)'; }}
                        onMouseLeave={e => { if (!submitting) (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.85)'; }}
                    >
                        {submitting
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                            : <><Pencil  className="w-3.5 h-3.5" /> Save Changes</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner page
// ─────────────────────────────────────────────────────────────────────────────
function BudgetAdjustmentEntryInner({ t, isDark }: { t: typeof T.dark; isDark: boolean }) {
    const {
        departments,
        sections,
        main_accounts,
        sub_accounts,
        adjustment_entries: initialEntries,
        proposal_school_year,
        current_school_year,
    } = budgetadjustmententryRoute.useLoaderData();

    // ── Toast state ──────────────────────────────────────────────────────────
    const [toasts,    setToasts]    = useState<ToastItem[]>([]);
    const toastCounter              = useRef(0);

    function addToast(kind: ToastKind, title: string, message?: string) {
        const id = ++toastCounter.current;
        setToasts(prev => [...prev, { id, kind, title, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
    }

    function dismissToast(id: number) {
        setToasts(prev => prev.filter(t => t.id !== id));
    }

    // ── Page state ───────────────────────────────────────────────────────────
    const [modalOpen,       setModalOpen]       = useState(false);
    const [searchRaw,       setSearchRaw]       = useState('');
    const [searching,       setSearching]       = useState(false);
    const [entries,         setEntries]         = useState<CursorPage<AdjustmentEntry> | null>(
        initialEntries ?? null
    );
    const [deleteTarget,    setDeleteTarget]    = useState<AdjustmentEntry | null>(null);
    const [deleting,        setDeleting]        = useState(false);
    const [editTarget,      setEditTarget]      = useState<AdjustmentEntry | null>(null);
    const [viewTarget,      setViewTarget]      = useState<AdjustmentEntry | null>(null);

    // ── Merge departments + sections into a single unit list ─────────────────
    const units: UnitOption[] = [
        ...(departments ?? []).map((d: any) => ({ id: String(d.id), name: d.name, kind: 'Department' as const })),
        ...(sections    ?? []).map((s: any) => ({ id: String(s.id), name: s.name, kind: 'Section'    as const })),
    ].sort((a, b) => a.name.localeCompare(b.name));

    const mainAccounts: Account[] = main_accounts ?? [];
    const subAccounts:  Account[] = sub_accounts  ?? [];

    // ── Server-side search with 400ms debounce ───────────────────────────────
    const fetchEntries = useCallback(async (search: string) => {
        setSearching(true);
        try {
            const { data } = await financeSvc.get('/abms/budget-adjustment-entry', {
                params: { ...(search.trim() ? { search: search.trim() } : {}) },
            });
            setEntries(data.adjustment_entries ?? null);
        } catch {
            // silently keep previous data on error
        } finally {
            setSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchEntries(searchRaw), 400);
        return () => clearTimeout(timer);
    }, [searchRaw, fetchEntries]);

    // ── On successful create: prepend to list + show toast ───────────────────
    function handleEntryCreated(newEntry: AdjustmentEntry) {
        setEntries(prev => {
            if (!prev) return prev;
            return { ...prev, data: [newEntry, ...prev.data] };
        });
        addToast(
            'success',
            'Adjustment entry saved',
            `"${newEntry.description}" was created successfully.`,
        );
    }

    // ── On successful edit: replace entry in list + show toast ───────────────
    function handleEntryUpdated(updated: AdjustmentEntry) {
        setEntries(prev => {
            if (!prev) return prev;
            return { ...prev, data: prev.data.map(e => e.id === updated.id ? updated : e) };
        });
        addToast(
            'success',
            'Entry updated',
            `"${updated.description}" was saved successfully.`,
        );
    }

    // ── On delete confirm ────────────────────────────────────────────────────
    async function handleDeleteConfirm() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await financeSvc.delete(`/abms/budget-adjustment-entry/${deleteTarget.id}`);
            setEntries(prev => {
                if (!prev) return prev;
                return { ...prev, data: prev.data.filter(e => e.id !== deleteTarget.id) };
            });
            addToast(
                'success',
                'Entry deleted',
                `"${deleteTarget.description}" was removed successfully.`,
            );
            setDeleteTarget(null);
        } catch (err: any) {
            const msg = err?.response?.data?.message as string | undefined;
            addToast(
                'error',
                'Deletion failed',
                msg ?? 'Something went wrong. Please try again.',
            );
        } finally {
            setDeleting(false);
        }
    }

    // ── Derived ──────────────────────────────────────────────────────────────
    const rows           = entries?.data ?? [];
    const totalCount     = rows.length;
    const totalAdditional = rows.reduce((s, r) => s + Number(r.additional ?? 0), 0);
    const totalDeduction  = rows.reduce((s, r) => s + Number(r.deduction  ?? 0), 0);

    const columns = [
        { label: 'Date',                width: '110px' },
        { label: 'Department / Section', width: 'auto'  },
        { label: 'Description',          width: 'auto'  },
        { label: 'Additional',           width: '150px' },
        { label: 'Deduction',            width: '150px' },
        { label: 'Actions',              width: '72px'  },
    ];

    function resolveUnit(row: AdjustmentEntry): { name: string; kind: 'Department' | 'Section' } | null {
        if (row.department) return { name: row.department.dep_name, kind: 'Department' };
        if (row.section)    return { name: row.section.sec_name,    kind: 'Section'    };
        return null;
    }

    return (
        <>
            {/* ── Toast container (bottom-right) */}
            <ToastContainer toasts={toasts} isDark={isDark} onDismiss={dismissToast} />

            {/* ── Add modal */}
            {modalOpen && (
                <AddAdjustmentModal
                    onClose={()               => setModalOpen(false)}
                    onSuccess={handleEntryCreated}
                    t={t}
                    isDark={isDark}
                    units={units}
                    mainAccounts={mainAccounts}
                    subAccounts={subAccounts}
                    proposalSchoolYear={proposal_school_year ?? null}
                    currentSchoolYear={current_school_year   ?? null}
                />
            )}

            {/* ── View modal */}
            {viewTarget && (
                <ViewAdjustmentModal
                    entry={viewTarget}
                    onClose={() => setViewTarget(null)}
                    t={t}
                    isDark={isDark}
                />
            )}

            {/* ── Edit modal */}
            {editTarget && (
                <EditAdjustmentModal
                    entry={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSuccess={entry => { handleEntryUpdated(entry); setEditTarget(null); }}
                    t={t}
                    isDark={isDark}
                />
            )}

            {/* ── Delete confirmation modal */}
            {deleteTarget && (
                <DeleteConfirmModal
                    entry={deleteTarget}
                    t={t}
                    isDark={isDark}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={handleDeleteConfirm}
                    deleting={deleting}
                />
            )}

            <div className="p-6">
                {/* ── Page title */}
                <div className="mb-5">
                    <h1 className="text-lg font-bold tracking-tight" style={{ color: t.titleColor }}>
                        Budget Adjustment Entry
                    </h1>
                    <p className="text-[11px] mt-0.5" style={{ color: t.cellMuted }}>
                        Manage additional and deduction adjustments per department or section.
                    </p>
                </div>

                {/* ── Card */}
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}
                >
                    {/* ── Card header */}
                    <div
                        className="flex flex-wrap items-center gap-3 px-5 py-3.5"
                        style={{ background: t.cardHeaderBg, borderBottom: `1px solid ${t.cardHeaderBorder}` }}
                    >
                        {/* Entry count pill */}
                        <span
                            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md shrink-0"
                            style={{ background: t.pillBg, color: t.pillText, border: `1px solid ${t.pillBorder}` }}
                        >
                            {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
                        </span>

                        {/* ── Search box */}
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <Search
                                className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ color: t.cellMuted }}
                            />
                            {searching && (
                                <Loader2
                                    className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 animate-spin pointer-events-none"
                                    style={{ color: t.cellMuted }}
                                />
                            )}
                            <input
                                type="text"
                                value={searchRaw}
                                onChange={e => setSearchRaw(e.target.value)}
                                placeholder="Search by department or description…"
                                className="w-full pl-8 pr-8 py-2 rounded-xl text-[11px] font-semibold border outline-none transition-all duration-150"
                                style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText }}
                                onFocus={e  => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)'; }}
                                onBlur={e   => { (e.target as HTMLElement).style.borderColor = t.inputBorder; }}
                            />
                        </div>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Add button */}
                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold tracking-wide uppercase transition-all duration-150 shrink-0"
                            style={{
                                background: 'rgba(37,99,235,0.85)',
                                border:     '1px solid rgba(99,155,255,0.70)',
                                color:      '#ffffff',
                                whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,1.00)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.85)'; }}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Adjustment Entry
                        </button>
                    </div>

                    {/* ── Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr style={{ background: t.tableHeadBg }}>
                                    {columns.map(({ label, width }) => (
                                        <th
                                            key={label}
                                            className="px-4 py-2.5 text-left font-bold uppercase tracking-widest whitespace-nowrap"
                                            style={{
                                                fontSize:    '9px',
                                                color:       t.tableHeadText,
                                                borderBottom:`2px solid ${t.tableHeadBorder}`,
                                                borderRight: `1px solid ${t.tableHeadBorder}`,
                                                width,
                                                textAlign:   label === 'Additional' || label === 'Deduction' ? 'right' : 'left',
                                            }}
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {searching && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length} className="px-4 py-14 text-center text-xs" style={{ color: t.cellMuted }}>
                                            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                            Searching…
                                        </td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length} className="px-4 py-14 text-center text-xs" style={{ color: t.cellMuted }}>
                                            {searchRaw.trim()
                                                ? <>No entries match <strong style={{ color: t.cellBlue }}>"{searchRaw}"</strong>.</>
                                                : <>No adjustment entries yet. Click <strong style={{ color: t.cellBlue }}>Add Adjustment Entry</strong> to get started.</>
                                            }
                                        </td>
                                    </tr>
                                ) : rows.map((row, i) => {
                                    const unit = resolveUnit(row);
                                    return (
                                        <tr
                                            key={row.id}
                                            style={{
                                                background:   i % 2 === 0 ? t.rowEvenBg : t.rowOddBg,
                                                borderBottom: `1px solid ${t.rowBorder}`,
                                            }}
                                        >
                                            {/* Date */}
                                            <td
                                                className="px-4 py-2.5 font-mono text-[11px]"
                                                style={{ color: t.cellMuted, borderRight: `1px solid ${t.rowBorder}`, fontVariantNumeric: 'tabular-nums' }}
                                            >
                                                {row.created_at?.slice(0, 10) ?? '—'}
                                            </td>

                                            {/* Department / Section */}
                                            <td className="px-4 py-2.5" style={{ borderRight: `1px solid ${t.rowBorder}` }}>
                                                {unit ? (
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md shrink-0"
                                                            style={{
                                                                background: unit.kind === 'Department'
                                                                    ? (isDark ? 'rgba(37,99,235,0.25)' : 'rgba(219,234,254,0.90)')
                                                                    : (isDark ? 'rgba(5,150,105,0.25)' : 'rgba(209,250,229,0.90)'),
                                                                color: unit.kind === 'Department'
                                                                    ? (isDark ? '#93c5fd' : '#1d4ed8')
                                                                    : (isDark ? '#6ee7b7' : '#047857'),
                                                            }}
                                                        >
                                                            {unit.kind === 'Department' ? 'Dept' : 'Sec'}
                                                        </span>
                                                        <span className="font-semibold truncate" style={{ color: t.cellText }}>
                                                            {unit.name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: t.cellMuted }}>—</span>
                                                )}
                                            </td>

                                            {/* Description */}
                                            <td
                                                className="px-4 py-2.5 font-semibold"
                                                style={{ color: t.cellText, borderRight: `1px solid ${t.rowBorder}` }}
                                            >
                                                {row.description || '—'}
                                            </td>

                                            {/* Additional */}
                                            <td
                                                className="px-4 py-2.5 text-right font-bold"
                                                style={{
                                                    color:              Number(row.additional) > 0 ? t.cellGreen : t.cellMuted,
                                                    fontFamily:         "'JetBrains Mono', monospace",
                                                    fontVariantNumeric: 'tabular-nums',
                                                    borderRight:        `1px solid ${t.rowBorder}`,
                                                }}
                                            >
                                                {Number(row.additional) > 0 ? `₱ ${fmt(Number(row.additional))}` : '—'}
                                            </td>

                                            {/* Deduction */}
                                            <td
                                                className="px-4 py-2.5 text-right font-bold"
                                                style={{
                                                    color:              Number(row.deduction) > 0 ? t.cellRed : t.cellMuted,
                                                    fontFamily:         "'JetBrains Mono', monospace",
                                                    fontVariantNumeric: 'tabular-nums',
                                                    borderRight:        `1px solid ${t.rowBorder}`,
                                                }}
                                            >
                                                {Number(row.deduction) > 0 ? `₱ ${fmt(Number(row.deduction))}` : '—'}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-3 py-2" style={{ width: '72px' }}>
                                                <ActionsMenu
                                                    t={t}
                                                    isDark={isDark}
                                                    onView={() => setViewTarget(row)}
                                                    onEdit={() => setEditTarget(row)}
                                                    onDelete={() => setDeleteTarget(row)}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Footer totals */}
                    {rows.length > 0 && (
                        <div
                            className="px-5 py-3 flex flex-wrap items-center gap-4"
                            style={{
                                background: isDark ? 'rgba(7,14,32,0.98)' : 'rgba(240,246,255,0.99)',
                                borderTop:  `2px solid ${t.cardHeaderBorder}`,
                            }}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.cellMuted }}>
                                {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
                            </span>

                            <div className="flex flex-wrap items-center gap-4 ml-auto">
                                {/* Total Additional */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: t.cellMuted }}>
                                        Total Additional
                                    </span>
                                    <div
                                        className="px-4 py-1.5 rounded-lg text-xs font-bold text-right"
                                        style={{
                                            background:         isDark ? 'rgba(13,26,58,0.85)' : 'rgba(232,242,255,0.95)',
                                            border:             `1px solid ${isDark ? 'rgba(74,222,128,0.25)' : 'rgba(4,120,87,0.20)'}`,
                                            color:              t.cellGreen,
                                            fontFamily:         "'JetBrains Mono', monospace",
                                            fontVariantNumeric: 'tabular-nums',
                                            minWidth:           '140px',
                                        }}
                                    >
                                        ₱ {fmt(totalAdditional)}
                                    </div>
                                </div>

                                {/* Total Deduction */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: t.cellMuted }}>
                                        Total Deduction
                                    </span>
                                    <div
                                        className="px-4 py-1.5 rounded-lg text-xs font-bold text-right"
                                        style={{
                                            background:         isDark ? 'rgba(13,26,58,0.85)' : 'rgba(232,242,255,0.95)',
                                            border:             `1px solid ${isDark ? 'rgba(248,113,113,0.25)' : 'rgba(220,38,38,0.18)'}`,
                                            color:              t.cellRed,
                                            fontFamily:         "'JetBrains Mono', monospace",
                                            fontVariantNumeric: 'tabular-nums',
                                            minWidth:           '140px',
                                        }}
                                    >
                                        ₱ {fmt(totalDeduction)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export
// ─────────────────────────────────────────────────────────────────────────────
export default function BudgetAdjustmentEntry() {
    return (
        <AdamsonBudgetLayout>
            {(isDark: boolean) => {
                const t = isDark ? T.dark : T.light;
                return <BudgetAdjustmentEntryInner t={t} isDark={isDark} />;
            }}
        </AdamsonBudgetLayout>
    );
}