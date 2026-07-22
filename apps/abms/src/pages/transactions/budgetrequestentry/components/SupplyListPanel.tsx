import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Search, X } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import type { SupplyItem, ThemeTokens } from '../types';

export interface SupplyItem {
    id: number; item_code: string; item_name: string;
    unit_measurement: string; unit_cost: string;
}

export interface SupplyPage {
    data: SupplyItem[];
    next_cursor: string | null;
    prev_cursor: string | null;
    per_page: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SupplyListPanel — read-only table, fetched from /abms/office-supplies
// ─────────────────────────────────────────────────────────────────────────────
export function SupplyListPanel({
    t, isDark, onClose,
}: { t: ThemeTokens; isDark: boolean; onClose: () => void }) {
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<SupplyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [prevCursor, setPrevCursor] = useState<string | null>(null);
    const [currentCursor, setCurrentCursor] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const requestSequence = useRef(0);

    const fetchSupplies = useCallback(async (q: string, cursor: string | null = null, targetPage = 1) => {
        const sequence = ++requestSequence.current;
        setLoading(true);
        setError(null);
        setCurrentCursor(cursor);
        setPage(targetPage);
        try {
            const params: Record<string, string> = { sort_by: 'item_name', sort: 'asc' };
            if (q) params.search = q;
            if (cursor) params.cursor = cursor;
            const res = await financeSvc.get('/abms/office-supplies', { params });
            if (sequence !== requestSequence.current) return;
            const raw = res.data;
            setItems(Array.isArray(raw) ? raw : (raw?.data ?? []));
            setNextCursor(Array.isArray(raw) ? null : (raw?.next_cursor ?? null));
            setPrevCursor(Array.isArray(raw) ? null : (raw?.prev_cursor ?? null));
        } catch {
            if (sequence !== requestSequence.current) return;
            setError('Failed to load supply list. Please try again.');
        } finally {
            if (sequence === requestSequence.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        // No delay on initial empty search, debounce only when user is typing
        const delay = search.trim() === '' ? 0 : 350;
        const timer = setTimeout(() => fetchSupplies(search.trim(), null, 1), delay);
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
                                        onClick={() => fetchSupplies(search.trim(), currentCursor, page)}
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
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}
            >
                <span
                    className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md"
                    style={{ background: t.pillBg, color: t.pillText, border: `1px solid ${t.pillBorder}` }}
                >
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                        type="button"
                        onClick={() => prevCursor && fetchSupplies(search.trim(), prevCursor, Math.max(1, page - 1))}
                        disabled={!prevCursor || loading}
                        aria-label="Previous stockable-items page"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '5px 8px', borderRadius: 7,
                            background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                            color: t.cellText, fontSize: 10, fontWeight: 700,
                            cursor: !prevCursor || loading ? 'not-allowed' : 'pointer',
                            opacity: !prevCursor || loading ? 0.4 : 1,
                        }}
                    >
                        <ChevronLeft style={{ width: 12, height: 12 }} />
                        Previous
                    </button>
                    <span style={{ minWidth: 48, textAlign: 'center', fontSize: 10, fontWeight: 700, color: t.cellMuted }}>
                        Page {page}
                    </span>
                    <button
                        type="button"
                        onClick={() => nextCursor && fetchSupplies(search.trim(), nextCursor, page + 1)}
                        disabled={!nextCursor || loading}
                        aria-label="Next stockable-items page"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '5px 8px', borderRadius: 7,
                            background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                            color: t.cellText, fontSize: 10, fontWeight: 700,
                            cursor: !nextCursor || loading ? 'not-allowed' : 'pointer',
                            opacity: !nextCursor || loading ? 0.4 : 1,
                        }}
                    >
                        Next
                        <ChevronRight style={{ width: 12, height: 12 }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// PayeeDetailsModal — payee form for specific payment forms
