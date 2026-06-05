import React, { useState, useRef } from 'react';
import AdamsonBudgetLayout from '../../layouts/Screenlayout';
import { toast, Toaster } from 'sonner';
import { financeSvc } from '@repo/axios-config/finance-service';
import { budgetstatusRoute } from '../../router.tsx';
import {
    Save, Plus, Trash2, RotateCcw, Loader2, AlertTriangle,
} from 'lucide-react';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@repo/ui/components/alert-dialog';
import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BudgetStatus {
    id: number;
    status_no: string;
    department: string;
    budget: string | null;
    logistics: string | null;
    accounting: string | null;
    stockroom: string | null;
    cashier: string | null;
}

type RowState = BudgetStatus & {
    _key: string;   // stable react key
    _isNew: boolean;  // not yet persisted
    _dirty: boolean;  // has unsaved changes
    _deleted: boolean;  // marked for deletion
};

// ─── Columns ─────────────────────────────────────────────────────────────────

const COLUMNS: { key: keyof BudgetStatus; label: string; width: string }[] = [
    { key: 'status_no', label: 'Status No.', width: '120px' },
    { key: 'department', label: 'Department', width: '180px' },
    { key: 'budget', label: 'Budget', width: '140px' },
    { key: 'logistics', label: 'Logistics', width: '140px' },
    { key: 'accounting', label: 'Accounting', width: '140px' },
    { key: 'stockroom', label: 'Stockroom', width: '140px' },
    { key: 'cashier', label: 'Cashier', width: '140px' },
];

// ─── Tokens ───────────────────────────────────────────────────────────────────

const T = {
    dark: {
        pageBg: 'transparent',
        cardBg: 'rgba(1, 12, 36, 0.72)',
        cardBorder: 'rgba(79, 168, 255, 0.14)',
        cardShadow: '0 8px 40px rgba(0, 40, 120, 0.22)',
        titleColor: '#FFFFFF',
        subColor: '#3A5070',
        theadBg: 'rgba(0, 20, 60, 0.80)',
        theadText: '#4FA8FF',
        theadBorder: 'rgba(79, 168, 255, 0.18)',
        rowBg: 'transparent',
        rowAltBg: 'rgba(79, 168, 255, 0.025)',
        rowHoverBg: 'rgba(79, 168, 255, 0.05)',
        rowBorder: 'rgba(79, 168, 255, 0.07)',
        dirtyBg: 'rgba(79, 168, 255, 0.08)',
        dirtyBorder: 'rgba(79, 168, 255, 0.30)',
        newBg: 'rgba(16, 185, 129, 0.06)',
        newBorder: 'rgba(16, 185, 129, 0.25)',
        cellText: '#CBD5E1',
        cellBorder: 'rgba(79, 168, 255, 0.09)',
        inputBg: 'rgba(1, 8, 24, 0.70)',
        inputBorder: 'rgba(79, 168, 255, 0.20)',
        inputFocusBorder: 'rgba(79, 168, 255, 0.70)',
        inputText: '#E8F0FF',
        placeholderText: '#2A4060',
        btnSaveBg: 'rgba(0, 70, 199, 0.85)',
        btnSaveHover: 'rgba(0, 70, 199, 1)',
        btnSaveBorder: 'rgba(79, 168, 255, 0.40)',
        btnSaveText: '#FFFFFF',
        btnAddBg: 'rgba(16, 185, 129, 0.12)',
        btnAddBorder: 'rgba(16, 185, 129, 0.30)',
        btnAddText: '#10b981',
        btnResetBg: 'rgba(255,255,255,0.04)',
        btnResetBorder: 'rgba(255,255,255,0.10)',
        btnResetText: '#3A5070',
        deleteHover: 'rgba(239, 68, 68, 0.12)',
        deleteText: '#475569',
        deleteHoverText: '#f87171',
        badgeDirty: 'rgba(79, 168, 255, 0.18)',
        badgeDirtyText: '#4FA8FF',
        scrollThumb: 'rgba(79, 168, 255, 0.12)',
        countText: '#3A5070',
    },
    light: {
        pageBg: 'transparent',
        cardBg: 'rgba(240, 247, 255, 0.96)',
        cardBorder: 'rgba(0, 70, 199, 0.22)',
        cardShadow: '0 8px 40px rgba(0, 48, 135, 0.16)',
        titleColor: '#00082E',
        subColor: '#2C4A72',
        theadBg: 'rgba(196, 220, 255, 0.98)',
        theadText: '#1740C0',
        theadBorder: 'rgba(59, 130, 246, 0.28)',
        rowBg: 'transparent',
        rowAltBg: 'rgba(210, 228, 255, 0.30)',
        rowHoverBg: 'rgba(196, 220, 255, 0.55)',
        rowBorder: 'rgba(59, 130, 246, 0.13)',
        dirtyBg: 'rgba(59, 130, 246, 0.10)',
        dirtyBorder: 'rgba(59, 130, 246, 0.45)',
        newBg: 'rgba(5, 150, 105, 0.08)',
        newBorder: 'rgba(5, 150, 105, 0.35)',
        cellText: '#00082E',
        cellBorder: 'rgba(59, 130, 246, 0.13)',
        inputBg: '#ffffff',
        inputBorder: 'rgba(59, 130, 246, 0.30)',
        inputFocusBorder: 'rgba(0, 70, 199, 0.80)',
        inputText: '#00082E',
        placeholderText: '#5272A0',
        btnSaveBg: '#1740C0',
        btnSaveHover: '#1234A0',
        btnSaveBorder: 'rgba(59, 130, 246, 0.50)',
        btnSaveText: '#ffffff',
        btnAddBg: 'rgba(5, 150, 105, 0.14)',
        btnAddBorder: 'rgba(5, 150, 105, 0.38)',
        btnAddText: '#047857',
        btnResetBg: 'rgba(0, 26, 94, 0.06)',
        btnResetBorder: 'rgba(0, 26, 94, 0.16)',
        btnResetText: '#2C4A72',
        deleteHover: 'rgba(220, 38, 38, 0.10)',
        deleteText: '#5272A0',
        deleteHoverText: '#dc2626',
        badgeDirty: 'rgba(59, 130, 246, 0.18)',
        badgeDirtyText: '#1740C0',
        scrollThumb: 'rgba(0, 26, 94, 0.22)',
        countText: '#2C4A72',
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _keyCounter = 0;
const newKey = () => `row_${++_keyCounter}_${Date.now()}`;

function toRowState(b: BudgetStatus): RowState {
    return { ...b, status_no: String(b.status_no), _key: newKey(), _isNew: false, _dirty: false, _deleted: false };
}

function emptyRow(): RowState {
    return {
        id: 0, status_no: '', department: '', budget: '',
        logistics: '', accounting: '', stockroom: '', cashier: '',
        _key: newKey(), _isNew: true, _dirty: true, _deleted: false,
    };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BudgetStatus() {
    const loaderData = budgetstatusRoute.useLoaderData();

    const originalRef = useRef<BudgetStatus[]>(loaderData.data as BudgetStatus[]);
    const [rows, setRows] = useState<RowState[]>(() =>
        (loaderData.data as BudgetStatus[]).map(toRowState)
    );
    const [loading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);
    const [deleteKey, setDeleteKey] = useState<string | null>(null);

    const rowSchema = z.object({
        status_no: z.string()
            .min(1, 'Status No. is required')
            .refine(val => /^\d+$/.test(val.trim()), 'Status No. must be a whole number'),
    });

    // ── Cell change ───────────────────────────────────────────────────────────

    const handleCellChange = (key: string, field: keyof BudgetStatus, value: string) => {
        setRows(prev => prev.map(r => {
            if (r._key !== key) return r;
            const updated = { ...r, [field]: value };
            if (!r._isNew) {
                const original = originalRef.current.find(o => o.id === r.id);
                const isDirty = original
                    ? COLUMNS.some(c => (updated[c.key] ?? '') !== (original[c.key] ?? ''))
                    : true;
                updated._dirty = isDirty;
            }
            return updated;
        }));
    };

    // ── Add row ───────────────────────────────────────────────────────────────

    const addRow = () => setRows(prev => [...prev, emptyRow()]);

    // ── Mark delete ───────────────────────────────────────────────────────────

    const confirmDelete = (key: string) => setDeleteKey(key);

    const executeDelete = async () => {
        if (!deleteKey) return;
        const row = rows.find(r => r._key === deleteKey);
        if (!row) { setDeleteKey(null); return; }

        if (row._isNew) {
            setRows(prev => prev.filter(r => r._key !== deleteKey));
            setDeleteKey(null);
            return;
        }

        try {
            await financeSvc.delete(`/abms/budget-status/${row.id}`);
            setRows(prev => prev.filter(r => r._key !== deleteKey));
            originalRef.current = originalRef.current.filter(o => o.id !== row.id);
            toast.success('Row deleted.');
        } catch {
            toast.error('Failed to delete row.');
        } finally {
            setDeleteKey(null);
        }
    };

    // ── Global save ───────────────────────────────────────────────────────────

    const handleSave = async () => {
        const toSave = rows.filter(r => r._dirty && !r._deleted);
        if (!toSave.length) {
            toast.info('No changes to save.');
            return;
        }

        // ── Client validation ────────────────────────────────────────
        const invalidRows: string[] = [];
        toSave.forEach((row, idx) => {
            const result = rowSchema.safeParse({ status_no: String(row.status_no) });
            if (!result.success) {
                result.error?.issues?.forEach(e => {
                    invalidRows.push(`Row ${idx + 1}: ${e.message}`);
                });
            }
        });

        if (invalidRows.length) {
            invalidRows.forEach(msg => toast.error(msg));
            return;
        }
        // ─────────────────────────────────────────────────────────────

        setSaving(true);
        const errors: string[] = [];

        await Promise.all(toSave.map(async row => {
            const payload = {
                status_no: row.status_no,
                department: row.department,
                budget: row.budget || null,
                logistics: row.logistics || null,
                accounting: row.accounting || null,
                stockroom: row.stockroom || null,
                cashier: row.cashier || null,
            };
            try {
                if (row._isNew) {
                    const res = await financeSvc.post('/abms/budget-status', payload);
                    const created: BudgetStatus = res.data.data;
                    originalRef.current.push(created);
                    setRows(prev => prev.map(r =>
                        r._key === row._key
                            ? { ...r, id: created.id, _isNew: false, _dirty: false }
                            : r
                    ));
                } else {
                    await financeSvc.put(`/abms/budget-status/${row.id}`, payload);
                    originalRef.current = originalRef.current.map(o =>
                        o.id === row.id ? { ...o, ...payload } : o
                    );
                    setRows(prev => prev.map(r =>
                        r._key === row._key ? { ...r, _dirty: false } : r
                    ));
                }
            } catch (e: any) {
                errors.push(row.status_no || `Row ${row._key}`);
            }
        }));

        setSaving(false);
        if (errors.length) {
            toast.error(`Failed to save: ${errors.join(', ')}`);
        } else {
            toast.success('All changes saved successfully.');
        }
    };

    // ── Reset ─────────────────────────────────────────────────────────────────

    const handleReset = () => {
        setRows(originalRef.current.map(toRowState));
        setConfirmReset(false);
    };

    // ── Derived ───────────────────────────────────────────────────────────────

    const dirtyCount = rows.filter(r => r._dirty).length;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <AdamsonBudgetLayout>
            {(isDark: boolean) => {
                const t = isDark ? T.dark : T.light;

                const inputStyle = (focused: boolean): React.CSSProperties => ({
                    width:        '100%',
                    background:   t.inputBg,
                    border:       `1px solid ${focused ? t.inputFocusBorder : t.inputBorder}`,
                    borderRadius: '5px',
                    color:        t.inputText,
                    fontSize:     '0.875rem',
                    padding:      '4px 7px',
                    outline:      'none',
                    transition:   'border-color 0.15s',
                    fontFamily:   'inherit',
                });

                return (
                    <>
                        <Toaster richColors position="bottom-right" />

                        {/* ── Header bar ──────────────────────────────────────── */}
                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                            <div>
                                <h1 className="text-xl font-bold tracking-tight" style={{ color: t.titleColor }}>
                                    Budget Status
                                </h1>
                                <p className="text-xs mt-0.5" style={{ color: t.subColor }}>
                                    Inline spreadsheet — edit cells then save all changes at once.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {dirtyCount > 0 && (
                                    <span
                                        className="text-xs px-2.5 py-1 rounded-full font-semibold"
                                        style={{ background: t.badgeDirty, color: t.badgeDirtyText }}
                                    >
                                        {dirtyCount} unsaved {dirtyCount === 1 ? 'change' : 'changes'}
                                    </span>
                                )}

                                <button
                                    onClick={() => setConfirmReset(true)}
                                    disabled={dirtyCount === 0 || saving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
                                    style={{
                                        background: t.btnResetBg,
                                        border: `1px solid ${t.btnResetBorder}`,
                                        color: t.btnResetText,
                                    }}
                                >
                                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                                </button>

                                <button
                                    onClick={addRow}
                                    disabled={saving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                    style={{
                                        background: t.btnAddBg,
                                        border: `1px solid ${t.btnAddBorder}`,
                                        color: t.btnAddText,
                                    }}
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Row
                                </button>

                                <button
                                    onClick={handleSave}
                                    disabled={saving || dirtyCount === 0}
                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
                                    style={{
                                        background: t.btnSaveBg,
                                        border: `1px solid ${t.btnSaveBorder}`,
                                        color: t.btnSaveText,
                                    }}
                                >
                                    {saving
                                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                                        : <><Save className="w-3.5 h-3.5" /> Save All</>
                                    }
                                </button>
                            </div>
                        </div>

                        {/* ── Table card ──────────────────────────────────────── */}
                        <div
                            style={{
                                background: t.cardBg,
                                border: `1px solid ${t.cardBorder}`,
                                borderRadius: '14px',
                                boxShadow: t.cardShadow,
                                overflow: 'hidden',
                            }}
                        >
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>

                                    {/* ── Head ───────────────────────────────────────── */}
                                    <thead>
                                        <tr style={{ background: t.theadBg, borderBottom: `1px solid ${t.theadBorder}` }}>
                                            {COLUMNS.map((col, i) => (
                                                <th
                                                    key={col.key}
                                                    style={{
                                                        width: col.width,
                                                        minWidth: col.width,
                                                        padding: '10px 12px',
                                                        textAlign: 'left',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        letterSpacing: '0.08em',
                                                        textTransform: 'uppercase',
                                                        color: t.theadText,
                                                        borderRight: i < COLUMNS.length - 1 ? `1px solid ${t.theadBorder}` : 'none',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {col.label}
                                                </th>
                                            ))}
                                            <th style={{
                                                width: '48px', padding: '10px 8px', textAlign: 'center',
                                                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
                                                textTransform: 'uppercase', color: t.theadText,
                                            }}>
                                                Del
                                            </th>
                                        </tr>
                                    </thead>

                                    {/* ── Body ───────────────────────────────────────── */}
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={COLUMNS.length + 1} style={{ padding: '48px', textAlign: 'center' }}>
                                                    <div className="flex items-center justify-center gap-2" style={{ color: t.subColor }}>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span className="text-sm">Loading records…</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : rows.length === 0 ? (
                                            <tr>
                                                <td colSpan={COLUMNS.length + 1} style={{ padding: '48px', textAlign: 'center' }}>
                                                    <p className="text-sm" style={{ color: t.subColor }}>
                                                        No records yet. Click <strong>Add Row</strong> to begin.
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : (
                                            rows.map((row, rowIdx) => (
                                                <DataRow
                                                    key={row._key}
                                                    row={row}
                                                    rowIdx={rowIdx}
                                                    t={t}
                                                    inputStyle={inputStyle}
                                                    onCellChange={handleCellChange}
                                                    onDelete={() => confirmDelete(row._key)}
                                                />
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Footer count ─────────────────────────────────── */}
                            {!loading && rows.length > 0 && (
                                <div style={{
                                    padding: '8px 16px',
                                    borderTop: `1px solid ${t.theadBorder}`,
                                    background: t.theadBg,
                                }}>
                                    <span className="text-xs" style={{ color: t.countText }}>
                                        {rows.length} {rows.length === 1 ? 'record' : 'records'}
                                        {dirtyCount > 0 && ` · ${dirtyCount} unsaved`}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* ── Reset Confirm ────────────────────────────────────── */}
                        <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
                            <AlertDialogContent style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle style={{ color: t.titleColor }} className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-400" /> Discard changes?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription style={{ color: t.subColor }}>
                                        All {dirtyCount} unsaved {dirtyCount === 1 ? 'change' : 'changes'} will be lost and the table will revert to its last saved state.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel style={{ color: t.btnResetText }}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleReset} className="bg-amber-500 hover:bg-amber-600 text-white">
                                        Discard
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* ── Delete Confirm ───────────────────────────────────── */}
                        <AlertDialog open={!!deleteKey} onOpenChange={open => !open && setDeleteKey(null)}>
                            <AlertDialogContent style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle style={{ color: t.titleColor }} className="flex items-center gap-2">
                                        <Trash2 className="w-4 h-4 text-red-400" /> Delete this row?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription style={{ color: t.subColor }}>
                                        This will permanently remove the record. This action cannot be undone from the UI.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel style={{ color: t.btnResetText }}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                );
            }}
        </AdamsonBudgetLayout>
    );
}

// ─── DataRow (memoized for perf) ──────────────────────────────────────────────

const DataRow = React.memo(function DataRow({
    row, rowIdx, t, inputStyle, onCellChange, onDelete,
}: {
    row: RowState;
    rowIdx: number;
    t: typeof T.dark;
    inputStyle: (focused: boolean) => React.CSSProperties;
    onCellChange: (key: string, field: keyof BudgetStatus, value: string) => void;
    onDelete: () => void;
}) {
    const [focusedCol, setFocusedCol] = useState<string | null>(null);
    const [hovered, setHovered] = useState(false);

    const rowBg = row._isNew
        ? t.newBg
        : row._dirty
            ? t.dirtyBg
            : rowIdx % 2 === 1 ? t.rowAltBg : t.rowBg;

    const rowBorderLeft = row._isNew
        ? `2px solid ${t.newBorder.replace('rgba', 'rgba').replace('0.22', '0.6')}`
        : row._dirty
            ? `2px solid ${t.dirtyBorder}`
            : '2px solid transparent';

    return (
        <tr
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered && !row._dirty && !row._isNew ? t.rowHoverBg : rowBg,
                borderBottom: `1px solid ${t.rowBorder}`,
                borderLeft: rowBorderLeft,
                transition: 'background 0.12s',
            }}
        >
            {COLUMNS.map((col, i) => (
                <td
                    key={col.key}
                    style={{
                        padding: '5px 8px',
                        borderRight: i < COLUMNS.length - 1 ? `1px solid ${t.cellBorder}` : 'none',
                        verticalAlign: 'middle',
                    }}
                >
                    <CellInput
                        value={(row[col.key] as string) ?? ''}
                        placeholder={col.label}
                        focused={focusedCol === col.key}
                        onFocus={() => setFocusedCol(col.key)}
                        onBlur={() => setFocusedCol(null)}
                        onChange={v => onCellChange(row._key, col.key, v)}
                        inputStyle={inputStyle}
                        t={t}
                    />
                </td>
            ))}
            <td style={{ padding: '5px 6px', textAlign: 'center', verticalAlign: 'middle' }}>
                <button
                    onClick={onDelete}
                    className="flex items-center justify-center w-7 h-7 rounded-md transition-all mx-auto"
                    style={{ color: hovered ? t.deleteHoverText : t.deleteText }}
                    onMouseEnter={e => (e.currentTarget.style.background = t.deleteHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    title="Delete row"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </td>
        </tr>
    );
});

// ─── CellInput ────────────────────────────────────────────────────────────────

function CellInput({
    value, placeholder, focused, onFocus, onBlur, onChange, inputStyle, t,
}: {
    value: string;
    placeholder: string;
    focused: boolean;
    onFocus: () => void;
    onBlur: () => void;
    onChange: (v: string) => void;
    inputStyle: (focused: boolean) => React.CSSProperties;
    t: typeof T.dark;
}) {
    return (
        <input
            type="text"
            value={value}
            placeholder={placeholder}
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={e => onChange(e.target.value)}
            style={{
                ...inputStyle(focused),
                '--placeholder-color': t.placeholderText,
            } as React.CSSProperties}
        />
    );
}