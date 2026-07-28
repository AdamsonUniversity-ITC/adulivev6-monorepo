import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    ChevronDown, FilePlus, RefreshCw, Search, X,
} from 'lucide-react';
import type { PayeeDetails, ThemeTokens } from '../types';
import { Btn } from './common';
import { PAYEE_REQUIRED_FORMS, PayeeDetailsModal } from './PayeeDetailsModal';
import { SupplyListPanel } from './SupplyListPanel';

export type RSType = 'stockroom' | 'logistics' | 'cashier' | null;

export const PAYMENT_FORMS = [
    'Payment for Supplier/Water',
    'Reimbursement/Replenishment',
    'Payment for Honorarium',
    'Payment for Employee Benefits(Maternal Leave, Magna Carta, etc.)',
    'Request for Cash Advance',
    'PNB Credit Card Payment',

];

export interface RSTypeOption {
    id: RSType;
    label: string;
    note: string;
}

export const RS_TYPES: RSTypeOption[] = [
    {
        id: 'stockroom',
        label: 'For Office Supplies / Stockable Items / Inventoriable Items (WICO / Stockroom)',
        note: 'Will be served by WICO within 2 working days after Budget Office certifies the RS.',
    },
    {
        id: 'logistics',
        label: 'For Purchase (Logistics Office)',
        note: 'Will be PO\'d by Logistics within 10 working days after Budget Office certifies the RS.',
    },
    {
        id: 'cashier',
        label: 'For Cash Valued Items / Cash Advance / Payments (Accounting / Cashier)',
        note: 'For signed check release within 5 working days after Budget Office certifies the RS.',
    },
];

export function NewRSModal({
    open, onClose, onConfirm, isLoading = false, t, isDark,
}: {
    open: boolean; onClose: () => void;
    onConfirm: (type: RSType, paymentForm: string, payeeDetails: PayeeDetails | null) => void;
    isLoading?: boolean;
    t: ThemeTokens; isDark: boolean;
}) {
    const [selected, setSelected] = useState<RSType>('stockroom');
    const [paymentForm, setPaymentForm] = useState('');
    const [showSupplyList, setShowSupplyList] = useState(false);
    const [showPayeeModal, setShowPayeeModal] = useState(false);
    const [pendingType, setPendingType] = useState<RSType>(null);


    useEffect(() => {
        if (!open) return;
        const resetTimer = window.setTimeout(() => {
            setSelected('stockroom');
            setPaymentForm('');
            setShowSupplyList(false);
            setShowPayeeModal(false);
            setPendingType(null);
        }, 0);
        return () => window.clearTimeout(resetTimer);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !showPayeeModal) onClose();
        };
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [onClose, open, showPayeeModal]);

    function handleConfirm() {
        if (!selected || isLoading) return;
        const needsPayee = PAYEE_REQUIRED_FORMS.includes(paymentForm as typeof PAYEE_REQUIRED_FORMS[number]);
        if (selected === 'cashier' && needsPayee) {
            setPendingType(selected);
            setShowPayeeModal(true);
        } else {
            onConfirm(selected, paymentForm, null);
        }
    }

    if (!open) return null;

    const portal = createPortal(
        <div
            className="abms-modal-backdrop fixed inset-0 z-[99998] overflow-y-auto p-3 sm:p-4"
            style={{
                background: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,20,60,0.40)',
                backdropFilter: 'blur(4px)',
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <style>{`
                @keyframes modal-in {
                    from { opacity: 0; transform: scale(0.97) translateY(8px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0);   }
                }
            `}</style>

            <div
                className="mx-auto flex min-h-full w-full max-w-[1116px] flex-col items-center justify-start gap-3 lg:flex-row lg:items-center lg:justify-center lg:gap-4"
                onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            >
                {/* Supply list panel — shown to the left when toggled */}
                {showSupplyList && (
                    <SupplyListPanel
                        t={t}
                        isDark={isDark}
                        onClose={() => setShowSupplyList(false)}
                    />
                )}

                {/* Modal card — same shape as the page card */}
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="new-rs-modal-title"
                    className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[580px] min-w-0 flex-col overflow-hidden rounded-2xl"
                    style={{
                        background: t.cardBg,
                        border: `1px solid ${t.cardBorder}`,
                        boxShadow: t.cardShadow,
                        animation: 'modal-in .20s cubic-bezier(.22,1,.36,1)',
                    }}
                >
                {/* ── Header — same style as the page card header ── */}
                <div
                    className="shrink-0"
                    style={{
                        background: t.cardHeaderBg,
                        borderBottom: `1px solid ${t.cardHeaderBorder}`,
                        padding: '14px 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <h2
                            id="new-rs-modal-title"
                            className="text-sm font-bold tracking-tight"
                            style={{ color: t.titleColor }}
                        >
                            New Requisition Slip
                        </h2>
                        <p className="text-[11px] mt-0.5" style={{ color: t.cellMuted }}>
                            Select the type of budget request to proceed.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-150"
                        style={{
                            background: 'transparent',
                            borderColor: t.cardBorder,
                            color: t.cellMuted,
                        }}
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

                {/* ── Body ── */}
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">

                    {/* RS Type options */}
                    <p
                        className="text-[10px] font-bold uppercase tracking-widest mb-3"
                        style={{ color: t.tableHeadText }}
                    >
                        Request Type
                    </p>

                    <div
                        className="rounded-xl overflow-hidden mb-4"
                        style={{ border: `1px solid ${t.cardBorder}` }}
                    >
                        {RS_TYPES.map((opt, i) => {
                            const isSel = selected === opt.id;
                            return (
                                <div
                                    key={opt.id}
                                    style={{
                                        borderBottom: i < RS_TYPES.length - 1
                                            ? `1px solid ${t.sectionDivider}` : 'none',
                                    }}
                                >
                                    {/* Clickable row */}
                                    <div
                                        onClick={() => setSelected(opt.id)}
                                        className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-150"
                                        style={{
                                            background: isSel
                                                ? (isDark ? 'rgba(37,99,235,0.14)' : 'rgba(219,234,254,0.60)')
                                                : 'transparent',
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSel)
                                                (e.currentTarget as HTMLElement).style.background = t.rowHoverBg;
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSel)
                                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                        }}
                                    >
                                        {/* Radio dot */}
                                        <div
                                            className="mt-0.5 shrink-0 flex items-center justify-center rounded-full transition-all duration-150"
                                            style={{
                                                width: 15, height: 15,
                                                border: `2px solid ${isSel
                                                    ? (isDark ? '#3b82f6' : '#1d4ed8')
                                                    : t.checkboxBorder}`,
                                                background: isSel
                                                    ? (isDark ? '#3b82f6' : '#1d4ed8')
                                                    : t.checkboxBg,
                                            }}
                                        >
                                            {isSel && (
                                                <div style={{
                                                    width: 5, height: 5,
                                                    borderRadius: '50%',
                                                    background: '#fff',
                                                }} />
                                            )}
                                        </div>

                                        {/* Text */}
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className="text-[11px] font-semibold leading-snug"
                                                style={{
                                                    color: isSel
                                                        ? (isDark ? t.cellText : '#0a1628')
                                                        : t.cellMuted,
                                                }}
                                            >
                                                {opt.label}
                                            </p>
                                            <p
                                                className="text-[10px] mt-1 leading-snug"
                                                style={{ color: isDark ? t.cellAmber : '#b45309' }}
                                            >
                                                {opt.note}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Payment Form — always shown, enabled only for cashier */}
                    <div className="mb-4">
                        <label
                            className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: t.tableHeadText }}
                        >
                            Payment Form
                        </label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={paymentForm}
                                onChange={e => setPaymentForm(e.target.value)}
                                disabled={selected !== 'cashier'}
                                className="w-full rounded-lg text-[11px] font-semibold px-3 py-2 border outline-none transition-all duration-150"
                                style={{
                                    background: selected === 'cashier' ? t.inputBg : (isDark ? 'rgba(10,18,42,0.4)' : 'rgba(241,245,249,0.8)'),
                                    borderColor: t.inputBorder,
                                    color: paymentForm ? t.inputText : t.inputPlaceholder,
                                    opacity: selected === 'cashier' ? 1 : 0.45,
                                    cursor: selected === 'cashier' ? 'default' : 'not-allowed',
                                    appearance: 'none', WebkitAppearance: 'none',
                                    colorScheme: isDark ? 'dark' : 'light',
                                    paddingRight: 28,
                                }}
                            >
                                <option value="">— Select —</option>
                                {PAYMENT_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <ChevronDown
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={{
                                    width: 13, height: 13,
                                    color: t.cellMuted,
                                    opacity: selected === 'cashier' ? 1 : 0.4,
                                }}
                            />
                        </div>
                    </div>

                    {/* Data Privacy notice */}
                    <div
                        className="rounded-xl px-4 py-3 mb-4 text-[10px] leading-relaxed"
                        style={{
                            background: t.inputBg,
                            border: `1px solid ${t.cardBorder}`,
                            color: t.cellMuted,
                        }}
                    >
                        In compliance with the Data Privacy Act, we would like to secure your consent on the general use and sharing of information
                        obtained from you in the course of transactions with any employee of the AdU Finance department. These data, which includes
                        your sensitive or personal information, may be collected, processed or stored in accordance with AdU retention and disposal
                        policies for legitimate purposes, and to comply with AdU internal policies and its reporting obligations to government
                        authorities under applicable laws.
                    </div>

                    {/* NOTE — visible only for stockroom */}
                    {selected === 'stockroom' && (
                        <div
                            className="rounded-xl px-4 py-3 mb-4"
                            style={{
                                background: isDark ? 'rgba(251,191,36,0.07)' : 'rgba(253,230,138,0.30)',
                                border: `1px solid ${isDark ? 'rgba(251,191,36,0.22)' : 'rgba(202,138,4,0.30)'}`,
                            }}
                        >
                            <p
                                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                                style={{ color: isDark ? t.cellAmber : '#b45309' }}
                            >
                                Note
                            </p>
                            <p className="text-[10px] leading-relaxed" style={{ color: isDark ? '#e5c97a' : '#92400e' }}>
                                For Office Supplies / Stockable / Inventoriable Items (WICO / Stockroom) — you may search
                                for the item(s) using the button below to check availability in WICO / Stockroom.
                                If not available, you may request the item(s) through the Logistics Office under For Purchase.
                            </p>
                        </div>
                    )}

                    {/* Check/Search button — stockroom only */}
                    {selected === 'stockroom' && (
                        <div className="mb-5">
                            <Btn
                                token={showSupplyList ? t.btnPrevSY : t.btnRefresh}
                                icon={<Search className="w-3.5 h-3.5" />}
                                label={showSupplyList ? 'Hide Supply List' : 'Check / Search Stockable / Inventoriable Items'}
                                onClick={() => setShowSupplyList(prev => !prev)}
                                t={t}
                            />
                        </div>
                    )}

                </div>

                    {/* Footer actions */}
                    <div
                        className="grid shrink-0 grid-cols-1 gap-2 p-3 min-[420px]:grid-cols-2 sm:flex sm:justify-end sm:px-5 sm:py-3.5"
                        style={{
                            background: t.cardHeaderBg,
                            borderTop: `1px solid ${t.sectionDivider}`,
                        }}
                    >
                        <Btn
                            token={t.btnRefresh}
                            icon={<X className="w-3.5 h-3.5" />}
                            label="Cancel"
                            onClick={onClose}
                            t={t}
                            className="w-full justify-center sm:w-auto"
                        />
                        <Btn
                            token={t.btnNew}
                            icon={isLoading
                                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                : <FilePlus className="w-3.5 h-3.5" />
                            }
                            label={isLoading ? 'Creating…' : 'Confirm & Proceed'}
                            onClick={handleConfirm}
                            disabled={isLoading}
                            t={t}
                            className="w-full justify-center sm:w-auto"
                        />
                    </div>

                </div>
            </div>
        </div>,
        document.body,
    );

    return (
        <>
            {portal}
            <PayeeDetailsModal
                open={showPayeeModal}
                onClose={() => setShowPayeeModal(false)}
                onConfirm={(details) => {
                    setShowPayeeModal(false);
                    onConfirm(pendingType, paymentForm, details);
                }}
                t={t}
                isDark={isDark}
            />
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SelectSupplyModal — clickable supply list; replaces AddItemModal temporarily
