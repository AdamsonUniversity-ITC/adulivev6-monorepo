import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, CreditCard, RefreshCw, User, X } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import type { PayeeDetailRecord, ThemeTokens } from '../types';
import { Btn } from './common';

export interface PayeeDetailRecord {
    tin: string | null;
    is_adu_employee: boolean;
    is_vat_registered: boolean;
    is_cheque: boolean;
    is_bank: boolean;
    bank_name: string | null;
    account_name: string | null;
    account_number: string | null;
    bank_address: string | null;
}

export const PAYEE_VIEW_REQUIRED_FORMS = ['Payment for Supplier/Water', 'Reimbursement/Replenishment'];

export function PayeeDetailsViewModal({
    open, onClose, payeeName, detail, t, isDark,
}: {
    open: boolean;
    onClose: () => void;
    payeeName: string;
    detail: PayeeDetailRecord | null;
    t: ThemeTokens;
    isDark: boolean;
}) {
    if (!open) return null;

    const labelStyle: React.CSSProperties = {
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
        color: t.tableHeadText, marginBottom: 5, display: 'block',
    };
    const readonlyFieldStyle: React.CSSProperties = {
        width: '100%', borderRadius: 8, fontSize: 11, fontWeight: 600,
        padding: '7px 11px', border: `1px solid ${t.sectionDivider}`,
        background: isDark ? 'rgba(10,22,50,0.55)' : 'rgba(220,234,255,0.55)',
        color: t.cellText, outline: 'none', boxSizing: 'border-box' as const,
        cursor: 'default',
    };
    const sectionHead: React.CSSProperties = {
        fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em',
        color: t.tableHeadText, marginBottom: 8, paddingBottom: 5,
        borderBottom: `1px solid ${t.sectionDivider}`,
    };
    const emptyVal = (val: string | null | undefined) =>
        val ? val : <span style={{ color: t.cellMuted, fontStyle: 'italic', fontWeight: 400 }}>—</span>;

    function ReadonlyCheck({ checked, label }: { checked: boolean; label: string }) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div
                    style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `1.5px solid ${checked ? (isDark ? '#60a5fa' : '#3b82f6') : t.sectionDivider}`,
                        background: checked
                            ? (isDark ? 'rgba(96,165,250,0.18)' : 'rgba(59,130,246,0.10)')
                            : (isDark ? 'rgba(10,22,50,0.55)' : 'rgba(220,234,255,0.55)'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    {checked && <Check style={{ width: 10, height: 10, color: isDark ? '#60a5fa' : '#3b82f6', strokeWidth: 3 }} />}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: checked ? t.cellText : t.cellMuted }}>{label}</span>
            </div>
        );
    }

    const mopLabel = detail?.is_cheque ? 'Cheque' : detail?.is_bank ? 'Bank Transfer' : '—';

    return createPortal(
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 100000,
                background: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(0,20,60,0.45)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                style={{
                    width: '100%', maxWidth: 480,
                    borderRadius: 16,
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.60)' : '0 16px 48px rgba(0,20,60,0.18)',
                    animation: 'modal-in .18s ease both',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '14px 20px 12px',
                    borderBottom: `1px solid ${t.sectionDivider}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <User style={{ width: 15, height: 15, color: isDark ? '#60a5fa' : '#3b82f6' }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: t.titleColor }}>Payee Details</span>
                        {/* Read-only badge */}
                        <span
                            style={{
                                fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
                                padding: '2px 7px', borderRadius: 6,
                                background: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(253,230,138,0.40)',
                                border: `1px solid ${isDark ? 'rgba(251,191,36,0.35)' : 'rgba(202,138,4,0.35)'}`,
                                color: isDark ? t.cellAmber : '#92400e',
                            }}
                        >
                            Read Only
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.cellMuted, display: 'flex', padding: 2 }}
                    >
                        <X style={{ width: 15, height: 15 }} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '18px 20px 20px', maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>

                    {/* Payee */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Payee</label>
                        <div style={readonlyFieldStyle}>{emptyVal(payeeName)}</div>
                    </div>

                    {/* TIN No. */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>TIN No.</label>
                        <div style={readonlyFieldStyle}>{emptyVal(detail?.tin)}</div>
                    </div>

                    {/* Classification */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={sectionHead}>Classification</div>
                        <ReadonlyCheck checked={!!detail?.is_adu_employee} label="AdU Employee" />
                        <ReadonlyCheck checked={!!detail && !detail.is_vat_registered && !detail.is_adu_employee} label="Non-VAT Registered" />
                        <ReadonlyCheck checked={!!detail?.is_vat_registered} label="VAT Registered" />
                    </div>

                    {/* Mode of Payment */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={sectionHead}>Mode of Payment</div>
                        {/* Radio-style display */}
                        {(['Cheque', 'Bank Transfer'] as const).map(opt => {
                            const isSelected = opt === 'Cheque' ? !!detail?.is_cheque : !!detail?.is_bank;
                            return (
                                <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <div
                                        style={{
                                            width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                                            border: `1.5px solid ${isSelected ? (isDark ? '#60a5fa' : '#3b82f6') : t.sectionDivider}`,
                                            background: isSelected
                                                ? (isDark ? 'rgba(96,165,250,0.18)' : 'rgba(59,130,246,0.10)')
                                                : (isDark ? 'rgba(10,22,50,0.55)' : 'rgba(220,234,255,0.55)'),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        {isSelected && (
                                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: isDark ? '#60a5fa' : '#3b82f6' }} />
                                        )}
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? t.cellText : t.cellMuted }}>{opt}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bank Transfer fields — shown only when is_bank */}
                    {detail?.is_bank && (
                        <div
                            style={{
                                borderRadius: 10,
                                border: `1px solid ${t.cardBorder}`,
                                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                padding: '14px 14px 10px',
                                marginBottom: 4,
                            }}
                        >
                            <div style={{ ...sectionHead, marginBottom: 12 }}>Bank Transfer Details</div>

                            <div style={{ marginBottom: 12 }}>
                                <label style={labelStyle}>Bank Name</label>
                                <div style={readonlyFieldStyle}>{emptyVal(detail?.bank_name)}</div>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={labelStyle}>Account Name</label>
                                <div style={readonlyFieldStyle}>{emptyVal(detail?.account_name)}</div>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={labelStyle}>Account Number</label>
                                <div style={{ ...readonlyFieldStyle, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
                                    {emptyVal(detail?.account_number)}
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Bank Address</label>
                                <div style={readonlyFieldStyle}>{emptyVal(detail?.bank_address)}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 20px',
                    borderTop: `1px solid ${t.sectionDivider}`,
                    display: 'flex', justifyContent: 'flex-end',
                }}>
                    <Btn token={t.btnRefresh} icon={<X className="w-3.5 h-3.5" />} label="Close" onClick={onClose} t={t} />
                </div>
            </div>
        </div>,
        document.body,
    );
}
