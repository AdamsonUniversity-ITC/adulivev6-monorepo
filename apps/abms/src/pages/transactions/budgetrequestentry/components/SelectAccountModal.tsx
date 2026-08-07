import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Search, X, RefreshCw, AlertCircle } from 'lucide-react';
import type { ThemeTokens } from '../types';
import { financeSvc } from '@repo/axios-config';
import {fmtCurrency} from '../utils';

export interface AccountOption {
    account_id: number;
    account_code: string;
    account_name: string;
    main_account_code?: string | null;
    main_account_name?: string | null;
    balance: number;
    account_parent_id: number;
}

export function SelectAccountModal({
    open, onClose, onSelect, t, isDark,
    departmentId, sectionId, currentSchoolYear, requisitionId,
}: {
    open: boolean;
    onClose: () => void;
    onSelect: (item: AccountOption) => void;
    t: ThemeTokens;
    isDark: boolean;
    departmentId: string;
    sectionId: string;
    currentSchoolYear: string;
    requisitionId?: number | null;
}) {
    const [items, setItems] = useState<AccountOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [prevCursor, setPrevCursor] = useState<string | null>(null);
    const [currentCursor, setCurrentCursor] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const requestSequence = useRef(0);

    const fetchAccounts = useCallback(async (query: string, cursor: string | null = null, targetPage = 1) => {
        const sequence = ++requestSequence.current;
        setLoading(true);
        setError(null);
        setCurrentCursor(cursor);
        setPage(targetPage);

        const params: Record<string, string> = {};
        if (!requisitionId) {
            params.currentSchoolYear = currentSchoolYear;
            if (departmentId) params.departmentId = departmentId;
            else params.sectionId = sectionId;
        }
        if (query) params.search = query;
        if (cursor) params.cursor = cursor;

        try {
            const endpoint = requisitionId
                ? `/abms/budget-request-entry/${requisitionId}/editable-accounts`
                : '/abms/budget-request-entry/accounts';
            const { data } = await financeSvc.get(endpoint, { params });
            if (sequence !== requestSequence.current) return;
            setItems(data?.accounts ?? []);
            setNextCursor(data?.next_cursor ?? null);
            setPrevCursor(data?.prev_cursor ?? null);
        } catch {
            if (sequence !== requestSequence.current) return;
            setError('Failed to load accounts. Please try again.');
        } finally {
            if (sequence === requestSequence.current) setLoading(false);
        }
    }, [currentSchoolYear, departmentId, requisitionId, sectionId]);

    useEffect(() => {
        if (!open) return;
        requestSequence.current += 1;
        setSearch(''); setItems([]); setLoading(true); setError(null);
        setNextCursor(null); setPrevCursor(null); setCurrentCursor(null); setPage(1);
    }, [open, departmentId, sectionId, currentSchoolYear, requisitionId]);

    useEffect(() => {
        if (!open) return;
        const delay = search.trim() === '' ? 0 : 350;
        const timer = window.setTimeout(() => fetchAccounts(search.trim(), null, 1), delay);
        return () => window.clearTimeout(timer);
    }, [open, search, fetchAccounts]);

    if (!open) return null;

    const displayAccountCode = (account: AccountOption) => account.main_account_code
        ? `${account.main_account_code} - ${account.account_code}`
        : account.account_code;
    const displayAccountName = (account: AccountOption) => account.main_account_name
        ? `${account.main_account_name} - ${account.account_name}`
        : account.account_name;

    const COLS = ['Account Code', 'Account Name', 'Balance'];

    const portal = createPortal(
        <div
            className="abms-modal-backdrop fixed inset-0 z-[100002] flex items-center justify-center overflow-y-auto p-3 sm:p-4"
            style={{
                background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(0,20,60,0.52)',
                backdropFilter: 'blur(6px)',
            }}
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
                    maxHeight: 'calc(100dvh - 24px)',
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
                <div style={{ overflow: 'auto', flex: 1 }}>
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
                                        <button onClick={() => fetchAccounts(search.trim(), currentCursor, page)} className="block mx-auto mt-2 text-[10px] font-bold underline" style={{ color: t.cellBlue }}>Retry</button>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={3} style={{ padding: '40px 16px', textAlign: 'center', fontSize: 11, color: t.cellMuted }}>
                                        {search ? <>No accounts match &ldquo;{search}&rdquo;.</> : 'No accounts found.'}
                                    </td>
                                </tr>
                            ) : items.map((row, i) => (
                                <tr
                                    key={row.account_id}
                                    onClick={() => onSelect(row)}
                                    onMouseEnter={() => setHoveredId(row.account_id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    style={{
                                        background: hoveredId === row.account_id
                                            ? (isDark ? 'rgba(59,130,246,0.18)' : 'rgba(219,234,254,0.75)')
                                            : i % 2 === 0 ? t.rowEvenBg : t.rowOddBg,
                                        borderBottom: `1px solid ${t.rowBorder}`,
                                        cursor: 'pointer',
                                        transition: 'background .10s ease',
                                        outline: hoveredId === row.account_id
                                            ? `2px solid ${isDark ? 'rgba(99,155,255,0.35)' : 'rgba(37,99,235,0.25)'}`
                                            : 'none',
                                        outlineOffset: -2,
                                    }}
                                >
                                    <td style={{ padding: '9px 14px', fontSize: 11, fontWeight: 700, color: t.cellBlue, borderRight: `1px solid ${t.rowBorder}`, whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
                                        {displayAccountCode(row)}
                                    </td>
                                    <td style={{ padding: '9px 14px', fontSize: 11, color: t.cellText, borderRight: `1px solid ${t.rowBorder}` }}>
                                        {displayAccountName(row)}
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
                <div style={{ padding: '8px 16px', background: t.cardHeaderBg, borderTop: `1px solid ${t.cardHeaderBorder}`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md" style={{ background: t.pillBg, color: t.pillText, border: `1px solid ${t.pillBorder}` }}>
                        {items.length} {items.length === 1 ? 'account' : 'accounts'}
                    </span>
                    <span style={{ fontSize: 10, color: t.cellMuted }}>Click a row to select it</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                            type="button"
                            onClick={() => prevCursor && fetchAccounts(search.trim(), prevCursor, Math.max(1, page - 1))}
                            disabled={!prevCursor || loading}
                            aria-label="Previous account page"
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
                            onClick={() => nextCursor && fetchAccounts(search.trim(), nextCursor, page + 1)}
                            disabled={!nextCursor || loading}
                            aria-label="Next account page"
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
        </div>,
        document.body,
    );

    return <>{portal}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// AddItemModal — opened when "New Item" is clicked inside RSFormModal
