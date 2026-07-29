import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Search, X } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import type { Theme } from '../types';
import { formatAccountCode } from '../../../shared/accountCode';

export interface EditableAccountOption {
    account_id: number;
    account_parent_id: number;
    account_code: string;
    account_name: string;
    main_account_code?: string | null;
    main_account_name?: string | null;
    balance: string | number;
}

export function EditableAccountPickerModal({
    open,
    requisitionId,
    onClose,
    onSelect,
    t,
    isDark,
}: {
    open: boolean;
    requisitionId: number;
    onClose: () => void;
    onSelect: (account: EditableAccountOption) => void;
    t: Theme;
    isDark: boolean;
}) {
    const [accounts, setAccounts] = useState<EditableAccountOption[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [prevCursor, setPrevCursor] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const requestSequence = useRef(0);

    const loadAccounts = useCallback(async (
        query: string,
        cursor: string | null = null,
        targetPage = 1,
    ) => {
        const sequence = ++requestSequence.current;
        setLoading(true);
        setError(null);

        try {
            const response = await financeSvc.get(
                `/abms/requisition-process/${requisitionId}/editable-accounts`,
                {
                    params: {
                        ...(query ? { search: query } : {}),
                        ...(cursor ? { cursor } : {}),
                    },
                },
            );
            if (sequence !== requestSequence.current) return;
            setAccounts(response.data?.accounts ?? []);
            setNextCursor(response.data?.next_cursor ?? null);
            setPrevCursor(response.data?.prev_cursor ?? null);
            setPage(targetPage);
        } catch (caught: unknown) {
            if (sequence !== requestSequence.current) return;
            const message = typeof caught === 'object' && caught !== null && 'response' in caught
                ? (caught as { response?: { data?: { message?: string } } }).response?.data?.message
                : null;
            setAccounts([]);
            setError(message ?? 'Failed to load eligible accounts.');
        } finally {
            if (sequence === requestSequence.current) setLoading(false);
        }
    }, [requisitionId]);

    useEffect(() => {
        if (!open) return;
        requestSequence.current += 1;
        setAccounts([]);
        setSearch('');
        setError(null);
        setNextCursor(null);
        setPrevCursor(null);
        setPage(1);
    }, [open, requisitionId]);

    useEffect(() => {
        if (!open) return;
        const delay = search.trim() === '' ? 0 : 300;
        const timer = window.setTimeout(() => {
            void loadAccounts(search.trim(), null, 1);
        }, delay);
        return () => window.clearTimeout(timer);
    }, [loadAccounts, open, search]);

    if (!open) return null;

    return createPortal(
        <div
            className="abms-modal-backdrop fixed inset-0 z-[100003] flex items-center justify-center overflow-y-auto p-3 sm:p-4"
            style={{
                background: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(0,20,60,0.52)',
                backdropFilter: 'blur(6px)',
            }}
            onClick={event => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Select an eligible account"
                className="flex w-full max-w-[620px] flex-col overflow-hidden rounded-2xl"
                style={{
                    maxHeight: 'calc(100dvh - 24px)',
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    boxShadow: t.cardShadow,
                }}
            >
                <div
                    className="flex shrink-0 items-start justify-between gap-3 px-4 py-3 sm:px-5"
                    style={{ background: t.cardHeaderBg, borderBottom: `1px solid ${t.cardHeaderBorder}` }}
                >
                    <div className="min-w-0">
                        <h2 className="m-0 text-[13px] font-extrabold" style={{ color: t.titleColor }}>
                            Select Account
                        </h2>
                        <p className="mt-0.5 text-[10px]" style={{ color: t.cellMuted }}>
                            Only accounts allocated to this RS department or section and school year are available.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ color: t.cellMuted, border: `1px solid ${t.cardBorder}`, background: 'transparent' }}
                        aria-label="Close account picker"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div
                    className="shrink-0 p-3 sm:px-4"
                    style={{ background: t.cardHeaderBg, borderBottom: `1px solid ${t.cardHeaderBorder}` }}
                >
                    <div className="relative">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                            style={{ color: t.cellMuted }}
                        />
                        <input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Search account code or name…"
                            className="w-full rounded-lg py-2 pl-9 pr-3 text-xs outline-none"
                            style={{
                                background: t.inputBg,
                                border: `1px solid ${t.inputBorder}`,
                                color: t.inputText,
                            }}
                        />
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 px-4 py-12 text-xs" style={{ color: t.cellMuted }}>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Loading eligible accounts…
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
                            <AlertCircle className="h-6 w-6" style={{ color: t.cellRed }} />
                            <p className="m-0 text-xs font-semibold" style={{ color: t.cellRed }}>{error}</p>
                            <button
                                type="button"
                                onClick={() => void loadAccounts(search.trim(), null, 1)}
                                className="rounded-lg px-3 py-1.5 text-[11px] font-bold"
                                style={{ color: t.accentColor, border: `1px solid ${t.accentColor}66` }}
                            >
                                Retry
                            </button>
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="px-5 py-12 text-center text-xs" style={{ color: t.cellMuted }}>
                            No eligible account found.
                        </div>
                    ) : (
                        <div className="divide-y" style={{ borderColor: t.rowBorder }}>
                            {accounts.map(account => (
                                <button
                                    key={account.account_id}
                                    type="button"
                                    onClick={() => onSelect(account)}
                                    className="grid w-full grid-cols-1 gap-1 px-4 py-3 text-left transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                                    style={{ background: 'transparent', color: t.cellText, borderColor: t.rowBorder }}
                                    onMouseEnter={event => { event.currentTarget.style.background = t.rowHoverBg; }}
                                    onMouseLeave={event => { event.currentTarget.style.background = 'transparent'; }}
                                >
                                    <span className="min-w-0">
                                        <span className="block break-words font-mono text-[11px] font-extrabold" style={{ color: t.cellBlue }}>
                                            {formatAccountCode(account.main_account_code, account.account_code)}
                                        </span>
                                        <span className="mt-0.5 block break-words text-[11px] font-semibold">
                                            {account.main_account_name
                                                ? `${account.main_account_name} - ${account.account_name}`
                                                : account.account_name}
                                        </span>
                                    </span>
                                    <span className="text-[10px] font-bold sm:text-right" style={{ color: t.cellMuted }}>
                                        Balance
                                        <span className="ml-1 font-mono" style={{ color: t.cellGreen }}>
                                            ₱{Number(account.balance).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div
                    className="flex shrink-0 items-center justify-between gap-3 px-4 py-3"
                    style={{ background: t.cardHeaderBg, borderTop: `1px solid ${t.cardHeaderBorder}` }}
                >
                    <button
                        type="button"
                        disabled={!prevCursor || loading}
                        onClick={() => void loadAccounts(search.trim(), prevCursor, Math.max(1, page - 1))}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold disabled:opacity-40"
                        style={{ color: t.cellText, border: `1px solid ${t.cardBorder}` }}
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Previous
                    </button>
                    <span className="text-[10px] font-bold" style={{ color: t.cellMuted }}>Page {page}</span>
                    <button
                        type="button"
                        disabled={!nextCursor || loading}
                        onClick={() => void loadAccounts(search.trim(), nextCursor, page + 1)}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold disabled:opacity-40"
                        style={{ color: t.cellText, border: `1px solid ${t.cardBorder}` }}
                    >
                        Next
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
