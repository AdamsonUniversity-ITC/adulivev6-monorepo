import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    AlertTriangle, Banknote, Box, Check, ChevronDown, CreditCard, Droplets, FilePlus, HeartHandshake, Info, RefreshCw, Repeat2, Search, ShoppingCart, UserRound, WalletCards, X,
} from 'lucide-react';
import type { PayeeDetails, ThemeTokens } from '../types';
import { Btn } from './common';
import { PAYEE_REQUIRED_FORMS, PayeeDetailsModal } from './PayeeDetailsModal';
import { SupplyListPanel } from './SupplyListPanel';

export type RSType = 'stockroom' | 'logistics' | 'cashier' | null;

// eslint-disable-next-line react-refresh/only-export-components
export const PAYMENT_FORMS = [
    'Payment for Supplier/Water',
    'Reimbursement/Replenishment',
    'Payment for Honorarium',
    'Payment for Employee Benefits(Maternal Leave, Magna Carta, etc.)',
    'Request for Cash Advance',
    'PNB Credit Card Payment',

];

const PAYMENT_FORM_ICONS = [Droplets, Repeat2, UserRound, HeartHandshake, WalletCards, CreditCard];

export interface RSTypeOption {
    id: RSType;
    label: string;
    note: string;
}

// eslint-disable-next-line react-refresh/only-export-components
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
    const [paymentFormError, setPaymentFormError] = useState<string | null>(null);
    const [paymentFormOpen, setPaymentFormOpen] = useState(false);
    const [showSupplyList, setShowSupplyList] = useState(false);
    const [showPayeeModal, setShowPayeeModal] = useState(false);
    const [pendingType, setPendingType] = useState<RSType>(null);


    useEffect(() => {
        if (!open) return;
        const resetTimer = window.setTimeout(() => {
            setSelected('stockroom');
            setPaymentForm('');
            setPaymentFormError(null);
            setPaymentFormOpen(false);
            setShowSupplyList(false);
            setShowPayeeModal(false);
            setPendingType(null);
        }, 0);
        return () => window.clearTimeout(resetTimer);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    function handleConfirm() {
        if (!selected || isLoading) return;
        if (selected === 'cashier' && !paymentForm) {
            setPaymentFormError('Payment form is required for Cash Valued Items.');
            return;
        }
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
        >
            <style>{`
                @keyframes modal-in {
                    from { opacity: 0; transform: scale(0.97) translateY(8px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0);   }
                }
            `}</style>

            <div
                className="mx-auto flex min-h-full w-full max-w-[1380px] flex-col items-center justify-start gap-3 lg:flex-row lg:items-center lg:justify-center lg:gap-4"
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
                    className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[720px] min-w-0 flex-col overflow-hidden rounded-2xl"
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
                        padding: '28px 36px 22px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                >
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: isDark ? 'rgba(37,99,235,.18)' : '#eef4ff', color: t.cellBlue }}>
                            <FilePlus className="h-7 w-7" />
                        </div>
                        <div>
                        <h2
                            id="new-rs-modal-title"
                            className="text-2xl font-extrabold tracking-tight"
                            style={{ color: t.titleColor }}
                        >
                            New Requisition Slip
                        </h2>
                        <p className="mt-1 text-sm" style={{ color: t.cellMuted }}>
                            Select the type of budget request to proceed.
                        </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-150"
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
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6 sm:px-11">

                    {/* RS Type options */}
                    <p
                        className="mb-1 text-sm font-extrabold uppercase tracking-widest"
                        style={{ color: t.tableHeadText }}
                    >
                        1. Request Type
                    </p>
                    <p className="mb-5 text-sm" style={{ color: t.cellMuted }}>Choose the category that best matches your request.</p>

                    <div
                        className="mb-7 space-y-3"
                    >
                        {RS_TYPES.map((opt, i) => {
                            const isSel = selected === opt.id;
                            return (
                                <div
                                    key={opt.id}
                                    className="overflow-hidden rounded-2xl"
                                    style={{ border: `1.5px solid ${isSel ? t.cellBlue : t.cardBorder}` }}
                                >
                                    {/* Clickable row */}
                                    <div
                                        onClick={() => {
                                            setSelected(opt.id);
                                            setPaymentFormError(null);
                                            if (opt.id !== 'cashier') {
                                                setPaymentForm('');
                                                setPaymentFormOpen(false);
                                            }
                                        }}
                                        className="flex cursor-pointer items-center gap-5 px-6 py-5 transition-all duration-150"
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
                                            className="shrink-0 flex items-center justify-center rounded-full transition-all duration-150"
                                            style={{
                                                width: 24, height: 24,
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
                                                    width: 8, height: 8,
                                                    borderRadius: '50%',
                                                    background: '#fff',
                                                }} />
                                            )}
                                        </div>

                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full" style={{ background: isDark ? 'rgba(37,99,235,.16)' : '#eaf1ff', color: t.cellBlue }}>
                                            {i === 0 ? <Box className="h-8 w-8" /> : i === 1 ? <ShoppingCart className="h-8 w-8" /> : <WalletCards className="h-8 w-8" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className="text-base font-bold leading-snug"
                                                style={{
                                                    color: isSel
                                                        ? (isDark ? t.cellText : '#0a1628')
                                                        : t.cellMuted,
                                                }}
                                            >
                                                {opt.label}
                                            </p>
                                            <p
                                                className="mt-1 text-sm leading-relaxed"
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
                            className="mb-2 block text-sm font-extrabold uppercase tracking-widest"
                            style={{ color: t.tableHeadText }}
                        >
                            2. Payment Form
                            {selected === 'cashier' && <span style={{ color: t.cellRed }}> *</span>}
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                aria-haspopup="listbox"
                                aria-expanded={paymentFormOpen}
                                disabled={selected !== 'cashier'}
                                onClick={() => setPaymentFormOpen(open => !open)}
                                onKeyDown={event => {
                                    if (event.key === 'Escape') setPaymentFormOpen(false);
                                }}
                                className="flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left text-sm font-semibold outline-none transition-all duration-150"
                                style={{
                                    background: selected === 'cashier' ? t.inputBg : (isDark ? 'rgba(10,18,42,0.4)' : 'rgba(241,245,249,0.8)'),
                                    borderColor: paymentFormOpen ? t.cellBlue : t.inputBorder,
                                    color: paymentForm ? t.inputText : t.inputPlaceholder,
                                    opacity: selected === 'cashier' ? 1 : 0.45,
                                    cursor: selected === 'cashier' ? 'pointer' : 'not-allowed',
                                    boxShadow: paymentFormOpen ? `0 0 0 2px ${isDark ? 'rgba(59,130,246,.16)' : 'rgba(37,99,235,.10)'}` : 'none',
                                }}
                            >
                                <span>{paymentForm || '— Select payment form —'}</span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${paymentFormOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {paymentFormOpen && selected === 'cashier' && (
                                <div
                                    role="listbox"
                                    aria-label="Payment form"
                                    className="absolute inset-x-0 top-full z-30 overflow-hidden rounded-b-xl border shadow-xl"
                                    style={{ background: t.cardBg, borderColor: t.inputBorder }}
                                >
                                    {['', ...PAYMENT_FORMS].map((form, index) => {
                                        const active = paymentForm === form;
                                        const OptionIcon = index > 0 ? PAYMENT_FORM_ICONS[index - 1] : Banknote;
                                        return (
                                            <button
                                                key={form || 'empty'}
                                                type="button"
                                                role="option"
                                                aria-selected={active}
                                                onClick={() => {
                                                    setPaymentForm(form);
                                                    setPaymentFormError(null);
                                                    setPaymentFormOpen(false);
                                                }}
                                                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors"
                                                style={{
                                                    background: active ? (isDark ? '#1d4ed8' : '#1769d2') : 'transparent',
                                                    color: active ? '#fff' : t.inputText,
                                                }}
                                                onMouseEnter={event => {
                                                    if (!active) event.currentTarget.style.background = t.rowHoverBg;
                                                }}
                                                onMouseLeave={event => {
                                                    if (!active) event.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <span className="w-4 shrink-0">{active ? <Check className="h-4 w-4" /> : <OptionIcon className="h-4 w-4" style={{ color: active ? '#fff' : t.cellBlue }} />}</span>
                                                {form || '— Select payment form —'}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        {paymentFormError && (
                            <p role="alert" className="mt-1.5 text-[10px] font-semibold" style={{ color: t.cellRed }}>
                                {paymentFormError}
                            </p>
                        )}
                    </div>

                    {/* Data Privacy notice */}
                    <div
                        className="mb-4 flex gap-4 rounded-xl px-5 py-4 text-sm leading-relaxed"
                        style={{
                            background: t.inputBg,
                            border: `1px solid ${t.cardBorder}`,
                            color: t.cellMuted,
                        }}
                    >
                        <Info className="mt-0.5 h-6 w-6 shrink-0" style={{ color: t.cellBlue }} />
                        <span>In compliance with the Data Privacy Act, we would like to secure your consent on the general use and sharing of information
                        obtained from you in the course of transactions with any employee of the AdU Finance department. These data, which includes
                        your sensitive or personal information, may be collected, processed or stored in accordance with AdU retention and disposal
                        policies for legitimate purposes, and to comply with AdU internal policies and its reporting obligations to government
                        authorities under applicable laws.</span>
                    </div>

                    {/* NOTE — visible only for stockroom */}
                    {selected === 'stockroom' && (
                        <div
                            className="mb-4 flex gap-4 rounded-xl px-5 py-4"
                            style={{
                                background: isDark ? 'rgba(251,191,36,0.07)' : 'rgba(253,230,138,0.30)',
                                border: `1px solid ${isDark ? 'rgba(251,191,36,0.22)' : 'rgba(202,138,4,0.30)'}`,
                            }}
                        >
                            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" style={{ color: isDark ? t.cellAmber : '#d97706' }} />
                            <div><p
                                className="mb-1 text-sm font-bold uppercase tracking-widest"
                                style={{ color: isDark ? t.cellAmber : '#b45309' }}
                            >
                                Note
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: isDark ? '#e5c97a' : '#1f2937' }}>
                                For Office Supplies / Stockable / Inventoriable Items (WICO / Stockroom) — you may search
                                for the item(s) using the button below to check availability in WICO / Stockroom.
                                If not available, you may request the item(s) through the Logistics Office under For Purchase.
                            </p></div>
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
                        className="grid shrink-0 grid-cols-1 gap-3 p-4 min-[420px]:grid-cols-2 sm:flex sm:justify-end sm:px-9 sm:py-5"
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
                            disabled={isLoading}
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
                paymentForm={paymentForm}
                t={t}
                isDark={isDark}
            />
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SelectSupplyModal — clickable supply list; replaces AddItemModal temporarily
