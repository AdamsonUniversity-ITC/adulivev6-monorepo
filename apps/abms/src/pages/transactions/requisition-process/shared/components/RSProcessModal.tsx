import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    X, FileText, Building2, User, Hash, Calendar,
    DollarSign, MapPin, ArrowRightLeft, CheckCircle2,
    Clock, Package, Stamp, ShieldCheck, Truck, Calculator,
    CreditCard, ChevronDown, ChevronUp,
    Eye, MessageSquare, History, Send, RefreshCw, Printer, XCircle,
    AlertTriangle, AlertCircle, ArrowRight, ShoppingCart, Pencil, Save,
    Warehouse, BookOpen, Users, Briefcase, Landmark, Banknote,
    Undo2, PackageCheck, CircleDollarSign
} from 'lucide-react';
import { Theme } from '../types.ts';
import { PermissionKey } from '../constants.ts';
import { financeSvc } from '@repo/axios-config/finance-service';
import echo from '../../../../../lib/echo';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface RSLineItem {
    id: number;
    account_code: string;
    description: string;
    quantity: number;
    unit_of_measurement: string;
    unit_cost: number;
    total_cost: number;
    quoted_price?: number | null;
}

export interface RSProcessRow {
    id: number;
    date: string;
    requisition_no: string;
    department_id?: number | string | null;
    section_id?: number | string | null;
    kind?: 'Department' | 'Section';
    department_section: string;
    requested_by: string;
    requested_by_empno: string;
    total_amount: number;
    status: string | null;
    location: string | null;
    from: string | null;
    for_liquidation?: boolean;
    // Extended fields (populated when modal fetches detail)
    payee?: string | null;
    payment_form?: string | null;
    note?: string | null;
    items?: RSLineItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat & Audit types
// ─────────────────────────────────────────────────────────────────────────────
interface ChatMessage {
    id: number;
    sender_id: string;
    sender_name: string;
    message: string;
    created_at: string;
}

interface AuditRecord {
    id: number;
    event: string;
    user_id: string;
    username: string;
    user_name: string;
    created_at: string;
    old_values: Record<string, any>;
    new_values: Record<string, any>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Role action configs — what buttons each role sees
// ─────────────────────────────────────────────────────────────────────────────
interface RoleAction {
    label: string;
    variant: 'primary' | 'secondary' | 'danger' | 'success';
    /** Which statuses make this button visible. '*' = always visible */
    visibleOn: string[] | '*';
    /** Optional icon shown alongside the label */
    icon?: React.ElementType;
    /** Set to false to skip the confirmation modal (e.g. read-only actions). Defaults to true. */
    confirm?: boolean;
    /** Restrict visibility to specific roles, even within COMMON_ACTIONS. Omit to allow all roles. */
    restrictedTo?: PermissionKey[];
    /** If true, this action renders in the "Forward to…" group instead of the main action row. */
    forwardGroup?: boolean;
    /** If set, button is only shown when row.location matches one of these values (case-insensitive). */
    locationFilter?: string[];
    /** For COMMON_ACTIONS only: which toolbar group this renders in. Defaults to 'left' if omitted. */
    toolbarGroup?: 'left' | 'right';
}

const ROLE_ACTIONS: Partial<Record<PermissionKey, RoleAction[]>> = {
    'budget-access': [
        { label: 'Mark as Reviewed', variant: 'success', visibleOn: ['for review', 'for certification'], locationFilter: ['budget office'] },
        { label: 'Disapprove', variant: 'danger', visibleOn: ['for review', 'for certification'], locationFilter: ['budget office'] },
        // { label: 'Mark Unserved',    variant: 'secondary', visibleOn: ['certified rs'] },
    ],
    'admin-access': [
        { label: 'Disapprove', variant: 'danger', visibleOn: ['for budget director'], locationFilter: ['budget office'] },
        // ── Forward to… group — only when status is "for budget director" and location is "budget office" ──
        { label: 'Stockroom', icon: Warehouse, variant: 'secondary', visibleOn: ['for budget director'], locationFilter: ['budget office'], forwardGroup: true },
        { label: 'Accounting', icon: BookOpen, variant: 'secondary', visibleOn: ['for budget director'], locationFilter: ['budget office'], forwardGroup: true },
        { label: 'Acctg. Director', icon: Briefcase, variant: 'secondary', visibleOn: ['for budget director'], locationFilter: ['budget office'], forwardGroup: true },
        { label: 'HRMDO', icon: Users, variant: 'secondary', visibleOn: ['for budget director'], locationFilter: ['budget office'], forwardGroup: true },
        { label: 'BAO', icon: Landmark, variant: 'secondary', visibleOn: ['for budget director'], locationFilter: ['budget office'], forwardGroup: true },
        { label: 'Cash Management', icon: Banknote, variant: 'secondary', visibleOn: ['for budget director'], locationFilter: ['budget office'], forwardGroup: true },
    ],
    'logistics-access': [
        { label: 'Mark Served', variant: 'success', visibleOn: ['certified rs', 'unserved rs'] },
        { label: 'Mark Unserved', variant: 'secondary', visibleOn: ['certified rs'] },
    ],
    'accounting-access': [
        { label: 'Post Entry', variant: 'primary', visibleOn: ['certified rs', 'served'] },
        { label: 'Certify RS', variant: 'success', visibleOn: ['for certification'] },
    ],
    // 'stockroom-access' has no footer actions — its buttons (Return RS to Budget,
    // Mark Served) now live in COMMON_ACTIONS so they render in the toolbar
    // beside RS Process History / Print RS instead of the action footer.
    'cashier-access': [
        { label: 'Process Payment', variant: 'success', visibleOn: ['certified rs', 'for certification'] },
        { label: 'Return to Budget', variant: 'danger', visibleOn: ['for certification'] },
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Common actions — shown across all roles regardless of permission.
// Each entry's `toolbarGroup` ('left' | 'right', defaults to 'left') decides
// which side of the toolbar it renders in; order within the array is the
// render order within that group (see leftToolbarActions/rightToolbarActions
// below). 'For Purchase' is gated to admin-access + status 'for budget
// director' + location 'budget office', matching the Forward-to… group's
// visibility rules. 'Return RS to Budget' and 'Mark Served' are restricted to
// stockroom-access + location 'stockroom' and sit beside RS Process History
// / Print RS respectively, replacing the old stockroom-access footer.
// ─────────────────────────────────────────────────────────────────────────────
const COMMON_ACTIONS: RoleAction[] = [
    { label: 'View Accounts', icon: Eye, variant: 'secondary', visibleOn: '*', confirm: false, toolbarGroup: 'left' },
    { label: 'Chat / Messages', icon: MessageSquare, variant: 'secondary', visibleOn: '*', confirm: false, toolbarGroup: 'left' },
    { label: 'RS Process History', icon: History, variant: 'secondary', visibleOn: '*', confirm: false, toolbarGroup: 'left' },
    {
        label: 'Return RS to Budget', icon: Undo2, variant: 'primary',
        visibleOn: ['certified rs', 'certified'], restrictedTo: ['stockroom-access'],
        locationFilter: ['stockroom'], toolbarGroup: 'left',
    },
    {
        label: 'For Pricing', icon: CircleDollarSign, variant: 'secondary',
        visibleOn: ['for budget director'], restrictedTo: ['admin-access'],
        locationFilter: ['budget office'], toolbarGroup: 'left',
    },
    { label: 'Send RS to WICO', icon: Send, variant: 'primary', visibleOn: ['for purchase'], restrictedTo: ['logistics-access'], locationFilter: ['logistics'], toolbarGroup: 'right' },
    { label: 'For Purchase', icon: ShoppingCart, variant: 'secondary', visibleOn: ['for approval'], restrictedTo: ['admin-access'], locationFilter: ['budget office'], toolbarGroup: 'right' },
    { label: 'Reprocess RS', icon: RefreshCw, variant: 'secondary', visibleOn: '*', restrictedTo: ['budget-access', 'admin-access'], toolbarGroup: 'right' },
    { label: 'Send RS to Staff', icon: Send, variant: 'primary', visibleOn: ['for budget director'], restrictedTo: ['admin-access'], locationFilter: ['budget office'], toolbarGroup: 'right' },
    { label: 'Print RS', icon: Printer, variant: 'secondary', visibleOn: '*', confirm: false, toolbarGroup: 'right' },
    {
        label: 'Mark Served', icon: PackageCheck, variant: 'success',
        visibleOn: ['certified rs', 'certified', 'p.o. on process'], restrictedTo: ['stockroom-access'],
        locationFilter: ['stockroom'], toolbarGroup: 'right',
    },
];

/** Always-available cancel action, shown next to the Notes box. */
const CANCEL_ACTION: RoleAction = {
    label: 'Mark as Cancelled', icon: XCircle, variant: 'danger', visibleOn: '*',
};

/** Terminal statuses — once an entry lands here, the workflow is over, so
 *  "Mark as Cancelled" hides regardless of role.
 *  "Reprocess RS" is intentionally NOT gated by this: budget-access and
 *  admin-access need to be able to reprocess an RS regardless of its current
 *  status, including terminal ones. The "For Liquidation" toggle is also not
 *  gated by this: it's a manual tag the budget officer can set independent
 *  of status, even on terminal entries. */
const TERMINAL_STATUSES = ['disapproved', 'cancelled'];

// ─────────────────────────────────────────────────────────────────────────────
// For Liquidation — accent color for the standalone toggle chip. Deliberately
// not part of getStatusColors below: for_liquidation is a tag on the entry,
// independent of its workflow status, so it gets its own visual identity
// (violet) that won't be confused with status semantics (amber/green/blue).
// ─────────────────────────────────────────────────────────────────────────────
const LIQUIDATION_COLOR = '#eab308';

// ─────────────────────────────────────────────────────────────────────────────
// Status color map — theme-aware so dark/light variants both look correct
// ─────────────────────────────────────────────────────────────────────────────
function getStatusColors(status: string | null, t: Theme, isDark: boolean) {
    if (isDark) {
        const map: Record<string, { bg: string; text: string; border: string }> = {
            'for review': { bg: `${t.cellAmber}26`, text: t.cellAmber, border: `${t.cellAmber}66` },
            'for certification': { bg: `${t.cellAmber}1a`, text: t.cellAmber, border: `${t.cellAmber}55` },
            'certified rs': { bg: `${t.cellGreen}26`, text: t.cellGreen, border: `${t.cellGreen}66` },
            'certified': { bg: `${t.cellGreen}26`, text: t.cellGreen, border: `${t.cellGreen}66` },
            'for pricing': { bg: `${t.cellAmber}1f`, text: t.cellAmber, border: `${t.cellAmber}59` },
            'disapproved': { bg: `${t.cellAmber}1a`, text: t.cellAmber, border: `${t.cellAmber}4d` },
            'cancelled': { bg: `${t.cellMuted}1a`, text: t.cellMuted, border: `${t.cellMuted}4d` },
            'served by wico': { bg: `${t.cellBlue}26`, text: t.cellBlue, border: `${t.cellBlue}66` },
            'for budget staff': { bg: `${t.cellBlue}1f`, text: t.cellBlue, border: `${t.cellBlue}55` },
            'for budget director': { bg: `${t.cellBlue}2e`, text: t.cellBlue, border: `${t.cellBlue}66` },
            'for purchase': { bg: `${t.cellBlue}1a`, text: t.cellBlue, border: `${t.cellBlue}4d` },
            'po on process': { bg: `${t.cellBlue}26`, text: t.cellBlue, border: `${t.cellBlue}59` },
            'unserved rs': { bg: `${t.cellAmber}1a`, text: t.cellAmber, border: `${t.cellAmber}55` },
            'unserved': { bg: `${t.cellAmber}1a`, text: t.cellAmber, border: `${t.cellAmber}55` },
            'served': { bg: `${t.cellGreen}1a`, text: t.cellGreen, border: `${t.cellGreen}55` },
        };
        return map[(status ?? '').toLowerCase()] ?? {
            bg: `${t.cellMuted}26`, text: t.cellMuted, border: `${t.cellMuted}59`,
        };
    }

    // Light mode — matches BudgetView reference palette exactly
    const map: Record<string, { bg: string; text: string; border: string }> = {
        'for review': { bg: 'rgba(253,230,138,0.50)', border: 'rgba(202,138,4,0.40)', text: '#92400e' },
        'for certification': { bg: 'rgba(253,230,138,0.35)', border: 'rgba(202,138,4,0.28)', text: '#a16207' },
        'certified rs': { bg: 'rgba(187,247,208,0.55)', border: 'rgba(4,120,87,0.35)', text: '#065f46' },
        'certified': { bg: 'rgba(187,247,208,0.55)', border: 'rgba(4,120,87,0.35)', text: '#065f46' },
        'for pricing': { bg: 'rgba(254,215,170,0.55)', border: 'rgba(194,65,12,0.32)', text: '#9a3412' },
        'disapproved': { bg: 'rgba(254,226,226,0.65)', border: 'rgba(220,38,38,0.32)', text: '#991b1b' },
        'cancelled': { bg: 'rgba(241,245,249,0.85)', border: 'rgba(148,163,184,0.38)', text: '#475569' },
        'served by wico': { bg: 'rgba(219,234,254,0.75)', border: 'rgba(29,78,216,0.30)', text: '#1e3a8a' },
        'for budget staff': { bg: 'rgba(237,233,254,0.70)', border: 'rgba(109,40,217,0.30)', text: '#5b21b6' },
        'for budget director': { bg: 'rgba(237,233,254,0.90)', border: 'rgba(109,40,217,0.40)', text: '#4c1d95' },
        'for purchase': { bg: 'rgba(207,250,254,0.65)', border: 'rgba(8,145,178,0.30)', text: '#155e75' },
        'po on process': { bg: 'rgba(207,250,254,0.85)', border: 'rgba(8,145,178,0.40)', text: '#0e4f63' },
        'unserved rs': { bg: 'rgba(253,230,138,0.35)', border: 'rgba(202,138,4,0.28)', text: '#a16207' },
        'unserved': { bg: 'rgba(253,230,138,0.35)', border: 'rgba(202,138,4,0.28)', text: '#a16207' },
        'served': { bg: 'rgba(187,247,208,0.55)', border: 'rgba(4,120,87,0.35)', text: '#065f46' },
    };
    return map[(status ?? '').toLowerCase()] ?? {
        bg: 'rgba(241,245,249,0.85)', text: '#475569', border: 'rgba(148,163,184,0.38)',
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatAmount(amount: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
    }).format(amount);
}

/** Cell styling for the Requested Items table — shared between the
 *  read-only render and the admin item-editing render so both look
 *  pixel-identical. */
function itemTdStyle(
    t: Theme, totalCols: number, ci: number,
    align: 'left' | 'right', muted: boolean, mono: boolean
): React.CSSProperties {
    return {
        padding: '10px 14px',
        fontSize: 12,
        color: muted ? t.cellMuted : t.cellText,
        fontVariantNumeric: mono ? 'tabular-nums' : undefined,
        borderBottom: `1px solid ${t.rowBorder}`,
        borderRight: ci < totalCols - 1 ? `1px solid ${t.rowBorder}` : 'none',
        textAlign: align,
        whiteSpace: 'nowrap',
    };
}

function RoleIcon({ roleKey }: { roleKey: PermissionKey }) {
    const icons: Record<PermissionKey, React.ReactNode> = {
        'budget-access': <DollarSign style={{ width: 14, height: 14 }} />,
        'admin-access': <ShieldCheck style={{ width: 14, height: 14 }} />,
        'logistics-access': <Truck style={{ width: 14, height: 14 }} />,
        'accounting-access': <Calculator style={{ width: 14, height: 14 }} />,
        'stockroom-access': <Package style={{ width: 14, height: 14 }} />,
        'cashier-access': <CreditCard style={{ width: 14, height: 14 }} />,
    };
    return <>{icons[roleKey]}</>;
}


// ─────────────────────────────────────────────────────────────────────────────
// Confirmation copy — per-action phrasing for the confirm modal
// ─────────────────────────────────────────────────────────────────────────────
function getConfirmCopy(action: string): { verb: string; danger: boolean } {
    const map: Record<string, { verb: string; danger?: boolean }> = {
        'Mark as Reviewed': { verb: 'mark this requisition slip as reviewed' },
        'Mark as Cancelled': { verb: 'cancel this requisition slip', danger: true },
        'Disapprove': { verb: 'disapprove this requisition slip', danger: true },
        'Reprocess RS': { verb: 'send this requisition slip back for reprocessing' },
        'Approve RS': { verb: 'approve this requisition slip' },
        'Reject RS': { verb: 'reject this requisition slip', danger: true },
        'Mark Served': { verb: 'mark this requisition slip as served' },
        'Mark Unserved': { verb: 'mark this requisition slip as unserved' },
        'Post Entry': { verb: 'post this entry' },
        'Certify RS': { verb: 'certify this requisition slip' },
        'Prepare Items': { verb: 'mark the items as being prepared' },
        'Process Payment': { verb: 'process payment for this requisition slip' },
        'Return to Budget': { verb: 'return this requisition slip to the budget office', danger: true },
        'Send RS to Staff': { verb: 'send this requisition slip to staff' },
        'For Purchase': { verb: 'mark this requisition slip as for purchase' },
        'Forward to Stockroom': { verb: 'forward this requisition slip to the Stockroom' },
        'Forward to Accounting': { verb: 'forward this requisition slip to Accounting' },
        'Forward to Acctg. Director': { verb: 'forward this requisition slip to the Accounting Director' },
        'Forward to HRMDO': { verb: 'forward this requisition slip to HRMDO' },
        'Forward to BAO': { verb: 'forward this requisition slip to the BAO' },
        'Forward to Cash Management': { verb: 'forward this requisition slip to Cash Management' },
        'For Liquidation': { verb: 'mark this requisition slip for liquidation' },
    };
    const entry = map[action] ?? { verb: `proceed with "${action}"` };
    return { verb: entry.verb, danger: !!entry.danger };
}

// ─────────────────────────────────────────────────────────────────────────────
// ConfirmActionModal — shown before an action button's onAction actually fires
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmActionModal({
    action, row, t, isDark, onCancel, onConfirm,
}: {
    action: string;
    row: RSProcessRow;
    t: Theme;
    isDark: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const { verb, danger } = getConfirmCopy(action);
    const tone = danger
        ? { bg: `${t.cellAmber}1f`, border: `${t.cellAmber}66`, text: t.cellAmber, hover: `${t.cellAmber}38` }
        : { bg: `${t.cellGreen}1f`, border: `${t.cellGreen}66`, text: t.cellGreen, hover: `${t.cellGreen}38` };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 70,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(3px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px 16px',
            }}
            onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div style={{
                background: t.cardBg,
                border: `1px solid ${t.cardBorder}`,
                boxShadow: t.cardShadow,
                borderRadius: 14,
                width: '100%',
                maxWidth: 380,
                padding: '22px 22px 18px',
                display: 'flex', flexDirection: 'column', gap: 14,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: danger ? `${t.cellAmber}1f` : `${t.cellGreen}1f`,
                        color: danger ? t.cellAmber : t.cellGreen,
                    }}>
                        <AlertTriangle style={{ width: 17, height: 17 }} />
                    </span>
                    <span style={{ fontSize: 14.5, fontWeight: 800, color: t.cellText }}>
                        Confirm {action}
                    </span>
                </div>

                <p style={{ fontSize: 12.5, lineHeight: 1.6, color: t.cellMuted, margin: 0 }}>
                    Are you sure you want to {verb} for{' '}
                    <strong style={{ color: t.cellText }}>{row.requisition_no}</strong>? This action cannot be undone.
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                            border: `1px solid ${t.cardBorder}`, background: 'transparent',
                            color: t.cellMuted, cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '8px 18px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                            border: `1px solid ${tone.border}`, background: tone.bg, color: tone.text,
                            cursor: 'pointer', transition: 'background .14s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = tone.hover)}
                        onMouseLeave={e => (e.currentTarget.style.background = tone.bg)}
                    >
                        Yes, {action}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function InfoLine({
    label, value, t, justify = 'flex-start', muted = false,
}: {
    label: string;
    value: React.ReactNode;
    t: Theme;
    justify?: 'flex-start' | 'flex-end';
    muted?: boolean;
}) {
    return (
        <div style={{
            display: 'flex', alignItems: 'baseline', gap: 6,
            justifyContent: justify, flexWrap: 'wrap', minWidth: 0,
        }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: t.cellText, whiteSpace: 'nowrap' }}>
                {label}
            </span>
            <span style={{
                fontSize: muted ? 12 : 13,
                fontWeight: muted ? 600 : 800,
                color: muted ? t.cellMuted : t.accentColor,
                wordBreak: 'break-word',
            }}>
                {value}
            </span>
        </div>
    );
}

function ActionButton({
    label, icon: Icon, variant, t, onClick,
}: {
    label: string;
    icon?: React.ElementType;
    variant: 'primary' | 'secondary' | 'danger' | 'success';
    t: Theme;
    onClick?: () => void;
}) {
    const styles = {
        primary: { bg: t.btnPrimary.bg, border: t.btnPrimary.border, text: t.btnPrimary.text, hover: t.btnPrimary.hover },
        secondary: { bg: t.btnRefresh.bg, border: t.btnRefresh.border, text: t.btnRefresh.text, hover: t.btnRefresh.hover },
        danger: { bg: `${t.cellAmber}1f`, border: `${t.cellAmber}66`, text: t.cellAmber, hover: `${t.cellAmber}38` },
        success: { bg: `${t.cellGreen}1f`, border: `${t.cellGreen}66`, text: t.cellGreen, hover: `${t.cellGreen}38` },
    }[variant];

    return (
        <button
            onClick={onClick}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 20,
                fontSize: 12, fontWeight: 700,
                border: `1px solid ${styles.border}`,
                background: styles.bg, color: styles.text,
                cursor: 'pointer', transition: 'background .14s ease',
                whiteSpace: 'nowrap', letterSpacing: '0.01em',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = styles.hover)}
            onMouseLeave={e => (e.currentTarget.style.background = styles.bg)}
        >
            {Icon && <Icon style={{ width: 13, height: 13, flexShrink: 0 }} />}
            {label}
        </button>
    );
}

function ToolbarButton({
    label, icon: Icon, t, isDark, onClick, tone = 'neutral',
}: {
    label: string;
    icon: React.ElementType;
    t: Theme;
    isDark: boolean;
    onClick?: () => void;
    tone?: 'neutral' | 'accent' | 'danger' | 'success';
}) {
    const palette = {
        neutral: { icon: t.accentColor, bg: t.dropdownSelected, border: t.cardBorder, label: t.cellMuted },
        accent: { icon: t.btnPrimary.text, bg: t.btnPrimary.bg, border: t.btnPrimary.border, label: t.accentColor },
        danger: { icon: t.cellAmber, bg: `${t.cellAmber}1f`, border: `${t.cellAmber}59`, label: t.cellAmber },
        success: { icon: t.cellGreen, bg: `${t.cellGreen}1f`, border: `${t.cellGreen}59`, label: t.cellGreen },
    }[tone];

    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, padding: '6px 7px', minWidth: 52,
                border: 'none', background: 'transparent',
                borderRadius: 8, cursor: 'pointer', transition: 'background .12s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.045)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
            <span style={{
                width: 32, height: 32, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: palette.bg, border: `1px solid ${palette.border}`,
                color: palette.icon, flexShrink: 0,
            }}>
                <Icon style={{ width: 15, height: 15 }} />
            </span>
            <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.03em',
                color: palette.label, whiteSpace: 'nowrap',
            }}>
                {label}
            </span>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// RSProcessModal
// ─────────────────────────────────────────────────────────────────────────────
interface RSProcessModalProps {
    row: RSProcessRow;
    roleKey: PermissionKey;
    roleLabel: string;
    t: Theme;
    isDark: boolean;
    isLoading?: boolean;
    error?: string | null;
    onClose: () => void;
    /** Called when a role action button is clicked */
    onAction?: (action: string, row: RSProcessRow) => void;
    /** Current logged-in user — required for chat */
    currentUser?: { id: string; name: string };
}

export function RSProcessModal({
    row, roleKey, roleLabel, t, isDark, isLoading = false, error = null, onClose, onAction,
    currentUser = { id: '', name: '' },
}: RSProcessModalProps) {
    console.log(roleKey);
    const [itemsExpanded, setItemsExpanded] = useState(true);
    const [pendingAction, setPendingAction] = useState<RoleAction | null>(null);

    // ── Notes editing state ──────────────────────────────────────────────────
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [noteDraft, setNoteDraft] = useState(row.note ?? '');
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [noteError, setNoteError] = useState<string | null>(null);
    // Keep the draft in sync if the row changes underneath us (e.g. a fresh
    // row loaded after navigating to a different entry) while not editing.
    useEffect(() => {
        if (!isEditingNote) setNoteDraft(row.note ?? '');
    }, [row.id, row.note, isEditingNote]);

    // ── Item editing state (admin-only) ──────────────────────────────────────
    // Admin can edit quantity / UOM / unit cost on existing line items, but
    // only while the entry sits at the Budget Director stage — the same
    // status that gates the 'Disapprove' button for this role. Account code,
    // description, and adding/removing items are intentionally out of scope:
    // this only ever mutates the three fields below on items that already
    // exist, and the backend recomputes total_cost itself rather than
    // trusting whatever the client multiplies out.
    const canEditItems = roleKey === 'admin-access'
        && (row.status ?? '').toLowerCase() === 'for budget director';
    const [isEditingItems, setIsEditingItems] = useState(false);
    const [itemDrafts, setItemDrafts] = useState<Record<number, {
        quantity: number; unit_cost: number; unit_of_measurement: string;
    }>>({});
    const [isSavingItems, setIsSavingItems] = useState(false);
    const [itemsError, setItemsError] = useState<string | null>(null);

    // ── Quoted price entry (logistics-only) ──────────────────────────────────
    // Logistics checks supplier prices and records a quoted price per line
    // item while the entry sits at the pricing stage reached via the
    // 'For Pricing' action (DB status 'for pricing', location 'logistics').
    // This never touches quantity/unit_cost/total_cost or any account
    // balance — quoted_price is a reference column for whoever reviews the
    // RS afterward. Saving forwards the RS on to the Budget Office.
    const canPriceItems = roleKey === 'logistics-access'
        && (row.status ?? '').toLowerCase() === 'for pricing'
        && (row.location ?? '').toLowerCase() === 'logistics';
    const [isPricingItems, setIsPricingItems] = useState(false);
    const [priceDrafts, setPriceDrafts] = useState<Record<number, number>>({});
    const [isSavingPrices, setIsSavingPrices] = useState(false);
    const [pricesError, setPricesError] = useState<string | null>(null);

    // ── Accept quoted prices (admin-only, for approval stage) ────────────────
    // Clicking "Accept Quoted Prices" fetches a preview of what the change
    // would do to each account balance, then shows a confirmation modal.
    // The actual write is POST'd only after the user confirms.
    const canAcceptQuotedPrices = roleKey === 'admin-access'
        && (row.status ?? '').toLowerCase() === 'for approval'
        && (row.location ?? '').toLowerCase() === 'budget office';

    interface QuotedPricePreviewItem {
        id: number;
        account_code: string;
        description: string;
        quantity: number;
        unit_of_measurement: string;
        unit_cost: number;
        quoted_price: number | null;
        total_cost: number;
        proposed_unit_cost: number;
        proposed_total_cost: number;
        delta: number;
        account_balance: number | null;
        balance_after: number | null;
        sufficient: boolean | null;
    }

    const [acceptPreviewOpen, setAcceptPreviewOpen] = useState(false);
    const [acceptPreviewItems, setAcceptPreviewItems] = useState<QuotedPricePreviewItem[]>([]);
    const [acceptPreviewAllSufficient, setAcceptPreviewAllSufficient] = useState(false);
    const [acceptPreviewLoading, setAcceptPreviewLoading] = useState(false);
    const [acceptPreviewError, setAcceptPreviewError] = useState<string | null>(null);
    const [isAccepting, setIsAccepting] = useState(false);
    const [acceptError, setAcceptError] = useState<string | null>(null);

    async function handleOpenAcceptPreview() {
        setAcceptPreviewError(null);
        setAcceptPreviewLoading(true);
        setAcceptPreviewOpen(true);
        try {
            const res = await financeSvc.get(`/abms/requisition-process/${row.id}/quoted-prices-preview`);
            setAcceptPreviewItems(res.data.items ?? []);
            setAcceptPreviewAllSufficient(res.data.all_sufficient ?? false);
        } catch (err: any) {
            setAcceptPreviewError(err?.response?.data?.message ?? 'Failed to load preview. Please try again.');
        } finally {
            setAcceptPreviewLoading(false);
        }
    }

    async function handleConfirmAcceptQuotedPrices() {
        if (isAccepting) return;
        setAcceptError(null);
        setIsAccepting(true);
        try {
            const res = await financeSvc.put(`/abms/requisition-process/${row.id}/accept-quoted-prices`);
            setAcceptPreviewOpen(false);
            const updatedItems: RSLineItem[] = res.data?.items ?? row.items ?? [];
            const updatedTotal: number = res.data?.data?.total_amount ?? row.total_amount;
            onAction?.('Accept Quoted Prices', { ...row, items: updatedItems, total_amount: updatedTotal });
        } catch (err: any) {
            setAcceptError(err?.response?.data?.message ?? 'Failed to accept quoted prices. No changes were applied.');
        } finally {
            setIsAccepting(false);
        }
    }

    // The Quoted Price column itself is only shown to: logistics, while
    // they're actively entering prices (canPriceItems above); and admin,
    // once the RS has reached the Budget Office for approval — i.e. after
    // logistics has already priced it. Every other role/stage never sees
    // this column at all.
    const showQuotedPriceColumn = canPriceItems
        || (roleKey === 'admin-access'
            && (row.status ?? '').toLowerCase() === 'for approval'
            && (row.location ?? '').toLowerCase() === 'budget office');

    // ── Chat state ────────────────────────────────────────────────────────────
    const [showChat, setShowChat] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [incomingMessage, setIncomingMessage] = useState<ChatMessage | null>(null);
    const showChatRef = useRef(showChat);
    useEffect(() => { showChatRef.current = showChat; }, [showChat]);
    const [showHistory, setShowHistory] = useState(false);

    // Persistent realtime subscription — lives while modal is open
    const seenMessageIds = useRef<Set<number>>(new Set());
    useEffect(() => {
        if (!row.id || !currentUser.id) return;
        let isSubscribed = true;
        try {
            const channel = echo
                .private(`requisition-chat.${row.id}`)
                .listen('.RequisitionChatMessageSent', (e: ChatMessage) => {
                    if (!isSubscribed) return;
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
                    echo.leave(`requisition-chat.${row.id}`);
                } catch { }
            };
        } catch {
            return;
        }
    }, [row.id, currentUser.id]);

    // Fetch unread count when modal mounts / row changes
    useEffect(() => {
        if (!row.id || !currentUser.id) return;
        setUnreadCount(0);
        seenMessageIds.current.clear();
        financeSvc.get(`/abms/budget-request-entry/chats/unread-counts`, {
            params: { userId: currentUser.id, ids: [row.id] },
        }).then(res => {
            setUnreadCount(res.data[String(row.id)] ?? 0);
        }).catch(() => { });
    }, [row.id, currentUser.id]);

    function triggerAction(action: RoleAction) {
        if (action.label === 'Chat / Messages') {
            setShowChat(p => !p);
            setUnreadCount(0);
            return;
        }
        if (action.label === 'RS Process History') {
            setShowHistory(true);
            return;
        }
        // Forward actions use a prefixed label so onAction handlers can
        // distinguish them from plain role actions with the same destination name.
        const effectiveAction: RoleAction = action.forwardGroup
            ? { ...action, label: `Forward to ${action.label}` }
            : action;
        if (effectiveAction.confirm === false) {
            onAction?.(effectiveAction.label, row);
            return;
        }
        setPendingAction(effectiveAction);
    }

    function confirmPendingAction() {
        if (pendingAction) onAction?.(pendingAction.label, row);
        setPendingAction(null);
    }

    async function handleSaveNote() {
        if (isSavingNote) return;
        setIsSavingNote(true);
        setNoteError(null);
        try {
            const res = await financeSvc.put(`/abms/requisition-process/${row.id}`, {
                action: 'Save Note',
                note: noteDraft,
            });
            const savedNote: string | null = res.data?.data?.note ?? noteDraft;
            setNoteDraft(savedNote ?? '');
            setIsEditingNote(false);
            onAction?.('Save Note', { ...row, note: savedNote });
        } catch (err: any) {
            setNoteError(err?.response?.data?.message ?? 'Failed to save note.');
        } finally {
            setIsSavingNote(false);
        }
    }

    function handleCancelEditNote() {
        setNoteDraft(row.note ?? '');
        setNoteError(null);
        setIsEditingNote(false);
    }

    // ── Item editing handlers ────────────────────────────────────────────────
    function startEditingItems() {
        const drafts: typeof itemDrafts = {};
        (row.items ?? []).forEach(item => {
            drafts[item.id] = {
                quantity: item.quantity,
                unit_cost: item.unit_cost,
                unit_of_measurement: item.unit_of_measurement ?? '',
            };
        });
        setItemDrafts(drafts);
        setItemsError(null);
        setIsEditingItems(true);
    }

    function cancelEditingItems() {
        setItemDrafts({});
        setItemsError(null);
        setIsEditingItems(false);
    }

    function updateItemDraft(itemId: number, patch: Partial<{
        quantity: number; unit_cost: number; unit_of_measurement: string;
    }>) {
        setItemDrafts(prev => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }));
    }

    async function handleSaveItems() {
        if (isSavingItems) return;
        setIsSavingItems(true);
        setItemsError(null);
        try {
            const payload = {
                items: Object.entries(itemDrafts).map(([id, d]) => ({
                    id: Number(id),
                    quantity: d.quantity,
                    unit_cost: d.unit_cost,
                    unit_of_measurement: d.unit_of_measurement,
                })),
            };
            const res = await financeSvc.put(`/abms/requisition-process/${row.id}/items`, payload);
            const updatedItems: RSLineItem[] = res.data?.items ?? row.items ?? [];
            const updatedTotal: number = res.data?.data?.total_amount ?? row.total_amount;
            setIsEditingItems(false);
            setItemDrafts({});
            onAction?.('Save Items', { ...row, items: updatedItems, total_amount: updatedTotal });
        } catch (err: any) {
            setItemsError(err?.response?.data?.message ?? 'Failed to save item changes. No changes were applied.');
        } finally {
            setIsSavingItems(false);
        }
    }

    // ── Quoted price handlers (logistics-only) ───────────────────────────────
    function startPricingItems() {
        const drafts: typeof priceDrafts = {};
        (row.items ?? []).forEach(item => {
            drafts[item.id] = item.quoted_price ?? 0;
        });
        setPriceDrafts(drafts);
        setPricesError(null);
        setIsPricingItems(true);
    }

    function cancelPricingItems() {
        setPriceDrafts({});
        setPricesError(null);
        setIsPricingItems(false);
    }

    function updatePriceDraft(itemId: number, quoted_price: number) {
        setPriceDrafts(prev => ({ ...prev, [itemId]: quoted_price }));
    }

    async function handleSaveQuotedPrices() {
        if (isSavingPrices) return;
        setIsSavingPrices(true);
        setPricesError(null);
        try {
            const payload = {
                items: Object.entries(priceDrafts).map(([id, quoted_price]) => ({
                    id: Number(id),
                    quoted_price,
                })),
            };
            const res = await financeSvc.put(`/abms/requisition-process/${row.id}/quoted-prices`, payload);
            const updatedItems: RSLineItem[] = res.data?.items ?? row.items ?? [];
            const updatedEntry = res.data?.data ?? {};
            setIsPricingItems(false);
            setPriceDrafts({});
            onAction?.('Save Quoted Prices', {
                ...row,
                items: updatedItems,
                status: updatedEntry.status ?? 'for approval',
                location: updatedEntry.location ?? 'budget office',
                from: updatedEntry.from ?? row.location,
            });
        } catch (err: any) {
            setPricesError(err?.response?.data?.message ?? 'Failed to save quoted prices. No changes were applied.');
        } finally {
            setIsSavingPrices(false);
        }
    }


    const statusLower = (row.status ?? '').toLowerCase();
    const locationLower = (row.location ?? '').toLowerCase();
    const statusColors = getStatusColors(row.status, t, isDark);
    const isTerminal = TERMINAL_STATUSES.includes(statusLower);

    const matchesStatus = (a: RoleAction) =>
        a.visibleOn === '*' || a.visibleOn.some(s => s.toLowerCase() === statusLower);

    const matchesRole = (a: RoleAction) =>
        !a.restrictedTo || a.restrictedTo.includes(roleKey);

    const matchesLocation = (a: RoleAction) =>
        !a.locationFilter || a.locationFilter.some(l => l.toLowerCase() === locationLower);

    // Toolbar (top): common actions, split left/right via each action's toolbarGroup.
    const leftToolbarActions = COMMON_ACTIONS.filter(a => a.toolbarGroup !== 'right' && matchesStatus(a) && matchesRole(a) && matchesLocation(a));
    const rightToolbarActions = COMMON_ACTIONS.filter(a => a.toolbarGroup === 'right' && matchesStatus(a) && matchesRole(a) && matchesLocation(a));

    // Footer (bottom): role-specific transition buttons only
    const roleActions = ROLE_ACTIONS[roleKey] ?? [];
    const visibleRoleActions = roleActions.filter(a => !a.forwardGroup && matchesStatus(a));
    const visibleForwardActions = roleActions.filter(a => a.forwardGroup && matchesStatus(a) && matchesLocation(a));

    const cancelVisible = matchesStatus(CANCEL_ACTION) && !isTerminal;

    const toolbarTone = (a: RoleAction): 'accent' | 'success' | 'neutral' =>
        a.variant === 'primary' ? 'accent' : a.variant === 'success' ? 'success' : 'neutral';

    // Mock line items if not provided
    const lineItems: RSLineItem[] = row.items ?? [];

    // Column count for the Requested Items table — 7 when the Quoted Price
    // column is visible (see showQuotedPriceColumn above), 6 otherwise.
    const totalCols = showQuotedPriceColumn ? 7 : 6;

    // Client-side mirror of the backend's validation — purely for disabling
    // the Save button / giving instant feedback. The backend re-validates
    // and is the actual source of truth; this never substitutes for it.
    const draftsValid = !isEditingItems || Object.values(itemDrafts).every(d =>
        Number.isInteger(d.quantity) && d.quantity >= 1 &&
        typeof d.unit_cost === 'number' && d.unit_cost > 0 &&
        d.unit_of_measurement.trim().length > 0
    );

    // Client-side mirror of the backend's validation for the quoted-price
    // save button — every drafted quoted price must be a number > 0.
    const priceDraftsValid = !isPricingItems || Object.values(priceDrafts).every(v =>
        typeof v === 'number' && v > 0 && !Number.isNaN(v)
    );

    // Live recalculated grand total while editing, so the admin can see the
    // new total_amount before committing — actual recalculation/validation
    // against account balances still happens server-side on Save.
    const editedTotal = lineItems.reduce((sum, item) => {
        const draft = itemDrafts[item.id];
        return sum + (draft ? draft.quantity * draft.unit_cost : item.total_cost);
    }, 0);

    const sectionDivider = (
        <div style={{ height: 1, background: t.cardHeaderBorder, margin: '0 0' }} />
    );

    return (
        <>
            {/* ── Backdrop ──────────────────────────────────────────────── */}
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: 60,
                    background: 'rgba(0,0,0,0.60)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '24px 16px',
                }}
                onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            >
                {/* ── Modal shell ─────────────────────────────────────────── */}
                <div style={{
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    boxShadow: t.cardShadow,
                    borderRadius: 14,
                    width: '100%',
                    maxWidth: 780,
                    maxHeight: 'calc(100vh - 48px)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}>

                    {/* ── Forward to… strip — admin-only, sits above everything else ── */}
                    {visibleForwardActions.length > 0 && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${visibleForwardActions.length}, 1fr)`,
                            gap: 6,
                            padding: '8px 14px',
                            background: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)',
                            borderBottom: `1px solid ${isDark ? 'rgba(99,102,241,0.22)' : 'rgba(99,102,241,0.15)'}`,
                            flexShrink: 0,
                        }}>
                            {visibleForwardActions.map(action => {
                                const Icon = action.icon;
                                return (
                                    <button
                                        key={action.label}
                                        onClick={() => triggerAction(action)}
                                        title={`Forward to ${action.label}`}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            width: '100%',
                                            padding: '11px 8px', borderRadius: 8,
                                            fontSize: 12, fontWeight: 700,
                                            border: isDark
                                                ? '1px solid rgba(99,102,241,0.38)'
                                                : '1px solid rgba(99,102,241,0.25)',
                                            background: isDark
                                                ? 'rgba(99,102,241,0.14)'
                                                : 'rgba(99,102,241,0.09)',
                                            color: isDark ? '#a5b4fc' : '#4338ca',
                                            cursor: 'pointer',
                                            transition: 'background .13s ease, box-shadow .15s ease',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            letterSpacing: '0.01em',
                                            position: 'relative',
                                            zIndex: 1,
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = isDark
                                                ? 'rgba(99,102,241,0.26)'
                                                : 'rgba(99,102,241,0.17)';
                                            e.currentTarget.style.width = 'max-content';
                                            e.currentTarget.style.minWidth = '100%';
                                            e.currentTarget.style.overflow = 'visible';
                                            e.currentTarget.style.zIndex = '5';
                                            e.currentTarget.style.boxShadow = isDark
                                                ? '0 4px 14px rgba(0,0,0,0.45)'
                                                : '0 4px 14px rgba(0,0,0,0.18)';
                                            const span = e.currentTarget.querySelector('span');
                                            if (span) span.style.overflow = 'visible';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = isDark
                                                ? 'rgba(99,102,241,0.14)'
                                                : 'rgba(99,102,241,0.09)';
                                            e.currentTarget.style.width = '100%';
                                            e.currentTarget.style.minWidth = '';
                                            e.currentTarget.style.overflow = 'hidden';
                                            e.currentTarget.style.zIndex = '1';
                                            e.currentTarget.style.boxShadow = 'none';
                                            const span = e.currentTarget.querySelector('span');
                                            if (span) span.style.overflow = 'hidden';
                                        }}
                                    >
                                        <ArrowRight style={{ width: 13, height: 13, flexShrink: 0 }} />
                                        {Icon && <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />}
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{action.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Toolbar ─────────────────────────────────────────── */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 8, padding: '8px 14px',
                        background: t.cardHeaderBg,
                        borderBottom: `1px solid ${t.cardHeaderBorder}`,
                        flexShrink: 0, flexWrap: 'nowrap', overflow: 'hidden',
                    }}>
                        <div style={{
                            display: 'flex', gap: 1, flexWrap: 'nowrap', alignItems: 'center',
                            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            border: `1px solid ${t.cardBorder}`,
                            borderRadius: 10, padding: '3px',
                        }}>
                            {leftToolbarActions.map(action => (
                                action.label === 'Chat / Messages' ? (
                                    <div key={action.label} style={{ position: 'relative', display: 'inline-flex' }}>
                                        <ToolbarButton
                                            label={action.label}
                                            icon={MessageSquare}
                                            t={t}
                                            isDark={isDark}
                                            tone={showChat ? 'accent' : 'neutral'}
                                            onClick={() => { setShowChat(p => !p); setUnreadCount(0); }}
                                        />
                                        {unreadCount > 0 && (
                                            <span style={{
                                                position: 'absolute', top: 2, right: 2,
                                                minWidth: 14, height: 14, borderRadius: 7,
                                                background: '#ef4444', color: '#fff',
                                                fontSize: 8, fontWeight: 700,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                padding: '0 3px', pointerEvents: 'none', lineHeight: 1,
                                            }}>
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <ToolbarButton
                                        key={action.label}
                                        label={action.label}
                                        icon={action.icon!}
                                        t={t}
                                        isDark={isDark}
                                        tone={toolbarTone(action)}
                                        onClick={() => triggerAction(action)}
                                    />
                                )
                            ))}
                        </div>
                        <div style={{
                            display: 'flex', gap: 1, flexWrap: 'nowrap', alignItems: 'center',
                            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            border: `1px solid ${t.cardBorder}`,
                            borderRadius: 10, padding: '3px',
                        }}>
                            {rightToolbarActions.map(action => (
                                <ToolbarButton
                                    key={action.label}
                                    label={action.label}
                                    icon={action.icon!}
                                    t={t}
                                    isDark={isDark}
                                    tone={toolbarTone(action)}
                                    onClick={() => triggerAction(action)}
                                />
                            ))}
                            <div style={{ width: 1, height: 28, background: t.dividerColor, margin: '0 2px', flexShrink: 0 }} />
                            <ToolbarButton label="Close" icon={X} t={t} isDark={isDark} tone="danger" onClick={onClose} />
                        </div>
                    </div>

                    {/* ── Info band — Department/RS No., Requested By/Date ── */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: '10px 24px',
                        padding: '16px 20px',
                        background: isDark ? 'rgba(96,165,250,0.05)' : 'rgba(37,99,235,0.03)',
                        borderBottom: `1px solid ${t.cardHeaderBorder}`,
                        flexShrink: 0,
                        alignItems: 'center',
                    }}>
                        {/* Row 1 left: Department */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <span style={{
                                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                                textTransform: 'uppercase', color: t.labelColor,
                                whiteSpace: 'nowrap', flexShrink: 0,
                            }}>
                                Department
                            </span>
                            <span style={{
                                width: 1, height: 12, background: t.dividerColor, flexShrink: 0,
                            }} />
                            <span style={{
                                fontSize: 13, fontWeight: 800, color: t.accentColor,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                                {row.department_section}
                            </span>
                        </div>

                        {/* Row 1 right: RS No. + Status badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.labelColor }}>
                                    RS No.
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 800, color: t.accentColor }}>
                                    {row.requisition_no}
                                </span>
                            </div>
                            <span style={{
                                padding: '3px 10px', borderRadius: 20,
                                fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                                textTransform: 'uppercase',
                                background: statusColors.bg,
                                color: statusColors.text,
                                border: `1px solid ${statusColors.border}`,
                                flexShrink: 0,
                            }}>
                                {row.status?.toUpperCase() ?? '—'}
                            </span>
                        </div>

                        {/* Row 2 left: Requested by */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.labelColor, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                Requested by
                            </span>
                            <span style={{ width: 1, height: 12, background: t.dividerColor, flexShrink: 0 }} />
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                                <img
                                    src={`https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${row.requested_by_empno}_2`}
                                    alt={row.requested_by}
                                    style={{
                                        width: 22, height: 22, borderRadius: '50%', objectFit: 'cover',
                                        border: `1.5px solid ${t.rowBorder}`, flexShrink: 0,
                                        cursor: 'pointer',
                                        transition: 'transform .18s ease, box-shadow .18s ease',
                                        transformOrigin: 'center left',
                                    }}
                                    onError={e => {
                                        (e.currentTarget as HTMLImageElement).src =
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(row.requested_by)}&size=22&background=random`;
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'scale(3.2)';
                                        e.currentTarget.style.boxShadow = isDark
                                            ? '0 6px 18px rgba(0,0,0,0.55)'
                                            : '0 6px 18px rgba(0,0,0,0.25)';
                                        e.currentTarget.style.zIndex = '10';
                                        e.currentTarget.style.position = 'relative';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                                <span style={{ fontSize: 13, fontWeight: 800, color: t.accentColor }}>{row.requested_by}</span>
                                <span style={{
                                    fontSize: 10, fontWeight: 600, color: t.cellMuted,
                                    padding: '2px 6px', borderRadius: 5,
                                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                    border: `1px solid ${t.cardBorder}`,
                                }}>
                                    {row.requested_by_empno}
                                </span>
                            </span>
                        </div>

                        {/* Row 2 right: Date */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', flexShrink: 0 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.labelColor }}>
                                Date
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: t.cellText }}>{row.date}</span>
                        </div>
                    </div>

                    {/* ── Scrollable body ─────────────────────────────────── */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>

                        {/* ── Loading overlay ─────────────────────────────── */}
                        {isLoading && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: 10, padding: '48px 20px',
                                fontSize: 13, fontWeight: 600, color: t.cellMuted,
                            }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite', color: t.accentColor }}>
                                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                </svg>
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                Loading RS details…
                            </div>
                        )}

                        {/* ── Fetch error ─────────────────────────────────── */}
                        {!isLoading && error && (
                            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                                <span style={{
                                    fontSize: 13, fontWeight: 600,
                                    color: t.cellAmber,
                                    background: `${t.cellAmber}1a`,
                                    border: `1px solid ${t.cellAmber}4d`,
                                    borderRadius: 8, padding: '8px 18px',
                                    display: 'inline-block',
                                }}>
                                    {error}
                                </span>
                            </div>
                        )}

                        {/* ── Line Items ──────────────────────────────────── */}
                        <div style={{ display: isLoading || error ? 'none' : undefined }}>
                            {/* Section header */}
                            <div
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center',
                                    gap: 10, padding: '11px 20px',
                                    background: t.cardHeaderBg,
                                    borderBottom: itemsExpanded ? `1px solid ${t.cardHeaderBorder}` : 'none',
                                }}
                            >
                                <button
                                    onClick={() => setItemsExpanded(p => !p)}
                                    style={{
                                        flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10,
                                        background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                                        textAlign: 'left',
                                    }}
                                >
                                    <div style={{
                                        width: 24, height: 24, borderRadius: 6,
                                        background: isDark ? 'rgba(96,165,250,0.14)' : 'rgba(37,99,235,0.10)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Package style={{ width: 12, height: 12, color: t.accentColor }} />
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: t.titleColor, flex: 1, textAlign: 'left', letterSpacing: '0.02em' }}>
                                        Requested Items
                                    </span>
                                    {lineItems.length > 0 && (
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, padding: '2px 8px',
                                            borderRadius: 20, letterSpacing: '0.06em',
                                            background: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(29,78,216,0.08)',
                                            border: `1px solid ${isDark ? 'rgba(96,165,250,0.28)' : 'rgba(37,99,235,0.22)'}`,
                                            color: t.accentColor,
                                        }}>
                                            {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'}
                                        </span>
                                    )}
                                </button>

                                {/* Admin item-editing controls — only when gated open above */}
                                {canEditItems && itemsExpanded && lineItems.length > 0 && (
                                    isEditingItems ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                            {itemsError && (
                                                <span style={{ fontSize: 10, color: t.cellAmber, maxWidth: 240, textAlign: 'right', lineHeight: 1.4 }}>
                                                    {itemsError}
                                                </span>
                                            )}
                                            <button
                                                onClick={handleSaveItems}
                                                disabled={isSavingItems || !draftsValid}
                                                title={!draftsValid ? 'Quantity must be a whole number ≥ 1 and unit cost must be greater than 0' : 'Save item changes'}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                    padding: '5px 12px', borderRadius: 8,
                                                    fontSize: 11, fontWeight: 700, border: 'none',
                                                    background: (isSavingItems || !draftsValid)
                                                        ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')
                                                        : (isDark ? 'rgba(37,99,235,0.70)' : '#1d4ed8'),
                                                    color: (isSavingItems || !draftsValid) ? t.cellMuted : '#ffffff',
                                                    cursor: (isSavingItems || !draftsValid) ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                {isSavingItems
                                                    ? <RefreshCw style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                                                    : <Save style={{ width: 12, height: 12 }} />
                                                }
                                                {isSavingItems ? 'Saving…' : 'Save'}
                                            </button>
                                            <button
                                                onClick={cancelEditingItems}
                                                disabled={isSavingItems}
                                                style={{
                                                    padding: '5px 12px', borderRadius: 8,
                                                    fontSize: 11, fontWeight: 700,
                                                    border: `1px solid ${t.cardBorder}`,
                                                    background: 'transparent', color: t.cellMuted,
                                                    cursor: isSavingItems ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={startEditingItems}
                                            title="Edit items"
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                width: 24, height: 24, borderRadius: 6, border: 'none',
                                                background: 'transparent', color: t.cellMuted, cursor: 'pointer',
                                                flexShrink: 0, transition: 'background .12s ease, color .12s ease',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = t.accentColor; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.cellMuted; }}
                                        >
                                            <Pencil style={{ width: 12, height: 12 }} />
                                        </button>
                                    )
                                )}

                                {/* Admin accept-all quoted prices button — only when gated open above */}
                                {canAcceptQuotedPrices && itemsExpanded && lineItems.length > 0 && lineItems.some(i => i.quoted_price != null) && (
                                    <button
                                        onClick={handleOpenAcceptPreview}
                                        title="Review and accept all quoted prices for this entry"
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 7,
                                            padding: '7px 16px', borderRadius: 8,
                                            fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                                            border: `1.5px solid ${isDark ? 'rgba(16,185,129,0.38)' : 'rgba(4,120,87,0.30)'}`,
                                            background: isDark ? 'rgba(16,185,129,0.09)' : 'rgba(187,247,208,0.30)',
                                            color: isDark ? '#86efac' : '#047857',
                                            cursor: 'pointer',
                                            transition: 'background .12s ease, border-color .12s ease',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = isDark ? 'rgba(16,185,129,0.18)' : 'rgba(187,247,208,0.50)';
                                            e.currentTarget.style.borderColor = isDark ? 'rgba(16,185,129,0.60)' : 'rgba(4,120,87,0.45)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = isDark ? 'rgba(16,185,129,0.09)' : 'rgba(187,247,208,0.30)';
                                            e.currentTarget.style.borderColor = isDark ? 'rgba(16,185,129,0.38)' : 'rgba(4,120,87,0.30)';
                                        }}
                                    >
                                        <CheckCircle2 style={{ width: 14, height: 14 }} />
                                        Accept Quoted Prices
                                    </button>
                                )}

                                {/* Logistics quoted-price controls — only when gated open above */}
                                {canPriceItems && itemsExpanded && lineItems.length > 0 && (
                                    isPricingItems ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                            {pricesError && (
                                                <span style={{ fontSize: 10, color: t.cellAmber, maxWidth: 240, textAlign: 'right', lineHeight: 1.4 }}>
                                                    {pricesError}
                                                </span>
                                            )}
                                            <button
                                                onClick={handleSaveQuotedPrices}
                                                disabled={isSavingPrices || !priceDraftsValid}
                                                title={!priceDraftsValid ? 'Every quoted price must be greater than 0' : 'Save quoted prices and forward to Budget Office'}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                    padding: '5px 12px', borderRadius: 8,
                                                    fontSize: 11, fontWeight: 700, border: 'none',
                                                    background: (isSavingPrices || !priceDraftsValid)
                                                        ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')
                                                        : (isDark ? 'rgba(37,99,235,0.70)' : '#1d4ed8'),
                                                    color: (isSavingPrices || !priceDraftsValid) ? t.cellMuted : '#ffffff',
                                                    cursor: (isSavingPrices || !priceDraftsValid) ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                {isSavingPrices
                                                    ? <RefreshCw style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                                                    : <Save style={{ width: 12, height: 12 }} />
                                                }
                                                {isSavingPrices ? 'Saving…' : 'Save'}
                                            </button>
                                            <button
                                                onClick={cancelPricingItems}
                                                disabled={isSavingPrices}
                                                style={{
                                                    padding: '5px 12px', borderRadius: 8,
                                                    fontSize: 11, fontWeight: 700,
                                                    border: `1px solid ${t.cardBorder}`,
                                                    background: 'transparent', color: t.cellMuted,
                                                    cursor: isSavingPrices ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={startPricingItems}
                                            title="Enter quoted prices for each item"
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 7,
                                                padding: '7px 16px', borderRadius: 8,
                                                fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                                                border: `1.5px solid ${isDark ? 'rgba(37,99,235,0.55)' : 'rgba(29,78,216,0.45)'}`,
                                                background: isDark ? 'rgba(37,99,235,0.18)' : 'rgba(37,99,235,0.10)',
                                                color: isDark ? '#93c5fd' : '#1d4ed8',
                                                cursor: 'pointer', flexShrink: 0,
                                                transition: 'background .12s ease, border-color .12s ease, transform .12s ease',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = isDark ? 'rgba(37,99,235,0.28)' : 'rgba(37,99,235,0.16)';
                                                e.currentTarget.style.borderColor = isDark ? 'rgba(37,99,235,0.80)' : 'rgba(29,78,216,0.70)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = isDark ? 'rgba(37,99,235,0.18)' : 'rgba(37,99,235,0.10)';
                                                e.currentTarget.style.borderColor = isDark ? 'rgba(37,99,235,0.55)' : 'rgba(29,78,216,0.45)';
                                            }}
                                        >
                                            <Calculator style={{ width: 14, height: 14 }} />
                                            Enter Quoted Prices
                                        </button>
                                    )
                                )}

                                <div
                                    onClick={() => setItemsExpanded(p => !p)}
                                    style={{
                                        width: 20, height: 20, borderRadius: 5, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                        border: `1px solid ${t.cardBorder}`,
                                        flexShrink: 0,
                                    }}
                                >
                                    {itemsExpanded
                                        ? <ChevronUp style={{ width: 11, height: 11, color: t.cellMuted }} />
                                        : <ChevronDown style={{ width: 11, height: 11, color: t.cellMuted }} />
                                    }
                                </div>
                            </div>

                            {/* Items table */}
                            {itemsExpanded && (
                                <div style={{ overflowX: 'auto' }}>
                                    {lineItems.length > 0 ? (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                                            <thead>
                                                <tr style={{ background: t.tableHeadBg }}>
                                                    {(showQuotedPriceColumn
                                                        ? ['Account Code', 'Description', 'Qty', 'UOM', 'Unit Cost', 'Quoted Price', 'Total Cost']
                                                        : ['Account Code', 'Description', 'Qty', 'UOM', 'Unit Cost', 'Total Cost']
                                                    ).map((col, i, arr) => (
                                                        <th key={col} style={{
                                                            padding: '10px 14px',
                                                            fontSize: 10, fontWeight: 700,
                                                            textTransform: 'uppercase', letterSpacing: '0.08em',
                                                            color: t.tableHeadText,
                                                            borderBottom: `2px solid ${t.tableHeadBorder}`,
                                                            borderRight: i < arr.length - 1 ? `1px solid ${t.tableHeadBorder}` : 'none',
                                                            textAlign: i >= 2 ? 'right' : 'left',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            {col}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lineItems.map((item, idx) => {
                                                    const draft = itemDrafts[item.id];
                                                    const rowEditing = isEditingItems && !!draft;
                                                    const priceDraft = priceDrafts[item.id];
                                                    const rowPricing = isPricingItems && priceDraft !== undefined;
                                                    const liveTotal = rowEditing ? draft.quantity * draft.unit_cost : item.total_cost;
                                                    const rowBg = idx % 2 === 0 ? t.rowEvenBg : t.rowOddBg;
                                                    const inputStyle: React.CSSProperties = {
                                                        width: '100%', maxWidth: 90, padding: '4px 8px',
                                                        borderRadius: 6, border: `1px solid ${t.inputBorder}`,
                                                        background: t.inputBg, color: t.inputText,
                                                        fontSize: 12, fontVariantNumeric: 'tabular-nums',
                                                        textAlign: 'right', outline: 'none',
                                                    };
                                                    return (
                                                        <tr
                                                            key={item.id}
                                                            style={{ background: rowBg }}
                                                            onMouseEnter={e => { if (!rowEditing) e.currentTarget.style.background = t.rowHoverBg; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}
                                                        >
                                                            <td style={itemTdStyle(t, totalCols, 0, 'left', false, true)}>
                                                                {item.account_code}
                                                            </td>
                                                            <td style={itemTdStyle(t, totalCols, 1, 'left', false, false)}>
                                                                {item.description}
                                                            </td>
                                                            <td style={itemTdStyle(t, totalCols, 2, 'right', false, true)}>
                                                                {rowEditing ? (
                                                                    <input
                                                                        type="number" min={1} step={1}
                                                                        value={draft.quantity}
                                                                        disabled={isSavingItems}
                                                                        onChange={e => updateItemDraft(item.id, {
                                                                            quantity: e.target.value === '' ? 0 : parseInt(e.target.value, 10),
                                                                        })}
                                                                        style={inputStyle}
                                                                    />
                                                                ) : item.quantity}
                                                            </td>
                                                            <td style={itemTdStyle(t, totalCols, 3, 'right', true, false)}>
                                                                {rowEditing ? (
                                                                    <input
                                                                        type="text" maxLength={50}
                                                                        value={draft.unit_of_measurement}
                                                                        disabled={isSavingItems}
                                                                        onChange={e => updateItemDraft(item.id, { unit_of_measurement: e.target.value })}
                                                                        style={{ ...inputStyle, textAlign: 'right', maxWidth: 70 }}
                                                                    />
                                                                ) : (item.unit_of_measurement || '—')}
                                                            </td>
                                                            <td style={itemTdStyle(t, totalCols, 4, 'right', false, true)}>
                                                                {rowEditing ? (
                                                                    <input
                                                                        type="number" min={0.01} step={0.01}
                                                                        value={draft.unit_cost}
                                                                        disabled={isSavingItems}
                                                                        onChange={e => updateItemDraft(item.id, {
                                                                            unit_cost: e.target.value === '' ? 0 : parseFloat(e.target.value),
                                                                        })}
                                                                        style={inputStyle}
                                                                    />
                                                                ) : formatAmount(item.unit_cost)}
                                                            </td>
                                                            {showQuotedPriceColumn && (
                                                                <td style={itemTdStyle(t, totalCols, 5, 'right', false, true)}>
                                                                    {rowPricing ? (
                                                                        <input
                                                                            type="number" min={0.01} step={0.01}
                                                                            value={priceDraft}
                                                                            disabled={isSavingPrices}
                                                                            onChange={e => updatePriceDraft(item.id,
                                                                                e.target.value === '' ? 0 : parseFloat(e.target.value),
                                                                            )}
                                                                            style={inputStyle}
                                                                        />
                                                                    ) : (item.quoted_price != null ? formatAmount(item.quoted_price) : '—')}
                                                                </td>
                                                            )}
                                                            <td style={{
                                                                ...itemTdStyle(t, totalCols, totalCols - 1, 'right', false, true),
                                                                borderRight: 'none',
                                                                fontWeight: rowEditing && liveTotal !== item.total_cost ? 700 : undefined,
                                                                color: rowEditing && liveTotal !== item.total_cost ? t.accentColor : undefined,
                                                            }}>
                                                                {formatAmount(liveTotal)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {isEditingItems && (
                                                    <tr style={{ background: isDark ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.05)' }}>
                                                        <td colSpan={totalCols - 1} style={{
                                                            padding: '10px 14px', fontSize: 11, fontWeight: 700,
                                                            textAlign: 'right', color: t.cellMuted,
                                                            borderTop: `1px solid ${t.rowBorder}`,
                                                        }}>
                                                            Recalculated Total
                                                        </td>
                                                        <td style={{
                                                            padding: '10px 14px', fontSize: 13, fontWeight: 800,
                                                            textAlign: 'right', color: t.accentColor,
                                                            borderTop: `1px solid ${t.rowBorder}`,
                                                            fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                                                        }}>
                                                            {formatAmount(editedTotal)}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: t.cellMuted }}>
                                            No line items available.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── Payee (if present) ──────────────────────────── */}
                        {(row.payee || row.payment_form) && (
                            <>
                                {sectionDivider}
                                <div style={{
                                    display: 'flex', gap: 24, flexWrap: 'wrap',
                                    padding: '12px 20px',
                                    background: isDark ? 'rgba(251,191,36,0.07)' : 'rgba(251,191,36,0.08)',
                                }}>
                                    {row.payee && <InfoLine label="Payee:" value={row.payee} t={t} />}
                                    {row.payment_form && <InfoLine label="Payment Form:" value={row.payment_form} t={t} />}
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── Notes + Mark as Cancelled  |  Total Amount + Status ── */}
                    <div style={{ display: 'flex', flexShrink: 0, borderTop: `1px solid ${t.cardHeaderBorder}` }}>
                        {/* Left: notes + cancel */}
                        <div style={{
                            flex: '1 1 60%', minWidth: 0,
                            padding: '14px 20px',
                            borderRight: `1px solid ${t.cardHeaderBorder}`,
                            display: 'flex', flexDirection: 'column', gap: 10,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: t.labelColor }}>
                                    Notes
                                </span>
                                {!isEditingNote && (
                                    <button
                                        onClick={() => setIsEditingNote(true)}
                                        title="Edit note"
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            width: 24, height: 24, borderRadius: 6, border: 'none',
                                            background: 'transparent', color: t.cellMuted, cursor: 'pointer',
                                            transition: 'background .12s ease, color .12s ease',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
                                            e.currentTarget.style.color = t.accentColor;
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = t.cellMuted;
                                        }}
                                    >
                                        <Pencil style={{ width: 12, height: 12 }} />
                                    </button>
                                )}
                            </div>
                            {isEditingNote ? (
                                <>
                                    <textarea
                                        autoFocus
                                        value={noteDraft}
                                        onChange={e => setNoteDraft(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Escape') { e.preventDefault(); handleCancelEditNote(); }
                                        }}
                                        placeholder="Add a note…"
                                        maxLength={2000}
                                        style={{
                                            minHeight: 56, maxHeight: 90, overflowY: 'auto',
                                            padding: '10px 12px', borderRadius: 10,
                                            background: t.inputBg, color: t.inputText,
                                            border: `1px solid ${t.inputBorder}`,
                                            fontSize: 12.5, lineHeight: 1.7, fontFamily: 'inherit',
                                            resize: 'vertical', outline: 'none',
                                        }}
                                    />
                                    {noteError && (
                                        <span style={{ fontSize: 10.5, color: t.cellAmber }}>{noteError}</span>
                                    )}
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={handleSaveNote}
                                            disabled={isSavingNote}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                                padding: '6px 13px', borderRadius: 8,
                                                fontSize: 11, fontWeight: 700,
                                                border: 'none',
                                                background: isSavingNote
                                                    ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')
                                                    : (isDark ? 'rgba(37,99,235,0.70)' : '#1d4ed8'),
                                                color: isSavingNote ? t.cellMuted : '#ffffff',
                                                cursor: isSavingNote ? 'not-allowed' : 'pointer',
                                                transition: 'background .13s ease',
                                            }}
                                        >
                                            {isSavingNote
                                                ? <RefreshCw style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                                                : <Save style={{ width: 12, height: 12 }} />
                                            }
                                            {isSavingNote ? 'Saving…' : 'Save'}
                                        </button>
                                        <button
                                            onClick={handleCancelEditNote}
                                            disabled={isSavingNote}
                                            style={{
                                                padding: '6px 13px', borderRadius: 8,
                                                fontSize: 11, fontWeight: 700,
                                                border: `1px solid ${t.cardBorder}`,
                                                background: 'transparent', color: t.cellMuted,
                                                cursor: isSavingNote ? 'not-allowed' : 'pointer',
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div style={{
                                    minHeight: 56, maxHeight: 90, overflowY: 'auto',
                                    padding: '10px 12px', borderRadius: 10,
                                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
                                    border: `1px solid ${t.cardBorder}`,
                                    fontSize: 12.5, lineHeight: 1.7,
                                    color: row.note ? t.cellText : t.cellMuted,
                                    fontStyle: row.note ? 'normal' : 'italic',
                                }}>
                                    {row.note || 'No notes.'}
                                </div>
                            )}
                            {cancelVisible && (
                                <button
                                    onClick={() => triggerAction(CANCEL_ACTION)}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        alignSelf: 'flex-start',
                                        padding: '7px 14px', borderRadius: 20,
                                        fontSize: 11, fontWeight: 700,
                                        border: `1px solid ${t.cellAmber}66`,
                                        background: `${t.cellAmber}1a`, color: t.cellAmber,
                                        cursor: 'pointer', transition: 'background .14s ease',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = `${t.cellAmber}33`)}
                                    onMouseLeave={e => (e.currentTarget.style.background = `${t.cellAmber}1a`)}
                                >
                                    <XCircle style={{ width: 13, height: 13 }} />
                                    {CANCEL_ACTION.label}
                                </button>
                            )}
                        </div>

                        {/* Right: total amount + status */}
                        <div style={{ flex: '1 1 40%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                            <div style={{
                                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', gap: 8, padding: '16px 20px',
                                background: isDark ? 'rgba(74,222,128,0.07)' : 'rgba(74,222,128,0.06)',
                            }}>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: t.labelColor }}>
                                    Total Amount
                                </span>
                                <span style={{
                                    fontSize: 24, fontWeight: 800, color: t.cellGreen,
                                    fontVariantNumeric: 'tabular-nums', letterSpacing: '0.01em',
                                    lineHeight: 1,
                                }}>
                                    {formatAmount(row.total_amount)}
                                </span>
                                {/* For Liquidation — only shown to admin-access and budget-access
                                when the entry is at the budget office. A tag on the entry,
                                independent of its status. Revertible: clicking again flips it off. */}
                                {(roleKey === 'admin-access' || roleKey === 'budget-access') && locationLower === 'budget office' && (
                                <button
                                    onClick={() => triggerAction({ label: 'For Liquidation', variant: 'primary', visibleOn: '*', confirm: false })}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        marginTop: 2,
                                        padding: '5px 12px', borderRadius: 20,
                                        fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                                        border: row.for_liquidation ? `1px solid ${LIQUIDATION_COLOR}88` : `1px solid ${t.cardBorder}`,
                                        background: row.for_liquidation ? `${LIQUIDATION_COLOR}22` : 'transparent',
                                        color: row.for_liquidation ? LIQUIDATION_COLOR : t.cellMuted,
                                        cursor: 'pointer', transition: 'background .14s ease',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = row.for_liquidation ? `${LIQUIDATION_COLOR}38` : `${t.cellMuted}1a`)}
                                    onMouseLeave={e => (e.currentTarget.style.background = row.for_liquidation ? `${LIQUIDATION_COLOR}22` : 'transparent')}
                                >
                                    <span style={{
                                        display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                                        background: row.for_liquidation ? LIQUIDATION_COLOR : t.cellMuted,
                                        flexShrink: 0,
                                    }} />
                                    {row.for_liquidation ? 'For Liquidation' : 'Mark For Liquidation'}
                                </button>
                                )}
                            </div>
                            <div style={{
                                padding: '9px 20px', textAlign: 'center',
                                background: statusColors.bg,
                                borderTop: `1px solid ${statusColors.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}>
                                <span style={{
                                    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                                    background: statusColors.text, flexShrink: 0,
                                }} />
                                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: statusColors.text }}>
                                    {row.status?.toUpperCase() ?? '—'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── Action footer — role-specific buttons ───────────── */}
                    {visibleRoleActions.length > 0 && (
                        <>
                            <div style={{ height: 1, background: t.cardHeaderBorder, flexShrink: 0 }} />
                            <div style={{
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 10, padding: '12px 20px',
                                background: t.cardHeaderBg,
                                flexShrink: 0, flexWrap: 'wrap',
                            }}>
                                {/* Left: role label */}
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                                    textTransform: 'uppercase', color: t.labelColor,
                                    padding: '4px 10px', borderRadius: 20,
                                    background: isDark ? 'rgba(96,165,250,0.09)' : 'rgba(29,78,216,0.06)',
                                    border: `1px solid ${t.dividerColor}`,
                                }}>
                                    <span style={{ color: t.accentColor }}><RoleIcon roleKey={roleKey} /></span>
                                    {roleLabel} Actions
                                </span>

                                {/* Right: action buttons */}
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    {visibleRoleActions.map(action => (
                                        <ActionButton
                                            key={action.label}
                                            label={action.label}
                                            icon={action.icon}
                                            variant={action.variant}
                                            t={t}
                                            onClick={() => triggerAction(action)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Forward to… buttons live in the toolbar above, not here ── */}
                </div>
            </div>

            {/* ── Confirmation modal — shown before any onAction actually fires ── */}
            {/* ── Accept Quoted Prices preview + confirmation modal ──────────── */}
            {acceptPreviewOpen && createPortal(
                <>
                    <style>{`
                        @keyframes accept-modal-in {
                            from { opacity: 0; transform: scale(0.96) translateY(8px); }
                            to   { opacity: 1; transform: scale(1)    translateY(0);   }
                        }
                    `}</style>
                    <div
                        style={{
                            position: 'fixed', inset: 0, zIndex: 80,
                            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '24px 16px',
                        }}
                        onClick={e => { if (e.target === e.currentTarget && !isAccepting) setAcceptPreviewOpen(false); }}
                    >
                        <div
                            style={{
                                background: t.cardBg,
                                border: `1px solid ${t.cardBorder}`,
                                borderRadius: 14,
                                boxShadow: t.cardShadow,
                                width: '100%',
                                maxWidth: 820,
                                maxHeight: 'calc(100vh - 48px)',
                                display: 'flex',
                                flexDirection: 'column',
                                animation: 'accept-modal-in .22s cubic-bezier(.22,1,.36,1)',
                                overflow: 'hidden',
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 20px',
                                background: t.cardHeaderBg,
                                borderBottom: `1px solid ${t.cardHeaderBorder}`,
                                flexShrink: 0,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                        background: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(187,247,208,0.50)',
                                        border: `1px solid ${isDark ? 'rgba(16,185,129,0.35)' : 'rgba(4,120,87,0.25)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <CheckCircle2 style={{ width: 14, height: 14, color: isDark ? '#6ee7b7' : '#047857' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: t.titleColor }}>
                                            Accept Quoted Prices
                                        </div>
                                        <div style={{ fontSize: 10, color: t.cellMuted, marginTop: 1 }}>
                                            Review balance impact before confirming — RS {row.requisition_no}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { if (!isAccepting) setAcceptPreviewOpen(false); }}
                                    disabled={isAccepting}
                                    style={{
                                        width: 28, height: 28, borderRadius: 8, border: 'none',
                                        background: 'transparent', color: t.cellMuted,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: isAccepting ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    <X style={{ width: 15, height: 15 }} />
                                </button>
                            </div>

                            {/* Body */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                                {acceptPreviewLoading ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, gap: 10, color: t.cellMuted }}>
                                        <RefreshCw style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                                        <span style={{ fontSize: 12 }}>Loading balance preview…</span>
                                    </div>
                                ) : acceptPreviewError ? (
                                    <div style={{
                                        padding: '14px 16px', borderRadius: 10, fontSize: 12,
                                        background: isDark ? 'rgba(239,68,68,0.10)' : 'rgba(254,242,242,0.90)',
                                        border: `1px solid ${isDark ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.30)'}`,
                                        color: isDark ? '#fca5a5' : '#b91c1c',
                                        display: 'flex', alignItems: 'flex-start', gap: 10,
                                    }}>
                                        <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
                                        {acceptPreviewError}
                                    </div>
                                ) : (
                                    <>
                                        {/* Info banner */}
                                        <div style={{
                                            padding: '10px 14px', borderRadius: 10, fontSize: 11,
                                            marginBottom: 14,
                                            background: isDark ? 'rgba(96,165,250,0.08)' : 'rgba(219,234,254,0.60)',
                                            border: `1px solid ${isDark ? 'rgba(96,165,250,0.25)' : 'rgba(37,99,235,0.18)'}`,
                                            color: isDark ? '#93c5fd' : '#1e40af',
                                            display: 'flex', alignItems: 'flex-start', gap: 8,
                                        }}>
                                            <AlertCircle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
                                            <span>
                                                Accepting will replace each item's <strong>unit cost</strong> with its <strong>quoted price</strong> and recalculate totals.
                                                Items without a quoted price are left unchanged. This action adjusts account balances and <strong>cannot be undone</strong>.
                                            </span>
                                        </div>

                                        {/* Insufficient balance warning */}
                                        {!acceptPreviewAllSufficient && (
                                            <div style={{
                                                padding: '10px 14px', borderRadius: 10, fontSize: 11,
                                                marginBottom: 14,
                                                background: isDark ? 'rgba(239,68,68,0.10)' : 'rgba(254,242,242,0.90)',
                                                border: `1px solid ${isDark ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.30)'}`,
                                                color: isDark ? '#fca5a5' : '#b91c1c',
                                                display: 'flex', alignItems: 'flex-start', gap: 8, fontWeight: 600,
                                            }}>
                                                <AlertTriangle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
                                                One or more accounts have insufficient balance for the quoted prices. You cannot accept until the budget allocation is corrected.
                                            </div>
                                        )}

                                        {/* Items table */}
                                        <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${t.cardBorder}` }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                                                <thead>
                                                    <tr style={{ background: t.tableHeadBg }}>
                                                        {['Account', 'Description', 'Qty', 'Current Cost', 'Quoted Price', 'Delta', 'Acct. Balance', 'Balance After'].map((col, i, arr) => (
                                                            <th key={col} style={{
                                                                padding: '9px 12px', fontSize: 9, fontWeight: 700,
                                                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                                                color: t.tableHeadText,
                                                                borderBottom: `2px solid ${t.tableHeadBorder}`,
                                                                borderRight: i < arr.length - 1 ? `1px solid ${t.tableHeadBorder}` : 'none',
                                                                textAlign: i >= 2 ? 'right' : 'left',
                                                                whiteSpace: 'nowrap',
                                                            }}>
                                                                {col}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {acceptPreviewItems.map((item, idx) => {
                                                        const rowBg = idx % 2 === 0 ? t.rowEvenBg : t.rowOddBg;
                                                        const noChange = item.quoted_price === null || item.delta === 0;
                                                        const insufficient = item.sufficient === false;
                                                        return (
                                                            <tr key={item.id} style={{ background: insufficient ? (isDark ? 'rgba(239,68,68,0.07)' : 'rgba(254,242,242,0.70)') : rowBg }}>
                                                                <td style={{ padding: '9px 12px', fontSize: 11, color: t.cellText, fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${t.rowBorder}`, borderRight: `1px solid ${t.rowBorder}`, whiteSpace: 'nowrap' }}>
                                                                    {item.account_code}
                                                                </td>
                                                                <td style={{ padding: '9px 12px', fontSize: 11, color: t.cellText, borderBottom: `1px solid ${t.rowBorder}`, borderRight: `1px solid ${t.rowBorder}`, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {item.description}
                                                                </td>
                                                                <td style={{ padding: '9px 12px', fontSize: 11, color: t.cellText, fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${t.rowBorder}`, borderRight: `1px solid ${t.rowBorder}`, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                                    {item.quantity} {item.unit_of_measurement}
                                                                </td>
                                                                <td style={{ padding: '9px 12px', fontSize: 11, color: t.cellMuted, fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${t.rowBorder}`, borderRight: `1px solid ${t.rowBorder}`, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                                    {formatAmount(item.unit_cost)}
                                                                    <div style={{ fontSize: 9, color: t.cellMuted, marginTop: 1 }}>Total: {formatAmount(item.total_cost)}</div>
                                                                </td>
                                                                <td style={{ padding: '9px 12px', fontSize: 11, fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${t.rowBorder}`, borderRight: `1px solid ${t.rowBorder}`, textAlign: 'right', whiteSpace: 'nowrap', color: noChange ? t.cellMuted : (isDark ? '#93c5fd' : '#1d4ed8'), fontWeight: noChange ? undefined : 700 }}>
                                                                    {item.quoted_price != null ? formatAmount(item.quoted_price) : <span style={{ color: t.cellMuted, fontSize: 10 }}>—</span>}
                                                                    {!noChange && <div style={{ fontSize: 9, color: isDark ? '#93c5fd' : '#1d4ed8', marginTop: 1 }}>Total: {formatAmount(item.proposed_total_cost)}</div>}
                                                                </td>
                                                                <td style={{ padding: '9px 12px', fontSize: 11, fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${t.rowBorder}`, borderRight: `1px solid ${t.rowBorder}`, textAlign: 'right', whiteSpace: 'nowrap',
                                                                    color: noChange ? t.cellMuted : item.delta > 0 ? (isDark ? '#fca5a5' : '#dc2626') : (isDark ? '#6ee7b7' : '#047857'),
                                                                    fontWeight: noChange ? undefined : 700,
                                                                }}>
                                                                    {noChange ? '—' : (item.delta > 0 ? '+' : '') + formatAmount(item.delta)}
                                                                </td>
                                                                <td style={{ padding: '9px 12px', fontSize: 11, color: t.cellText, fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${t.rowBorder}`, borderRight: `1px solid ${t.rowBorder}`, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                                    {item.account_balance != null ? formatAmount(item.account_balance) : <span style={{ color: t.cellMuted }}>—</span>}
                                                                </td>
                                                                <td style={{ padding: '9px 12px', fontSize: 11, fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${t.rowBorder}`, textAlign: 'right', whiteSpace: 'nowrap',
                                                                    color: insufficient ? (isDark ? '#fca5a5' : '#dc2626') : (item.balance_after != null && item.balance_after < item.account_balance! * 0.2 ? (isDark ? t.cellAmber : '#b45309') : (isDark ? '#6ee7b7' : '#047857')),
                                                                    fontWeight: 700,
                                                                }}>
                                                                    {item.balance_after != null ? (
                                                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                                                                            {insufficient && <AlertTriangle style={{ width: 11, height: 11, flexShrink: 0 }} />}
                                                                            {formatAmount(item.balance_after)}
                                                                        </span>
                                                                    ) : <span style={{ color: t.cellMuted }}>—</span>}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            {!acceptPreviewLoading && !acceptPreviewError && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
                                    padding: '12px 20px',
                                    borderTop: `1px solid ${t.cardHeaderBorder}`,
                                    flexShrink: 0,
                                    background: t.cardHeaderBg,
                                }}>
                                    {acceptError && (
                                        <span style={{ fontSize: 11, color: isDark ? '#fca5a5' : '#dc2626', flex: 1, lineHeight: 1.4 }}>
                                            {acceptError}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => { if (!isAccepting) setAcceptPreviewOpen(false); }}
                                        disabled={isAccepting}
                                        style={{
                                            padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                            border: `1px solid ${t.cardBorder}`,
                                            background: 'transparent', color: t.cellMuted,
                                            cursor: isAccepting ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirmAcceptQuotedPrices}
                                        disabled={isAccepting || !acceptPreviewAllSufficient}
                                        title={!acceptPreviewAllSufficient ? 'Cannot accept — one or more accounts have insufficient balance' : 'Accept all quoted prices and update balances'}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 7,
                                            padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                            border: 'none',
                                            background: (isAccepting || !acceptPreviewAllSufficient)
                                                ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')
                                                : (isDark ? 'rgba(16,185,129,0.75)' : '#059669'),
                                            color: (isAccepting || !acceptPreviewAllSufficient) ? t.cellMuted : '#ffffff',
                                            cursor: (isAccepting || !acceptPreviewAllSufficient) ? 'not-allowed' : 'pointer',
                                            transition: 'background .12s ease',
                                        }}
                                    >
                                        {isAccepting
                                            ? <RefreshCw style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                                            : <CheckCircle2 style={{ width: 13, height: 13 }} />
                                        }
                                        {isAccepting ? 'Accepting…' : 'Confirm & Accept'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>,
                document.body,
            )}

            {pendingAction && (
                <ConfirmActionModal
                    action={pendingAction.label}
                    row={row}
                    t={t}
                    isDark={isDark}
                    onCancel={() => setPendingAction(null)}
                    onConfirm={confirmPendingAction}
                />
            )}

            {/* ── Chat modal ─────────────────────────────────────────────────── */}
            <RSChatModal
                open={showChat}
                onClose={() => setShowChat(false)}
                entryId={row.id}
                currentUser={currentUser}
                t={t}
                isDark={isDark}
                incomingMessage={incomingMessage}
            />

            {/* ── Audit history modal ───────────────────────────────────────── */}
            <RSAuditHistoryModal
                open={showHistory}
                onClose={() => setShowHistory(false)}
                entryId={row.id}
                t={t}
                isDark={isDark}
            />
        </>
    );
}
// ─────────────────────────────────────────────────────────────────────────────
// RSChatBadge — pill button with unread badge shown in toolbar
// ─────────────────────────────────────────────────────────────────────────────
function RSChatBadge({
    onClick, unreadCount, active = false, t, isDark,
}: {
    onClick: () => void;
    unreadCount: number;
    active?: boolean;
    t: Theme;
    isDark: boolean;
}) {
    const paleBlue = {
        idleBg: isDark ? 'rgba(147,197,253,0.10)' : 'rgba(219,234,254,0.55)',
        idleBorder: isDark ? 'rgba(147,197,253,0.30)' : 'rgba(96,165,250,0.40)',
        idleText: isDark ? '#93c5fd' : '#2563eb',
        hoverBg: isDark ? 'rgba(147,197,253,0.20)' : 'rgba(191,219,254,0.80)',
        hoverBorder: isDark ? 'rgba(147,197,253,0.50)' : 'rgba(59,130,246,0.55)',
        activeBg: isDark ? 'rgba(59,130,246,0.28)' : 'rgba(191,219,254,0.95)',
        activeBorder: isDark ? 'rgba(96,165,250,0.65)' : 'rgba(37,99,235,0.55)',
        activeText: isDark ? '#60a5fa' : '#1d4ed8',
    };

    return (
        <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button
                onClick={onClick}
                title={active ? 'Close chat' : 'Open chat'}
                style={{
                    height: 32,
                    paddingLeft: 10,
                    paddingRight: 12,
                    borderRadius: 20,
                    border: `1px solid ${active ? paleBlue.activeBorder : paleBlue.idleBorder}`,
                    background: active ? paleBlue.activeBg : paleBlue.idleBg,
                    color: active ? paleBlue.activeText : paleBlue.idleText,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    transition: 'all .12s ease',
                }}
                onMouseEnter={e => {
                    if (!active) {
                        (e.currentTarget as HTMLElement).style.background = paleBlue.hoverBg;
                        (e.currentTarget as HTMLElement).style.borderColor = paleBlue.hoverBorder;
                    }
                }}
                onMouseLeave={e => {
                    if (!active) {
                        (e.currentTarget as HTMLElement).style.background = paleBlue.idleBg;
                        (e.currentTarget as HTMLElement).style.borderColor = paleBlue.idleBorder;
                    }
                }}
            >
                <MessageSquare style={{ width: 13, height: 13 }} />
                <span>Chat / Messages</span>
            </button>
            {unreadCount > 0 && (
                <span style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    pointerEvents: 'none',
                    lineHeight: 1,
                }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// RSChatModal — portal modal wrapping the chat panel
// ─────────────────────────────────────────────────────────────────────────────
function RSChatModal({
    open, onClose, entryId, currentUser, t, isDark, incomingMessage,
}: {
    open: boolean;
    onClose: () => void;
    entryId: number;
    currentUser: { id: string; name: string };
    t: Theme;
    isDark: boolean;
    incomingMessage?: ChatMessage | null;
}) {
    if (!open) return null;

    return createPortal(
        <>
            <style>{`
                @keyframes rschat-overlay-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes rschat-modal-in { from { opacity: 0; transform: translate(-50%,-48%) scale(0.96); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
            {/* Overlay */}
            <div
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.50)',
                    zIndex: 999998,
                    animation: 'rschat-overlay-in .18s ease',
                    backdropFilter: 'blur(2px)',
                }}
                onClick={onClose}
            />
            {/* Modal card */}
            <div
                style={{
                    position: 'fixed',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    zIndex: 999999,
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    borderRadius: 14,
                    boxShadow: t.cardShadow,
                    width: '90%',
                    maxWidth: 600,
                    height: '85vh',
                    maxHeight: 700,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'rschat-modal-in .22s cubic-bezier(.22,1,.36,1)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 22px',
                    background: t.cardHeaderBg,
                    borderBottom: `1px solid ${t.cardHeaderBorder}`,
                    borderRadius: '14px 14px 0 0',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MessageSquare style={{ width: 16, height: 16, color: isDark ? '#60a5fa' : '#3b82f6' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: t.titleColor, letterSpacing: '-.01em' }}>
                            Discussion
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 28, height: 28, borderRadius: 8, border: 'none',
                            background: 'transparent', color: t.cellMuted,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all .12s ease',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.18)' : 'rgba(254,242,242,0.80)';
                            (e.currentTarget as HTMLElement).style.color = isDark ? '#f87171' : '#dc2626';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = t.cellMuted;
                        }}
                    >
                        <X style={{ width: 16, height: 16 }} />
                    </button>
                </div>

                {/* Chat panel */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <RSChatPanel
                        entryId={entryId}
                        currentUser={currentUser}
                        t={t}
                        isDark={isDark}
                        incomingMessage={incomingMessage}
                    />
                </div>
            </div>
        </>,
        document.body,
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// RSChatPanel — scrollable message list + send input
// ─────────────────────────────────────────────────────────────────────────────
function RSChatPanel({
    entryId, currentUser, t, isDark, onNewMessage, incomingMessage,
}: {
    entryId: number;
    currentUser: { id: string; name: string };
    t: Theme;
    isDark: boolean;
    onNewMessage?: () => void;
    incomingMessage?: ChatMessage | null;
}) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastMessageIdRef = useRef<number>(0);

    // Consume incoming WebSocket messages
    useEffect(() => {
        if (!incomingMessage) return;
        setMessages(prev => {
            if (prev.some(m => m.id === incomingMessage.id)) return prev;
            return [...prev, incomingMessage];
        });
        if (incomingMessage.id > lastMessageIdRef.current) {
            lastMessageIdRef.current = incomingMessage.id;
        }
        financeSvc
            .post(`/abms/budget-request-entry/${entryId}/chats/mark-read`, {
                userId: currentUser.id,
                lastChatId: incomingMessage.id,
            })
            .catch(() => { });
        onNewMessage?.();
    }, [incomingMessage]);

    // Load messages on mount
    useEffect(() => {
        setIsLoading(true);
        financeSvc
            .get(`/abms/budget-request-entry/${entryId}/chats`, {
                params: { userId: currentUser.id },
            })
            .then(res => {
                const loaded: ChatMessage[] = res.data.chats ?? [];
                setMessages(loaded);
                if (loaded.length > 0) {
                    lastMessageIdRef.current = Math.max(...loaded.map(m => m.id));
                }
            })
            .catch(() => { })
            .finally(() => setIsLoading(false));
    }, [entryId, currentUser.id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Polling fallback
    useEffect(() => {
        if (!entryId || !currentUser.id) return;
        let isSubscribed = true;

        const pollMessages = async () => {
            try {
                const res = await financeSvc.get(`/abms/budget-request-entry/${entryId}/chats`, {
                    params: { userId: currentUser.id, lastId: lastMessageIdRef.current },
                });
                if (isSubscribed) {
                    const newMessages: ChatMessage[] = res.data.chats ?? [];
                    if (newMessages.length > 0) {
                        setMessages(prev => {
                            const merged = [...prev];
                            for (const m of newMessages) {
                                if (!merged.some(x => x.id === m.id)) merged.push(m);
                            }
                            return merged.sort((a, b) => a.id - b.id);
                        });
                        lastMessageIdRef.current = Math.max(...newMessages.map(m => m.id));
                    }
                }
            } catch { }
        };

        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = setInterval(pollMessages, 3000);

        return () => {
            isSubscribed = false;
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [entryId, currentUser.id]);

    async function handleSend() {
        const text = inputValue.trim();
        if (!text || isSending || !currentUser.id) return;
        setIsSending(true);
        setInputValue('');

        const optimistic: ChatMessage = {
            id: Date.now(),
            sender_id: currentUser.id,
            sender_name: currentUser.name,
            message: text,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);

        try {
            const res = await financeSvc.post(`/abms/budget-request-entry/${entryId}/chats`, {
                sender_id: currentUser.id,
                sender_name: currentUser.name,
                message: text,
            });
            const confirmed: ChatMessage = res.data.chat;
            setMessages(prev => prev.map(m => (m.id === optimistic.id ? confirmed : m)));
        } catch {
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            setInputValue(text);
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    }

    function formatTime(iso: string) {
        return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    function formatDate(iso: string) {
        return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    const grouped: { date: string; msgs: ChatMessage[] }[] = [];
    for (const msg of messages) {
        const date = formatDate(msg.created_at);
        const last = grouped[grouped.length - 1];
        if (last && last.date === date) last.msgs.push(msg);
        else grouped.push({ date, msgs: [msg] });
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: isDark ? 'rgba(7,14,32,0.95)' : 'rgba(245,249,255,0.98)',
        }}>
            {/* Panel header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px',
                background: t.cardHeaderBg,
                borderBottom: `1px solid ${t.cardHeaderBorder}`,
                flexShrink: 0,
            }}>
                <MessageSquare style={{ width: 13, height: 13, color: isDark ? '#60a5fa' : '#3b82f6' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: t.titleColor, letterSpacing: '-.01em' }}>
                    Discussion
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 600, color: t.cellMuted }}>
                    {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                </span>
            </div>

            {/* Messages list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <RefreshCw style={{ width: 18, height: 18, color: t.cellMuted, animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                        <MessageSquare style={{ width: 28, height: 28, color: t.cellMuted, opacity: 0.35 }} />
                        <p style={{ fontSize: 11, color: t.cellMuted, margin: 0 }}>No messages yet. Start the discussion!</p>
                    </div>
                ) : (
                    grouped.map(group => (
                        <div key={group.date}>
                            {/* Date separator */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 8px' }}>
                                <div style={{ flex: 1, height: 1, background: t.sectionDivider }} />
                                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: t.cellMuted, whiteSpace: 'nowrap' }}>
                                    {group.date}
                                </span>
                                <div style={{ flex: 1, height: 1, background: t.sectionDivider }} />
                            </div>

                            {group.msgs.map(msg => {
                                const isOwn = msg.sender_id === currentUser.id;
                                const avatarUrl = `https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${msg.sender_id}_2`;
                                return (
                                    <div
                                        key={msg.id}
                                        style={{
                                            display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10,
                                            flexDirection: isOwn ? 'row-reverse' : 'row',
                                        } as React.CSSProperties}
                                    >
                                        <img
                                            src={avatarUrl}
                                            alt={msg.sender_name}
                                            style={{
                                                width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
                                                border: `2px solid ${isDark ? 'rgba(100,160,255,0.30)' : 'rgba(37,99,235,0.20)'}`,
                                                flexShrink: 0,
                                            }}
                                            onError={e => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E';
                                            }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', flex: 1, minWidth: 0 }}>
                                            {!isOwn && (
                                                <span style={{ fontSize: 9, fontWeight: 700, color: t.tableHeadText, marginBottom: 3, paddingLeft: 2, letterSpacing: '.03em' }}>
                                                    {msg.sender_name}
                                                </span>
                                            )}
                                            <div style={{
                                                padding: '8px 12px',
                                                borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                                fontSize: 11, lineHeight: 1.55, wordBreak: 'break-word',
                                                background: isOwn
                                                    ? (isDark ? 'rgba(37,99,235,0.55)' : 'rgba(29,78,216,0.88)')
                                                    : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
                                                color: isOwn ? '#ffffff' : t.cellText,
                                                border: isOwn ? 'none' : `1px solid ${t.rowBorder}`,
                                            }}>
                                                {msg.message}
                                            </div>
                                            <span style={{ fontSize: 9, color: t.cellMuted, marginTop: 3, paddingRight: isOwn ? 2 : 0, paddingLeft: isOwn ? 0 : 2 }}>
                                                {formatTime(msg.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px',
                borderTop: `1px solid ${t.cardHeaderBorder}`,
                background: t.cardHeaderBg,
                flexShrink: 0,
            }}>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    placeholder="Type a message…"
                    maxLength={2000}
                    style={{
                        flex: 1, padding: '8px 12px', borderRadius: 10,
                        border: `1px solid ${t.inputBorder}`,
                        background: t.inputBg, color: t.inputText,
                        fontSize: 11, outline: 'none',
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isSending}
                    style={{
                        width: 34, height: 34, borderRadius: 10, border: 'none',
                        background: !inputValue.trim() || isSending
                            ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)')
                            : (isDark ? 'rgba(37,99,235,0.70)' : '#1d4ed8'),
                        color: !inputValue.trim() || isSending ? t.cellMuted : '#ffffff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: !inputValue.trim() || isSending ? 'not-allowed' : 'pointer',
                        transition: 'background .12s ease', flexShrink: 0,
                    }}
                    title="Send (Enter)"
                >
                    {isSending
                        ? <RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                        : <Send style={{ width: 14, height: 14 }} />
                    }
                </button>
            </div>
        </div>
    );
}
// ─────────────────────────────────────────────────────────────────────────────
// RSAuditHistoryModal — displays audit trail for the requisition entry
// ─────────────────────────────────────────────────────────────────────────────
function RSAuditHistoryModal({
    open, onClose, entryId, t, isDark,
}: {
    open: boolean;
    onClose: () => void;
    entryId: number;
    t: Theme;
    isDark: boolean;
}) {
    const [audits, setAudits] = useState<AuditRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !entryId) return;
        setIsLoading(true);
        setError(null);
        financeSvc
            .get(`/abms/budget-request-entry/${entryId}/audit-history`)
            .then(res => {
                console.log('=== AUDIT HISTORY DATA ===');
                console.log('Full response:', res.data);
                res.data.audits?.forEach((audit, idx) => {
                    console.log(`\n--- Audit ${idx} ---`);
                    console.log('Event:', audit.event);
                    console.log('new_values:', audit.new_values);
                    console.log('new_values type:', typeof audit.new_values);
                    console.log('new_values keys:', audit.new_values ? Object.keys(audit.new_values) : 'null');
                    console.log('old_values:', audit.old_values);
                    console.log('old_values type:', typeof audit.old_values);
                    console.log('old_values keys:', audit.old_values ? Object.keys(audit.old_values) : 'null');
                });
                setAudits(res.data.audits ?? []);
            })
            .catch(err => {
                setError(err.response?.data?.message ?? 'Failed to load history');
            })
            .finally(() => setIsLoading(false));
    }, [open, entryId]);

    if (!open) return null;

    const targetColumns = ['location', 'requisition_number', 'status', 'total_amount', 'from'];

    return createPortal(
        <>
            <style>{`
                @keyframes audit-overlay-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes audit-modal-in { from { opacity: 0; transform: translate(-50%,-48%) scale(0.96); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
            `}</style>
            {/* Overlay */}
            <div
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.50)',
                    zIndex: 999998,
                    animation: 'audit-overlay-in .18s ease',
                    backdropFilter: 'blur(2px)',
                }}
                onClick={onClose}
            />
            {/* Modal */}
            <div
                style={{
                    position: 'fixed',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    zIndex: 999999,
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    borderRadius: 14,
                    boxShadow: t.cardShadow,
                    width: '90%',
                    maxWidth: 700,
                    height: '85vh',
                    maxHeight: 750,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'audit-modal-in .22s cubic-bezier(.22,1,.36,1)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 22px',
                    background: t.cardHeaderBg,
                    borderBottom: `1px solid ${t.cardHeaderBorder}`,
                    borderRadius: '14px 14px 0 0',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <History style={{ width: 16, height: 16, color: isDark ? '#60a5fa' : '#3b82f6' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: t.titleColor }}>Process History</span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 28, height: 28, borderRadius: 8, border: 'none',
                            background: 'transparent', color: t.cellMuted,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <X style={{ width: 16, height: 16 }} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {isLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <RefreshCw style={{ width: 18, height: 18, color: t.cellMuted, animation: 'spin 1s linear infinite' }} />
                        </div>
                    ) : error ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <span style={{ fontSize: 12, color: t.cellMuted }}>{error}</span>
                        </div>
                    ) : audits.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <History style={{ width: 28, height: 28, color: t.cellMuted, opacity: 0.35 }} />
                            <p style={{ fontSize: 11, color: t.cellMuted, margin: 0 }}>No history available</p>
                        </div>
                    ) : (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
                            {audits.map((audit, idx) => (
                                <div
                                    key={audit.id ?? idx}
                                    style={{
                                        padding: '12px 18px',
                                        borderBottom: idx < audits.length - 1 ? `1px solid ${t.rowBorder}` : 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: t.tableHeadText }}>
                                            {audit.event.charAt(0).toUpperCase() + audit.event.slice(1)}
                                        </span>
                                        <span style={{ marginLeft: 'auto', fontSize: 9, color: t.cellMuted }}>
                                            {new Date(audit.created_at).toLocaleDateString('en-PH')} {new Date(audit.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 10, color: t.cellText, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span>By</span>
                                        <img
                                            src={`https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${audit.username}_2`}
                                            alt={audit.user_name}
                                            style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${t.cardBorder}` }}
                                            onError={e => (e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E')}
                                        />
                                        <span style={{ fontWeight: 600, color: t.titleColor }}>{audit.user_name}</span>
                                    </div>

                                    {/* Changes */}
                                    {audit.event.toLowerCase() === 'updated' && (
                                        <div style={{ fontSize: 10, marginTop: 8, paddingLeft: 12, paddingTop: 8, borderLeft: `2px solid ${isDark ? 'rgba(96,165,250,0.40)' : 'rgba(59,130,246,0.30)'}`, borderTop: `1px solid ${isDark ? 'rgba(96,165,250,0.20)' : 'rgba(59,130,246,0.15)'}` }}>
                                            <div style={{ fontWeight: 700, color: t.cellText, marginBottom: 8, fontSize: 9, textTransform: 'uppercase', letterSpacing: '.05em' }}>Changes</div>
                                            {(() => {
                                                const newVals = audit.new_values ?? {};
                                                const oldVals = audit.old_values ?? {};
                                                const allKeys = Object.keys(newVals);

                                                console.log('Rendering changes for audit', audit.id, '- Keys:', allKeys);

                                                if (allKeys.length === 0) {
                                                    return <span style={{ color: t.cellMuted, fontSize: 9 }}>No changes recorded</span>;
                                                }

                                                return allKeys.map(key => {
                                                    const oldVal = oldVals[key];
                                                    const newVal = newVals[key];

                                                    console.log(`Key: ${key}, Old: ${oldVal}, New: ${newVal}`);

                                                    const displayKey = key.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                                    return (
                                                        <div key={key} style={{ marginBottom: 8 }}>
                                                            <div style={{ fontWeight: 600, color: t.tableHeadText, marginBottom: 3, fontSize: 9 }}>{displayKey}</div>
                                                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                                                <span style={{ background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(254,242,242,0.80)', padding: '4px 8px', borderRadius: 4, color: isDark ? '#fca5a5' : '#dc2626', fontSize: 9, fontFamily: 'monospace', flex: 1, wordBreak: 'break-word' }}>
                                                                    {oldVal === null || oldVal === undefined ? '(empty)' : String(oldVal)}
                                                                </span>
                                                                <span style={{ color: t.cellMuted, fontWeight: 700, whiteSpace: 'nowrap' }}>→</span>
                                                                <span style={{ background: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(236,253,245,0.90)', padding: '4px 8px', borderRadius: 4, color: isDark ? '#86efac' : '#059669', fontSize: 9, fontFamily: 'monospace', flex: 1, wordBreak: 'break-word' }}>
                                                                    {newVal === null || newVal === undefined ? '(empty)' : String(newVal)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>,
        document.body,
    );
}