import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import AdamsonBudgetLayout from '../../layouts/Screenlayout.tsx';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@repo/ui/components/table';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import {
    FileText,
    Save,
    XCircle,
    Plus,
    Trash2,
    Copy,
    RefreshCw,
    ChevronDown,
    ClipboardList,
    CheckCircle2,
    AlertCircle,
    Info,
    Lock,
    CalendarClock,
    Search,
} from 'lucide-react';
import { budgetproposalentryRoute } from '../../router.tsx';
import { financeSvc } from '@repo/axios-config';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — mirrors Department.tsx pattern
// ─────────────────────────────────────────────────────────────────────────────
const T = {
    dark: {
        titleColor: '#f1f5f9',
        subColor: '#94a3b8',
        cardBg: 'rgba(11, 20, 38, 0.70)',
        cardBorder: 'rgba(59, 130, 246, 0.18)',
        cardShadow: '0 4px 32px rgba(37, 99, 235, 0.10)',
        cardHeaderBorder: 'rgba(59, 130, 246, 0.12)',
        cardTitleColor: '#e2e8f0',

        tableHeadBg: 'rgba(8, 14, 26, 0.60)',
        tableHeadText: '#60a5fa',
        tableHeadBorder: 'rgba(59, 130, 246, 0.15)',
        rowBorder: 'rgba(59, 130, 246, 0.08)',
        rowHoverBg: 'rgba(59, 130, 246, 0.06)',
        cellText: '#cbd5e1',
        cellMuted: '#64748b',
        rowNumBg: 'rgba(8, 14, 26, 0.40)',
        rowNumText: '#475569',

        inputBg: 'rgba(8, 14, 26, 0.55)',
        inputBorder: 'rgba(59, 130, 246, 0.22)',
        inputText: '#e2e8f0',
        inputPlaceholder: '#475569',
        labelText: '#94a3b8',

        emptyStateBg: 'rgba(8, 14, 26, 0.30)',
        emptyStateText: '#475569',
        emptyStateIcon: '#334155',

        btnRequery: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.35)', text: '#a78bfa', hover: 'rgba(139,92,246,0.28)' },
        btnEdit: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)', text: '#60a5fa', hover: 'rgba(59,130,246,0.28)' },
        btnSave: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.30)', text: '#4ade80', hover: 'rgba(34,197,94,0.22)' },
        btnCancel: { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.30)', text: '#fb923c', hover: 'rgba(251,146,60,0.22)' },

        btnAdd: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.30)', text: '#4ade80', hover: 'rgba(34,197,94,0.22)' },
        btnRemove: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.30)', text: '#f87171', hover: 'rgba(239,68,68,0.22)' },
        btnCopy: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.30)', text: '#60a5fa', hover: 'rgba(59,130,246,0.22)' },

        btnDisabledBg: 'rgba(30,41,59,0.40)',
        btnDisabledBorder: 'rgba(51,65,85,0.40)',
        btnDisabledText: '#334155',

        totalBg: 'rgba(8,14,26,0.55)',
        totalBorder: 'rgba(59,130,246,0.22)',
        totalText: '#f1f5f9',
        totalLabelText: '#60a5fa',

        divider: 'rgba(59,130,246,0.10)',
        sectionBadgeBg: 'rgba(59,130,246,0.12)',
        sectionBadgeText: '#60a5fa',
        sectionBadgeBorder: 'rgba(59,130,246,0.22)',

        kindBadgeDeptBg: 'rgba(59,130,246,0.12)',
        kindBadgeDeptText: '#60a5fa',
        kindBadgeDeptBorder: 'rgba(59,130,246,0.25)',
        kindBadgeSecBg: 'rgba(139,92,246,0.12)',
        kindBadgeSecText: '#a78bfa',
        kindBadgeSecBorder: 'rgba(139,92,246,0.25)',

        gridLine: 'rgba(59,130,246,0.18)',
        gridLineHd: 'rgba(59,130,246,0.28)',
        cellBg: 'rgba(8,14,26,0.25)',
        cellBgAlt: 'rgba(15,25,50,0.30)',
    },
    light: {
        titleColor: '#0f172a',
        subColor: '#64748b',
        cardBg: 'rgba(255, 255, 255, 0.60)',
        cardBorder: 'rgba(59, 130, 246, 0.12)',
        cardShadow: '0 4px 24px rgba(0, 48, 135, 0.06)',
        cardHeaderBorder: 'rgba(59, 130, 246, 0.10)',
        cardTitleColor: '#0f172a',

        tableHeadBg: 'rgba(239, 246, 255, 0.80)',
        tableHeadText: '#2563eb',
        tableHeadBorder: 'rgba(59, 130, 246, 0.12)',
        rowBorder: 'rgba(59, 130, 246, 0.06)',
        rowHoverBg: 'rgba(239, 246, 255, 0.60)',
        cellText: '#1e293b',
        cellMuted: '#94a3b8',
        rowNumBg: 'rgba(239,246,255,0.70)',
        rowNumText: '#94a3b8',

        inputBg: 'rgba(255,255,255,0.80)',
        inputBorder: 'rgba(59,130,246,0.18)',
        inputText: '#0f172a',
        inputPlaceholder: '#94a3b8',
        labelText: '#64748b',

        emptyStateBg: 'rgba(239,246,255,0.40)',
        emptyStateText: '#94a3b8',
        emptyStateIcon: '#cbd5e1',

        btnRequery: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.25)', text: '#7c3aed', hover: 'rgba(139,92,246,0.16)' },
        btnEdit: { bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.22)', text: '#2563eb', hover: 'rgba(37,99,235,0.16)' },
        btnSave: { bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.22)', text: '#16a34a', hover: 'rgba(22,163,74,0.16)' },
        btnCancel: { bg: 'rgba(234,88,12,0.08)', border: 'rgba(234,88,12,0.22)', text: '#ea580c', hover: 'rgba(234,88,12,0.16)' },

        btnAdd: { bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.22)', text: '#16a34a', hover: 'rgba(22,163,74,0.16)' },
        btnRemove: { bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.22)', text: '#dc2626', hover: 'rgba(220,38,38,0.16)' },
        btnCopy: { bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.22)', text: '#2563eb', hover: 'rgba(37,99,235,0.16)' },

        btnDisabledBg: 'rgba(241,245,249,0.60)',
        btnDisabledBorder: 'rgba(203,213,225,0.60)',
        btnDisabledText: '#cbd5e1',

        totalBg: 'rgba(239,246,255,0.70)',
        totalBorder: 'rgba(59,130,246,0.18)',
        totalText: '#0f172a',
        totalLabelText: '#2563eb',

        divider: 'rgba(59,130,246,0.08)',
        sectionBadgeBg: 'rgba(37,99,235,0.08)',
        sectionBadgeText: '#2563eb',
        sectionBadgeBorder: 'rgba(37,99,235,0.18)',

        kindBadgeDeptBg: 'rgba(37,99,235,0.08)',
        kindBadgeDeptText: '#2563eb',
        kindBadgeDeptBorder: 'rgba(37,99,235,0.20)',
        kindBadgeSecBg: 'rgba(124,58,237,0.08)',
        kindBadgeSecText: '#7c3aed',
        kindBadgeSecBorder: 'rgba(124,58,237,0.20)',

        gridLine: 'rgba(59,130,246,0.15)',
        gridLineHd: 'rgba(59,130,246,0.22)',
        cellBg: 'rgba(255,255,255,0.85)',
        cellBgAlt: 'rgba(239,246,255,0.50)',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface LineItem {
    id: number;
    isNew: boolean;
    description: string;
    unitCost: string;
    quantity: string;
    uom: string;
    totalAmount: string;
}

interface DeptOption {
    id: string;
    name: string;
    kind: 'Department' | 'Section';
}

interface MainAccount {
    id: number;
    parent_id: null;
    account_code: string;
    account_name: string;
}

interface SubAccount {
    id: number;
    parent_id: number;
    account_code: string;
    account_name: string;
}

type AccountOption = { value: string; label: string };

type BtnToken = { bg: string; border: string; text: string; hover: string };

// ─────────────────────────────────────────────────────────────────────────────
// Zod validation schemas
// ─────────────────────────────────────────────────────────────────────────────
const rowSchema = z.object({
    item_name: z.string().min(1, 'Description is required'),
    unit_cost: z.number({ invalid_type_error: 'Unit cost must be a number' })
        .positive('Unit cost must be greater than 0'),
    quantity: z.number({ invalid_type_error: 'Quantity must be a number' })
        .positive('Quantity must be greater than 0'),
    unit_measurement: z.string().min(1, 'Unit of measurement is required'),
    total_cost: z.number({ invalid_type_error: 'Total cost must be a number' })
        .positive('Total cost must be greater than 0'),
});

const saveSchema = z.object({
    school_year: z.string().min(1, 'School year is required'),
    user_id: z.string().min(1, 'User is required'),
    // department_id is used for both department and section — one must be present
    department_id: z.string().min(1, 'Department or section must be selected'),
    kind: z.enum(['Department', 'Section']),
    main_account_id: z.number().int().positive('Main account is required'),
    sub_account_id: z.number().int().positive('Sub account is required'),
    existing_ids: z.array(z.number().int()),
    rows: z.array(rowSchema),   // empty array is valid — means "delete all items"
});

// ─────────────────────────────────────────────────────────────────────────────
// Toast — fixed bottom-right notification, auto-dismisses after 3.5 s
// ─────────────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'info' | 'error';

interface ToastState {
    visible: boolean;
    message: string;
    type: ToastType;
}

const TOAST_STYLES: Record<ToastType, {
    dark: { bg: string; border: string; text: string; shadow: string };
    light: { bg: string; border: string; text: string; shadow: string };
    icon: React.ReactNode;
}> = {
    success: {
        dark: { bg: 'rgba(21,128,61,0.22)', border: 'rgba(34,197,94,0.40)', text: '#4ade80', shadow: '0 8px 32px rgba(21,128,61,0.25)' },
        light: { bg: 'rgba(220,252,231,1)', border: 'rgba(22,163,74,0.50)', text: '#15803d', shadow: '0 8px 32px rgba(22,163,74,0.18)' },
        icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
    },
    info: {
        dark: { bg: 'rgba(37,99,235,0.20)', border: 'rgba(59,130,246,0.40)', text: '#60a5fa', shadow: '0 8px 32px rgba(37,99,235,0.25)' },
        light: { bg: 'rgba(219,234,254,1)', border: 'rgba(37,99,235,0.45)', text: '#1d4ed8', shadow: '0 8px 32px rgba(37,99,235,0.18)' },
        icon: <Info className="w-4 h-4 shrink-0" />,
    },
    error: {
        dark: { bg: 'rgba(185,28,28,0.22)', border: 'rgba(239,68,68,0.40)', text: '#f87171', shadow: '0 8px 32px rgba(185,28,28,0.25)' },
        light: { bg: 'rgba(254,226,226,1)', border: 'rgba(220,38,38,0.45)', text: '#b91c1c', shadow: '0 8px 32px rgba(220,38,38,0.18)' },
        icon: <AlertCircle className="w-4 h-4 shrink-0" />,
    },
};

function Toast({ toast, onClose, isDark }: { toast: ToastState; onClose: () => void; isDark: boolean }) {
    useEffect(() => {
        if (!toast.visible) return;
        const timer = setTimeout(onClose, 3500);
        return () => clearTimeout(timer);
    }, [toast.visible, toast.message]);

    if (!toast.visible) return null;

    const style = TOAST_STYLES[toast.type];
    const s = isDark ? style.dark : style.light;

    return (
        <div
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                color: s.text,
                boxShadow: s.shadow,
                backdropFilter: 'blur(12px)',
                minWidth: '260px',
                maxWidth: '360px',
                animation: 'slideInToast 0.25s ease-out',
            }}
        >
            <style>{`
                @keyframes slideInToast {
                    from { opacity: 0; transform: translateY(12px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)     scale(1);    }
                }
            `}</style>
            {style.icon}
            <span className="flex-1">{toast.message}</span>
            <button
                onClick={onClose}
                className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: s.text }}
            >
                <XCircle className="w-4 h-4" />
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// StyledSelect — generic flat select (Main Account, Sub Account)
// options is an array of { value, label } so it works with loader account data.
// ─────────────────────────────────────────────────────────────────────────────
function StyledSelect({
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
    t,
}: {
    value: string;
    onChange: (v: string) => void;
    options: AccountOption[];
    placeholder: string;
    disabled?: boolean;
    t: typeof T.dark;
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                className="w-full appearance-none rounded-md text-sm px-3 py-2 pr-8 outline-none transition-all duration-150"
                style={{
                    background: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                    color: value ? t.inputText : t.inputPlaceholder,
                    backdropFilter: 'blur(6px)',
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? 'not-allowed' : 'default',
                }}
            >
                <option value="">{placeholder}</option>
                {options.map(o => (
                    <option key={o.value} value={o.value} style={{ background: '#0f172a', color: '#e2e8f0' }}>
                        {o.label}
                    </option>
                ))}
            </select>
            <ChevronDown
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: t.tableHeadText }}
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// DeptSelect — grouped optgroup select populated from loader data
// value is the option's id string; onChange also returns the kind so the
// parent knows whether it picked a Department or a Section.
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// DeptSelect — custom dropdown with Dept/Sec badges, sorted alphabetically
// mirrors BudgetReview design exactly
// ─────────────────────────────────────────────────────────────────────────────
function DeptSelect({
    value,
    valueKind,
    onChange,
    departments,
    sections,
    t,
    isDark,
}: {
    value: string;
    valueKind: 'Department' | 'Section' | '';
    onChange: (id: string, kind: 'Department' | 'Section') => void;
    departments: DeptOption[];
    sections: DeptOption[];
    t: typeof T.dark;
    isDark: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const mergedList: DeptOption[] = [
        ...departments.map(d => ({ ...d, kind: 'Department' as const })),
        ...sections.map(s => ({ ...s, kind: 'Section' as const })),
    ].sort((a, b) => a.name.localeCompare(b.name));

    // Match on BOTH id and kind — ids can collide between departments and
    // sections (e.g. department id "5" and section id "5"), so matching on
    // id alone would pick whichever one happens to appear first in the list.
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
                    color: selected ? t.inputText : t.inputPlaceholder,
                    backdropFilter: 'blur(6px)',
                }}
            >
                <span className="flex-1 text-left truncate">
                    {selected?.name ?? 'Select department / section…'}
                </span>
                {/* Show kind badge inline on the button when something is selected */}
                {selected && (
                    <span
                        className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md shrink-0"
                        style={{
                            background: selected.kind === 'Department'
                                ? (isDark ? 'rgba(37,99,235,0.25)' : 'rgba(219,234,254,0.90)')
                                : (isDark ? 'rgba(5,150,105,0.25)' : 'rgba(209,250,229,0.90)'),
                            color: selected.kind === 'Department'
                                ? (isDark ? '#93c5fd' : '#1d4ed8')
                                : (isDark ? '#6ee7b7' : '#047857'),
                        }}
                    >
                        {selected.kind === 'Department' ? 'Dept' : 'Sec'}
                    </span>
                )}
                <ChevronDown
                    className="w-3.5 h-3.5 shrink-0 transition-transform duration-150"
                    style={{
                        color: isDark ? '#94a3b8' : '#64748b',
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
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
                    {/* Search box — list can contain 100+ items */}
                    <div
                        className="px-3 py-2"
                        style={{ borderBottom: `1px solid ${isDark ? 'rgba(99,155,255,0.15)' : 'rgba(37,99,235,0.10)'}` }}
                    >
                        <div className="relative">
                            <Search
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                                style={{ color: isDark ? '#64748b' : '#94a3b8' }}
                            />
                            <input
                                type="text"
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search department / section…"
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
                                <span className="text-xs" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                                    No results found.
                                </span>
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
                                            color: isSelected
                                                ? (isDark ? '#93c5fd' : '#1d4ed8')
                                                : (isDark ? '#e2e8f0' : '#0f172a'),
                                            background: isSelected
                                                ? (isDark ? 'rgba(37,99,235,0.20)' : 'rgba(219,234,254,0.80)')
                                                : 'transparent',
                                            fontWeight: isSelected ? 600 : 400,
                                            borderBottom: idx < filteredList.length - 1
                                                ? `1px solid ${isDark ? 'rgba(99,155,255,0.10)' : 'rgba(37,99,235,0.08)'}`
                                                : 'none',
                                        }}
                                        onClick={() => handleSelect(item)}
                                        onMouseEnter={e => {
                                            if (!isSelected)
                                                (e.currentTarget as HTMLElement).style.background = isDark
                                                    ? 'rgba(59,130,246,0.12)'
                                                    : 'rgba(219,234,254,0.50)';
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected)
                                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                        }}
                                    >
                                        <span className="truncate">{item.name}</span>
                                        {/* Kind badge */}
                                        <span
                                            className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md shrink-0"
                                            style={{
                                                background: item.kind === 'Department'
                                                    ? (isDark ? 'rgba(37,99,235,0.25)' : 'rgba(219,234,254,0.90)')
                                                    : (isDark ? 'rgba(5,150,105,0.25)' : 'rgba(209,250,229,0.90)'),
                                                color: item.kind === 'Department'
                                                    ? (isDark ? '#93c5fd' : '#1d4ed8')
                                                    : (isDark ? '#6ee7b7' : '#047857'),
                                            }}
                                        >
                                            {item.kind === 'Department' ? 'Dept' : 'Sec'}
                                        </span>
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

// ─────────────────────────────────────────────────────────────────────────────
// ActionBtn — supports disabled + loading states
// ─────────────────────────────────────────────────────────────────────────────
function ActionBtn({
    token,
    icon,
    label,
    onClick,
    disabled = false,
    loading = false,
    t,
}: {
    token: BtnToken;
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    t: typeof T.dark;
}) {
    const [hovered, setHovered] = useState(false);

    return (
        <button
            onClick={!disabled && !loading ? onClick : undefined}
            onMouseEnter={() => !disabled && !loading && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border select-none"
            style={{
                background: disabled ? t.btnDisabledBg : hovered ? token.hover : token.bg,
                borderColor: disabled ? t.btnDisabledBorder : token.border,
                color: disabled ? t.btnDisabledText : token.text,
                minWidth: '60px',
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.55 : 1,
            }}
        >
            <span className={loading ? 'animate-spin' : ''}>{icon}</span>
            {label}
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function BudgetProposalEntry() {
    // ── Loader data ───────────────────────────────────────────────────────────
    const { data } = budgetproposalentryRoute.useLoaderData() || {};
    const { user } = budgetproposalentryRoute.useRouteContext();
    const sy: string = data?.school_year ?? '—';
    const departments: DeptOption[] = (data?.departments ?? []) as DeptOption[];
    const sections: DeptOption[] = (data?.sections ?? []) as DeptOption[];
    const mainAccounts: MainAccount[] = (data?.mainaccounts ?? []) as MainAccount[];
    const subAccounts: SubAccount[] = (data?.subaccounts ?? []) as SubAccount[];

    // ── Entry period gate ─────────────────────────────────────────────────────
    const entryFrom: string = data?.entryfrom ?? '';
    const entryTo: string = data?.entryto ?? '';
    const now = new Date();
    const isWithinEntryPeriod =
        entryFrom && entryTo
            ? now >= new Date(entryFrom) && now <= new Date(entryTo)
            : false;

    const fmtDate = (dt: string) =>
        dt ? new Date(dt).toLocaleString('en-PH', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true,
        }) : '—';

    // ── Filter state ──────────────────────────────────────────────────────────
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedDeptKind, setSelectedDeptKind] = useState<'Department' | 'Section' | ''>('');
    const [selectedMain, setSelectedMain] = useState('');
    const [selectedSub, setSelectedSub] = useState('');

    // ── Table state ───────────────────────────────────────────────────────────
    const [rows, setRows] = useState<LineItem[]>([]);
    const [originalRows, setOriginalRows] = useState<LineItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isQuerying, setIsQuerying] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    // ── Toast ─────────────────────────────────────────────────────────────────
    const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'info' });

    const showToast = (message: string, type: ToastType) =>
        setToast({ visible: true, message, type });

    // ── Helpers ───────────────────────────────────────────────────────────────
    const resetState = () => {
        setIsLoaded(false);
        setRows([]);
    };

    const handleDeptChange = (id: string, kind: 'Department' | 'Section') => {
        setSelectedDept(id);
        setSelectedDeptKind(kind);
        resetState();
    };

    const handleMainChange = (v: string) => {
        setSelectedMain(v);
        setSelectedSub('');   // reset sub when main changes
        resetState();
    };

    // Derive filtered account options from loader data
    const mainAccountOptions: AccountOption[] = mainAccounts.map(a => ({
        value: String(a.id),
        label: `${a.account_code} – ${a.account_name}`,
    }));

    // Only show sub-accounts that belong to the selected main account
    const filteredSubAccountOptions: AccountOption[] = subAccounts
        .filter(s => s.parent_id === Number(selectedMain))
        .map(s => ({
            value: String(s.id),
            label: `${s.account_code} – ${s.account_name}`,
        }));

    // ── Requery ───────────────────────────────────────────────────────────────
    const handleRequery = async () => {
        if (!selectedDept || !selectedMain || !selectedSub) return;
        setIsQuerying(true);
        setIsLoaded(false);
        setRows([]);

        try {
            const { data: result } = await financeSvc.post('/abms/budget-proposal-entry/requery', {
                school_year: sy,
                department_id: selectedDept,
                kind: selectedDeptKind,
                main_account_id: Number(selectedMain),
                sub_account_id: Number(selectedSub),
            });

            const items = result.items ?? [];

            const mapped: LineItem[] = items.map((item: any) => ({
                id: item.id,
                isNew: false,
                description: item.description ?? '',   // DB column is `description`
                unitCost: String(item.unit_cost ?? ''),
                quantity: String(item.quantity ?? ''),
                uom: item.unit_measurement ?? '',
                totalAmount: String(item.total_cost ?? ''),
            }));

            setRows(mapped);
            setOriginalRows(mapped);
            setIsLoaded(true);

            if (mapped.length > 0) {
                showToast(`Loaded ${mapped.length} item${mapped.length > 1 ? 's' : ''} successfully.`, 'success');
            } else {
                showToast('No existing entries found. You can start adding rows.', 'info');
            }
        } catch (err) {
            console.error('Requery failed:', err);
            showToast('Failed to load data. Please try again.', 'error');
        } finally {
            setIsQuerying(false);
        }
    };

    // ── Row management ────────────────────────────────────────────────────────
    const handleAddRow = () => {
        setRows(prev => [
            ...prev,
            { id: Date.now(), isNew: true, description: '', unitCost: '', quantity: '', uom: '', totalAmount: '' },
        ]);
    };

    const handleRemoveLastRow = () => {
        setRows(prev => prev.slice(0, -1));
    };

    // ── Cancel — restore to last requery snapshot ─────────────────────────────
    const handleCancel = () => {
        setRows(originalRows);
        showToast('Changes discarded.', 'info');
    };

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!isLoaded || !isWithinEntryPeriod) return;

        // Build the raw payload then validate with zod
        const payload = {
            school_year: sy,
            user_id: user.username,
            department_id: selectedDept,
            kind: selectedDeptKind as 'Department' | 'Section',
            main_account_id: Number(selectedMain),
            sub_account_id: Number(selectedSub),
            existing_ids: originalRows.filter(r => !r.isNew).map(r => r.id),
            rows: rows.map(r => ({
                id: r.isNew ? null : r.id,
                item_name: r.description,
                unit_cost: parseFloat(r.unitCost) || 0,
                quantity: parseFloat(r.quantity) || 0,
                unit_measurement: r.uom,
                total_cost: parseFloat(r.totalAmount) || 0,
            })),
        };

        const result = saveSchema.safeParse(payload);

        if (!result.success) {
            // Collect all unique messages and show the first one
            const errors = result.error.errors;

            // Check for row-level errors and build a readable message
            const rowErrors = errors.filter(e => e.path[0] === 'rows');
            const topErrors = errors.filter(e => e.path[0] !== 'rows');

            if (rowErrors.length > 0) {
                // Find which rows have errors
                const badRows = [...new Set(rowErrors.map(e => (e.path[1] as number) + 1))];
                const fieldMessages = [...new Set(rowErrors.map(e => e.message))];
                showToast(
                    `Row${badRows.length > 1 ? 's' : ''} ${badRows.join(', ')}: ${fieldMessages[0]}`,
                    'error',
                );
            } else {
                showToast(topErrors[0]?.message ?? 'Validation failed.', 'error');
            }
            return;
        }

        setIsSaving(true);
        try {
            await financeSvc.post('/abms/budget-proposal-entry/save', result.data);

            // Mark all rows as persisted and update snapshot
            const saved = rows.map(r => ({ ...r, isNew: false }));
            setRows(saved);
            setOriginalRows(saved);
            showToast('Budget proposal saved successfully.', 'success');
        } catch (err) {
            console.error('Save failed:', err);
            showToast('Failed to save. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Copy Previous ─────────────────────────────────────────────────────────
    const handleCopyPrevious = async () => {
        if (!isLoaded || !isWithinEntryPeriod || !selectedDeptKind) return;
        setIsCopying(true);
        try {
            const { data: result } = await financeSvc.post('/abms/budget-proposal-entry/copy-previous', {
                school_year: sy,
                department_id: selectedDept,
                kind: selectedDeptKind,
                main_account_id: Number(selectedMain),
                sub_account_id: Number(selectedSub),
            });

            const items: any[] = result.items ?? [];

            if (items.length === 0) {
                showToast(`No entries found for ${result.previous_school_year}.`, 'info');
                return;
            }

            // Each copied row is treated as new (no id) so the save endpoint
            // will INSERT them rather than UPDATE existing records.
            const copied: LineItem[] = items.map((item) => ({
                id: Date.now() + Math.random(),   // temp key, safe for React
                isNew: true,
                description: item.description ?? '',   // DB column is `description`
                unitCost: String(item.unit_cost ?? ''),
                quantity: String(item.quantity ?? ''),
                uom: item.unit_measurement ?? '',
                totalAmount: String(item.total_cost ?? ''),
            }));

            setRows(prev => [...prev, ...copied]);
            showToast(
                `Copied ${copied.length} item${copied.length > 1 ? 's' : ''} from ${result.previous_school_year}.`,
                'success',
            );
        } catch (err) {
            console.error('Copy previous failed:', err);
            showToast('Failed to copy previous entries. Please try again.', 'error');
        } finally {
            setIsCopying(false);
        }
    };

    const updateRow = (id: number, field: keyof LineItem, value: string) => {
        setRows(prev =>
            prev.map(r => {
                if (r.id !== id) return r;
                const updated = { ...r, [field]: value };
                const cost = parseFloat(updated.unitCost) || 0;
                const qty = parseFloat(updated.quantity) || 0;
                updated.totalAmount = cost > 0 && qty > 0 ? (cost * qty).toFixed(2) : '';
                return updated;
            }),
        );
    };

    const grandTotal = rows.reduce((sum, r) => sum + (parseFloat(r.totalAmount) || 0), 0);
    const requeryReady = !!(selectedDept && selectedMain && selectedSub);

    // Find the selected dept/section name for the kind badge display
    const selectedDeptName = [
        ...departments,
        ...sections,
    ].find(o => o.id === selectedDept)?.name ?? '';

    return (
        <AdamsonBudgetLayout>
            {(isDark: boolean) => {
                const t = isDark ? T.dark : T.light;

                // Kind badge colors
                const kindBadge = selectedDeptKind === 'Department'
                    ? { bg: t.kindBadgeDeptBg, text: t.kindBadgeDeptText, border: t.kindBadgeDeptBorder }
                    : { bg: t.kindBadgeSecBg, text: t.kindBadgeSecText, border: t.kindBadgeSecBorder };

                return (
                    <>
                        <div className="max-w-6xl mx-auto space-y-6">

                            {/* ── Page header ─────────────────────────────────── */}
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight" style={{ color: t.titleColor }}>
                                    Budget Proposal Entry
                                </h1>
                                <p className="text-sm mt-0.5" style={{ color: t.subColor }}>
                                    For School Year: {sy}
                                </p>
                            </div>

                            {/* ── Main Card ───────────────────────────────────── */}
                            <Card
                                className="overflow-hidden backdrop-blur-sm"
                                style={{
                                    background: t.cardBg,
                                    border: `1px solid ${t.cardBorder}`,
                                    boxShadow: t.cardShadow,
                                }}
                            >
                                {/* Card header */}
                                <CardHeader
                                    className="px-6 py-4 flex flex-row items-center gap-2"
                                    style={{ borderBottom: `1px solid ${t.cardHeaderBorder}` }}
                                >
                                    <FileText className="w-4 h-4" style={{ color: t.tableHeadText }} />
                                    <CardTitle
                                        className="text-sm font-semibold tracking-wide"
                                        style={{ color: t.cardTitleColor }}
                                    >
                                        Budget Proposal Entry
                                    </CardTitle>

                                    {/* Show selected dept/section kind badge when one is chosen */}
                                    {selectedDeptKind && (
                                        <span
                                            className="text-xs font-medium px-2 py-0.5 rounded-full border"
                                            style={{
                                                background: kindBadge.bg,
                                                color: kindBadge.text,
                                                borderColor: kindBadge.border,
                                            }}
                                        >
                                            {selectedDeptKind}
                                        </span>
                                    )}

                                    <span
                                        className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                                        style={{
                                            background: t.sectionBadgeBg,
                                            color: t.sectionBadgeText,
                                            border: `1px solid ${t.sectionBadgeBorder}`,
                                        }}
                                    >
                                        SY {sy}
                                    </span>
                                </CardHeader>

                                <CardContent className="p-6 space-y-6">

                                    {/* ── Filters + action buttons ─────────────────── */}
                                    <div className="flex flex-col lg:flex-row gap-4 lg:items-end">

                                        {/* Selects */}
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">

                                            {/* Department / Section — grouped from loader */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: t.labelText }}>
                                                    Department / Section
                                                </label>
                                                <DeptSelect
                                                    value={selectedDept}
                                                    valueKind={selectedDeptKind}
                                                    onChange={handleDeptChange}
                                                    departments={departments}
                                                    sections={sections}
                                                    t={t}
                                                    isDark={isDark} 
                                                />
                                            </div>

                                            {/* Main Account */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: t.labelText }}>
                                                    Main Account
                                                </label>
                                                <StyledSelect
                                                    value={selectedMain}
                                                    onChange={handleMainChange}
                                                    options={mainAccountOptions}
                                                    placeholder="Select main account…"
                                                    t={t}
                                                />
                                            </div>

                                            {/* Sub Account */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: t.labelText }}>
                                                    Sub Account
                                                </label>
                                                <StyledSelect
                                                    value={selectedSub}
                                                    onChange={v => { setSelectedSub(v); resetState(); }}
                                                    options={filteredSubAccountOptions}
                                                    placeholder={selectedMain ? 'Select sub account…' : 'Select main account first…'}
                                                    disabled={!selectedMain}
                                                    t={t}
                                                />
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div
                                            className="flex items-center gap-2 flex-wrap"
                                            style={{ paddingLeft: '1rem', borderLeft: `1px solid ${t.divider}` }}
                                        >
                                            <ActionBtn
                                                token={t.btnRequery}
                                                icon={<RefreshCw className="w-4 h-4" />}
                                                label="Requery"
                                                onClick={handleRequery}
                                                disabled={!requeryReady || isQuerying}
                                                loading={isQuerying}
                                                t={t}
                                            />
                                            <ActionBtn
                                                token={t.btnSave}
                                                icon={<Save className="w-4 h-4" />}
                                                label="Save"
                                                onClick={handleSave}
                                                loading={isSaving}
                                                disabled={!isLoaded || !isWithinEntryPeriod || isSaving}
                                                t={t}
                                            />
                                            <ActionBtn
                                                token={t.btnCancel}
                                                icon={<XCircle className="w-4 h-4" />}
                                                label="Cancel"
                                                onClick={handleCancel}
                                                disabled={!isLoaded || !isWithinEntryPeriod || isSaving}
                                                t={t}
                                            />
                                        </div>
                                    </div>

                                    {/* ── Entry period banner (shown when outside window) ── */}
                                    {!isWithinEntryPeriod && (
                                        <div
                                            className="flex items-start gap-3 rounded-lg px-4 py-3 text-sm"
                                            style={{
                                                background: 'rgba(234,88,12,0.08)',
                                                border: '1px solid rgba(234,88,12,0.28)',
                                                color: isDark ? '#fb923c' : '#ea580c',
                                            }}
                                        >
                                            <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                                            <div className="space-y-0.5">
                                                <p className="font-semibold">Budget entry is currently closed.</p>
                                                <p className="opacity-80 text-xs">
                                                    Entry window: <span className="font-medium">{fmtDate(entryFrom)}</span>
                                                    {' '}→{' '}
                                                    <span className="font-medium">{fmtDate(entryTo)}</span>
                                                </p>
                                            </div>
                                            <CalendarClock className="w-4 h-4 mt-0.5 ml-auto shrink-0 opacity-60" />
                                        </div>
                                    )}

                                    {/* ── Line Items Table ─────────────────────────── */}
                                    <div
                                        className="rounded-lg overflow-hidden"
                                        style={{ border: `1px solid ${t.gridLineHd}` }}
                                    >
                                        <Table>
                                            <TableHeader>
                                                <TableRow
                                                    style={{
                                                        background: t.tableHeadBg,
                                                        borderBottom: `2px solid ${t.gridLineHd}`,
                                                    }}
                                                >
                                                    <TableHead
                                                        className="text-xs font-bold uppercase tracking-widest h-10 w-12 text-center"
                                                        style={{
                                                            color: t.tableHeadText,
                                                            borderRight: `1px solid ${t.gridLineHd}`,
                                                        }}
                                                    >
                                                        #
                                                    </TableHead>
                                                    {['Item / Description', '₱ Unit Cost', 'Quantity', 'Units of Measurement', 'Total Amount'].map((col, i, arr) => (
                                                        <TableHead
                                                            key={col}
                                                            className="text-xs font-bold uppercase tracking-widest h-10 px-4"
                                                            style={{
                                                                color: t.tableHeadText,
                                                                borderRight: i < arr.length - 1 ? `1px solid ${t.gridLineHd}` : undefined,
                                                            }}
                                                        >
                                                            {col}
                                                        </TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>

                                            <TableBody>
                                                {rows.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={6}
                                                            className="py-16 text-center"
                                                            style={{ background: t.emptyStateBg }}
                                                        >
                                                            <div className="flex flex-col items-center gap-3">
                                                                <ClipboardList className="w-10 h-10" style={{ color: t.emptyStateIcon }} />
                                                                <p className="text-sm font-medium max-w-sm mx-auto" style={{ color: t.emptyStateText }}>
                                                                    {!isLoaded
                                                                        ? 'Select a department / section, main account, and sub account — then click Requery to load data.'
                                                                        : 'No items yet. Click "Add Row" below to start adding proposal items.'}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    rows.map((row, idx) => (
                                                        <TableRow
                                                            key={row.id}
                                                            className="transition-colors duration-150"
                                                            style={{
                                                                background: idx % 2 === 0 ? t.cellBg : t.cellBgAlt,
                                                                borderBottom: `1px solid ${t.gridLine}`,
                                                            }}
                                                            onMouseEnter={e =>
                                                                ((e.currentTarget as HTMLElement).style.background = t.rowHoverBg)
                                                            }
                                                            onMouseLeave={e =>
                                                                ((e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? t.cellBg : t.cellBgAlt)
                                                            }
                                                        >
                                                            {/* Row number */}
                                                            <TableCell
                                                                className="text-center text-xs font-mono w-12 py-2"
                                                                style={{
                                                                    color: t.rowNumText,
                                                                    background: t.rowNumBg,
                                                                    borderRight: `1px solid ${t.gridLineHd}`,
                                                                }}
                                                            >
                                                                {idx + 1}
                                                            </TableCell>

                                                            {/* Description */}
                                                            <TableCell className="px-4 py-1.5" style={{ minWidth: '220px', borderRight: `1px solid ${t.gridLine}` }}>
                                                                <input
                                                                    type="text"
                                                                    value={row.description}
                                                                    onChange={e => updateRow(row.id, 'description', e.target.value)}
                                                                    placeholder="Enter item description…"
                                                                    readOnly={!isWithinEntryPeriod}
                                                                    className="w-full bg-transparent outline-none text-sm"
                                                                    style={{
                                                                        color: t.cellText,
                                                                        cursor: !isWithinEntryPeriod ? 'default' : 'text',
                                                                    }}
                                                                />
                                                            </TableCell>

                                                            {/* Unit Cost */}
                                                            <TableCell className="px-4 py-1.5" style={{ minWidth: '130px', borderRight: `1px solid ${t.gridLine}` }}>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-sm font-medium shrink-0" style={{ color: t.cellMuted }}>₱</span>
                                                                    <input
                                                                        type="number"
                                                                        value={row.unitCost}
                                                                        onChange={e => updateRow(row.id, 'unitCost', e.target.value)}
                                                                        placeholder="0.00"
                                                                        min="0"
                                                                        readOnly={!isWithinEntryPeriod}
                                                                        className="w-full bg-transparent outline-none text-sm text-left"
                                                                        style={{
                                                                            color: t.cellText,
                                                                            cursor: !isWithinEntryPeriod ? 'default' : 'text',
                                                                        }}
                                                                    />
                                                                </div>
                                                            </TableCell>

                                                            {/* Quantity */}
                                                            <TableCell className="px-4 py-1.5" style={{ minWidth: '90px', borderRight: `1px solid ${t.gridLine}` }}>
                                                                <input
                                                                    type="number"
                                                                    value={row.quantity}
                                                                    onChange={e => updateRow(row.id, 'quantity', e.target.value)}
                                                                    placeholder="0"
                                                                    min="0"
                                                                    readOnly={!isWithinEntryPeriod}
                                                                    className="w-full bg-transparent outline-none text-sm text-left"
                                                                    style={{
                                                                        color: t.cellText,
                                                                        cursor: !isWithinEntryPeriod ? 'default' : 'text',
                                                                    }}
                                                                />
                                                            </TableCell>

                                                            {/* Units of Measurement */}
                                                            <TableCell className="px-4 py-1.5" style={{ minWidth: '140px', borderRight: `1px solid ${t.gridLine}` }}>
                                                                <input
                                                                    type="text"
                                                                    value={row.uom}
                                                                    onChange={e => updateRow(row.id, 'uom', e.target.value)}
                                                                    placeholder="e.g. pcs, reams…"
                                                                    readOnly={!isWithinEntryPeriod}
                                                                    className="w-full bg-transparent outline-none text-sm text-center"
                                                                    style={{
                                                                        color: t.cellText,
                                                                        cursor: !isWithinEntryPeriod ? 'default' : 'text',
                                                                    }}
                                                                />
                                                            </TableCell>

                                                            {/* Total Amount — auto-computed, read-only */}
                                                            <TableCell className="px-4 py-1.5" style={{ minWidth: '130px' }}>
                                                                <span
                                                                    className="block w-full text-sm text-center font-medium font-mono"
                                                                    style={{ color: t.tableHeadText }}
                                                                >
                                                                    {row.totalAmount
                                                                        ? `₱ ${parseFloat(row.totalAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                                                                        : '—'}
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* ── Bottom toolbar ───────────────────────────── */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

                                        {/* Add / Remove / Copy — locked until isLoaded and within entry period */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <ActionBtn
                                                token={t.btnAdd}
                                                icon={<Plus className="w-4 h-4" />}
                                                label="Add Row"
                                                onClick={handleAddRow}
                                                disabled={!isLoaded || !isWithinEntryPeriod || isSaving}
                                                t={t}
                                            />
                                            <ActionBtn
                                                token={t.btnRemove}
                                                icon={<Trash2 className="w-4 h-4" />}
                                                label="Remove"
                                                onClick={handleRemoveLastRow}
                                                disabled={!isLoaded || rows.length === 0 || !isWithinEntryPeriod || isSaving}
                                                t={t}
                                            />
                                            <ActionBtn
                                                token={t.btnCopy}
                                                icon={<Copy className="w-4 h-4" />}
                                                label="Copy Previous Budget Proposal"
                                                onClick={handleCopyPrevious}
                                                loading={isCopying}
                                                disabled={!isLoaded || !isWithinEntryPeriod || isSaving || isCopying}
                                                t={t}
                                            />
                                        </div>

                                        {/* Grand Total */}
                                        <div
                                            className="flex items-center gap-3 rounded-lg px-4 py-2.5"
                                            style={{
                                                background: t.totalBg,
                                                border: `1px solid ${t.totalBorder}`,
                                                backdropFilter: 'blur(6px)',
                                            }}
                                        >
                                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: t.totalLabelText }}>
                                                Total
                                            </span>
                                            <div className="h-4 w-px" style={{ background: t.totalBorder }} />
                                            <span
                                                className="text-sm font-semibold font-mono min-w-[140px] text-right"
                                                style={{ color: t.totalText }}
                                            >
                                                ₱ {grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                        </div>

                        {/* ── Toast notification ──────────────────────────── */}
                        <Toast
                            toast={toast}
                            onClose={() => setToast(t => ({ ...t, visible: false }))}
                            isDark={isDark}
                        />
                    </>
                );
            }}
        </AdamsonBudgetLayout>
    );
}