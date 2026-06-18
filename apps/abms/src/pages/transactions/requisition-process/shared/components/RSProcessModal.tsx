import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    X, FileText, Building2, User, Hash, Calendar,
    DollarSign, MapPin, ArrowRightLeft, CheckCircle2,
    Clock, Package, Stamp, ShieldCheck, Truck, Calculator,
    CreditCard, ChevronDown, ChevronUp,
    Eye, MessageSquare, History, Send, RefreshCw, Printer, XCircle,
    AlertTriangle, AlertCircle,
} from 'lucide-react';
import { Theme } from '../types.ts';
import { PermissionKey } from '../constants.ts';
import { financeSvc } from '@repo/axios-config/finance-service';
import echo from '../../../../../lib/echo';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface RSLineItem {
    account_code: string;
    description: string;
    quantity: number;
    unit_of_measurement: string;
    unit_cost: number;
    total_cost: number;
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
}

const ROLE_ACTIONS: Partial<Record<PermissionKey, RoleAction[]>> = {
    'budget-access': [
        { label: 'Mark as Reviewed', variant: 'success',   visibleOn: ['for review', 'for certification'] },
        { label: 'Disapprove',       variant: 'danger',    visibleOn: ['for review', 'for certification'] },
        { label: 'Mark Unserved',    variant: 'secondary', visibleOn: ['certified rs'] },
    ],
    'admin-access': [
        { label: 'Approve RS',    variant: 'success',   visibleOn: ['for review'] },
        { label: 'Reject RS',     variant: 'danger',    visibleOn: ['for review'] },
    ],
    'logistics-access': [
        { label: 'Mark Served',   variant: 'success',   visibleOn: ['certified rs', 'unserved rs'] },
        { label: 'Mark Unserved', variant: 'secondary', visibleOn: ['certified rs'] },
    ],
    'accounting-access': [
        { label: 'Post Entry',    variant: 'primary',   visibleOn: ['certified rs', 'served'] },
        { label: 'Certify RS',    variant: 'success',   visibleOn: ['for certification'] },
    ],
    'stockroom-access': [
        { label: 'Prepare Items', variant: 'primary',   visibleOn: ['certified rs'] },
        { label: 'Mark Served',   variant: 'success',   visibleOn: ['certified rs'] },
    ],
    'cashier-access': [
        { label: 'Process Payment', variant: 'success', visibleOn: ['certified rs', 'for certification'] },
        { label: 'Return to Budget', variant: 'danger', visibleOn: ['for certification'] },
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Common actions — shown across all roles regardless of permission.
// Order matters: first 4 render in the toolbar's left group, the rest in the
// right group (see RSProcessModal). `visibleOn: '*'` for now; tighten
// per-status/per-role later as needed.
// ─────────────────────────────────────────────────────────────────────────────
const COMMON_ACTIONS: RoleAction[] = [
    { label: 'View Accounts',       icon: Eye,           variant: 'secondary', visibleOn: '*', confirm: false },
    { label: 'Chat / Messages',     icon: MessageSquare, variant: 'secondary', visibleOn: '*', confirm: false },
    { label: 'RS Process History',  icon: History,       variant: 'secondary', visibleOn: '*', confirm: false },
    { label: 'Reprocess RS',        icon: RefreshCw,     variant: 'secondary', visibleOn: '*' },
    { label: 'Send RS to Staff',    icon: Send,          variant: 'primary',   visibleOn: '*', restrictedTo: ['admin-access'] },
    { label: 'Print RS',            icon: Printer,       variant: 'secondary', visibleOn: '*', confirm: false },
];

/** Always-available cancel action, shown next to the Notes box. */
const CANCEL_ACTION: RoleAction = {
    label: 'Mark as Cancelled', icon: XCircle, variant: 'danger', visibleOn: '*',
};

// ─────────────────────────────────────────────────────────────────────────────
// Status color map — theme-aware so dark/light variants both look correct
// ─────────────────────────────────────────────────────────────────────────────
function getStatusColors(status: string | null, t: Theme, isDark: boolean) {
    if (isDark) {
        const map: Record<string, { bg: string; text: string; border: string }> = {
            'for review':        { bg: `${t.cellAmber}26`, text: t.cellAmber, border: `${t.cellAmber}66` },
            'for certification': { bg: `${t.cellAmber}1a`, text: t.cellAmber, border: `${t.cellAmber}55` },
            'certified rs':      { bg: `${t.cellGreen}26`, text: t.cellGreen, border: `${t.cellGreen}66` },
            'certified':         { bg: `${t.cellGreen}26`, text: t.cellGreen, border: `${t.cellGreen}66` },
            'for pricing':       { bg: `${t.cellAmber}1f`, text: t.cellAmber, border: `${t.cellAmber}59` },
            'disapproved':       { bg: `${t.cellAmber}1a`, text: t.cellAmber, border: `${t.cellAmber}4d` },
            'cancelled':         { bg: `${t.cellMuted}1a`, text: t.cellMuted, border: `${t.cellMuted}4d` },
            'served by wico':    { bg: `${t.cellBlue}26`,  text: t.cellBlue,  border: `${t.cellBlue}66`  },
            'for budget staff':  { bg: `${t.cellBlue}1f`,  text: t.cellBlue,  border: `${t.cellBlue}55`  },
            'for budget director':    { bg: `${t.cellBlue}2e`,  text: t.cellBlue,  border: `${t.cellBlue}66`  },
            'for purchase':      { bg: `${t.cellBlue}1a`,  text: t.cellBlue,  border: `${t.cellBlue}4d`  },
            'po on process':     { bg: `${t.cellBlue}26`,  text: t.cellBlue,  border: `${t.cellBlue}59`  },
            'unserved rs':       { bg: `${t.cellAmber}1a`, text: t.cellAmber, border: `${t.cellAmber}55` },
            'unserved':          { bg: `${t.cellAmber}1a`, text: t.cellAmber, border: `${t.cellAmber}55` },
            'served':            { bg: `${t.cellGreen}1a`, text: t.cellGreen, border: `${t.cellGreen}55` },
        };
        return map[(status ?? '').toLowerCase()] ?? {
            bg: `${t.cellMuted}26`, text: t.cellMuted, border: `${t.cellMuted}59`,
        };
    }

    // Light mode — matches BudgetView reference palette exactly
    const map: Record<string, { bg: string; text: string; border: string }> = {
        'for review':        { bg: 'rgba(253,230,138,0.50)', border: 'rgba(202,138,4,0.40)',   text: '#92400e' },
        'for certification': { bg: 'rgba(253,230,138,0.35)', border: 'rgba(202,138,4,0.28)',   text: '#a16207' },
        'certified rs':      { bg: 'rgba(187,247,208,0.55)', border: 'rgba(4,120,87,0.35)',    text: '#065f46' },
        'certified':         { bg: 'rgba(187,247,208,0.55)', border: 'rgba(4,120,87,0.35)',    text: '#065f46' },
        'for pricing':       { bg: 'rgba(254,215,170,0.55)', border: 'rgba(194,65,12,0.32)',   text: '#9a3412' },
        'disapproved':       { bg: 'rgba(254,226,226,0.65)', border: 'rgba(220,38,38,0.32)',   text: '#991b1b' },
        'cancelled':         { bg: 'rgba(241,245,249,0.85)', border: 'rgba(148,163,184,0.38)', text: '#475569' },
        'served by wico':    { bg: 'rgba(219,234,254,0.75)', border: 'rgba(29,78,216,0.30)',   text: '#1e3a8a' },
        'for budget staff':  { bg: 'rgba(237,233,254,0.70)', border: 'rgba(109,40,217,0.30)',  text: '#5b21b6' },
        'for budget director':    { bg: 'rgba(237,233,254,0.90)', border: 'rgba(109,40,217,0.40)',  text: '#4c1d95' },
        'for purchase':      { bg: 'rgba(207,250,254,0.65)', border: 'rgba(8,145,178,0.30)',   text: '#155e75' },
        'po on process':     { bg: 'rgba(207,250,254,0.85)', border: 'rgba(8,145,178,0.40)',   text: '#0e4f63' },
        'unserved rs':       { bg: 'rgba(253,230,138,0.35)', border: 'rgba(202,138,4,0.28)',   text: '#a16207' },
        'unserved':          { bg: 'rgba(253,230,138,0.35)', border: 'rgba(202,138,4,0.28)',   text: '#a16207' },
        'served':            { bg: 'rgba(187,247,208,0.55)', border: 'rgba(4,120,87,0.35)',    text: '#065f46' },
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

function RoleIcon({ roleKey }: { roleKey: PermissionKey }) {
    const icons: Record<PermissionKey, React.ReactNode> = {
        'budget-access':     <DollarSign  style={{ width: 14, height: 14 }} />,
        'admin-access':      <ShieldCheck style={{ width: 14, height: 14 }} />,
        'logistics-access':  <Truck       style={{ width: 14, height: 14 }} />,
        'accounting-access': <Calculator  style={{ width: 14, height: 14 }} />,
        'stockroom-access':  <Package     style={{ width: 14, height: 14 }} />,
        'cashier-access':    <CreditCard  style={{ width: 14, height: 14 }} />,
    };
    return <>{icons[roleKey]}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirmation copy — per-action phrasing for the confirm modal
// ─────────────────────────────────────────────────────────────────────────────
function getConfirmCopy(action: string): { verb: string; danger: boolean } {
    const map: Record<string, { verb: string; danger?: boolean }> = {
        'Mark as Reviewed':     { verb: 'mark this requisition slip as reviewed' },
        'Mark as Cancelled':    { verb: 'cancel this requisition slip', danger: true },
        'Disapprove':           { verb: 'disapprove this requisition slip', danger: true },
        'Reprocess RS':         { verb: 'send this requisition slip back for reprocessing' },
        'Approve RS':           { verb: 'approve this requisition slip' },
        'Reject RS':            { verb: 'reject this requisition slip', danger: true },
        'Mark Served':          { verb: 'mark this requisition slip as served' },
        'Mark Unserved':        { verb: 'mark this requisition slip as unserved' },
        'Post Entry':           { verb: 'post this entry' },
        'Certify RS':           { verb: 'certify this requisition slip' },
        'Prepare Items':        { verb: 'mark the items as being prepared' },
        'Process Payment':      { verb: 'process payment for this requisition slip' },
        'Return to Budget':     { verb: 'return this requisition slip to the budget office', danger: true },
        'Send RS to Staff':     { verb: 'send this requisition slip to staff' },
        'For Liquidation':      { verb: 'mark this requisition slip for liquidation' },
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
        primary:   { bg: t.btnPrimary.bg,   border: t.btnPrimary.border,   text: t.btnPrimary.text,   hover: t.btnPrimary.hover },
        secondary: { bg: t.btnRefresh.bg,   border: t.btnRefresh.border,   text: t.btnRefresh.text,   hover: t.btnRefresh.hover },
        danger:    { bg: `${t.cellAmber}1f`, border: `${t.cellAmber}66`, text: t.cellAmber, hover: `${t.cellAmber}38` },
        success:   { bg: `${t.cellGreen}1f`, border: `${t.cellGreen}66`, text: t.cellGreen, hover: `${t.cellGreen}38` },
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
    tone?: 'neutral' | 'accent' | 'danger';
}) {
    const palette = {
        neutral: { icon: t.accentColor,    bg: t.dropdownSelected, border: t.cardBorder,             label: t.cellMuted },
        accent:  { icon: t.btnPrimary.text, bg: t.btnPrimary.bg,    border: t.btnPrimary.border,       label: t.accentColor },
        danger:  { icon: t.cellAmber, bg: `${t.cellAmber}1f`, border: `${t.cellAmber}59`, label: t.cellAmber },
    }[tone];

    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, padding: '7px 9px', minWidth: 62,
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
    const [itemsExpanded, setItemsExpanded] = useState(true);
    const [pendingAction, setPendingAction] = useState<RoleAction | null>(null);

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
        if (action.confirm === false) {
            onAction?.(action.label, row);
            return;
        }
        setPendingAction(action);
    }

    function confirmPendingAction() {
        if (pendingAction) onAction?.(pendingAction.label, row);
        setPendingAction(null);
    }

    const statusLower = (row.status ?? '').toLowerCase();
    const statusColors = getStatusColors(row.status, t, isDark);

    const matchesStatus = (a: RoleAction) =>
        a.visibleOn === '*' || a.visibleOn.some(s => s.toLowerCase() === statusLower);

    const matchesRole = (a: RoleAction) =>
        !a.restrictedTo || a.restrictedTo.includes(roleKey);

    // Toolbar (top): common actions, split left/right to match the reference layout
    const leftToolbarActions  = COMMON_ACTIONS.slice(0, 3).filter(a => matchesStatus(a) && matchesRole(a));
    const rightToolbarActions = COMMON_ACTIONS.slice(3).filter(a => matchesStatus(a) && matchesRole(a));

    // Footer (bottom): role-specific transition buttons only
    const roleActions = ROLE_ACTIONS[roleKey] ?? [];
    const visibleRoleActions = roleActions.filter(matchesStatus);

    const cancelVisible = matchesStatus(CANCEL_ACTION);

    // Mock line items if not provided
    const lineItems: RSLineItem[] = row.items ?? [];

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

                {/* ── Toolbar ─────────────────────────────────────────── */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 8, padding: '8px 14px',
                    background: t.cardHeaderBg,
                    borderBottom: `1px solid ${t.cardHeaderBorder}`,
                    flexShrink: 0, flexWrap: 'wrap',
                }}>
                    <div style={{
                        display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center',
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
                                    tone={action.variant === 'primary' ? 'accent' : 'neutral'}
                                    onClick={() => triggerAction(action)}
                                />
                            )
                        ))}
                    </div>
                    <div style={{
                        display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center',
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
                                tone={action.variant === 'primary' ? 'accent' : 'neutral'}
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
                        <button
                            onClick={() => setItemsExpanded(p => !p)}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center',
                                gap: 10, padding: '11px 20px',
                                background: t.cardHeaderBg,
                                border: 'none', cursor: 'pointer',
                                borderBottom: itemsExpanded ? `1px solid ${t.cardHeaderBorder}` : 'none',
                                transition: 'background .12s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(59,130,246,0.06)' : 'rgba(37,99,235,0.04)')}
                            onMouseLeave={e => (e.currentTarget.style.background = t.cardHeaderBg)}
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
                            <div style={{
                                width: 20, height: 20, borderRadius: 5,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                border: `1px solid ${t.cardBorder}`,
                                flexShrink: 0,
                            }}>
                                {itemsExpanded
                                    ? <ChevronUp   style={{ width: 11, height: 11, color: t.cellMuted }} />
                                    : <ChevronDown style={{ width: 11, height: 11, color: t.cellMuted }} />
                                }
                            </div>
                        </button>

                        {/* Items table */}
                        {itemsExpanded && (
                            <div style={{ overflowX: 'auto' }}>
                                {lineItems.length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                                        <thead>
                                            <tr style={{ background: t.tableHeadBg }}>
                                                {['Account Code', 'Description', 'Qty', 'UOM', 'Unit Cost', 'Total Cost'].map((col, i, arr) => (
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
                                            {lineItems.map((item, idx) => (
                                                <tr
                                                    key={idx}
                                                    style={{ background: idx % 2 === 0 ? t.rowEvenBg : t.rowOddBg }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = t.rowHoverBg)}
                                                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? t.rowEvenBg : t.rowOddBg)}
                                                >
                                                    {[
                                                        { v: item.account_code,                     align: 'left'  as const, muted: false, mono: true  },
                                                        { v: item.description,                      align: 'left'  as const, muted: false, mono: false },
                                                        { v: item.quantity,                         align: 'right' as const, muted: false, mono: true  },
                                                        { v: item.unit_of_measurement || '—',       align: 'right' as const, muted: true,  mono: false },
                                                        { v: formatAmount(item.unit_cost),          align: 'right' as const, muted: false, mono: true  },
                                                        { v: formatAmount(item.total_cost),         align: 'right' as const, muted: false, mono: true  },
                                                    ].map((cell, ci, arr) => (
                                                        <td key={ci} style={{
                                                            padding: '10px 14px',
                                                            fontSize: 12,
                                                            color: cell.muted ? t.cellMuted : t.cellText,
                                                            fontVariantNumeric: cell.mono ? 'tabular-nums' : undefined,
                                                            borderBottom: `1px solid ${t.rowBorder}`,
                                                            borderRight: ci < arr.length - 1 ? `1px solid ${t.rowBorder}` : 'none',
                                                            textAlign: cell.align,
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            {cell.v}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
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
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: t.labelColor }}>
                            Notes
                        </span>
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
                            justifyContent: 'center', gap: 6, padding: '16px 20px',
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
                        </div>
                        {statusLower === 'for review' ? (
                            <button
                                onClick={() => triggerAction({ label: 'For Liquidation', variant: 'primary', visibleOn: '*' })}
                                style={{
                                    padding: '9px 20px', textAlign: 'center',
                                    background: statusColors.bg,
                                    border: 'none',
                                    borderTop: `1px solid ${statusColors.border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    width: '100%', cursor: 'pointer',
                                    transition: 'filter .14s ease',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
                                onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
                            >
                                <span style={{
                                    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                                    background: statusColors.text, flexShrink: 0,
                                }} />
                                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: statusColors.text }}>
                                    For Liquidation
                                </span>
                            </button>
                        ) : (
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
                        )}
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
            </div>
        </div>

        {/* ── Confirmation modal — shown before any onAction actually fires ── */}
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
        idleBg:      isDark ? 'rgba(147,197,253,0.10)' : 'rgba(219,234,254,0.55)',
        idleBorder:  isDark ? 'rgba(147,197,253,0.30)' : 'rgba(96,165,250,0.40)',
        idleText:    isDark ? '#93c5fd' : '#2563eb',
        hoverBg:     isDark ? 'rgba(147,197,253,0.20)' : 'rgba(191,219,254,0.80)',
        hoverBorder: isDark ? 'rgba(147,197,253,0.50)' : 'rgba(59,130,246,0.55)',
        activeBg:    isDark ? 'rgba(59,130,246,0.28)' : 'rgba(191,219,254,0.95)',
        activeBorder:isDark ? 'rgba(96,165,250,0.65)' : 'rgba(37,99,235,0.55)',
        activeText:  isDark ? '#60a5fa' : '#1d4ed8',
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