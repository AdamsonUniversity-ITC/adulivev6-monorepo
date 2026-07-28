import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ExternalLink, FileText, Loader2, Lock, Trash2, Upload, X } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import { apiErrorMessage, fetchLiquidationFilesOnce, fetchLiquidationItemsOnce, fmt } from '../api';
import { T } from '../theme';
import type { LiquidationItem, LiquidationRecord, MediaFile, PendingFile, ToastItem, ToastKind } from '../types';
import { Toasts } from './common';

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

export function LiquidationUploadModal({
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
    const isApproved = Number(row.is_approve) === 1;
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
    const returnedAmountsRef = useRef<HTMLDivElement>(null);

    // ── Toasts ───────────────────────────────────────────────────────────────
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const toastCounter = useRef(0);
    const addToast = useCallback((kind: ToastKind, title: string, description?: string) => {
        const id = ++toastCounter.current;
        setToasts(prev => [...prev, { id, kind, title, description }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    // ── Admin state ──────────────────────────────────────────────────────────
    const [localIsApprove, setLocalIsApprove] = useState(() => Number(row.is_approve));
    const [remarksValue, setRemarksValue] = useState(row.remarks ?? '');
    const [isTogglingApprove, setIsTogglingApprove] = useState(false);
    const [isUntagging, setIsUntagging] = useState(false);
    const [isSavingRemarks, setIsSavingRemarks] = useState(false);
    const [isSavingReturnedAmounts, setIsSavingReturnedAmounts] = useState(false);
    const [liquidationItems, setLiquidationItems] = useState<LiquidationItem[]>(row.items ?? []);
    const [isLoadingItems, setIsLoadingItems] = useState(true);
    const [itemsError, setItemsError] = useState<string | null>(null);
    const [returnedAmounts, setReturnedAmounts] = useState<Record<number, string>>(() =>
        Object.fromEntries((row.items ?? []).map(item => [item.id, String(item.unused_amount ?? 0)])),
    );

    const returnedAmountsDirty = liquidationItems.some(item => {
        const draft = Number(returnedAmounts[item.id] ?? 0);
        return Number.isFinite(draft) && Math.abs(draft - Number(item.unused_amount ?? 0)) >= 0.005;
    });

    // Load items in the modal so they cannot be lost between the row click and
    // the modal's initial state creation.
    useEffect(() => {
        let cancelled = false;
        setIsLoadingItems(true);
        setItemsError(null);

        void fetchLiquidationItemsOnce(row.id)
            .then(items => {
                if (cancelled) return;
                setLiquidationItems(items);
                setReturnedAmounts(Object.fromEntries(
                    items.map(item => [item.id, String(item.unused_amount ?? 0)]),
                ));
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setItemsError(apiErrorMessage(error, 'Request-entry items could not be loaded.'));
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoadingItems(false);
            });

        return () => { cancelled = true; };
    }, [row.id]);

    // Fetch already-uploaded files on mount
    useEffect(() => {
        fetchUploadedFiles();
    }, []);

    async function fetchUploadedFiles() {
        setIsLoadingFiles(true);
        try {
            setUploadedFiles(await fetchLiquidationFilesOnce(row.id));
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
        } catch (err: unknown) {
            const msg = apiErrorMessage(err, 'Upload failed. Please try again.');
            setSubmitError(msg);
            addToast('error', 'Upload failed', msg);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleToggleApprove() {
        if (Number(localIsApprove) === 1) return;

        if (returnedAmountsDirty) {
            addToast('warning', 'Save returned amounts first', 'Review and save the returned amounts before approving.');
            return;
        }
        setIsTogglingApprove(true);
        try {
            const res = await financeSvc.patch(`abms/liquidation-submission/rs/${row.id}/approve`);
            const newIsApprove = Number(res.data?.is_approve ?? res.data?.data?.is_approve);
            if (!Number.isFinite(newIsApprove)) {
                throw new Error('Approval response did not include a valid is_approve value.');
            }
            setLocalIsApprove(newIsApprove);
            onRowUpdate({ is_approve: newIsApprove });
            addToast(
                'success',
                'Entry approved',
                `RS ${row.requisition_no} has been approved and removed from the liquidation queue.`,
            );
            // Approved entries drop out of the for_liquidation list — close modal
            if (newIsApprove === 1) {
                setTimeout(() => onClose(), 1200);
            }
        } catch (err: unknown) {
            console.error('Failed to toggle approval:', err);
            addToast('error', 'Action failed', apiErrorMessage(err, 'Could not approve this liquidation. Please try again.'));
        } finally {
            setIsTogglingApprove(false);
        }
    }

    async function handleSaveReturnedAmounts() {
        const invalidItem = liquidationItems.find(item => {
            const amount = Number(returnedAmounts[item.id]);
            return !Number.isFinite(amount) || amount < 0 || amount > Number(item.total_cost);
        });
        if (invalidItem) {
            addToast('error', 'Invalid returned amount', `Enter an amount from ₱0.00 to ₱${fmt(Number(invalidItem.total_cost))} for ${invalidItem.description}.`);
            return;
        }

        setIsSavingReturnedAmounts(true);
        try {
            const res = await financeSvc.patch(`abms/liquidation-submission/rs/${row.id}/returned-amounts`, {
                items: liquidationItems.map(item => ({
                    id: item.id,
                    unused_amount: Number(returnedAmounts[item.id] ?? 0),
                })),
            });
            const savedAmounts = new Map<number, number>(
                (res.data?.items ?? []).map((item: { id: number; unused_amount: number }) => [item.id, Number(item.unused_amount)]),
            );
            const updatedItems = liquidationItems.map(item => ({
                ...item,
                unused_amount: savedAmounts.get(item.id) ?? Number(returnedAmounts[item.id] ?? 0),
            }));
            setReturnedAmounts(Object.fromEntries(updatedItems.map(item => [item.id, String(item.unused_amount)])));
            setLiquidationItems(updatedItems);
            onRowUpdate({ items: updatedItems });
            addToast('success', 'Returned amounts saved', 'Account and proposal balances were recalculated successfully.');
        } catch (err: unknown) {
            addToast('error', 'Save failed', apiErrorMessage(err, 'Could not save returned amounts. No changes were applied.'));
        } finally {
            setIsSavingReturnedAmounts(false);
        }
    }

    async function handleUntagLiquidation() {
        setIsUntagging(true);
        try {
            await financeSvc.patch(`abms/liquidation-submission/rs/${row.id}/untag`);
            onRowUpdate({ for_liquidation: false });
            addToast('info', 'Liquidation tag removed', `RS ${row.requisition_no} was removed from the liquidation queue.`);
            setTimeout(() => onClose(), 900);
        } catch (err: unknown) {
            addToast('error', 'Action failed', apiErrorMessage(err, 'Could not remove the liquidation tag.'));
        } finally {
            setIsUntagging(false);
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

    const isLocallyApproved = Number(localIsApprove) === 1;
    const approveDisabled = isLocallyApproved
        || isTogglingApprove
        || isUntagging
        || isSavingReturnedAmounts
        || returnedAmountsDirty;

    return (
        <div
            className="abms-modal-backdrop"
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
                    maxHeight: 'calc(100dvh - 24px)',
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

                    {/* ── Request-entry items ── */}
                    <div
                        ref={returnedAmountsRef}
                        data-testid="liquidation-request-entry-items"
                        style={{ border: `1px solid ${t.rowBorder}`, borderRadius: 10, overflow: 'hidden', scrollMarginTop: 12, flexShrink: 0 }}
                    >
                        <div style={{ padding: '10px 12px', background: t.tableHeadBg, borderBottom: `1px solid ${t.tableHeadBorder}` }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: t.tableHeadText, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Request Entry Items
                            </p>
                            {/* <p style={{ margin: '3px 0 0', fontSize: 10, color: t.cellMuted }}>
                                {isLoadingItems
                                    ? 'Loading items…'
                                    : itemsError
                                        ? 'Items could not be loaded.'
                                        : `${liquidationItems.length} item${liquidationItems.length === 1 ? '' : 's'} found`}
                            </p> */}
                        </div>

                        {isLoadingItems ? (
                            <div style={{ padding: '14px 12px', color: t.cellMuted, fontSize: 12 }}>
                                Loading requisition items…
                            </div>
                        ) : itemsError ? (
                            <div style={{ padding: '14px 12px', color: t.cellRed, fontSize: 12 }}>
                                {itemsError}
                            </div>
                        ) : liquidationItems.length === 0 ? (
                            <div style={{ padding: '14px 12px', color: t.cellMuted, fontSize: 12 }}>
                                No request-entry items were found for this requisition slip.
                            </div>
                        ) : (
                            <>
                            {/* <div style={{ padding: '10px 12px', background: t.tableHeadBg, borderBottom: `1px solid ${t.tableHeadBorder}` }}>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: t.tableHeadText, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    {isAdmin ? 'Returned Amounts' : 'Requisition Items'}
                                </p>
                                {isAdmin && (
                                    <p style={{ margin: '3px 0 0', fontSize: 10, color: t.cellMuted }}>
                                        Save changes before approving. Balances are recalculated by the difference from the last saved amount.
                                    </p>
                                )}
                            </div> */}
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                                    <thead>
                                        <tr style={{ background: t.tableHeadBg }}>
                                            {['Account', 'Item', 'Total Cost', 'Returned Amount'].map((label, index) => (
                                                <th key={label} style={{
                                                    padding: '8px 10px', fontSize: 9, color: t.tableHeadText,
                                                    textAlign: index >= 2 ? 'right' : 'left', textTransform: 'uppercase',
                                                    borderBottom: `1px solid ${t.tableHeadBorder}`,
                                                }}>{label}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {liquidationItems.map(item => {
                                            const amount = Number(returnedAmounts[item.id]);
                                            const invalid = !Number.isFinite(amount) || amount < 0 || amount > Number(item.total_cost);
                                            return (
                                                <tr key={item.id} style={{ borderBottom: `1px solid ${t.rowBorder}` }}>
                                                    <td style={{ padding: '9px 10px', fontSize: 11, color: t.cellMuted }}>{item.account_code}</td>
                                                    <td style={{ padding: '9px 10px', fontSize: 11, color: t.cellText }}>{item.description}</td>
                                                    <td style={{ padding: '9px 10px', fontSize: 11, color: t.cellText, textAlign: 'right', whiteSpace: 'nowrap' }}>₱ {fmt(Number(item.total_cost))}</td>
                                                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                            <span style={{ fontSize: 11, color: t.cellMuted }}>₱</span>
                                                            {isAdmin ? <input
                                                                type="number"
                                                                min={0}
                                                                max={Number(item.total_cost)}
                                                                step="0.01"
                                                                value={returnedAmounts[item.id] ?? ''}
                                                                onChange={e => setReturnedAmounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                                disabled={localIsApprove === 1 || isSavingReturnedAmounts}
                                                                style={{
                                                                    width: 110, padding: '6px 8px', borderRadius: 7, textAlign: 'right',
                                                                    background: t.inputBg, color: t.inputText, outline: 'none', fontSize: 11,
                                                                    border: `1px solid ${invalid ? t.cellRed : t.inputBorder}`,
                                                                }}
                                                            /> : <span style={{ fontSize: 11, color: t.cellText }}>{fmt(Number(item.unused_amount ?? 0))}</span>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {isAdmin && <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 12px', background: t.cardHeaderBg }}>
                                <button
                                    onClick={handleSaveReturnedAmounts}
                                    disabled={!returnedAmountsDirty || isSavingReturnedAmounts || localIsApprove === 1}
                                    style={{
                                        padding: '7px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8,
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        cursor: !returnedAmountsDirty || isSavingReturnedAmounts ? 'not-allowed' : 'pointer',
                                        background: !returnedAmountsDirty || isSavingReturnedAmounts ? t.btnDisBg : t.btnRefresh.bg,
                                        border: `1px solid ${!returnedAmountsDirty || isSavingReturnedAmounts ? t.btnDisBorder : t.btnRefresh.border}`,
                                        color: !returnedAmountsDirty || isSavingReturnedAmounts ? t.btnDisText : t.btnRefresh.text,
                                    }}
                                >
                                    {isSavingReturnedAmounts && <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />}
                                    {isSavingReturnedAmounts ? 'Saving…' : 'Save Returned Amounts'}
                                </button>
                            </div>}
                            </>
                        )}
                    </div>

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
                    {/* ── Admin: untag and approve are separate final actions ── */}
                    {isAdmin && (
                        <button
                            onClick={handleUntagLiquidation}
                            disabled={isUntagging || isTogglingApprove || isSavingReturnedAmounts}
                            style={{
                                padding: '7px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8,
                                display: 'flex', alignItems: 'center', gap: 6,
                                cursor: isUntagging ? 'not-allowed' : 'pointer',
                                background: isUntagging ? t.btnDisBg : 'transparent',
                                border: `1px solid ${isUntagging ? t.btnDisBorder : t.cellAmber}`,
                                color: isUntagging ? t.btnDisText : t.cellAmber,
                            }}
                        >
                            {isUntagging && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
                            {isUntagging ? 'Removing…' : 'Untag Liquidation'}
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            onClick={handleToggleApprove}
                            disabled={approveDisabled}
                            style={{
                                padding: '7px 18px', fontSize: 12, fontWeight: 700, borderRadius: 8,
                                display: 'flex', alignItems: 'center', gap: 6,
                                cursor: approveDisabled ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                                background: approveDisabled
                                    ? t.btnDisBg
                                    : (isDark ? 'rgba(5,150,105,0.70)' : '#059669'),
                                border: `1px solid ${approveDisabled
                                    ? t.btnDisBorder
                                    : (isDark ? 'rgba(52,211,153,0.55)' : '#047857')}`,
                                color: approveDisabled ? t.btnDisText : '#ffffff',
                            }}
                        >
                            {isTogglingApprove
                                ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                                : <CheckCircle2 style={{ width: 13, height: 13 }} />
                            }
                            {isTogglingApprove
                                ? 'Processing…'
                                : isLocallyApproved
                                    ? 'Approved'
                                    : returnedAmountsDirty
                                        ? 'Save Amounts First'
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
