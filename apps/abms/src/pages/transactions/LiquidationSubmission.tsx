import React, { useState, useRef, useEffect, useCallback } from 'react';
import AdamsonBudgetLayout from '../../layouts/Screenlayout.tsx';
import { RefreshCw, ChevronDown, X, Upload, FileText, Trash2, Lock, ExternalLink, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
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
// Toast — same pattern and color palette as StockroomView / BudgetView
// ─────────────────────────────────────────────────────────────────────────────
type ToastKind = 'success' | 'error' | 'info' | 'warning';
interface ToastItem { id: number; kind: ToastKind; title: string; description?: string }

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

function Toasts({
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
    is_approve: number;
    remarks: string | null;
}

interface MediaFile {
    id: number;
    name: string;
    file_name: string;
    mime_type: string;
    size: number;
    url: string;
    expires_at: string;
    created_at: string;
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
// Allowed MIME types mirror the server-side validation
const ALLOWED_MIME_TYPES = new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'text/csv',
    'application/csv',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
]);
const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB

interface PendingFile {
    id: string;
    file: File;
}

function LiquidationUploadModal({
    row, t, isDark, isAdmin, onClose, onRowUpdate,
}: {
    row: LiquidationRecord;
    t: typeof T.dark;
    isDark: boolean;
    isAdmin: boolean;
    onClose: () => void;
    onRowUpdate: (updated: Partial<LiquidationRecord>) => void;
}) {
    // is_approve = 1 → entry is approved, file submission blocked for regular users
    // isAdmin → can only view files, never upload/delete regardless of approval state
    const isApproved = row.is_approve === 1;
    const isLocked = isApproved || isAdmin;

    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoadingFiles, setIsLoadingFiles] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [openingId, setOpeningId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Toasts ───────────────────────────────────────────────────────────────
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const toastCounter = useRef(0);
    const addToast = useCallback((kind: ToastKind, title: string, description?: string) => {
        const id = ++toastCounter.current;
        setToasts(prev => [...prev, { id, kind, title, description }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    // ── Admin state ──────────────────────────────────────────────────────────
    const [localIsApprove, setLocalIsApprove] = useState(row.is_approve);
    const [remarksValue, setRemarksValue] = useState(row.remarks ?? '');
    const [isTogglingApprove, setIsTogglingApprove] = useState(false);
    const [isSavingRemarks, setIsSavingRemarks] = useState(false);

    // Fetch already-uploaded files on mount
    useEffect(() => {
        fetchUploadedFiles();
    }, []);

    async function fetchUploadedFiles() {
        setIsLoadingFiles(true);
        try {
            const res = await financeSvc.get(`abms/liquidation-submission/rs/${row.id}/files`);
            setUploadedFiles(res.data.data ?? []);
        } catch (err) {
            console.error('Failed to fetch uploaded files:', err);
            addToast('error', 'Could not load documents', 'Failed to retrieve uploaded files. Please close and reopen.');
        } finally {
            setIsLoadingFiles(false);
        }
    }

    function addFiles(incoming: FileList | null) {
        if (!incoming || isLocked) return;
        setFileError(null);

        const rejected: string[] = [];
        const next: PendingFile[] = [];

        Array.from(incoming).forEach(file => {
            if (!ALLOWED_MIME_TYPES.has(file.type)) {
                rejected.push(`"${file.name}" — unsupported file type`);
                return;
            }
            if (file.size > MAX_FILE_BYTES) {
                rejected.push(`"${file.name}" — exceeds 100 MB limit`);
                return;
            }
            next.push({
                id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
                file,
            });
        });

        if (rejected.length > 0) {
            setFileError(rejected.join('\n'));
            rejected.forEach(msg => {
                addToast('warning', 'File not accepted', msg);
            });
        }
        if (next.length > 0) {
            setPendingFiles(prev => [...prev, ...next]);
            addToast('info',
                `${next.length} file${next.length !== 1 ? 's' : ''} queued`,
                `Ready to submit${next.length === 1 ? `: ${next[0].file.name}` : '.'}`,
            );
        }
    }

    function removePending(id: string) {
        setPendingFiles(prev => prev.filter(f => f.id !== id));
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
        if (!isLocked) addFiles(e.dataTransfer.files);
    }

    async function handleOpenFile(f: MediaFile) {
        if (new Date(f.expires_at) > new Date()) {
            window.open(f.url, '_blank', 'noopener,noreferrer');
            return;
        }
        setOpeningId(f.id);
        try {
            const res = await financeSvc.get(
                `abms/liquidation-submission/rs/${row.id}/files/${f.id}/url`,
            );
            const freshUrl: string = res.data.url;
            setUploadedFiles(prev =>
                prev.map(u => u.id === f.id
                    ? { ...u, url: freshUrl, expires_at: res.data.expires_at }
                    : u,
                ),
            );
            window.open(freshUrl, '_blank', 'noopener,noreferrer');
        } catch (err) {
            console.error('Failed to get signed URL:', err);
            addToast('error', 'Could not open file', 'Failed to generate a secure link. Please try again.');
        } finally {
            setOpeningId(null);
        }
    }

    async function handleDeleteUploaded(mediaId: number) {
        setDeletingId(mediaId);
        try {
            await financeSvc.delete(`abms/liquidation-submission/rs/${row.id}/files/${mediaId}`);
            const deleted = uploadedFiles.find(f => f.id === mediaId);
            setUploadedFiles(prev => prev.filter(f => f.id !== mediaId));
            addToast('success', 'File deleted', deleted ? `"${deleted.file_name}" has been removed.` : 'File removed successfully.');
        } catch (err) {
            console.error('Failed to delete file:', err);
            addToast('error', 'Delete failed', 'Could not delete the file. Please try again.');
        } finally {
            setDeletingId(null);
        }
    }

    async function handleSubmit() {
        if (pendingFiles.length === 0 || isSubmitting || isLocked) return;
        setIsSubmitting(true);
        setSubmitError(null);
        const fileCount = pendingFiles.length;
        try {
            const formData = new FormData();
            pendingFiles.forEach(f => formData.append('files[]', f.file));
            await financeSvc.post(
                `abms/liquidation-submission/rs/${row.id}/files`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } },
            );
            setPendingFiles([]);
            await fetchUploadedFiles();
            addToast('success', 'Upload complete', `${fileCount} file${fileCount !== 1 ? 's' : ''} submitted successfully.`);
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? 'Upload failed. Please try again.';
            setSubmitError(msg);
            addToast('error', 'Upload failed', msg);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleToggleApprove() {
        setIsTogglingApprove(true);
        try {
            const res = await financeSvc.patch(`abms/liquidation-submission/rs/${row.id}/approve`);
            const newIsApprove: number = res.data.is_approve;
            setLocalIsApprove(newIsApprove);
            onRowUpdate({ is_approve: newIsApprove });
            addToast(
                newIsApprove === 1 ? 'success' : 'info',
                newIsApprove === 1 ? 'Entry approved' : 'Approval removed',
                newIsApprove === 1
                    ? `RS ${row.requisition_no} has been approved and removed from the liquidation queue.`
                    : `RS ${row.requisition_no} approval has been revoked and restored to the queue.`,
            );
            // Approved entries drop out of the for_liquidation list — close modal
            if (newIsApprove === 1) {
                setTimeout(() => onClose(), 1200);
            }
        } catch (err) {
            console.error('Failed to toggle approval:', err);
            addToast('error', 'Action failed', 'Could not update approval status. Please try again.');
        } finally {
            setIsTogglingApprove(false);
        }
    }

    async function handleSaveRemarks() {
        setIsSavingRemarks(true);
        try {
            await financeSvc.patch(`abms/liquidation-submission/rs/${row.id}/remarks`, {
                remarks: remarksValue,
            });
            onRowUpdate({ remarks: remarksValue });
            addToast('success', 'Remarks saved', 'The remarks have been updated successfully.');
        } catch (err) {
            console.error('Failed to save remarks:', err);
            addToast('error', 'Save failed', 'Could not save remarks. Please try again.');
        } finally {
            setIsSavingRemarks(false);
        }
    }

    function formatBytes(bytes: number) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function handleBackdropClick(e: React.MouseEvent) {
        if (e.target === e.currentTarget) onClose();
    }

    const dropzoneBorder = isLocked
        ? (isDark ? 'rgba(100,116,139,0.30)' : 'rgba(148,163,184,0.35)')
        : isDragging
            ? (isDark ? 'rgba(99,155,255,0.80)' : 'rgba(37,99,235,0.70)')
            : (isDark ? 'rgba(100,160,255,0.28)' : 'rgba(37,99,235,0.25)');

    const dropzoneBg = isLocked
        ? (isDark ? 'rgba(20,30,50,0.40)' : 'rgba(248,250,252,0.70)')
        : isDragging
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
            {/* Toasts — rendered outside the modal card so they're never clipped */}
            <Toasts items={toasts} isDark={isDark} onDismiss={id => setToasts(p => p.filter(t => t.id !== id))} />
            <div
                style={{
                    width: '100%', maxWidth: 580,
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: t.titleColor, margin: 0 }}>
                                Liquidation Documents
                            </p>
                            {isApproved && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                    background: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(254,226,226,0.70)',
                                    color: isDark ? '#f87171' : '#991b1b',
                                    border: `1px solid ${isDark ? 'rgba(248,113,113,0.35)' : 'rgba(220,38,38,0.28)'}`,
                                }}>
                                    <Lock style={{ width: 9, height: 9 }} />
                                    Locked
                                </span>
                            )}
                        </div>
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
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* ── Approved notice (regular users only) ── */}
                    {isApproved && !isAdmin && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            padding: '12px 14px', borderRadius: 10,
                            background: isDark ? 'rgba(248,113,113,0.08)' : 'rgba(254,242,242,0.90)',
                            border: `1px solid ${isDark ? 'rgba(248,113,113,0.25)' : 'rgba(220,38,38,0.22)'}`,
                        }}>
                            <Lock style={{ width: 14, height: 14, color: isDark ? '#f87171' : '#dc2626', flexShrink: 0, marginTop: 1 }} />
                            <p style={{ margin: 0, fontSize: 12, color: isDark ? '#fca5a5' : '#991b1b', lineHeight: 1.5 }}>
                                This entry has already been approved. File submission is no longer allowed.
                                You may still view the documents uploaded below.
                            </p>
                        </div>
                    )}

                    {/* ── Admin read-only notice ── */}
                    {isAdmin && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            padding: '12px 14px', borderRadius: 10,
                            background: isDark ? 'rgba(99,155,255,0.07)' : 'rgba(239,246,255,0.90)',
                            border: `1px solid ${isDark ? 'rgba(99,155,255,0.22)' : 'rgba(37,99,235,0.20)'}`,
                        }}>
                            <Lock style={{ width: 14, height: 14, color: isDark ? '#60a5fa' : '#1d4ed8', flexShrink: 0, marginTop: 1 }} />
                            <p style={{ margin: 0, fontSize: 12, color: isDark ? '#93c5fd' : '#1e40af', lineHeight: 1.5 }}>
                                You are viewing this entry as an administrator. File upload and deletion are not available in this view.
                            </p>
                        </div>
                    )}

                    {/* ── Dropzone ── */}
                    <div
                        onDragOver={e => { e.preventDefault(); if (!isLocked) setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => { if (!isLocked) fileInputRef.current?.click(); }}
                        style={{
                            border: `2px dashed ${dropzoneBorder}`,
                            borderRadius: 12,
                            background: dropzoneBg,
                            padding: '28px 20px',
                            textAlign: 'center',
                            cursor: isLocked ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                            opacity: isLocked ? 0.60 : 1,
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            disabled={isLocked}
                            style={{ display: 'none' }}
                            onChange={e => addFiles(e.target.files)}
                        />
                        <div style={{
                            width: 38, height: 38, borderRadius: '50%', margin: '0 auto 10px',
                            background: isLocked
                                ? (isDark ? 'rgba(100,116,139,0.20)' : 'rgba(241,245,249,0.80)')
                                : (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.10)'),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {isLocked
                                ? <Lock style={{ width: 16, height: 16, color: t.cellMuted }} />
                                : <Upload style={{ width: 16, height: 16, color: t.cellBlue }} />
                            }
                        </div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isLocked ? t.cellMuted : t.cellText }}>
                            {isLocked ? 'Submission closed' : isDragging ? 'Drop files here' : 'Drag & drop files here'}
                        </p>
                        {!isLocked && (
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: t.cellMuted }}>
                                or <span style={{ color: t.cellBlue, fontWeight: 600 }}>click to browse</span>
                                {' '}— multiple files allowed
                            </p>
                        )}
                        {!isLocked && (
                            <p style={{ margin: '6px 0 0', fontSize: 10, color: t.cellMuted, letterSpacing: '0.02em' }}>
                                Accepted: PDF, Excel (xlsx), CSV, Images (jpg, png, gif, webp, bmp, svg) · Max 100 MB per file
                            </p>
                        )}
                    </div>

                    {/* ── Pending file list ── */}
                    {pendingFiles.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: t.cellMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} queued for upload
                            </p>
                            {pendingFiles.map(f => (
                                <div
                                    key={f.id}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '9px 12px', borderRadius: 8,
                                        background: isDark ? 'rgba(13,26,58,0.55)' : 'rgba(232,242,255,0.70)',
                                        border: `1px solid ${t.rowBorder}`,
                                    }}
                                >
                                    <FileText style={{ width: 14, height: 14, color: t.cellBlue, flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: t.cellText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {f.file.name}
                                        </p>
                                        <p style={{ margin: 0, fontSize: 11, color: t.cellMuted }}>{formatBytes(f.file.size)}</p>
                                    </div>
                                    <button
                                        onClick={() => removePending(f.id)}
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

                    {/* ── File validation errors ── */}
                    {fileError && (
                        <div style={{
                            padding: '10px 14px', borderRadius: 8, fontSize: 12,
                            background: isDark ? 'rgba(248,113,113,0.08)' : 'rgba(254,242,242,0.90)',
                            border: `1px solid ${isDark ? 'rgba(248,113,113,0.30)' : 'rgba(220,38,38,0.25)'}`,
                            color: isDark ? '#fca5a5' : '#991b1b',
                            whiteSpace: 'pre-line', lineHeight: 1.6,
                        }}>
                            <span style={{ fontWeight: 700 }}>File rejected:</span>{'\n'}{fileError}
                        </div>
                    )}

                    {/* ── Submit error ── */}
                    {submitError && (
                        <p style={{ margin: 0, fontSize: 12, color: isDark ? '#f87171' : '#dc2626', fontWeight: 500 }}>
                            {submitError}
                        </p>
                    )}

                    {/* ── Already-uploaded files ── */}
                    <div>
                        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: t.cellMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Uploaded Documents
                        </p>
                        {isLoadingFiles ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: t.cellMuted, fontSize: 12 }}>
                                <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                                Loading files…
                            </div>
                        ) : uploadedFiles.length === 0 ? (
                            <p style={{ margin: 0, fontSize: 12, color: t.cellMuted, fontStyle: 'italic' }}>
                                No documents uploaded yet.
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {uploadedFiles.map(f => (
                                    <div
                                        key={f.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '9px 12px', borderRadius: 8,
                                            background: isDark ? 'rgba(13,26,58,0.40)' : 'rgba(240,246,255,0.80)',
                                            border: `1px solid ${t.rowBorder}`,
                                        }}
                                    >
                                        <FileText style={{ width: 14, height: 14, color: t.cellGreen, flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: t.cellText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {f.file_name}
                                            </p>
                                            <p style={{ margin: 0, fontSize: 11, color: t.cellMuted }}>
                                                {formatBytes(f.size)} · {new Date(f.created_at).toLocaleDateString('en-PH')}
                                            </p>
                                        </div>
                                        {/* View — opens fresh signed URL */}
                                        <button
                                            onClick={() => handleOpenFile(f)}
                                            disabled={openingId === f.id}
                                            style={{
                                                background: 'transparent', border: 'none',
                                                cursor: openingId === f.id ? 'not-allowed' : 'pointer',
                                                color: t.cellBlue, padding: 4, borderRadius: 4, flexShrink: 0,
                                                display: 'flex', alignItems: 'center',
                                            }}
                                            title="Open file"
                                        >
                                            {openingId === f.id
                                                ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                                                : <ExternalLink style={{ width: 13, height: 13 }} />
                                            }
                                        </button>
                                        {/* Delete — only when not locked */}
                                        {!isLocked && (
                                            <button
                                                onClick={() => handleDeleteUploaded(f.id)}
                                                disabled={deletingId === f.id}
                                                style={{
                                                    background: 'transparent', border: 'none',
                                                    cursor: deletingId === f.id ? 'not-allowed' : 'pointer',
                                                    color: deletingId === f.id ? t.cellMuted : t.cellMuted,
                                                    padding: 4, borderRadius: 4, flexShrink: 0,
                                                    display: 'flex', alignItems: 'center',
                                                }}
                                                onMouseEnter={e => { if (deletingId !== f.id) (e.currentTarget as HTMLElement).style.color = t.cellRed; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = t.cellMuted; }}
                                            >
                                                {deletingId === f.id
                                                    ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                                                    : <Trash2 style={{ width: 13, height: 13 }} />
                                                }
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Remarks ── */}
                    <div>
                        <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: t.cellMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Remarks from Approving Officer
                        </p>
                        {isAdmin ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <textarea
                                    value={remarksValue}
                                    onChange={e => setRemarksValue(e.target.value)}
                                    placeholder="Enter remarks…"
                                    rows={3}
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        resize: 'vertical',
                                        padding: '10px 12px',
                                        fontSize: 12,
                                        borderRadius: 10,
                                        background: t.inputBg,
                                        border: `1px solid ${t.inputBorder}`,
                                        color: t.inputText,
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        lineHeight: 1.6,
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={handleSaveRemarks}
                                        disabled={isSavingRemarks}
                                        style={{
                                            padding: '6px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8,
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            cursor: isSavingRemarks ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.15s ease',
                                            background: isSavingRemarks ? t.btnDisBg : (isDark ? 'rgba(37,99,235,0.75)' : '#1d4ed8'),
                                            border: `1px solid ${isSavingRemarks ? t.btnDisBorder : (isDark ? 'rgba(99,155,255,0.55)' : '#1e40af')}`,
                                            color: isSavingRemarks ? t.btnDisText : '#ffffff',
                                        }}
                                    >
                                        {isSavingRemarks && <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />}
                                        {isSavingRemarks ? 'Saving…' : 'Save Remarks'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    padding: '12px 14px',
                                    borderRadius: 10,
                                    background: isDark ? 'rgba(10,20,46,0.60)' : 'rgba(240,246,255,0.90)',
                                    border: `1px solid ${isDark ? 'rgba(100,160,255,0.15)' : 'rgba(37,99,235,0.15)'}`,
                                    minHeight: 60,
                                }}
                            >
                                {remarksValue ? (
                                    <p style={{ margin: 0, fontSize: 12, color: t.cellText, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                        {remarksValue}
                                    </p>
                                ) : (
                                    <p style={{ margin: 0, fontSize: 12, color: t.cellMuted, fontStyle: 'italic' }}>
                                        No remarks yet.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

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
                        Close
                    </button>
                    {!isAdmin && !isLocked && (
                        <button
                            onClick={handleSubmit}
                            disabled={pendingFiles.length === 0 || isSubmitting}
                            style={{
                                padding: '7px 18px', fontSize: 12, fontWeight: 700, borderRadius: 8,
                                background: (pendingFiles.length === 0 || isSubmitting)
                                    ? t.btnDisBg
                                    : (isDark ? 'rgba(37,99,235,0.75)' : '#1d4ed8'),
                                border: `1px solid ${(pendingFiles.length === 0 || isSubmitting)
                                    ? t.btnDisBorder
                                    : (isDark ? 'rgba(99,155,255,0.55)' : '#1e40af')}`,
                                color: (pendingFiles.length === 0 || isSubmitting) ? t.btnDisText : '#ffffff',
                                cursor: (pendingFiles.length === 0 || isSubmitting) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}
                        >
                            {isSubmitting && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
                            {isSubmitting ? 'Uploading…' : `Submit${pendingFiles.length > 0 ? ` (${pendingFiles.length})` : ''}`}
                        </button>
                    )}
                    {/* ── Admin: approve toggle ── */}
                    {isAdmin && (
                        <button
                            onClick={handleToggleApprove}
                            disabled={isTogglingApprove}
                            style={{
                                padding: '7px 18px', fontSize: 12, fontWeight: 700, borderRadius: 8,
                                display: 'flex', alignItems: 'center', gap: 6,
                                cursor: isTogglingApprove ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                                // Green when currently approved (click = unapprove), Blue when not (click = approve)
                                background: isTogglingApprove
                                    ? t.btnDisBg
                                    : localIsApprove === 1
                                        ? (isDark ? 'rgba(5,150,105,0.70)' : '#059669')
                                        : (isDark ? 'rgba(37,99,235,0.75)' : '#1d4ed8'),
                                border: `1px solid ${isTogglingApprove
                                    ? t.btnDisBorder
                                    : localIsApprove === 1
                                        ? (isDark ? 'rgba(52,211,153,0.55)' : '#047857')
                                        : (isDark ? 'rgba(99,155,255,0.55)' : '#1e40af')}`,
                                color: isTogglingApprove ? t.btnDisText : '#ffffff',
                            }}
                        >
                            {isTogglingApprove
                                ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                                : localIsApprove === 1
                                    ? <CheckCircle2 style={{ width: 13, height: 13 }} />
                                    : null
                            }
                            {isTogglingApprove
                                ? 'Processing…'
                                : localIsApprove === 1
                                    ? 'Approved — click to revoke'
                                    : 'Approve'
                            }
                        </button>
                    )}
                </div>
            </div>

            {/* Spin keyframe */}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main inner component
// ─────────────────────────────────────────────────────────────────────────────
function LiquidationSubmissionInner({ t, isDark }: { t: typeof T.dark; isDark: boolean }) {
    const { data } = liquidationsubmissionRoute.useLoaderData();

    const isAdmin: boolean = (data?.data?.isadmin ?? 0) === 1;

    const deptOptions: DeptOption[] = [
        ...(data?.data?.department ?? []),
        ...(data?.data?.sections ?? []),
    ];

    const [selectedDeptId, setSelectedDeptId] = useState('');
    const [selectedDeptKind, setSelectedDeptKind] = useState<'Department' | 'Section' | ''>('');
    const [ascending, setAscending] = useState(true);
    const [descending, setDescending] = useState(false);

    const [records, setRecords] = useState<LiquidationRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [queried, setQueried] = useState(false);

    const [selectedRow, setSelectedRow] = useState<LiquidationRecord | null>(null);

    function handleRowUpdate(updated: Partial<LiquidationRecord>) {
        if (!selectedRow) return;
        const merged = { ...selectedRow, ...updated };
        // When approved, the entry's for_liquidation becomes 0 — remove it from the table
        if (merged.is_approve === 1) {
            setRecords(prev => prev.filter(r => r.id !== merged.id));
            return;
        }
        setSelectedRow(merged);
        setRecords(prev => prev.map(r => r.id === merged.id ? merged : r));
    }

    // ── Toasts ───────────────────────────────────────────────────────────────
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const toastCounter = useRef(0);
    const addToast = useCallback((kind: ToastKind, title: string, description?: string) => {
        const id = ++toastCounter.current;
        setToasts(prev => [...prev, { id, kind, title, description }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

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
            const rows = res.data.data ?? [];
            setRecords(rows);
            setQueried(true);
            addToast('success', 'Records loaded',
                rows.length === 0
                    ? 'No liquidation records found.'
                    : `${rows.length} record${rows.length !== 1 ? 's' : ''} retrieved.`,
            );
        } catch (err) {
            console.error('Failed to fetch liquidation records:', err);
            addToast('error', 'Failed to load records', 'Could not retrieve liquidation records. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedDeptId, selectedDeptKind, ascending, addToast]);

    const TABLE_COLS = [
        'Date', 'Requisition No.', 'Department / Section',
        'Requested By', 'Total Amount', 'Status', 'Location', 'From',
    ];

    return (
        <>
            <Toasts items={toasts} isDark={isDark} onDismiss={id => setToasts(p => p.filter(t => t.id !== id))} />
            <div className="p-6">
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
                            ) : !queried ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length} style={{ padding: '52px 16px', textAlign: 'center', fontSize: 13, color: t.cellMuted }}>
                                        Set your filters and press <strong>Requery</strong> to load records.
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length} style={{ padding: '52px 16px', textAlign: 'center', fontSize: 13, color: t.cellMuted }}>
                                        No records found.
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
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.03em', color: t.cellBlue }}>
                                                        {row.requisition_no}
                                                    </span>
                                                    {row.is_approve !== 0 && (
                                                        <Lock style={{ width: 11, height: 11, color: t.cellMuted }} title="Approved — submission locked" />
                                                    )}
                                                </div>
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
                    isAdmin={isAdmin}
                    onClose={() => setSelectedRow(null)}
                    onRowUpdate={handleRowUpdate}
                />
            )}
        </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export
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
