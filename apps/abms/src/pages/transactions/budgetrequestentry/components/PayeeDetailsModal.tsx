import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Check, ChevronDown, User, X } from 'lucide-react';
import type { PayeeDetails, ThemeTokens } from '../types';
import { Btn } from './common';

export const PAYEE_REQUIRED_FORMS = ['Payment for Supplier/Water', 'Payment for Honorarium'] as const;

export interface PayeeDetails {
    payee: string;
    tinNo: string;
    aduEmployee: boolean;
    nonAduEmployee: boolean;
    nonVatRegistered: boolean;
    vatRegistered: boolean;
    mopCheque: boolean;
    mopBankTransfer: boolean;
    bankName: string;
    accountName: string;
    accountNumber: string;
    bankAddress: string;
}

export const EMPTY_PAYEE: PayeeDetails = {
    payee: '',
    tinNo: '',
    aduEmployee: false,
    nonAduEmployee: false,
    nonVatRegistered: false,
    vatRegistered: false,
    mopCheque: false,
    mopBankTransfer: false,
    bankName: '',
    accountName: '',
    accountNumber: '',
    bankAddress: '',
};

export const BANK_OPTIONS = ['PNB', 'BDO', 'Metrobank', 'BPI'];

function CheckRow({
    checked,
    onChange,
    label,
    t,
    isDark,
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
    t: ThemeTokens;
    isDark: boolean;
}) {
    return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 6 }}>
            <div
                onClick={() => onChange(!checked)}
                style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `1.5px solid ${checked ? (isDark ? '#60a5fa' : '#3b82f6') : t.inputBorder}`,
                    background: checked ? (isDark ? 'rgba(96,165,250,0.18)' : 'rgba(59,130,246,0.10)') : t.inputBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .12s',
                }}
            >
                {checked && <Check style={{ width: 10, height: 10, color: isDark ? '#60a5fa' : '#3b82f6', strokeWidth: 3 }} />}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: t.inputText }}>{label}</span>
        </label>
    );
}

export function PayeeDetailsModal({
    open, onClose, onConfirm, paymentForm, t, isDark,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: (details: PayeeDetails) => void;
    paymentForm: string;
    t: ThemeTokens;
    isDark: boolean;
}) {
    const [form, setForm] = useState<PayeeDetails>(EMPTY_PAYEE);

    useEffect(() => {
        if (!open) return;
        const resetTimer = window.setTimeout(() => setForm(EMPTY_PAYEE), 0);
        return () => window.clearTimeout(resetTimer);
    }, [open, paymentForm]);

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    if (!open) return null;

    function set<K extends keyof PayeeDetails>(key: K, val: PayeeDetails[K]) {
        setForm(prev => ({ ...prev, [key]: val }));
    }

    const isSupplierPayment = paymentForm === 'Payment for Supplier/Water';
    const isHonorariumPayment = paymentForm === 'Payment for Honorarium';
    const hasSupplierClassification = form.vatRegistered !== form.nonVatRegistered;
    const hasHonorariumClassification = form.aduEmployee !== form.nonAduEmployee;
    const isValid = form.payee.trim() !== ''
        && (!(isSupplierPayment || isHonorariumPayment) || /^\d{1,20}$/.test(form.tinNo))
        && (!isSupplierPayment || hasSupplierClassification)
        && (!isHonorariumPayment || hasHonorariumClassification)
        && (form.mopCheque || form.mopBankTransfer) &&
        (!form.mopBankTransfer || (form.bankName !== '' && form.accountName.trim() !== '' && form.accountNumber.trim() !== ''));

    const labelStyle: React.CSSProperties = {
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
        color: t.tableHeadText, marginBottom: 5, display: 'block',
    };
    const inputStyle: React.CSSProperties = {
        width: '100%', borderRadius: 8, fontSize: 11, fontWeight: 600,
        padding: '7px 11px', border: `1px solid ${t.inputBorder}`,
        background: t.inputBg, color: t.inputText, outline: 'none',
        boxSizing: 'border-box' as const,
    };
    const sectionHead: React.CSSProperties = {
        fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em',
        color: t.tableHeadText, marginBottom: 8, paddingBottom: 5,
        borderBottom: `1px solid ${t.sectionDivider}`,
    };

    return createPortal(
        <div
            className="abms-modal-backdrop fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto p-3 sm:p-4"
            style={{
                background: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(0,20,60,0.45)',
                backdropFilter: 'blur(4px)',
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="payee-details-title"
                className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 w-full max-w-[480px] flex-col overflow-hidden rounded-2xl"
                style={{
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.60)' : '0 16px 48px rgba(0,20,60,0.18)',
                    animation: 'modal-in .18s ease both',
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
                        <span id="payee-details-title" style={{ fontSize: 13, fontWeight: 800, color: t.cardTitle }}>Payee Details</span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.cellMuted, display: 'flex', padding: 2 }}
                    >
                        <X style={{ width: 15, height: 15 }} />
                    </button>
                </div>

                {/* Body */}
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:px-5 sm:pb-5 sm:pt-[18px]">

                    {/* Payee */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Payee <span style={{ color: '#f87171' }}>*</span></label>
                        <input
                            style={inputStyle}
                            value={form.payee}
                            onChange={e => set('payee', e.target.value)}
                            placeholder="Enter payee name"
                        />
                    </div>

                    {/* TIN No. */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>
                            TIN No. {(isSupplierPayment || isHonorariumPayment) && <span style={{ color: '#f87171' }}>*</span>}
                        </label>
                        <input
                            style={inputStyle}
                            value={form.tinNo}
                            onChange={e => {
                                const v = e.target.value.replace(/\D/g, '');
                                set('tinNo', v);
                            }}
                            placeholder="Enter TIN number"
                            inputMode="numeric"
                            maxLength={20}
                        />
                    </div>

                    {/* Classification checkboxes */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={sectionHead}>Classification <span style={{ color: '#f87171' }}>*</span></div>
                        {isHonorariumPayment && (
                            <>
                                <CheckRow
                                    checked={form.aduEmployee}
                                    onChange={v => {
                                        set('aduEmployee', v);
                                        if (v) set('nonAduEmployee', false);
                                    }}
                                    label="AdU Employee"
                                    t={t}
                                    isDark={isDark}
                                />
                                <CheckRow
                                    checked={form.nonAduEmployee}
                                    onChange={v => {
                                        set('nonAduEmployee', v);
                                        if (v) set('aduEmployee', false);
                                    }}
                                    label="Non AdU Employee"
                                    t={t}
                                    isDark={isDark}
                                />
                            </>
                        )}
                        {isSupplierPayment && (
                            <>
                                <CheckRow
                                    checked={form.nonVatRegistered}
                                    onChange={v => {
                                        set('nonVatRegistered', v);
                                        if (v) set('vatRegistered', false);
                                    }}
                                    label="Non-VAT Registered"
                                    t={t}
                                    isDark={isDark}
                                />
                                <CheckRow
                                    checked={form.vatRegistered}
                                    onChange={v => {
                                        set('vatRegistered', v);
                                        if (v) set('nonVatRegistered', false);
                                    }}
                                    label="VAT Registered"
                                    t={t}
                                    isDark={isDark}
                                />
                            </>
                        )}
                    </div>

                    {/* Mode of Payment */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={sectionHead}>Mode of Payment <span style={{ color: '#f87171' }}>*</span></div>
                        {(['cheque', 'bank_transfer'] as const).map(opt => {
                            const isSelected = opt === 'cheque' ? form.mopCheque : form.mopBankTransfer;
                            const label = opt === 'cheque' ? 'Cheque' : 'Bank Transfer';
                            return (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 6 }}>
                                    <div
                                        onClick={() => {
                                            set('mopCheque', opt === 'cheque');
                                            set('mopBankTransfer', opt === 'bank_transfer');
                                        }}
                                        style={{
                                            width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                                            border: `1.5px solid ${isSelected ? (isDark ? '#60a5fa' : '#3b82f6') : t.inputBorder}`,
                                            background: isSelected ? (isDark ? 'rgba(96,165,250,0.18)' : 'rgba(59,130,246,0.10)') : t.inputBg,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all .12s',
                                        }}
                                    >
                                        {isSelected && (
                                            <div style={{
                                                width: 7, height: 7, borderRadius: '50%',
                                                background: isDark ? '#60a5fa' : '#3b82f6',
                                            }} />
                                        )}
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: t.inputText }}>{label}</span>
                                </label>
                            );
                        })}
                    </div>

                    {/* Bank Transfer fields */}
                    {form.mopBankTransfer && (
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

                            {/* Bank Name */}
                            <div style={{ marginBottom: 12 }}>
                                <label style={labelStyle}>Bank Name <span style={{ color: '#f87171' }}>*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        value={form.bankName}
                                        onChange={e => set('bankName', e.target.value)}
                                        style={{
                                            ...inputStyle,
                                            appearance: 'none', WebkitAppearance: 'none',
                                            paddingRight: 28,
                                            color: form.bankName ? t.inputText : t.inputPlaceholder,
                                            colorScheme: isDark ? 'dark' : 'light',
                                        }}
                                    >
                                        <option value="">— Select Bank —</option>
                                        {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <ChevronDown style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: t.cellMuted, pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Account Name */}
                            <div style={{ marginBottom: 12 }}>
                                <label style={labelStyle}>Account Name <span style={{ color: '#f87171' }}>*</span></label>
                                <input
                                    style={inputStyle}
                                    value={form.accountName}
                                    onChange={e => set('accountName', e.target.value)}
                                    placeholder="Enter account name"
                                />
                            </div>

                            {/* Account Number */}
                            <div style={{ marginBottom: 12 }}>
                                <label style={labelStyle}>Account Number <span style={{ color: '#f87171' }}>*</span></label>
                                <input
                                    style={inputStyle}
                                    value={form.accountNumber}
                                    onChange={e => set('accountNumber', e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter account number"
                                    inputMode="numeric"
                                />
                            </div>

                            {/* Bank Address */}
                            <div>
                                <label style={labelStyle}>Bank Address</label>
                                <input
                                    style={inputStyle}
                                    value={form.bankAddress}
                                    onChange={e => set('bankAddress', e.target.value)}
                                    placeholder="Enter bank address"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="grid shrink-0 grid-cols-1 gap-2 p-3 min-[420px]:grid-cols-2 sm:flex sm:justify-end sm:px-5" style={{
                    borderTop: `1px solid ${t.sectionDivider}`,
                }}>
                    <Btn token={t.btnRefresh} icon={<X className="w-3.5 h-3.5" />} label="Cancel" onClick={onClose} t={t} className="w-full justify-center sm:w-auto" />
                    <Btn
                        token={t.btnNew}
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                        label="Proceed"
                        onClick={() => {
                            if (!isValid) return;
                            onConfirm({
                                ...form,
                                aduEmployee: isSupplierPayment ? false : form.aduEmployee,
                                nonAduEmployee: isSupplierPayment ? false : form.nonAduEmployee,
                                nonVatRegistered: isHonorariumPayment ? false : form.nonVatRegistered,
                                vatRegistered: isHonorariumPayment ? false : form.vatRegistered,
                            });
                        }}
                        disabled={!isValid}
                        t={t}
                        className="w-full justify-center sm:w-auto"
                    />
                </div>
            </div>
        </div>,
        document.body,
    );
}

// NewRSModal — Budget Requisition Entry type-selection modal
