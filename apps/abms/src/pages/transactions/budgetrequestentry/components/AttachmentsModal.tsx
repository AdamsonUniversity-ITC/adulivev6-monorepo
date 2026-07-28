import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { File as FileIcon, Paperclip, UploadCloud, X } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import type { ThemeTokens } from '../types';

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
    const [isDragActive, setIsDragActive] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
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

    const handleDropzoneClick = () => fileInputRef.current?.click();
    const handleFilesSelected = (files: FileList | null) => {
        if (!files) return;

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
        try {
            const formData = new FormData();
            attachments.forEach(file => formData.append('files[]', file));
            await financeSvc.post(`abms/budget-request-entry/${rsHeaderId}/files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAttachments([]);
            onClose();
        } catch (err: unknown) {
            const message = typeof err === 'object' && err !== null && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : null;
            setFileError(message ?? 'Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    if (!open) return null;

    return createPortal(
        <div
            className="abms-modal-backdrop"
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
                role="dialog"
                aria-modal="true"
                aria-label="Add requisition files"
                style={{
                    width: '100%', maxWidth: 480,
                    background: t.cardBg, border: `1px solid ${t.cardBorder}`,
                    borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                    display: 'flex', flexDirection: 'column',
                    maxHeight: 'calc(100dvh - 24px)',
                    overflow: 'hidden',
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
                <div style={{ padding: 18, overflowY: 'auto', minHeight: 0, flex: 1 }}>
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
