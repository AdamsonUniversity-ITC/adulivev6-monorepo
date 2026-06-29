import React, { useState, useRef, useEffect, useCallback } from 'react';
import AdamsonBudgetLayout from '../../layouts/Screenlayout.tsx';
import { RefreshCw, ChevronDown, X, Upload, FileText, Trash2 } from 'lucide-react';
import { liquidationsubmissionRoute } from '../../router.tsx';
import { financeSvc } from '@repo/axios-config/finance-service';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
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
        rowHoverBg: 'rgba(59,130,246,0.09)',
        cellText: '#ddeeff',
        cellMuted: '#7a9cc4',
        cellGreen: '#4ade80',
        cellAmber: '#fbbf24',
        cellRed: '#f87171',
        cellBlue: '#60a5fa',
        checkboxBorder: 'rgba(100,160,255,0.45)',
        checkboxBg: 'rgba(13,26,58,0.85)',
        checkboxChecked: '#2563eb',
        btnRefresh: { bg: 'rgba(59,130,246,0.18)', border: 'rgba(100,160,255,0.45)', text: '#7eb8ff', hover: 'rgba(59,130,246,0.30)' },
        btnDisBg: 'rgba(20,30,60,0.50)',
        btnDisBorder: 'rgba(60,80,120,0.30)',
        btnDisText: '#3a5070',
        dropdownBg: 'rgba(10,18,38,0.98)',
        dropdownBorder: 'rgba(99,155,255,0.30)',
        dropdownShadow: '0 8px 32px rgba(0,0,0,0.55)',
        dropdownHover: 'rgba(59,130,246,0.12)',
        dropdownSelected: 'rgba(37,99,235,0.22)',
        dropdownSelectedText: '#93c5fd',
        dropdownText: '#e2e8f0',
        dropdownDivider: 'rgba(99,155,255,0.09)',
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
        rowHoverBg: 'rgba(219,234,254,0.55)',
        cellText: '#0a1628',
        cellMuted: '#2d4a7a',
        cellGreen: '#047857',
        cellAmber: '#b45309',
        cellRed: '#dc2626',
        cellBlue: '#1d4ed8',
        checkboxBorder: 'rgba(37,99,235,0.40)',
        checkboxBg: 'rgba(232,242,255,0.95)',
        checkboxChecked: '#1d4ed8',
        btnRefresh: { bg: 'rgba(37,99,235,0.10)', border: 'rgba(37,99,235,0.35)', text: '#1d4ed8', hover: 'rgba(37,99,235,0.18)' },
        btnDisBg: 'rgba(241,245,249,0.80)',
        btnDisBorder: 'rgba(203,213,225,0.60)',
        btnDisText: '#94a3b8',
        dropdownBg: 'rgba(255,255,255,0.99)',
        dropdownBorder: 'rgba(37,99,235,0.20)',
        dropdownShadow: '0 8px 32px rgba(0,48,135,0.16)',
        dropdownHover: 'rgba(219,234,254,0.55)',
        dropdownSelected: 'rgba(219,234,254,0.85)',
        dropdownSelectedText: '#1d4ed8',
        dropdownText: '#0f172a',
        dropdownDivider: 'rgba(37,99,235,0.08)',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface DeptOption { id: string; name: string; kind: 'Department' | 'Section' }

interface LiquidationRecord {
    id: string;
    date: string;
    requisition_no: string;
    department_section: string;
    requested_by: string;
    requested_by_empno: string;
    total_amount: number;
    status: string;
    location: string;
    from: string;
}

const fmt = (n: number) =>
    n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
// DeptDropdown
// ─────────────────────────────────────────────────────────────────────────────
function DeptDropdown({
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
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => { setOpen(p => !p); setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-xl text-xs font-semibold border outline-none transition-all duration-150"
                style={{
                    background: t.inputBg,
                    borderColor: open ? (isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)') : t.inputBorder,
                    color: selected ? t.inputText : t.inputPlaceholder,
                    minWidth: 220,
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
                                className="w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition-all duration-100"
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
// Status badge
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status, isDark }: { status: string; isDark: boolean }) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Upload Modal
// ─────────────────────────────────────────────────────────────────────────────
interface UploadedFile {
    id: string;
    file: File;
}

function LiquidationUploadModal({
    row, t, isDark, onClose,
}: {
    row: LiquidationRecord;
    t: typeof T.dark;
    isDark: boolean;
    onClose: () => void;
}) {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function addFiles(incoming: FileList | null) {
        if (!incoming) return;
        const next: UploadedFile[] = Array.from(incoming).map(file => ({
            id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
            file,
        }));
        setFiles(prev => [...prev, ...next]);
    }

    function removeFile(id: string) {
        setFiles(prev => prev.filter(f => f.id !== id));
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
        addFiles(e.dataTransfer.files);
    }

    function formatBytes(bytes: number) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    // Overlay click-to-close
    function handleBackdropClick(e: React.MouseEvent) {
        if (e.target === e.currentTarget) onClose();
    }

    const dropzoneBorder = isDragging
        ? (isDark ? 'rgba(99,155,255,0.80)' : 'rgba(37,99,235,0.70)')
        : (isDark ? 'rgba(100,160,255,0.28)' : 'rgba(37,99,235,0.25)');
    const dropzoneBg = isDragging
        ? (isDark ? 'rgba(37,99,235,0.10)' : 'rgba(219,234,254,0.35)')
        : (isDark ? 'rgba(13,26,58,0.50)' : 'rgba(232,242,255,0.60)');

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px',
            }}
            onClick={handleBackdropClick}
        >
            <div
                style={{
                    width: '100%', maxWidth: 560,
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    boxShadow: t.cardShadow,
                    borderRadius: 16,
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    maxHeight: '90vh',
                }}
            >
                {/* ── Header ── */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: `1px solid ${t.sectionDivider}`,
                    background: t.cardHeaderBg,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
                }}>
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: t.titleColor, margin: 0 }}>
                            Submit Liquidation Documents
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: t.cellBlue, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.03em' }}>
                                {row.requisition_no}
                            </span>
                            <span style={{ fontSize: 11, color: t.cellMuted }}>·</span>
                            <span style={{ fontSize: 11, color: t.cellMuted }}>{row.department_section}</span>
                            <span style={{ fontSize: 11, color: t.cellMuted }}>·</span>
                            <span style={{ fontSize: 11, color: t.cellMuted }}>{row.requested_by}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: t.cellMuted, padding: 4, borderRadius: 6, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = t.cellText; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = t.cellMuted; }}
                    >
                        <X style={{ width: 16, height: 16 }} />
                    </button>
                </div>

                {/* ── Body ── */}
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>

                    {/* Dropzone */}
                    <div
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${dropzoneBorder}`,
                            borderRadius: 12,
                            background: dropzoneBg,
                            padding: '32px 20px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            style={{ display: 'none' }}
                            onChange={e => addFiles(e.target.files)}
                        />
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px',
                            background: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.10)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Upload style={{ width: 18, height: 18, color: t.cellBlue }} />
                        </div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: t.cellText }}>
                            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: t.cellMuted }}>
                            or <span style={{ color: t.cellBlue, fontWeight: 600 }}>click to browse</span>
                            {' '}— multiple files allowed
                        </p>
                    </div>

                    {/* File list */}
                    {files.length > 0 && (
                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: t.cellMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                {files.length} file{files.length !== 1 ? 's' : ''} selected
                            </p>
                            {files.map(f => (
                                <div
                                    key={f.id}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 12px', borderRadius: 8,
                                        background: isDark ? 'rgba(13,26,58,0.55)' : 'rgba(232,242,255,0.70)',
                                        border: `1px solid ${t.rowBorder}`,
                                    }}
                                >
                                    <FileText style={{ width: 15, height: 15, color: t.cellBlue, flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: t.cellText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {f.file.name}
                                        </p>
                                        <p style={{ margin: 0, fontSize: 11, color: t.cellMuted }}>
                                            {formatBytes(f.file.size)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => removeFile(f.id)}
                                        style={{
                                            background: 'transparent', border: 'none', cursor: 'pointer',
                                            color: t.cellMuted, padding: 4, borderRadius: 4, flexShrink: 0,
                                            display: 'flex', alignItems: 'center',
                                        }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = t.cellRed; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = t.cellMuted; }}
                                    >
                                        <Trash2 style={{ width: 13, height: 13 }} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div style={{
                    padding: '14px 20px',
                    borderTop: `1px solid ${t.sectionDivider}`,
                    display: 'flex', justifyContent: 'flex-end', gap: 8,
                    background: t.cardHeaderBg,
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '7px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8,
                            background: 'transparent',
                            border: `1px solid ${isDark ? 'rgba(100,160,255,0.28)' : 'rgba(37,99,235,0.22)'}`,
                            color: t.cellMuted, cursor: 'pointer',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = t.cellText; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = t.cellMuted; }}
                    >
                        Cancel
                    </button>
                    <button
                        disabled={files.length === 0}
                        style={{
                            padding: '7px 18px', fontSize: 12, fontWeight: 700, borderRadius: 8,
                            background: files.length === 0
                                ? t.btnDisBg
                                : (isDark ? 'rgba(37,99,235,0.75)' : '#1d4ed8'),
                            border: `1px solid ${files.length === 0
                                ? t.btnDisBorder
                                : (isDark ? 'rgba(99,155,255,0.55)' : '#1e40af')}`,
                            color: files.length === 0 ? t.btnDisText : '#ffffff',
                            cursor: files.length === 0 ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        Submit {files.length > 0 ? `(${files.length})` : ''}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
function LiquidationSubmissionInner({ t, isDark }: { t: typeof T.dark; isDark: boolean }) {
    const { data } = liquidationsubmissionRoute.useLoaderData();

    // Merge departments + sections into one option list
    const deptOptions: DeptOption[] = [
        ...(data?.data?.department ?? []),
        ...(data?.data?.sections ?? []),
    ];

    // Filter state
    const [selectedDeptId, setSelectedDeptId] = useState('');
    const [selectedDeptKind, setSelectedDeptKind] = useState<'Department' | 'Section' | ''>('');
    const [ascending, setAscending] = useState(true);
    const [descending, setDescending] = useState(false);

    // Table state
    const [records, setRecords] = useState<LiquidationRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Modal state
    const [selectedRow, setSelectedRow] = useState<LiquidationRecord | null>(null);

    function handleDeptChange(id: string, kind: 'Department' | 'Section' | '') {
        setSelectedDeptId(id);
        setSelectedDeptKind(kind);
    }

    function handleAscending(v: boolean) {
        setAscending(v);
        if (v) setDescending(false);
    }
    function handleDescending(v: boolean) {
        setDescending(v);
        if (v) setAscending(false);
    }

    const fetchRecords = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, string> = {
                sortDir: ascending ? 'asc' : 'desc',
            };
            if (selectedDeptId && selectedDeptKind) {
                params.department = selectedDeptId;
                params.kind = selectedDeptKind;
            }
            const res = await financeSvc.get('abms/liquidation-submission/rs', { params });
            setRecords(res.data.data ?? []);
        } catch (err) {
            console.error('Failed to fetch liquidation records:', err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDeptId, selectedDeptKind, ascending]);

    // Load on mount
    useEffect(() => { fetchRecords(); }, []);

    const TABLE_COLS = [
        'Date', 'Requisition No.', 'Department / Section',
        'Requested By', 'Total Amount', 'Status', 'Location', 'From',
    ];

    return (
        <div className="p-6">
            {/* ── Page Title (outside card) ── */}
            <div className="mb-4">
                <h1 className="text-base font-bold" style={{ color: t.titleColor }}>
                    Liquidation Submission
                </h1>
                <p className="text-[11px] mt-0.5" style={{ color: t.subColor }}>
                    View and manage liquidation records
                </p>
            </div>

            <div
                className="rounded-2xl overflow-hidden"
                style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}
            >
                {/* ── Filter Section ── */}
                <div
                    className="px-6 py-3 flex flex-wrap items-center gap-4"
                    style={{ borderBottom: `1px solid ${t.sectionDivider}` }}
                >
                    <DeptDropdown
                        value={selectedDeptId}
                        onChange={handleDeptChange}
                        options={deptOptions}
                        t={t}
                        isDark={isDark}
                    />

                    <div className="flex items-center gap-4">
                        <Checkbox checked={ascending} onChange={handleAscending} label="Ascending" t={t} isDark={isDark} />
                        <Checkbox checked={descending} onChange={handleDescending} label="Descending" t={t} isDark={isDark} />
                    </div>

                    <button
                        onClick={fetchRecords}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none ml-auto"
                        style={{
                            background: isLoading ? t.btnDisBg : t.btnRefresh.bg,
                            borderColor: isLoading ? t.btnDisBorder : t.btnRefresh.border,
                            color: isLoading ? t.btnDisText : t.btnRefresh.text,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                        }}
                        onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = t.btnRefresh.hover; }}
                        onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = isLoading ? t.btnDisBg : t.btnRefresh.bg; }}
                    >
                        <RefreshCw className={`w-3.5 h-3.5${isLoading ? ' animate-spin' : ''}`} />
                        {isLoading ? 'Loading…' : 'Requery'}
                    </button>
                </div>

                {/* ── Table ── */}
                <div style={{ overflowX: 'auto' }}>
                    <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 900 }}>
                        <thead>
                            <tr style={{ background: t.tableHeadBg }}>
                                {TABLE_COLS.map((col, i) => (
                                    <th
                                        key={col}
                                        style={{
                                            padding: '11px 16px',
                                            fontSize: 11, fontWeight: 700,
                                            textTransform: 'uppercase', letterSpacing: '0.08em',
                                            color: t.tableHeadText,
                                            borderBottom: `2px solid ${t.tableHeadBorder}`,
                                            borderRight: i < TABLE_COLS.length - 1 ? `1px solid ${t.tableHeadBorder}` : 'none',
                                            textAlign: 'left', whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length} style={{ padding: '52px 16px', textAlign: 'center', fontSize: 13, color: t.cellMuted }}>
                                        Loading records…
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length} style={{ padding: '52px 16px', textAlign: 'center', fontSize: 13, color: t.cellMuted }}>
                                        No records found
                                    </td>
                                </tr>
                            ) : (
                                records.map((row, idx) => {
                                    const baseBg = idx % 2 === 0 ? t.rowEvenBg : 'transparent';
                                    const cs = (i: number): React.CSSProperties => ({
                                        padding: '11px 16px', fontSize: 13, color: t.cellText,
                                        borderBottom: `1px solid ${t.rowBorder}`,
                                        borderRight: i < TABLE_COLS.length - 1 ? `1px solid ${t.rowBorder}` : 'none',
                                        whiteSpace: 'nowrap',
                                    });
                                    return (
                                    <tr
                                        key={row.id}
                                        onClick={() => setSelectedRow(row)}
                                        style={{ background: baseBg, transition: 'background .1s', cursor: 'pointer' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.rowHoverBg; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = baseBg; }}
                                    >
                                        {/* Date */}
                                        <td style={cs(0)}>
                                            <span style={{ fontSize: 12, color: t.cellMuted, fontVariantNumeric: 'tabular-nums' }}>
                                                {row.date ? new Date(row.date).toLocaleDateString('en-PH') : '—'}
                                            </span>
                                        </td>
                                        {/* Requisition No. */}
                                        <td style={cs(1)}>
                                            <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.03em', color: t.cellBlue }}>
                                                {row.requisition_no}
                                            </span>
                                        </td>
                                        {/* Department / Section */}
                                        <td style={{ ...cs(2), whiteSpace: 'normal' }}>{row.department_section}</td>
                                        {/* Requested By */}
                                        <td style={{ ...cs(3), whiteSpace: 'normal' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <img
                                                    src={`https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${row.requested_by_empno}_2`}
                                                    alt={row.requested_by}
                                                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `1px solid ${t.rowBorder}` }}
                                                    onError={e => {
                                                        (e.currentTarget as HTMLImageElement).src =
                                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(row.requested_by)}&size=32&background=random`;
                                                    }}
                                                />
                                                <span style={{ fontSize: 13, color: t.cellText, fontWeight: 500 }}>{row.requested_by}</span>
                                            </div>
                                        </td>
                                        {/* Total Amount */}
                                        <td style={{ ...cs(4), fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                                            ₱ {fmt(row.total_amount)}
                                        </td>
                                        {/* Status */}
                                        <td style={cs(5)}>
                                            <StatusBadge status={row.status} isDark={isDark} />
                                        </td>
                                        {/* Location */}
                                        <td style={cs(6)}>
                                            <span style={{ color: t.cellMuted, textTransform: 'uppercase' }}>{row.location ?? '—'}</span>
                                        </td>
                                        {/* From */}
                                        <td style={{ ...cs(7), borderRight: 'none' }}>
                                            <span style={{ color: t.cellMuted, textTransform: 'uppercase' }}>{row.from ?? '—'}</span>
                                        </td>
                                    </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Upload Modal ── */}
            {selectedRow && (
                <LiquidationUploadModal
                    row={selectedRow}
                    t={t}
                    isDark={isDark}
                    onClose={() => setSelectedRow(null)}
                />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export — render-prop pattern
// ─────────────────────────────────────────────────────────────────────────────
export default function LiquidationSubmission() {
    return (
        <AdamsonBudgetLayout>
            {(isDark: boolean) => {
                const t = isDark ? T.dark : T.light;
                return <LiquidationSubmissionInner t={t} isDark={isDark} />;
            }}
        </AdamsonBudgetLayout>
    );
}