import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, MessageSquare, Paperclip, Plus, Printer, Save, StickyNote, Trash2, X, ClipboardList, User, UploadCloud, FileIcon, RefreshCw } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import type { PayeeDetails, RSFormItem, RSType, ThemeTokens } from '../types';
import { fmtCurrency, formatCurrentDate, formatRequisitionNumber, getCurrentSchoolYear } from '../utils';
import { AddItemModal } from './AddItemModal';
import { AttachmentsModal } from './AttachmentsModal';


export interface RSFormItem {
    id: number;
    accountId:number;
    accountNo: string;
    itemDescription: string;
    unitCost: string;
    quantity: string;
    unitOfMeasurement: string;
    totalCost: number;
}

export const RS_HEADER_MAP: Record<NonNullable<RSType>, { title: string; sub: string }> = {
    stockroom: {
        title: 'FOR OFFICE SUPPLIES / STOCKABLES (STOCKROOM)',
        sub: 'WICO / Stockroom — Office Supplies & Inventoriable Items',
    },
    logistics: {
        title: 'FOR PURCHASE (LOGISTICS OFFICE)',
        sub: 'Logistics Office — Purchase Requisition',
    },
    cashier: {
        title: 'FOR CASH VALUED ITEMS / CASH ADVANCE / PAYMENTS',
        sub: 'Accounting / Cashier — Cash or Check Release',
    },
};

export function getCurrentSchoolYear(): string {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed; June = 5
    const year = now.getFullYear();
    // School year starts in June
    const syStart = month >= 5 ? year : year - 1;
    return `${syStart}–${syStart + 1}`;
}

export function formatCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

export const fmtCurrency = (n: number) =>
    n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface UploadedAttachment {
    id: number;
    file_name: string;
    mime_type: string;
    size: number;
}

export function AttachmentsModal({
    open,
    onClose,
    t,
    isDark,
    rsHeaderId,
}: {
    open: boolean;
    onClose: () => void;
    t: ThemeTokens;
    isDark: boolean;
    rsHeaderId: number | null;
}) {
    const [attachments, setAttachments] = useState<File[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedAttachment[]>([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingFileId, setDeletingFileId] = useState<number | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const ACCEPTED_FILE_TYPES = '.png,.jpg,.jpeg,.gif,.webp,.pdf,.xls,.xlsx,.csv';
    const ALLOWED_MIME_TYPES = new Set([
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/svg+xml',
    ]);
    const MAX_FILE_BYTES = 25 * 1024 * 1024;

    useEffect(() => {
        setAttachments([]);
        setUploadedFiles([]);
        setFileError(null);
        setUploadSuccess(null);
    }, [rsHeaderId]);

    useEffect(() => {
        if (!open || !rsHeaderId) return;

        let active = true;
        financeSvc.get(`abms/budget-request-entry/${rsHeaderId}/files`)
            .then(res => {
                if (active) setUploadedFiles(res.data?.data ?? []);
            })
            .catch((err: unknown) => {
                if (!active) return;
                const message = typeof err === 'object' && err !== null && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                    : null;
                setFileError(message ?? 'Failed to load uploaded files.');
            });

        return () => { active = false; };
    }, [open, rsHeaderId]);

    const handleDropzoneClick = () => fileInputRef.current?.click();
    const handleFilesSelected = (files: FileList | null) => {
        if (!files) return;

        setUploadSuccess(null);

        const rejected: string[] = [];
        const accepted: File[] = [];

        Array.from(files).forEach(file => {
            if (!ALLOWED_MIME_TYPES.has(file.type)) {
                rejected.push(`"${file.name}" is not an accepted file type.`);
                return;
            }
            if (file.size > MAX_FILE_BYTES) {
                rejected.push(`"${file.name}" exceeds the 25 MB limit.`);
                return;
            }
            accepted.push(file);
        });

        setFileError(rejected.length > 0 ? rejected.join('\n') : null);
        if (accepted.length > 0) setAttachments(prev => [...prev, ...accepted]);
    };
    const handleRemoveAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleUploadAttachments = async () => {
        if (!rsHeaderId) {
            setFileError('Save the requisition slip header before uploading files.');
            return;
        }
        if (attachments.length === 0 || isUploading) return;

        setIsUploading(true);
        setFileError(null);
        setUploadSuccess(null);
        try {
            const formData = new FormData();
            attachments.forEach(file => formData.append('files[]', file));
            await financeSvc.post(`abms/budget-request-entry/${rsHeaderId}/files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const uploadedCount = attachments.length;
            const filesResponse = await financeSvc.get(`abms/budget-request-entry/${rsHeaderId}/files`);
            setUploadedFiles(filesResponse.data?.data ?? []);
            setAttachments([]);
            setUploadSuccess(`${uploadedCount} file${uploadedCount === 1 ? '' : 's'} uploaded successfully.`);
        } catch (err: unknown) {
            const message = typeof err === 'object' && err !== null && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : null;
            setFileError(message ?? 'Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteUploadedFile = async (file: UploadedAttachment) => {
        if (!rsHeaderId || deletingFileId !== null) return;

        setDeletingFileId(file.id);
        setFileError(null);
        setUploadSuccess(null);
        try {
            await financeSvc.delete(`abms/budget-request-entry/${rsHeaderId}/files/${file.id}`);
            setUploadedFiles(prev => prev.filter(item => item.id !== file.id));
            setUploadSuccess(`"${file.file_name}" was removed successfully.`);
        } catch (err: unknown) {
            const message = typeof err === 'object' && err !== null && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : null;
            setFileError(message ?? `Failed to remove "${file.file_name}". Please try again.`);
        } finally {
            setDeletingFileId(null);
        }
    };

    if (!open) return null;

    return createPortal(
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 100000,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16,
            }}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: 480,
                    background: t.cardBg, border: `1px solid ${t.cardBorder}`,
                    borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                    display: 'flex', flexDirection: 'column',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 18px', borderBottom: `1px solid ${t.cardHeaderBorder}`,
                    }}
                >
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.cellText, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Paperclip style={{ width: 14, height: 14 }} />
                        Add Files
                    </span>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.cellMuted }}
                    >
                        <X style={{ width: 16, height: 16 }} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: 18 }}>
                    <div
                        onClick={handleDropzoneClick}
                        onDragOver={e => { e.preventDefault(); setIsDragActive(true); }}
                        onDragLeave={() => setIsDragActive(false)}
                        onDrop={e => { e.preventDefault(); setIsDragActive(false); handleFilesSelected(e.dataTransfer.files); }}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: 6, padding: '28px 12px', borderRadius: 10,
                            border: `1.5px dashed ${isDragActive ? (isDark ? 'rgba(99,155,255,0.80)' : 'rgba(37,99,235,0.60)') : t.inputBorder}`,
                            background: isDragActive
                                ? (isDark ? 'rgba(37,99,235,0.10)' : 'rgba(219,234,254,0.50)')
                                : t.inputBg,
                            cursor: 'pointer',
                            transition: 'border-color .15s ease, background .15s ease',
                        }}
                    >
                        <UploadCloud style={{ width: 22, height: 22, color: t.cellMuted }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: t.cellText }}>
                            Drag & drop files here, or click to browse
                        </span>
                        <span style={{ fontSize: 9, color: t.cellMuted }}>
                            Accepted: images, PDF, Excel (.xls, .xlsx, .csv), max 25 MB each
                        </span>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept={ACCEPTED_FILE_TYPES}
                            onChange={e => {
                                handleFilesSelected(e.target.files);
                                e.currentTarget.value = '';
                            }}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {fileError && (
                        <div
                            style={{
                                marginTop: 10,
                                padding: '8px 10px',
                                borderRadius: 8,
                                whiteSpace: 'pre-line',
                                background: isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,242,242,0.90)',
                                border: `1px solid ${isDark ? 'rgba(248,113,113,0.30)' : 'rgba(220,38,38,0.25)'}`,
                                color: isDark ? '#fca5a5' : '#991b1b',
                                fontSize: 11,
                                lineHeight: 1.5,
                            }}
                        >
                            {fileError}
                        </div>
                    )}

                    {uploadSuccess && (
                        <div
                            role="status"
                            style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                marginTop: 10, padding: '8px 10px', borderRadius: 8,
                                background: isDark ? 'rgba(34,197,94,0.10)' : 'rgba(240,253,244,0.95)',
                                border: `1px solid ${isDark ? 'rgba(74,222,128,0.30)' : 'rgba(22,163,74,0.25)'}`,
                                color: isDark ? '#86efac' : '#166534', fontSize: 11,
                            }}
                        >
                            <CheckCircle2 style={{ width: 14, height: 14, flexShrink: 0 }} />
                            {uploadSuccess}
                        </div>
                    )}

                    {uploadedFiles.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <div style={{ marginBottom: 6, color: t.cellMuted, fontSize: 10, fontWeight: 700 }}>
                                Uploaded files ({uploadedFiles.length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {uploadedFiles.map(file => (
                                    <div
                                        key={file.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '6px 10px', borderRadius: 8,
                                            background: isDark ? 'rgba(34,197,94,0.08)' : 'rgba(240,253,244,0.80)',
                                            border: `1px solid ${isDark ? 'rgba(74,222,128,0.22)' : 'rgba(22,163,74,0.20)'}`,
                                            fontSize: 11, color: t.cellText,
                                        }}
                                    >
                                        <CheckCircle2 style={{ width: 13, height: 13, flexShrink: 0, color: isDark ? '#4ade80' : '#16a34a' }} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {file.file_name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => void handleDeleteUploadedFile(file)}
                                            disabled={deletingFileId !== null}
                                            aria-label={`Remove ${file.file_name}`}
                                            title="Remove uploaded file"
                                            style={{
                                                marginLeft: 'auto', width: 24, height: 24, borderRadius: 6,
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                background: 'transparent', border: 'none',
                                                cursor: deletingFileId !== null ? 'not-allowed' : 'pointer',
                                                color: isDark ? '#fca5a5' : '#b91c1c',
                                                opacity: deletingFileId !== null && deletingFileId !== file.id ? 0.45 : 1,
                                            }}
                                        >
                                            {deletingFileId === file.id
                                                ? <RefreshCw style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                                                : <Trash2 style={{ width: 12, height: 12 }} />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selected files preview */}
                    {attachments.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                            {attachments.map((file, i) => (
                                <div
                                    key={`${file.name}-${i}`}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '6px 10px', borderRadius: 8,
                                        background: isDark ? 'rgba(10,22,50,0.60)' : 'rgba(220,234,255,0.60)',
                                        border: `1px solid ${t.sectionDivider}`,
                                        fontSize: 11, color: t.cellText,
                                    }}
                                >
                                    <FileIcon style={{ width: 13, height: 13, flexShrink: 0, color: t.cellMuted }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {file.name}
                                    </span>
                                    <button
                                        onClick={() => handleRemoveAttachment(i)}
                                        style={{
                                            marginLeft: 'auto', width: 20, height: 20, borderRadius: 6,
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                            background: 'transparent', border: 'none', cursor: 'pointer', color: t.cellMuted,
                                        }}
                                    >
                                        <X style={{ width: 11, height: 11 }} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                        <button
                            onClick={onClose}
                            disabled={isUploading}
                            style={{
                                padding: '7px 14px',
                                borderRadius: 8,
                                border: `1px solid ${t.cardBorder}`,
                                background: 'transparent',
                                color: t.cellMuted,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: isUploading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUploadAttachments}
                            disabled={attachments.length === 0 || isUploading}
                            style={{
                                padding: '7px 14px',
                                borderRadius: 8,
                                border: `1px solid ${isDark ? 'rgba(167,139,250,0.40)' : 'rgba(124,58,237,0.35)'}`,
                                background: attachments.length === 0 || isUploading
                                    ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                                    : (isDark ? 'rgba(167,139,250,0.18)' : 'rgba(237,233,254,0.80)'),
                                color: attachments.length === 0 || isUploading ? t.cellMuted : (isDark ? '#c4b5fd' : '#7c3aed'),
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: attachments.length === 0 || isUploading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {isUploading ? 'Uploading...' : `Upload${attachments.length > 0 ? ` (${attachments.length})` : ''}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}
export function RSFormModal({
    open, rsType, rsHeaderId, rsHeaderData, department, onClose, onDiscard, onSaveSuccess, t, isDark,
    departmentId, sectionId, currentSchoolYear,
}: {
    open: boolean;
    rsType: RSType;
    rsHeaderId: number | null;
    rsHeaderData: {
        id: number;
        requisition_number: string;
        department: string;
        school_year: string;
        created_at: string;
        payee: string | null;
        payeeFromModal: boolean;
    } | null;
    department: string;
    onClose: () => void;
    onDiscard: () => Promise<void>;
    onSaveSuccess: (rsNumber: string) => void;
    t: ThemeTokens;
    isDark: boolean;
    departmentId: string;
    sectionId: string;
    currentSchoolYear: string;
}) {
    const [items, setItems] = useState<RSFormItem[]>([]);
    const [note, setNote] = useState('');
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [showAddItem, setShowAddItem] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [isSavingRS, setIsSavingRS] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [payeeInput, setPayeeInput] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    useEffect(() => {
        if (open) {
            setItems([]);
            setNote('');
            setShowAddItem(false);
            setIsSavingRS(false);
            setIsSaved(false);
            setPayeeInput(rsHeaderData?.payee ?? '');
        }
    }, [open]);

    if (!open || !rsType) return null;

    const header = RS_HEADER_MAP[rsType];
    const schoolYear = currentSchoolYear || getCurrentSchoolYear();
    const currentDate = formatCurrentDate();

    function handleSaveItem(item: RSFormItem) {
        setItems(prev => [...prev, item]);
    }

    async function removeItem(id: number) {
        try {
            await financeSvc.delete(`/abms/budget-request-entry/items/${id}`);
        } catch {
            // item may not yet be persisted (edge case); proceed with local removal
        }
        setItems(prev => prev.filter(item => item.id !== id));
    }

    const grandTotal = items.reduce((s, item) => s + item.totalCost, 0);

    async function handleSaveRS() {
        if (!rsHeaderId || isSavingRS || isSaved || items.length === 0) return;
        setIsSavingRS(true);
        try {
            const res = await financeSvc.patch(`/abms/budget-request-entry/${rsHeaderId}/save`, {
                total_amount: grandTotal,
                note: note.trim() || null,
                ...(!rsHeaderData?.payeeFromModal && payeeInput.trim()
                    ? { payee: payeeInput.trim() }
                    : {}),
            });
            setIsSaved(true);
            onSaveSuccess(res.data.requisition_number ?? String(rsHeaderId));
        } catch {
            // surface error — re-enable button so user can retry
        } finally {
            setIsSavingRS(false);
        }
    }

    // Shared display field style
    const displayField = (label: string, value: string) => (
        <div>
            <span
                className="block text-[9px] font-bold uppercase tracking-widest mb-0.5"
                style={{ color: t.tableHeadText }}
            >
                {label}
            </span>
            <div
                className="px-3 py-2 rounded-lg text-[11px] font-semibold"
                style={{
                    background: isDark ? 'rgba(10,22,50,0.60)' : 'rgba(220,234,255,0.60)',
                    border: `1px solid ${t.sectionDivider}`,
                    color: t.cellText,
                    minHeight: 32,
                }}
            >
                {value || <span style={{ color: t.cellMuted, fontStyle: 'italic' }}>—</span>}
            </div>
        </div>
    );

    const iconBtn = (
        icon: React.ReactNode,
        label: string,
        onClick: () => void,
        color: { bg: string; border: string; text: string; hover: string },
    ) => {
        return (
            <button
                onClick={onClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                style={{ background: color.bg, borderColor: color.border, color: color.text }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = color.hover; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = color.bg; }}
            >
                {icon}{label}
            </button>
        );
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
            onClick={e => { if (e.target === e.currentTarget) isSaved ? onClose() : onDiscard(); }}
        >
            <style>{`
                @keyframes rsform-in {
                    from { opacity: 0; transform: scale(0.97) translateY(10px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>

            <div
                style={{
                    width: '100%', maxWidth: '860px',
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    borderRadius: '18px',
                    boxShadow: t.cardShadow,
                    overflow: 'hidden',
                    animation: 'rsform-in .22s cubic-bezier(.22,1,.36,1)',
                    display: 'flex', flexDirection: 'column',
                }}
            >
                {/* ── Header ── */}
                <div
                    style={{
                        background: t.cardHeaderBg,
                        borderBottom: `1px solid ${t.cardHeaderBorder}`,
                        padding: '16px 22px',
                    }}
                >
                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span
                                    className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                                    style={{ background: t.pillBg, color: t.pillText, border: `1px solid ${t.pillBorder}` }}
                                >
                                    Requisition Slip
                                </span>
                            </div>
                            <h2
                                className="text-sm font-bold tracking-tight mt-1.5 leading-snug"
                                style={{ color: t.titleColor }}
                            >
                                {header.title}
                            </h2>
                            <p className="text-[10px] mt-0.5" style={{ color: t.cellMuted }}>
                                {header.sub}
                            </p>
                        </div>
                        {/* Close button */}
                        <button
                            onClick={isSaved ? onClose : onDiscard}
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

                    {/* Meta info row */}
                    <div
                        className="grid gap-3 mt-4"
                        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
                    >
                        {/* RS No. — enlarged + highlighted */}
                        <div>
                            <span
                                className="block text-[9px] font-bold uppercase tracking-widest mb-0.5"
                                style={{ color: t.tableHeadText }}
                            >
                                Requisition Slip No.
                            </span>
                            <div
                                style={{
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
                                }}
                            >
                                <ClipboardList style={{ width: 14, height: 14, opacity: 0.7, flexShrink: 0 }} />
                                {formatRequisitionNumber(rsHeaderData?.requisition_number ?? '0')}
                            </div>
                        </div>
                        {displayField('Department / Section', rsHeaderData?.department ?? department ?? '—')}
                        {displayField('Date', rsHeaderData?.created_at
                            ? new Date(rsHeaderData.created_at).toLocaleDateString('en-US', {
                                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                            })
                            : currentDate
                        )}
                        {displayField('School Year', rsHeaderData?.school_year ?? schoolYear)}
                    </div>

                    {/* Action buttons row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 14 }}>
                        <button
                            onClick={handleSaveRS}
                            disabled={isSavingRS || isSaved || items.length === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                            style={{
                                background: isSaved
                                    ? (isDark ? 'rgba(34,197,94,0.15)' : 'rgba(220,252,231,0.80)')
                                    : items.length === 0
                                        ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)')
                                        : t.btnNew.bg,
                                borderColor: isSaved
                                    ? (isDark ? 'rgba(34,197,94,0.40)' : 'rgba(22,163,74,0.35)')
                                    : items.length === 0
                                        ? (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)')
                                        : t.btnNew.border,
                                color: isSaved
                                    ? (isDark ? '#4ade80' : '#15803d')
                                    : items.length === 0
                                        ? (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)')
                                        : t.btnNew.text,
                                opacity: isSavingRS ? 0.6 : 1,
                                cursor: (isSavingRS || isSaved || items.length === 0) ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={e => { if (!isSavingRS && !isSaved && items.length > 0) (e.currentTarget as HTMLElement).style.background = t.btnNew.hover; }}
                            onMouseLeave={e => { if (!isSavingRS && !isSaved && items.length > 0) (e.currentTarget as HTMLElement).style.background = isSaved ? (isDark ? 'rgba(34,197,94,0.15)' : 'rgba(220,252,231,0.80)') : t.btnNew.bg; }}
                        >
                            {isSavingRS
                                ? <RefreshCw className="w-3.5 h-3.5" style={{ animation: 'spin 1s linear infinite' }} />
                                : isSaved
                                    ? <CheckCircle2 className="w-3.5 h-3.5" />
                                    : <Save className="w-3.5 h-3.5" />
                            }
                            {isSavingRS ? 'Saving…' : isSaved ? 'RS Saved' : 'Create / Save RS'}
                        </button>
                        {iconBtn(
                            <Plus className="w-3.5 h-3.5" />,
                            'New Item',
                            () => setShowAddItem(true),
                            t.btnRefresh,
                        )}
                        {iconBtn(
                            <Printer className="w-3.5 h-3.5" />,
                            'Print RS',
                            () => { },
                            t.btnPrevSY,
                        )}
                        {iconBtn(
                            <MessageSquare className="w-3.5 h-3.5" />,
                            'Chat / Message',
                            () => setShowChat(p => !p),
                            {
                                bg: isDark ? 'rgba(147,197,253,0.10)' : 'rgba(219,234,254,0.55)',
                                border: isDark ? 'rgba(147,197,253,0.35)' : 'rgba(96,165,250,0.45)',
                                text: isDark ? '#93c5fd' : '#2563eb',
                                hover: isDark ? 'rgba(147,197,253,0.20)' : 'rgba(191,219,254,0.80)',
                            },
                        )}
                        {iconBtn(
                            <Paperclip className="w-3.5 h-3.5" />,
                            'Add Files',
                            () => setShowAttachments(true),
                            {
                                bg: isDark ? 'rgba(167,139,250,0.10)' : 'rgba(237,233,254,0.55)',
                                border: isDark ? 'rgba(167,139,250,0.35)' : 'rgba(139,92,246,0.40)',
                                text: isDark ? '#c4b5fd' : '#7c3aed',
                                hover: isDark ? 'rgba(167,139,250,0.20)' : 'rgba(221,214,254,0.80)',
                            },
                        )}
                        <div style={{ flex: 1 }} />
                        {iconBtn(
                            <X className="w-3.5 h-3.5" />,
                            isSaved ? 'Close' : 'Discard / Close',
                            isSaved ? onClose : onDiscard,
                            {
                                bg: isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,226,226,0.60)',
                                border: isDark ? 'rgba(248,113,113,0.35)' : 'rgba(220,38,38,0.28)',
                                text: isDark ? t.cellRed : '#b91c1c',
                                hover: isDark ? 'rgba(248,113,113,0.20)' : 'rgba(254,226,226,0.90)',
                            },
                        )}
                    </div>
                </div>

                {/* ── Items Table ── */}
                <div style={{ flex: 1, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                        <thead>
                            <tr style={{ background: t.tableHeadBg }}>
                                {[
                                    { label: '#', w: '36px', align: 'center' },
                                    { label: 'Account No.', w: '120px', align: 'left' },
                                    { label: 'Item Description', w: 'auto', align: 'left' },
                                    { label: 'Unit Cost', w: '110px', align: 'left' },
                                    { label: 'Qty', w: '70px', align: 'right' },
                                    { label: 'Unit', w: '80px', align: 'right' },
                                    { label: 'Total Cost', w: '120px', align: 'right' },
                                    { label: '', w: '38px', align: 'center' },
                                ].map((col, i, arr) => (
                                    <th
                                        key={col.label || `col-${i}`}
                                        style={{
                                            padding: '9px 12px',
                                            fontSize: '9px', fontWeight: 700,
                                            textTransform: 'uppercase', letterSpacing: '.08em',
                                            color: t.tableHeadText,
                                            textAlign: col.align as 'left' | 'right' | 'center',
                                            borderBottom: `2px solid ${t.tableHeadBorder}`,
                                            borderRight: i < arr.length - 1 ? `1px solid ${t.tableHeadBorder}` : 'none',
                                            width: col.w, whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        style={{ padding: '44px 16px', textAlign: 'center', fontSize: '11px', color: t.cellMuted }}
                                    >
                                        <Plus className="w-6 h-6 mx-auto mb-2 opacity-25" style={{ color: t.cellMuted }} />
                                        No items yet. Click{' '}
                                        <button
                                            onClick={() => setShowAddItem(true)}
                                            style={{ color: t.cellBlue, fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
                                        >
                                            New Item
                                        </button>{' '}
                                        to add a line.
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
                                    {/* Row # */}
                                    <td style={{ padding: '7px 10px', fontSize: 10, color: t.cellMuted, textAlign: 'center', borderRight: `1px solid ${t.rowBorder}`, fontFamily: "'JetBrains Mono', monospace" }}>
                                        {i + 1}
                                    </td>
                                    {/* Account No. */}
                                    <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, color: t.cellBlue, borderRight: `1px solid ${t.rowBorder}`, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                                        {item.accountNo || <span style={{ color: t.cellMuted, fontWeight: 400, fontStyle: 'italic' }}>—</span>}
                                    </td>
                                    {/* Item Description */}
                                    <td style={{ padding: '7px 12px', fontSize: 11, color: t.cellText, borderRight: `1px solid ${t.rowBorder}` }}>
                                        {item.itemDescription || <span style={{ color: t.cellMuted, fontStyle: 'italic' }}>—</span>}
                                    </td>
                                    {/* Unit Cost */}
                                    <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600, color: t.cellText, borderRight: `1px solid ${t.rowBorder}`, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                        ₱ {fmtCurrency(parseFloat(item.unitCost) || 0)}
                                    </td>
                                    {/* Quantity */}
                                    <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600, color: t.cellText, textAlign: 'right', borderRight: `1px solid ${t.rowBorder}`, fontFamily: "'JetBrains Mono', monospace" }}>
                                        {item.quantity || '0'}
                                    </td>
                                    {/* Unit of Measurement */}
                                    <td style={{ padding: '7px 12px', fontSize: 11, color: t.cellMuted, borderRight: `1px solid ${t.rowBorder}`, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        {item.unitOfMeasurement || '—'}
                                    </td>
                                    {/* Total Cost */}
                                    <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, color: t.cellGreen, textAlign: 'right', borderRight: `1px solid ${t.rowBorder}`, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                        ₱ {fmtCurrency(item.totalCost)}
                                    </td>
                                    {/* Delete */}
                                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            title="Remove item"
                                            style={{ width: 24, height: 24, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: t.cellMuted, transition: 'all .12s ease' }}
                                            onMouseEnter={e => {
                                                (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.14)' : 'rgba(254,226,226,0.70)';
                                                (e.currentTarget as HTMLElement).style.color = t.cellRed;
                                            }}
                                            onMouseLeave={e => {
                                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                                (e.currentTarget as HTMLElement).style.color = t.cellMuted;
                                            }}
                                        >
                                            <X style={{ width: 12, height: 12 }} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── Grand Total row ── */}
                {items.length > 0 && (
                    <div
                        style={{
                            padding: '10px 22px',
                            background: t.totalBg,
                            borderTop: `1px solid ${t.totalBorder}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12,
                        }}
                    >
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: t.totalLabel }}>
                            Grand Total
                        </span>
                        <div
                            style={{
                                padding: '6px 18px', borderRadius: 8,
                                background: t.cardHeaderBg, border: `1px solid ${t.cardBorder}`,
                                fontSize: 12, fontWeight: 700, color: t.cellGreen,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontVariantNumeric: 'tabular-nums',
                                minWidth: 150, textAlign: 'right',
                            }}
                        >
                            ₱ {fmtCurrency(grandTotal)}
                        </div>
                    </div>
                )}

                {/* ── Footer: Payee + Note ── */}
                <div
                    style={{
                        padding: '14px 22px',
                        background: t.cardHeaderBg,
                        borderTop: `1px solid ${t.cardHeaderBorder}`,
                        display: 'flex', flexDirection: 'column', gap: 14,
                    }}
                >
                    {/* Payee */}
                    <div>
                        <label
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: '.08em', color: t.tableHeadText, marginBottom: 6,
                            }}
                        >
                            <User style={{ width: 12, height: 12 }} />
                            Payee
                            {!rsHeaderData?.payeeFromModal && (
                                <span style={{ color: t.cellAmber, textTransform: 'none', fontSize: 9, fontWeight: 600, marginLeft: 2 }}>
                                    (optional)
                                </span>
                            )}
                        </label>
                        {rsHeaderData?.payeeFromModal ? (
                            <div
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '8px 12px', borderRadius: 10,
                                    background: isDark ? 'rgba(10,22,50,0.60)' : 'rgba(220,234,255,0.60)',
                                    border: `1px solid ${t.sectionDivider}`,
                                    fontSize: 12, fontWeight: 600, color: t.cellText,
                                    minHeight: 36,
                                }}
                            >
                                <CheckCircle2 style={{ width: 13, height: 13, color: isDark ? '#4ade80' : '#15803d', flexShrink: 0 }} />
                                <span>{rsHeaderData.payee || <span style={{ color: t.cellMuted, fontStyle: 'italic', fontWeight: 400 }}>—</span>}</span>
                                <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: isDark ? '#4ade80' : '#15803d', opacity: 0.8 }}>
                                    from payee details
                                </span>
                            </div>
                        ) : (
                            <input
                                value={payeeInput}
                                onChange={e => setPayeeInput(e.target.value)}
                                disabled={isSaved}
                                placeholder="Enter payee name…"
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: isSaved
                                        ? (isDark ? 'rgba(10,22,50,0.40)' : 'rgba(220,234,255,0.40)')
                                        : t.inputBg,
                                    border: `1px solid ${t.inputBorder}`,
                                    borderRadius: 10, padding: '8px 12px',
                                    fontSize: 12, fontWeight: 600, color: t.inputText,
                                    outline: 'none', transition: 'border-color .15s ease',
                                    fontFamily: 'inherit',
                                    cursor: isSaved ? 'not-allowed' : 'text',
                                    minHeight: 36,
                                }}
                                onFocus={e => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)'; }}
                                onBlur={e => { (e.target as HTMLElement).style.borderColor = t.inputBorder; }}
                            />
                        )}
                    </div>

                    {/* Note */}
                    <div>
                        <label
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: '.08em', color: t.tableHeadText, marginBottom: 6,
                            }}
                        >
                            <StickyNote style={{ width: 12, height: 12 }} />
                            Note
                        </label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            rows={2}
                            placeholder="Add any remarks or special instructions for this requisition slip…"
                            style={{
                                width: '100%', resize: 'vertical',
                                background: t.inputBg,
                                border: `1px solid ${t.inputBorder}`,
                                borderRadius: 10, padding: '8px 12px',
                                fontSize: 11, color: t.inputText,
                                outline: 'none', transition: 'border-color .15s ease',
                                fontFamily: 'inherit',
                            }}
                            onFocus={e => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)'; }}
                            onBlur={e => { (e.target as HTMLElement).style.borderColor = t.inputBorder; }}
                        />
                    </div>
                </div>
            </div>
            {/* Add Item Modal — rendered inside same portal overlay context */}
            <AddItemModal
                open={showAddItem}
                onClose={() => setShowAddItem(false)}
                onSave={handleSaveItem}
                t={t}
                isDark={isDark}
                departmentId={departmentId}
                sectionId={sectionId}
                currentSchoolYear={currentSchoolYear}
                rsHeaderId={rsHeaderId}
                rsType={rsType}
            />
            <AttachmentsModal
                open={showAttachments}
                onClose={() => setShowAttachments(false)}
                t={t}
                isDark={isDark}
                rsHeaderId={rsHeaderId}
            />
        </div>,
        document.body,
    );

    return <>{portal}</>;
}


// ─────────────────────────────────────────────────────────────────────────────
// PayeeDetailsViewModal — read-only view of payee details (same layout as the
// PayeeDetailsModal the user fills in, but all fields are disabled/display-only)
