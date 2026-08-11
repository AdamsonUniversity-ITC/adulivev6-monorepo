import React from 'react';
import { X, Wallet } from 'lucide-react';
import { Theme } from '../types.ts';
import { formatAccountCode } from '../../../shared/accountCode';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface AccountRow {
    account_id: number;
    account_parent_id: number;
    account_code: string;
    main_account_code?: string | null;
    account_name: string;
    balance: number | string | null;
    data_quality_warning?: string | null;
}

interface AccountsViewModalProps {
    t: Theme;
    isDark: boolean;
    departmentSectionName: string;
    accounts: AccountRow[];
    isLoading?: boolean;
    error?: string | null;
    onClose: () => void;
}

function formatAmount(amount: number | string) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
    }).format(Number(amount));
}

export function AccountsViewModal({
    t, departmentSectionName, accounts, isLoading = false, error = null, onClose,
}: AccountsViewModalProps) {
    return (
        <div
            className="abms-modal-backdrop"
            style={{
                position: 'fixed', inset: 0, zIndex: 70,
                background: 'rgba(0,0,0,0.60)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px 16px',
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: t.cardBg,
                border: `1px solid ${t.cardBorder}`,
                boxShadow: t.cardShadow,
                borderRadius: 14,
                width: '100%',
                maxWidth: 640,
                maxHeight: 'calc(100dvh - 24px)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* ── Header ──────────────────────────────────────────── */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 8, padding: '14px 20px',
                    background: t.cardHeaderBg,
                    borderBottom: `1px solid ${t.cardHeaderBorder}`,
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <Wallet style={{ width: 16, height: 16, color: t.accentColor, flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                            <span style={{
                                fontSize: 13, fontWeight: 700, color: t.cellText,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                Accounts — {departmentSectionName}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.labelColor }}>
                                Read-only
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, borderRadius: 8,
                            border: `1px solid ${t.cardBorder}`,
                            background: 'transparent', color: t.cellMuted,
                            cursor: 'pointer', flexShrink: 0,
                        }}
                    >
                        <X style={{ width: 14, height: 14 }} />
                    </button>
                </div>

                {/* ── Body ────────────────────────────────────────────── */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {isLoading && (
                        <div style={{ padding: '52px 16px', textAlign: 'center', fontSize: 13, color: t.cellMuted }}>
                            Loading accounts…
                        </div>
                    )}

                    {!isLoading && error && (
                        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                            <span style={{
                                fontSize: 13, color: t.cellAmber, fontWeight: 600,
                                background: `${t.cellAmber}1a`, border: `1px solid ${t.cellAmber}4d`,
                                borderRadius: 8, padding: '8px 18px', display: 'inline-block',
                            }}>
                                {error}
                            </span>
                        </div>
                    )}

                    {!isLoading && !error && accounts.length === 0 && (
                        <div style={{ padding: '52px 16px', textAlign: 'center', fontSize: 13, color: t.cellMuted }}>
                            No accounts found for this department/section.
                        </div>
                    )}

                    {!isLoading && !error && accounts.length > 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: t.tableHeadBg }}>
                                    <th style={{
                                        padding: '10px 16px', fontSize: 11, fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: '0.07em',
                                        color: t.tableHeadText,
                                        borderBottom: `2px solid ${t.tableHeadBorder}`,
                                        textAlign: 'left', whiteSpace: 'nowrap',
                                    }}>
                                        Account Code
                                    </th>
                                    <th style={{
                                        padding: '10px 16px', fontSize: 11, fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: '0.07em',
                                        color: t.tableHeadText,
                                        borderBottom: `2px solid ${t.tableHeadBorder}`,
                                        textAlign: 'left', whiteSpace: 'nowrap',
                                    }}>
                                        Account Name
                                    </th>
                                    <th style={{
                                        padding: '10px 16px', fontSize: 11, fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: '0.07em',
                                        color: t.tableHeadText,
                                        borderBottom: `2px solid ${t.tableHeadBorder}`,
                                        textAlign: 'right', whiteSpace: 'nowrap',
                                    }}>
                                        Balance
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((acc, idx) => (
                                    <tr
                                        key={acc.account_id}
                                        style={{
                                            background: idx % 2 === 0
                                                ? t.rowEvenBg
                                                : t.rowOddBg,
                                        }}
                                    >
                                        <td style={{
                                            padding: '10px 16px', fontSize: 13, color: t.cellBlue,
                                            fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                                            borderBottom: `1px solid ${t.rowBorder}`,
                                        }}>
                                            {formatAccountCode(acc.main_account_code, acc.account_code)}
                                        </td>
                                        <td style={{
                                            padding: '10px 16px', fontSize: 13, color: t.cellText,
                                            borderBottom: `1px solid ${t.rowBorder}`,
                                        }}>
                                            {acc.account_name}
                                        </td>
                                        <td style={{
                                            padding: '10px 16px', fontSize: 13, color: t.cellText,
                                            fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                                            textAlign: 'right',
                                            borderBottom: `1px solid ${t.rowBorder}`,
                                        }}>
                                            {acc.balance === null
                                                ? <span title={acc.data_quality_warning ?? undefined} style={{ color: t.cellAmber }}>Unavailable</span>
                                                : formatAmount(acc.balance)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
