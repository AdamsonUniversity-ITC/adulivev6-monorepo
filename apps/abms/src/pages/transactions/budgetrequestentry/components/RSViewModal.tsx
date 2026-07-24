import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    AlertCircle, AlertTriangle, ClipboardList,
    Paperclip, Plus, Printer, RefreshCw, Save, StickyNote, Trash2, User, X,
} from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import echo from '../../../../lib/echo';
import type {
    ChatMessage,
    PayeeDetailRecord,
    QuotedPricePreview,
    RSFormItem,
    ThemeTokens,
} from '../types';
import { fmtCurrency, formatRequisitionNumber, isZeroRequisitionNumber, normalizeEntryStatus } from '../utils';
import { AddItemModal } from './AddItemModal';
import { AttachmentsModal } from './AttachmentsModal';
import { ChatModal, RSChatBadge } from './chat';
import { StatusBadge } from './common';
import { PAYEE_VIEW_REQUIRED_FORMS, PayeeDetailsViewModal } from './PayeeDetailsViewModal';
import { RSPrintPreview } from '../../requisition-process/shared/components/RSPrintPreview';
import type { RSLineItem, RSProcessRow } from '../../requisition-process/shared/components/RSProcessModal';

export interface RSViewHeader {
    id: number;
    requisition_number: string;
    rstype: string;
    payee: string;
    payment_form: string | null;
    requested_by: string;
    requested_by_name: string;
    department: string;
    department_id: string | null;
    section_id: string | null;
    school_year: string;
    status: string;
    total_amount: number;
    created_at: string;
    note: string | null;
    location: string | null;
}

interface RSAttachedFile {
    id: number;
    name: string;
    file_name: string;
    mime_type: string;
    size: number;
    url: string;
    expires_at: string;
    created_at: string;
}

type ApiErrorLike = {
    response?: {
        data?: {
            message?: string;
        };
    };
    message?: string;
};

type RawLineItem = Partial<RSFormItem> & {
    account_id?: number | string;
    accountId?: number | string;
    account_code?: string | number | null;
    description?: string | null;
    unit_cost?: string | number | null;
    unit_of_measurement?: string | null;
    total_cost?: string | number | null;
};

function getErrorMessage(err: unknown): string | undefined {
    if (typeof err !== 'object' || err === null) return undefined;
    const apiError = err as ApiErrorLike;
    return apiError.response?.data?.message ?? apiError.message;
}

export function RSViewModal({
    open, recordId, onClose, onUpdated, t, isDark, currentUser,
}: {
    open: boolean;
    recordId: number | null;
    onClose: () => void;
    onUpdated: () => void;
    t: ThemeTokens;
    isDark: boolean;
    currentUser: { id: string; name: string };
}) {
    const [header, setHeader] = useState<RSViewHeader | null>(null);
    const [items, setItems] = useState<RSFormItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Surfaces add/delete-item failures inline (e.g. "balance not refunded")
    // without wiping the whole modal body the way the full-page `error` does.
    const [itemActionError, setItemActionError] = useState<string | null>(null);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [showAddItem, setShowAddItem] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [showAttachedFiles, setShowAttachedFiles] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<RSAttachedFile[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [fileViewError, setFileViewError] = useState<string | null>(null);
    const [openingFileId, setOpeningFileId] = useState<number | null>(null);
    const [isResaving, setIsResaving] = useState(false);
    const [isDiscarding, setIsDiscarding] = useState(false);
    const [dirty, setDirty] = useState(false); // items changed since load
    const [payeeDetail, setPayeeDetail] = useState<PayeeDetailRecord | null>(null);
    const [showPayeeView, setShowPayeeView] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [incomingMessage, setIncomingMessage] = useState<ChatMessage | null>(null);
    const [quotedPricePreview, setQuotedPricePreview] =
        useState<QuotedPricePreview | null>(null);

    const [isLoadingQuotedPreview, setIsLoadingQuotedPreview] =
        useState(false);

    const [quotedPreviewError, setQuotedPreviewError] =
        useState<string | null>(null);
    const showChatRef = useRef(showChat);
    useEffect(() => { showChatRef.current = showChat; }, [showChat]);

    const isUnsavedRS = isZeroRequisitionNumber(header?.requisition_number) || normalizeEntryStatus(header?.status, header?.requisition_number) === 'unsaved';
    const isReprocessAtDepartment = normalizeEntryStatus(header?.status, header?.requisition_number) === 'reprocess'
        && (header?.location ?? '').toLowerCase() === 'department';
    const canEdit = !!header && (isUnsavedRS || isReprocessAtDepartment);

    // ── Persistent realtime subscription — lives while modal is open, not just when chat is open ──
    const seenMessageIds = useRef<Set<number>>(new Set());
    useEffect(() => {
        if (!open || !recordId || !currentUser.id) return;
        let isSubscribed = true;
        try {
            const channel = echo
                .private(`requisition-chat.${recordId}`)
                .listen('.RequisitionChatMessageSent', (e: ChatMessage) => {
                    if (!isSubscribed) return;
                    // Deduplicate — StrictMode mounts effects twice in dev,
                    // which can leave two listeners on the same channel.
                    if (seenMessageIds.current.has(e.id)) return;
                    seenMessageIds.current.add(e.id);
                    if (showChatRef.current) {
                        setIncomingMessage(e);
                    } else {
                        setUnreadCount(c => c + 1);
                    }
                });
            return () => {
                isSubscribed = false;
                try {
                    channel.stopListening('.RequisitionChatMessageSent');
                    echo.leave(`requisition-chat.${recordId}`);
                } catch {
                    // The realtime client may already have removed the channel.
                }
            };
        } catch {
            return;
        }
    }, [open, recordId, currentUser.id]);

    useEffect(() => {
        if (!open || !recordId) return;
        setHeader(null);
        setItems([]);
        setError(null);
        setItemActionError(null);
        setDirty(false);
        setShowAddItem(false);
        setShowAttachments(false);
        setShowAttachedFiles(false);
        setAttachedFiles([]);
        setFileViewError(null);
        setPayeeDetail(null);
        setShowPayeeView(false);
        setShowChat(false);
        setShowPrintPreview(false);
        setLoading(true);
        setQuotedPricePreview(null);
        setQuotedPreviewError(null);
        setIsLoadingQuotedPreview(true);
        financeSvc.get(`/abms/budget-request-entry/${recordId}`)
            .then(res => {
                setHeader(res.data.header);
                setItems(res.data.items ?? []);
                setPayeeDetail(res.data.payee_detail ?? null);
            })
            .catch(() => setError('Failed to load requisition slip details.'))
            .finally(() => setLoading(false));
        financeSvc.get(`/abms/budget-request-entry/chats/unread-counts`, {
            params: { userId: currentUser.id, ids: [recordId] },
        }).then(res => {
            setUnreadCount(res.data[String(recordId)] ?? 0);
        }).catch(() => { });
        financeSvc
            .get(`/abms/budget-request-entry/${recordId}/quoted-price-preview`)
            .then(res => {
                setQuotedPricePreview(res.data);
            })
            .catch((err: unknown) => {
                const message =
                    typeof err === 'object'
                        && err !== null
                        && 'response' in err
                        ? (
                            err as {
                                response?: {
                                    data?: {
                                        message?: string;
                                    };
                                };
                            }
                        ).response?.data?.message
                        : null;

                setQuotedPreviewError(
                    message ?? 'Failed to load the quoted-price preview.'
                );
            })
            .finally(() => {
                setIsLoadingQuotedPreview(false);
            });
    }, [open, recordId, currentUser.id]);

    if (!open) return null;

    const grandTotal = items.reduce((s, item) => s + item.totalCost, 0);
    const printRow: RSProcessRow | null = header ? {
        id: header.id,
        date: header.created_at,
        requisition_no: header.requisition_number,
        department_id: header.department_id,
        section_id: header.section_id,
        department_section: header.department,
        requested_by: header.requested_by_name,
        requested_by_empno: header.requested_by,
        total_amount: grandTotal,
        status: header.status,
        location: header.location,
        from: null,
        rstype: header.rstype,
        payee: header.payee,
        payment_form: header.payment_form,
        note: header.note,
    } : null;
    const printItems: RSLineItem[] = items.map(item => ({
        id: item.id,
        account_id: item.account_id,
        account_code: item.accountNo,
        description: item.itemDescription,
        quantity: Number(item.quantity) || 0,
        unit_of_measurement: item.unitOfMeasurement,
        unit_cost: Number(item.unitCost) || 0,
        total_cost: item.totalCost,
    }));

    function normalizeLineItem(raw: RawLineItem): RSFormItem {
        return {
            id: Number(raw.id),
            account_id: Number(raw.account_id ?? raw.accountId ?? 0),
            accountNo: String(raw.accountNo ?? raw.account_code ?? ''),
            itemDescription: String(raw.itemDescription ?? raw.description ?? ''),
            unitCost: String(raw.unitCost ?? raw.unit_cost ?? '0'),
            quantity: String(raw.quantity ?? '0'),
            unitOfMeasurement: String(raw.unitOfMeasurement ?? raw.unit_of_measurement ?? ''),
            totalCost: Number(raw.totalCost ?? raw.total_cost ?? 0),
            unused_amount: Number(raw.unused_amount ?? 0),
        };
    }

    function updateEditableItem(itemId: number, patch: Partial<RSFormItem>) {
        setItemActionError(null);
        setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item;

            const next = { ...item, ...patch };
            const quantity = Number(next.quantity);
            const unitCost = Number(next.unitCost);
            next.totalCost = Number.isFinite(quantity) && Number.isFinite(unitCost)
                ? Math.round(quantity * unitCost * 100) / 100
                : 0;

            return next;
        }));
        setDirty(true);
    }

    async function persistEditableItems(): Promise<number> {
        if (!header) return grandTotal;
        if (items.length === 0) {
            throw new Error('Add at least one item before saving the requisition slip.');
        }

        const payload = items.map(item => {
            const description = item.itemDescription.trim();
            const unitOfMeasurement = item.unitOfMeasurement.trim();
            const quantity = Number(item.quantity);
            const unitCost = Number(item.unitCost);

            if (!description) throw new Error('Every item must have a description.');
            if (!unitOfMeasurement) throw new Error('Every item must have a unit of measurement.');
            if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Every item quantity must be at least 1.');
            if (!Number.isFinite(unitCost) || unitCost <= 0) throw new Error('Every item unit cost must be greater than 0.');

            return {
                id: item.id,
                description,
                quantity,
                unit_cost: unitCost,
                unit_of_measurement: unitOfMeasurement,
            };
        });

        const res = await financeSvc.put(`/abms/budget-request-entry/${header.id}/items`, { items: payload });
        const nextItems = (res.data?.items ?? []).map(normalizeLineItem);
        setItems(nextItems);
        if (res.data?.data) setHeader(prev => prev ? { ...prev, ...res.data.data } : prev);
        return nextItems.reduce((sum: number, item: RSFormItem) => sum + item.totalCost, 0);
    }

    function handleAddItem(item: RSFormItem) {
        setItemActionError(null);
        setItems(prev => {
            const next = [...prev, item];
            // Sync total_amount immediately so the balance/budget checks stay
            // accurate, but finalize:false keeps status/location untouched —
            // the RS stays editable ('department') until the user explicitly
            // clicks "Save Changes".
            if (header && !isUnsavedRS) {
                const newTotal = next.reduce((s, i) => s + i.totalCost, 0);
                financeSvc.patch(`/abms/budget-request-entry/${header.id}/save`, {
                    total_amount: newTotal,
                    finalize: false,
                }).then(() => onUpdated()).catch(() => {
                    setItemActionError('Item was added, but the total amount failed to sync. Try Save Changes once you are done editing.');
                });
            }
            return next;
        });
        // There is now an uncommitted change (the item itself is already
        // persisted, but the RS hasn't been finalized/resubmitted yet) —
        // surface that to the user via the Save Changes button.
        setDirty(true);
    }

    async function handleDeleteItem(itemId: number) {
        if (items.length <= 1) return; // must keep at least 1 item
        setItemActionError(null);
        try {
            await financeSvc.delete(`/abms/budget-request-entry/items/${itemId}`);
        } catch (err: unknown) {
            // The backend now refuses to delete when it can't refund the
            // balance (no matching account/sub-account). Do NOT remove the
            // item locally in that case — doing so would desync the UI from
            // the database and make the un-refunded item disappear silently.
            const serverMessage = getErrorMessage(err);
            setItemActionError(
                serverMessage ?? 'Failed to remove item: the balance could not be refunded. The item was left in place.'
            );
            return;
        }
        setItems(prev => {
            const next = prev.filter(i => i.id !== itemId);
            const newTotal = next.reduce((s, i) => s + i.totalCost, 0);
            if (header && !isUnsavedRS && next.length > 0) {
                financeSvc.patch(`/abms/budget-request-entry/${header.id}/save`, {
                    total_amount: newTotal,
                    finalize: false,
                }).then(() => onUpdated()).catch(() => {
                    setItemActionError('Item was removed and refunded, but the total amount failed to sync. Try Save Changes once you are done editing.');
                });
            }
            return next;
        });
        setDirty(true);
    }

    async function handleResave(overrideTotal?: number) {
        if (!header || isResaving || items.length === 0) return;
        setIsResaving(true);
        setItemActionError(null);
        try {
            const persistedTotal = canEdit ? await persistEditableItems() : grandTotal;
            await financeSvc.patch(`/abms/budget-request-entry/${header.id}/save`, {
                total_amount: overrideTotal ?? persistedTotal,
                finalize: true,
            });
            setDirty(false);
            onUpdated();
            onClose();
        } catch (err: unknown) {
            // keep dirty so user can retry
            const serverMessage = getErrorMessage(err);
            setItemActionError(serverMessage ?? 'Failed to save changes. Please try again.');
        } finally {
            setIsResaving(false);
        }
    }

    async function handleDiscardRS() {
        if (!header || !isUnsavedRS || isDiscarding) return;
        setIsDiscarding(true);
        setItemActionError(null);
        try {
            await financeSvc.delete(`/abms/budget-request-entry/${header.id}`);
            onUpdated();
            onClose();
        } catch (err: unknown) {
            const serverMessage = getErrorMessage(err);
            setItemActionError(serverMessage ?? 'Failed to discard the Requisition Slip. Please try again.');
        } finally {
            setIsDiscarding(false);
        }
    }

    function formatBytes(bytes: number) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    async function fetchAttachedFiles() {
        if (!header) return;
        setIsLoadingFiles(true);
        setFileViewError(null);
        try {
            const res = await financeSvc.get(`/abms/budget-request-entry/${header.id}/files`);
            setAttachedFiles(res.data?.data ?? []);
        } catch (err: unknown) {
            setFileViewError(getErrorMessage(err) ?? 'Failed to load attached files.');
        } finally {
            setIsLoadingFiles(false);
        }
    }

    function openAttachedFilesModal() {
        setShowAttachedFiles(true);
        void fetchAttachedFiles();
    }

    async function openAttachedFile(file: RSAttachedFile) {
        if (new Date(file.expires_at) > new Date()) {
            window.open(file.url, '_blank', 'noopener,noreferrer');
            return;
        }

        setOpeningFileId(file.id);
        setFileViewError(null);
        try {
            const res = await financeSvc.get(`/abms/budget-request-entry/${header?.id}/files/${file.id}/url`);
            const freshUrl: string = res.data.url;
            setAttachedFiles(prev => prev.map(item => item.id === file.id
                ? { ...item, url: freshUrl, expires_at: res.data.expires_at }
                : item));
            window.open(freshUrl, '_blank', 'noopener,noreferrer');
        } catch (err: unknown) {
            setFileViewError(getErrorMessage(err) ?? 'Failed to open attached file.');
        } finally {
            setOpeningFileId(null);
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
                                {header && <StatusBadge status={normalizeEntryStatus(header.status, header.requisition_number)} t={t} />}
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
                                {header ? `RS No. ${formatRequisitionNumber(header.requisition_number)}` : ''}
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
                                    {formatRequisitionNumber(header.requisition_number)}
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
                                onClick={() => handleResave()}
                                disabled={isResaving || (!dirty && !isUnsavedRS) || items.length === 0}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                                style={{
                                    background: ((!dirty && !isUnsavedRS) || items.length === 0) ? t.btnDisBg : t.btnNew.bg,
                                    borderColor: ((!dirty && !isUnsavedRS) || items.length === 0) ? t.btnDisBorder : t.btnNew.border,
                                    color: ((!dirty && !isUnsavedRS) || items.length === 0) ? t.btnDisText : t.btnNew.text,
                                    opacity: isResaving ? 0.6 : 1,
                                    cursor: (isResaving || (!dirty && !isUnsavedRS) || items.length === 0) ? 'not-allowed' : 'pointer',
                                }}
                                onMouseEnter={e => { if ((dirty || isUnsavedRS) && !isResaving && items.length > 0) (e.currentTarget as HTMLElement).style.background = t.btnNew.hover; }}
                                onMouseLeave={e => { if ((dirty || isUnsavedRS) && !isResaving && items.length > 0) (e.currentTarget as HTMLElement).style.background = t.btnNew.bg; }}
                            >
                                {isResaving
                                    ? <RefreshCw className="w-3.5 h-3.5" style={{ animation: 'spin 1s linear infinite' }} />
                                    : <Save className="w-3.5 h-3.5" />
                                }
                                {isResaving ? 'Saving…' : items.length === 0 ? 'No Items' : isUnsavedRS ? 'Create / Save RS' : dirty ? 'Save Changes' : 'No Changes'}
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
                            <RSChatBadge
                                onClick={() => { setShowChat(p => !p); setUnreadCount(0); }}
                                unreadCount={unreadCount}
                                active={showChat}
                                t={t}
                                isDark={isDark}
                            />
                            {!isUnsavedRS && (
                                <button
                                    onClick={() => setShowPrintPreview(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                                    style={{ background: t.btnPrevSY.bg, borderColor: t.btnPrevSY.border, color: t.btnPrevSY.text }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.btnPrevSY.hover; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = t.btnPrevSY.bg; }}
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    Print RS
                                </button>
                            )}
                            <button
                                onClick={() => setShowAttachments(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                                style={{
                                    background: isDark ? 'rgba(167,139,250,0.10)' : 'rgba(237,233,254,0.55)',
                                    borderColor: isDark ? 'rgba(167,139,250,0.35)' : 'rgba(139,92,246,0.40)',
                                    color: isDark ? '#c4b5fd' : '#7c3aed',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(167,139,250,0.20)' : 'rgba(221,214,254,0.80)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(167,139,250,0.10)' : 'rgba(237,233,254,0.55)'; }}
                            >
                                <Paperclip className="w-3.5 h-3.5" />
                                Add Files
                            </button>
                            <button
                                onClick={openAttachedFilesModal}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                                style={{
                                    background: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(219,234,254,0.60)',
                                    borderColor: isDark ? 'rgba(96,165,250,0.40)' : 'rgba(37,99,235,0.35)',
                                    color: isDark ? '#60a5fa' : '#1d4ed8',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(96,165,250,0.22)' : 'rgba(219,234,254,0.90)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(96,165,250,0.12)' : 'rgba(219,234,254,0.60)'; }}
                            >
                                <Paperclip className="w-3.5 h-3.5" />
                                View Files
                            </button>
                            {/* View Payee Details — only when this payment form requires payee info */}
                            {header.payment_form && PAYEE_VIEW_REQUIRED_FORMS.includes(header.payment_form) && payeeDetail && (
                                <button
                                    onClick={() => setShowPayeeView(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                                    style={{
                                        background: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(219,234,254,0.60)',
                                        borderColor: isDark ? 'rgba(96,165,250,0.40)' : 'rgba(37,99,235,0.35)',
                                        color: isDark ? '#60a5fa' : '#1d4ed8',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(96,165,250,0.22)' : 'rgba(219,234,254,0.90)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(96,165,250,0.12)' : 'rgba(219,234,254,0.60)'; }}
                                >
                                    <User className="w-3.5 h-3.5" />
                                    View Payee Details
                                </button>
                            )}
                            <div style={{ flex: 1 }} />
                            {isUnsavedRS && (
                                <button
                                    onClick={handleDiscardRS}
                                    disabled={isDiscarding || isResaving}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                                    style={{
                                        background: isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,226,226,0.60)',
                                        borderColor: isDark ? 'rgba(248,113,113,0.35)' : 'rgba(220,38,38,0.28)',
                                        color: isDark ? t.cellRed : '#b91c1c',
                                        opacity: isDiscarding || isResaving ? 0.6 : 1,
                                        cursor: isDiscarding || isResaving ? 'not-allowed' : 'pointer',
                                    }}
                                    onMouseEnter={e => {
                                        if (isDiscarding || isResaving) return;
                                        (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.20)' : 'rgba(254,226,226,0.90)';
                                    }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,226,226,0.60)'; }}
                                >
                                    {isDiscarding
                                        ? <RefreshCw className="w-3.5 h-3.5" style={{ animation: 'spin 1s linear infinite' }} />
                                        : <Trash2 className="w-3.5 h-3.5" />
                                    }
                                    {isDiscarding ? 'Discarding…' : 'Discard RS'}
                                </button>
                            )}
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

                    {/* Inline banner for add/delete item failures — e.g. refund couldn't be processed */}
                    {itemActionError && (
                        <div
                            style={{
                                display: 'flex', alignItems: 'flex-start', gap: 8,
                                marginTop: 10, padding: '8px 12px', borderRadius: 8,
                                background: isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,226,226,0.70)',
                                border: `1px solid ${isDark ? 'rgba(248,113,113,0.35)' : 'rgba(220,38,38,0.30)'}`,
                            }}
                        >
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: isDark ? t.cellRed : '#b91c1c' }} />
                            <span style={{ fontSize: 11, color: isDark ? t.cellRed : '#b91c1c', flex: 1 }}>{itemActionError}</span>
                            <button
                                onClick={() => setItemActionError(null)}
                                style={{ background: 'transparent', border: 'none', color: isDark ? t.cellRed : '#b91c1c', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Read-only close row */}
                    {!canEdit && header && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
                            {/* View Payee Details — only when this payment form requires payee info */}
                            {header.payment_form && PAYEE_VIEW_REQUIRED_FORMS.includes(header.payment_form) && payeeDetail && (
                                <button
                                    onClick={() => setShowPayeeView(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                                    style={{
                                        background: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(219,234,254,0.60)',
                                        borderColor: isDark ? 'rgba(96,165,250,0.40)' : 'rgba(37,99,235,0.35)',
                                        color: isDark ? '#60a5fa' : '#1d4ed8',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(96,165,250,0.22)' : 'rgba(219,234,254,0.90)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(96,165,250,0.12)' : 'rgba(219,234,254,0.60)'; }}
                                >
                                    <User className="w-3.5 h-3.5" />
                                    View Payee Details
                                </button>
                            )}
                            <RSChatBadge
                                onClick={() => { setShowChat(p => !p); setUnreadCount(0); }}
                                unreadCount={unreadCount}
                                active={showChat}
                                t={t}
                                isDark={isDark}
                            />
                            <button
                                onClick={() => setShowPrintPreview(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                                style={{ background: t.btnPrevSY.bg, borderColor: t.btnPrevSY.border, color: t.btnPrevSY.text }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.btnPrevSY.hover; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = t.btnPrevSY.bg; }}
                            >
                                <Printer className="w-3.5 h-3.5" />
                                Print RS
                            </button>
                            <button
                                onClick={openAttachedFilesModal}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                                style={{
                                    background: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(219,234,254,0.60)',
                                    borderColor: isDark ? 'rgba(96,165,250,0.40)' : 'rgba(37,99,235,0.35)',
                                    color: isDark ? '#60a5fa' : '#1d4ed8',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(96,165,250,0.22)' : 'rgba(219,234,254,0.90)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(96,165,250,0.12)' : 'rgba(219,234,254,0.60)'; }}
                            >
                                <Paperclip className="w-3.5 h-3.5" />
                                View Files
                            </button>
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
                        {/* ── Supplier quoted-price preview ───────────────────────────── */}
                        {isLoadingQuotedPreview && (
                            <div
                                style={{
                                    margin: '16px 18px 0',
                                    padding: '14px 16px',
                                    borderRadius: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 9,
                                    background: isDark
                                        ? 'rgba(59,130,246,0.08)'
                                        : 'rgba(239,246,255,0.90)',
                                    border: `1px solid ${isDark
                                            ? 'rgba(96,165,250,0.25)'
                                            : 'rgba(37,99,235,0.18)'
                                        }`,
                                    color: t.cellMuted,
                                    fontSize: 11,
                                }}
                            >
                                <RefreshCw
                                    className="w-3.5 h-3.5"
                                    style={{ animation: 'spin 1s linear infinite' }}
                                />
                                Loading supplier quotation preview…
                            </div>
                        )}

                        {quotedPreviewError && (
                            <div
                                style={{
                                    margin: '16px 18px 0',
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 8,
                                    background: isDark
                                        ? 'rgba(248,113,113,0.10)'
                                        : 'rgba(254,242,242,0.90)',
                                    border: `1px solid ${isDark
                                            ? 'rgba(248,113,113,0.30)'
                                            : 'rgba(220,38,38,0.25)'
                                        }`,
                                    color: isDark ? '#fca5a5' : '#991b1b',
                                    fontSize: 11,
                                }}
                            >
                                <AlertTriangle
                                    className="w-3.5 h-3.5 shrink-0"
                                    style={{ marginTop: 1 }}
                                />
                                {quotedPreviewError}
                            </div>
                        )}

                        {quotedPricePreview?.has_quoted_prices && (
                            <div
                                style={{
                                    margin: '16px 18px',
                                    borderRadius: 14,
                                    overflow: 'hidden',
                                    border: `1px solid ${quotedPricePreview.quotation_status === 'pending'
                                            ? (
                                                isDark
                                                    ? 'rgba(251,191,36,0.35)'
                                                    : 'rgba(202,138,4,0.28)'
                                            )
                                            : (
                                                isDark
                                                    ? 'rgba(74,222,128,0.35)'
                                                    : 'rgba(22,163,74,0.25)'
                                            )
                                        }`,
                                    background: isDark
                                        ? 'rgba(10,22,50,0.55)'
                                        : 'rgba(248,250,252,0.95)',
                                }}
                            >
                                {/* Quotation heading */}
                                <div
                                    style={{
                                        padding: '13px 16px',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between',
                                        gap: 12,
                                        background:
                                            quotedPricePreview.quotation_status === 'pending'
                                                ? (
                                                    isDark
                                                        ? 'rgba(251,191,36,0.10)'
                                                        : 'rgba(254,249,195,0.75)'
                                                )
                                                : (
                                                    isDark
                                                        ? 'rgba(74,222,128,0.09)'
                                                        : 'rgba(240,253,244,0.90)'
                                                ),
                                        borderBottom: `1px solid ${t.sectionDivider}`,
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 800,
                                                color: t.titleColor,
                                            }}
                                        >
                                            Supplier Quotation Preview
                                        </div>

                                        <div
                                            style={{
                                                marginTop: 3,
                                                fontSize: 10,
                                                lineHeight: 1.5,
                                                color: t.cellMuted,
                                            }}
                                        >
                                            {quotedPricePreview.quotation_status === 'pending'
                                                ? 'Supplier prices have been entered and are awaiting Administration approval. The balances below are projections only.'
                                                : 'The supplier quoted prices have already been accepted by Administration.'}
                                        </div>
                                    </div>

                                    <span
                                        style={{
                                            flexShrink: 0,
                                            padding: '3px 8px',
                                            borderRadius: 999,
                                            fontSize: 9,
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            letterSpacing: '.06em',
                                            background:
                                                quotedPricePreview.quotation_status === 'pending'
                                                    ? (
                                                        isDark
                                                            ? 'rgba(251,191,36,0.15)'
                                                            : 'rgba(253,230,138,0.65)'
                                                    )
                                                    : (
                                                        isDark
                                                            ? 'rgba(74,222,128,0.13)'
                                                            : 'rgba(187,247,208,0.65)'
                                                    ),
                                            color:
                                                quotedPricePreview.quotation_status === 'pending'
                                                    ? (isDark ? '#fbbf24' : '#92400e')
                                                    : (isDark ? '#4ade80' : '#166534'),
                                        }}
                                    >
                                        {quotedPricePreview.quotation_status === 'pending'
                                            ? 'Pending Approval'
                                            : 'Accepted'}
                                    </span>
                                </div>

                                {/* Total comparison */}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns:
                                            'repeat(auto-fit, minmax(150px, 1fr))',
                                        gap: 10,
                                        padding: '14px 16px',
                                        borderBottom: `1px solid ${t.sectionDivider}`,
                                    }}
                                >
                                    {[
                                        {
                                            label: 'Original RS Total',
                                            value: quotedPricePreview.current_total,
                                            color: t.cellText,
                                        },
                                        {
                                            label: 'Quoted RS Total',
                                            value: quotedPricePreview.quoted_total,
                                            color: t.cellBlue,
                                        },
                                        {
                                            label:
                                                quotedPricePreview.total_delta > 0
                                                    ? 'Additional Requirement'
                                                    : quotedPricePreview.total_delta < 0
                                                        ? 'Expected Savings'
                                                        : 'Price Difference',
                                            value: Math.abs(quotedPricePreview.total_delta),
                                            color:
                                                quotedPricePreview.total_delta > 0
                                                    ? t.cellRed
                                                    : quotedPricePreview.total_delta < 0
                                                        ? t.cellGreen
                                                        : t.cellMuted,
                                        },
                                    ].map(summary => (
                                        <div
                                            key={summary.label}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: 10,
                                                background: isDark
                                                    ? 'rgba(7,14,32,0.50)'
                                                    : 'rgba(255,255,255,0.80)',
                                                border: `1px solid ${t.sectionDivider}`,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '.06em',
                                                    color: t.tableHeadText,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                {summary.label}
                                            </div>

                                            <div
                                                style={{
                                                    fontSize: 18,
                                                    fontWeight: 800,
                                                    color: summary.color,
                                                    fontVariantNumeric: 'tabular-nums',
                                                }}
                                            >
                                                ₱ {fmtCurrency(summary.value)}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Item quotation comparison */}
                                <div style={{ overflowX: 'auto' }}>
                                    <table
                                        style={{
                                            width: '100%',
                                            minWidth: 850,
                                            borderCollapse: 'collapse',
                                        }}
                                    >
                                        <thead>
                                            <tr style={{ background: t.tableHeadBg }}>
                                                {[
                                                    'Account',
                                                    'Item',
                                                    'Qty',
                                                    'Original Price',
                                                    'Quoted Price',
                                                    'Difference',
                                                    'Quoted Total',
                                                ].map((label, index, columns) => (
                                                    <th
                                                        key={label}
                                                        style={{
                                                            padding: '8px 10px',
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '.06em',
                                                            color: t.tableHeadText,
                                                            textAlign:
                                                                index >= 2 ? 'right' : 'left',
                                                            borderBottom:
                                                                `1px solid ${t.tableHeadBorder}`,
                                                            borderRight:
                                                                index < columns.length - 1
                                                                    ? `1px solid ${t.tableHeadBorder}`
                                                                    : 'none',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {quotedPricePreview.items.map((item, index) => (
                                                <tr
                                                    key={item.id}
                                                    style={{
                                                        background:
                                                            index % 2 === 0
                                                                ? t.rowEvenBg
                                                                : t.rowOddBg,
                                                        borderBottom:
                                                            `1px solid ${t.rowBorder}`,
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            padding: '8px 10px',
                                                            fontSize: 13,
                                                            fontWeight: 700,
                                                            color: t.cellBlue,
                                                        }}
                                                    >
                                                        {item.account_code}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding: '8px 10px',
                                                            fontSize: 13,
                                                            color: t.cellText,
                                                        }}
                                                    >
                                                        {item.description}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding: '8px 10px',
                                                            fontSize: 13,
                                                            textAlign: 'right',
                                                            color: t.cellText,
                                                        }}
                                                    >
                                                        {item.quantity}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding: '8px 10px',
                                                            fontSize: 13,
                                                            textAlign: 'right',
                                                            color: t.cellMuted,
                                                        }}
                                                    >
                                                        ₱ {fmtCurrency(item.unit_cost)}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding: '8px 10px',
                                                            fontSize: 13,
                                                            fontWeight: 800,
                                                            textAlign: 'right',
                                                            color:
                                                                item.quoted_price !== null
                                                                    ? t.cellBlue
                                                                    : t.cellMuted,
                                                        }}
                                                    >
                                                        {item.quoted_price !== null
                                                            ? `₱ ${fmtCurrency(item.quoted_price)}`
                                                            : '—'}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding: '8px 10px',
                                                            fontSize: 14,
                                                            fontWeight: 700,
                                                            textAlign: 'right',
                                                            color:
                                                                item.delta > 0
                                                                    ? t.cellRed
                                                                    : item.delta < 0
                                                                        ? t.cellGreen
                                                                        : t.cellMuted,
                                                        }}
                                                    >
                                                        {item.delta > 0 ? '+' : ''}
                                                        ₱ {fmtCurrency(item.delta)}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding: '8px 10px',
                                                            fontSize: 14,
                                                            fontWeight: 700,
                                                            textAlign: 'right',
                                                            color: t.cellText,
                                                        }}
                                                    >
                                                        ₱ {fmtCurrency(item.quoted_total)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Consolidated account balance effect */}
                                <div
                                    style={{
                                        padding: '14px 16px',
                                        borderTop: `1px solid ${t.sectionDivider}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            marginBottom: 9,
                                            fontSize: 9,
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            letterSpacing: '.08em',
                                            color: t.tableHeadText,
                                        }}
                                    >
                                        Projected Account Balances
                                    </div>

                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns:
                                                'repeat(auto-fit, minmax(240px, 1fr))',
                                            gap: 9,
                                        }}
                                    >
                                        {quotedPricePreview.accounts.map(account => (
                                            <div
                                                key={account.sub_account_id}
                                                style={{
                                                    padding: '10px 12px',
                                                    borderRadius: 10,
                                                    background: account.sufficient
                                                        ? (
                                                            isDark
                                                                ? 'rgba(74,222,128,0.06)'
                                                                : 'rgba(240,253,244,0.80)'
                                                        )
                                                        : (
                                                            isDark
                                                                ? 'rgba(248,113,113,0.08)'
                                                                : 'rgba(254,242,242,0.90)'
                                                        ),
                                                    border: `1px solid ${account.sufficient
                                                            ? (
                                                                isDark
                                                                    ? 'rgba(74,222,128,0.22)'
                                                                    : 'rgba(22,163,74,0.18)'
                                                            )
                                                            : (
                                                                isDark
                                                                    ? 'rgba(248,113,113,0.30)'
                                                                    : 'rgba(220,38,38,0.25)'
                                                            )
                                                        }`,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 10,
                                                        fontWeight: 800,
                                                        color: t.cellBlue,
                                                        marginBottom: 7,
                                                    }}
                                                >
                                                    Account {account.account_code}
                                                </div>

                                                <div
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr auto',
                                                        rowGap: 4,
                                                        fontSize: 10,
                                                    }}
                                                >
                                                    <span style={{ color: t.cellMuted }}>
                                                        Current balance
                                                    </span>
                                                    <strong style={{ color: t.cellText }}>
                                                        ₱ {fmtCurrency(account.current_balance)}
                                                    </strong>

                                                    <span style={{ color: t.cellMuted }}>
                                                        Price adjustment
                                                    </span>
                                                    <strong
                                                        style={{
                                                            color:
                                                                account.net_delta > 0
                                                                    ? t.cellRed
                                                                    : account.net_delta < 0
                                                                        ? t.cellGreen
                                                                        : t.cellMuted,
                                                        }}
                                                    >
                                                        {account.net_delta > 0 ? '-' : '+'}
                                                        ₱ {fmtCurrency(
                                                            Math.abs(account.net_delta)
                                                        )}
                                                    </strong>

                                                    <span style={{ color: t.cellMuted }}>
                                                        Balance after approval
                                                    </span>
                                                    <strong
                                                        style={{
                                                            color: account.sufficient
                                                                ? t.cellGreen
                                                                : t.cellRed,
                                                        }}
                                                    >
                                                        ₱ {fmtCurrency(account.balance_after)}
                                                    </strong>
                                                </div>

                                                {!account.sufficient && (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: 6,
                                                            marginTop: 8,
                                                            fontSize: 9,
                                                            fontWeight: 700,
                                                            color: t.cellRed,
                                                        }}
                                                    >
                                                        <AlertTriangle
                                                            className="w-3 h-3 shrink-0"
                                                        />
                                                        Insufficient balance if the quoted prices
                                                        are accepted.
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Items table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: canEdit ? 760 : 720 }}>
                                <thead>
                                    <tr style={{ background: t.tableHeadBg }}>
                                        {[
                                            { label: '#', w: '36px', align: 'center' },
                                            { label: 'Account No.', w: '120px', align: 'left' },
                                            { label: 'Item Description', w: 'auto', align: 'left' },
                                            { label: 'Unit Cost', w: '110px', align: 'left' },
                                            { label: 'Qty', w: '70px', align: 'right' },
                                            { label: 'UOM', w: '80px', align: 'right' },
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
                                                {canEdit ? (
                                                    <input
                                                        value={item.itemDescription}
                                                        onChange={e => updateEditableItem(item.id, { itemDescription: e.target.value })}
                                                        style={{ width: '100%', minWidth: 180, border: `1px solid ${t.inputBorder}`, borderRadius: 8, background: t.inputBg, color: t.inputText, padding: '6px 8px', fontSize: 11, outline: 'none' }}
                                                    />
                                                ) : (item.itemDescription || <span style={{ color: t.cellMuted, fontStyle: 'italic' }}>—</span>)}
                                            </td>
                                            <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600, color: t.cellText, borderRight: `1px solid ${t.rowBorder}`, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                                {canEdit ? (
                                                    <input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={item.unitCost}
                                                        onChange={e => updateEditableItem(item.id, { unitCost: e.target.value })}
                                                        style={{ width: 96, border: `1px solid ${t.inputBorder}`, borderRadius: 8, background: t.inputBg, color: t.inputText, padding: '6px 8px', fontSize: 11, textAlign: 'right', outline: 'none', fontFamily: "'JetBrains Mono', monospace" }}
                                                    />
                                                ) : <>₱ {fmtCurrency(parseFloat(item.unitCost) || 0)}</>}
                                            </td>
                                            <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600, color: t.cellText, textAlign: 'right', borderRight: `1px solid ${t.rowBorder}`, fontFamily: "'JetBrains Mono', monospace" }}>
                                                {canEdit ? (
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={item.quantity}
                                                        onChange={e => updateEditableItem(item.id, { quantity: e.target.value })}
                                                        style={{ width: 64, border: `1px solid ${t.inputBorder}`, borderRadius: 8, background: t.inputBg, color: t.inputText, padding: '6px 8px', fontSize: 11, textAlign: 'right', outline: 'none', fontFamily: "'JetBrains Mono', monospace" }}
                                                    />
                                                ) : (item.quantity || '0')}
                                            </td>
                                            <td style={{ padding: '7px 12px', fontSize: 11, color: t.cellMuted, borderRight: `1px solid ${t.rowBorder}`, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                {canEdit ? (
                                                    <input
                                                        value={item.unitOfMeasurement}
                                                        onChange={e => updateEditableItem(item.id, { unitOfMeasurement: e.target.value })}
                                                        style={{ width: 78, border: `1px solid ${t.inputBorder}`, borderRadius: 8, background: t.inputBg, color: t.inputText, padding: '6px 8px', fontSize: 11, textAlign: 'right', outline: 'none' }}
                                                    />
                                                ) : (item.unitOfMeasurement || '—')}
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

                {/* Note — shown when a note exists on the RS */}
                {!loading && !error && header?.note && (
                    <div
                        style={{
                            padding: '12px 22px',
                            background: t.cardHeaderBg,
                            borderTop: `1px solid ${t.cardHeaderBorder}`,
                            display: 'flex', gap: 10, alignItems: 'flex-start',
                        }}
                    >
                        <StickyNote style={{ width: 13, height: 13, color: t.cellMuted, flexShrink: 0, marginTop: 10 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: t.tableHeadText, whiteSpace: 'nowrap' }}>
                                    Note
                                </span>
                                <div
                                    style={{
                                        flex: 1,
                                        background: t.inputBg ?? t.cellBg,
                                        border: `1px solid ${t.cardHeaderBorder}`,
                                        borderRadius: 4,
                                        padding: '4px 8px',
                                        fontSize: 11,
                                        color: t.cellText,
                                        lineHeight: 1.6,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        cursor: 'default',
                                        userSelect: 'text',
                                    }}
                                >
                                    {header.note}
                                </div>
                            </div>
                        </div>
                    </div>
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

            {canEdit && header && (
                <AttachmentsModal
                    open={showAttachments}
                    onClose={() => setShowAttachments(false)}
                    t={t}
                    isDark={isDark}
                    rsHeaderId={header.id}
                />
            )}

            {showAttachedFiles && header && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 100000,
                        background: 'rgba(0,0,0,0.55)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 16,
                    }}
                    onClick={() => setShowAttachedFiles(false)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '100%', maxWidth: 520,
                            background: t.cardBg,
                            border: `1px solid ${t.cardBorder}`,
                            borderRadius: 14,
                            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${t.cardHeaderBorder}` }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: t.cellText, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Paperclip style={{ width: 14, height: 14 }} />
                                Attached Files
                            </span>
                            <button onClick={() => setShowAttachedFiles(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.cellMuted }}>
                                <X style={{ width: 16, height: 16 }} />
                            </button>
                        </div>
                        <div style={{ padding: 16 }}>
                            {fileViewError && (
                                <div style={{
                                    marginBottom: 10, padding: '8px 10px', borderRadius: 8,
                                    background: isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,242,242,0.90)',
                                    border: `1px solid ${isDark ? 'rgba(248,113,113,0.30)' : 'rgba(220,38,38,0.25)'}`,
                                    color: isDark ? '#fca5a5' : '#991b1b',
                                    fontSize: 11,
                                }}>
                                    {fileViewError}
                                </div>
                            )}
                            {isLoadingFiles ? (
                                <div style={{ padding: '28px 12px', textAlign: 'center', color: t.cellMuted, fontSize: 11 }}>
                                    <RefreshCw className="w-5 h-5 mx-auto mb-2 opacity-50" style={{ animation: 'spin 1s linear infinite' }} />
                                    Loading files…
                                </div>
                            ) : attachedFiles.length === 0 ? (
                                <div style={{ padding: '28px 12px', textAlign: 'center', color: t.cellMuted, fontSize: 11 }}>
                                    No attached files.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {attachedFiles.map(file => (
                                        <button
                                            key={file.id}
                                            onClick={() => openAttachedFile(file)}
                                            disabled={openingFileId === file.id}
                                            style={{
                                                width: '100%',
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '9px 10px',
                                                borderRadius: 8,
                                                background: isDark ? 'rgba(10,22,50,0.60)' : 'rgba(220,234,255,0.60)',
                                                border: `1px solid ${t.sectionDivider}`,
                                                color: t.cellText,
                                                cursor: openingFileId === file.id ? 'wait' : 'pointer',
                                                textAlign: 'left',
                                            }}
                                        >
                                            <Paperclip style={{ width: 14, height: 14, color: t.cellMuted, flexShrink: 0 }} />
                                            <span style={{ minWidth: 0, flex: 1 }}>
                                                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700 }}>
                                                    {file.file_name}
                                                </span>
                                                <span style={{ display: 'block', marginTop: 2, fontSize: 10, color: t.cellMuted }}>
                                                    {file.mime_type} · {formatBytes(file.size)}
                                                </span>
                                            </span>
                                            {openingFileId === file.id && <RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite', color: t.cellMuted }} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PayeeDetailsViewModal — read-only payee detail sheet */}
            <PayeeDetailsViewModal
                open={showPayeeView}
                onClose={() => setShowPayeeView(false)}
                payeeName={header?.payee ?? ''}
                detail={payeeDetail}
                t={t}
                isDark={isDark}
            />

            {/* ChatModal — discussion panel in separate modal */}
            {header && (
                <ChatModal
                    open={showChat}
                    onClose={() => setShowChat(false)}
                    entryId={header.id}
                    currentUser={currentUser}
                    t={t}
                    isDark={isDark}
                    incomingMessage={incomingMessage}
                />
            )}

            {showPrintPreview && printRow && (
                <RSPrintPreview
                    row={printRow}
                    items={printItems}
                    payeeDetail={payeeDetail}
                    onClose={() => setShowPrintPreview(false)}
                />
            )}
        </div>,
        document.body,
    );

    return <>{portal}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ChatModal — modal dialog for the chat/discussion panel
