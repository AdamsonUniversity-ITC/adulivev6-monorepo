import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, X, Printer } from 'lucide-react';
import { financeSvc } from '@repo/axios-config';
import React from 'react';

interface ReviewSheetButtonProps {
    /** Optional inline style override so the button can match the caller's theme tokens. */
    ghostBtnStyle?: React.CSSProperties;
    ghostBtnHoverBg?: string;
    ghostBtnBg?: string;
    label?: string;
    current_school_year?: string;
    kind?: 'Department' | 'Section';
    unitid?: string | number;
}

interface AccountHeader {
    sub_account_id: number;
    total_cost: number;
    approved_total_cost: number | null;
    released: number | null;
    balance: number | null;
    account_id: number;
    account_parent_id: number;
    account_code: string;
    account_name: string;
    SAP_account_no_acad: string | null;
    SAP_account_no_non_acad: string | null;
    is_consolidated_acct: number;
    is_qty_check: number;
    account_group: string;
    budget_proposal_entry_id: number;
    user_id: number;
    department_id: number | null;
    section_id: number | null;
    school_year: string;
    bpe_total_cost: number;
    bpe_approved_total_cost: number;
}

interface ProposalEntryItem {
    id: number;
    sub_account_id: number;
    description: string;
    unit_cost: number;
    unit_measurement: string;
    quantity: number;
    total_cost: number;
    approved_total_cost: number | null;
    remarks: string | null;
    status: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}
interface ParentAccounts {
    id: number;
    account_code: string;
    account_name: string;
}

interface Adjustments {
    adjustment_id: number;
    additional: number | null;
    deduction: number | null;
    school_year: string;
    sub_account_approved_total_cost: number | null;
    sub_account_id: number;
}

interface ReviewSheet {
    accountheader: AccountHeader[];
    proposalentryitems: ProposalEntryItem[];
    office: string;
    username: string;
    fullname: string;
    parentaccounts: ParentAccounts[];
    adjustments: Adjustments[];
}

const EMPTY_REVIEW_SHEET: ReviewSheet = {
    accountheader: [],
    proposalentryitems: [],
    office: '',
    username: '',
    fullname: '',
    parentaccounts: [],
    adjustments: [],
};




export default function ReviewSheetButton({
    ghostBtnStyle,
    ghostBtnHoverBg,
    ghostBtnBg,
    label = 'Review Sheet',
    current_school_year,
    kind,
    unitid,
}: ReviewSheetButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [reviewSheet, setReviewSheet] = useState<ReviewSheet>(EMPTY_REVIEW_SHEET);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const handleReviewSheet = async () => {
        if (!kind || unitid == null || !current_school_year) return;

        setIsOpen(true);
        setIsLoading(true);
        setLoadError(null);
        setReviewSheet(EMPTY_REVIEW_SHEET);
        try {
            const payload: Record<string, string | number> = {
                kind,
                current_school_year
            };
            if (kind === 'Department') {
                payload.department_id = unitid;
            } else {
                payload.section_id = unitid;
            }
            const { data } = await financeSvc.post('/abms/budget-review/review-sheet', payload);
            setReviewSheet(data);
        }
        catch {
            setLoadError('The review sheet could not be loaded. Please close this window and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={handleReviewSheet}
                disabled={isLoading || !kind || unitid == null || !current_school_year}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold self-end transition-all duration-150"
                style={ghostBtnStyle}
                onMouseEnter={e => {
                    if (ghostBtnHoverBg) (e.currentTarget as HTMLElement).style.background = ghostBtnHoverBg;
                }}
                onMouseLeave={e => {
                    if (ghostBtnBg) (e.currentTarget as HTMLElement).style.background = ghostBtnBg;
                }}
            >
                <FileText className="w-3.5 h-3.5" />
                {label}
            </button>

            {isOpen &&
                <ReviewSheetOverlay
                    onClose={() => setIsOpen(false)}
                    reviewsheet={reviewSheet}
                    currentschoolyear={current_school_year}
                    isLoading={isLoading}
                    loadError={loadError}
                />}
        </>
    );
}

interface ReviewSheetOverlayProps {
    onClose: () => void;
    reviewsheet: ReviewSheet;
    currentschoolyear?: string;
    isLoading: boolean;
    loadError: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Overlay + printable sheet
// ─────────────────────────────────────────────────────────────────────────────

function ReviewSheetOverlay({
    onClose,
    reviewsheet,
    currentschoolyear,
    isLoading,
    loadError,
}: ReviewSheetOverlayProps) {
    return createPortal(
        <div
            className="review-sheet-overlay"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10000,
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                overflowY: 'auto',
                padding: '40px 20px',
            }}
            onClick={onClose}
        >
            {/* Non-printable toolbar */}
            <div
                className="review-sheet-toolbar"
                style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    display: 'flex',
                    gap: '10px',
                    zIndex: 10001,
                }}
            >
                <button
                    onClick={e => {
                        e.stopPropagation();
                        window.print();
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold"
                    style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 2px 12px rgba(37, 99, 235, 0.4)',
                    }}
                >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                </button>
                <button
                    onClick={e => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="flex items-center justify-center w-9 h-9 rounded-lg"
                    style={{
                        background: 'rgba(15, 23, 42, 0.9)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.2)',
                    }}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Printable page */}
            <div
                className="review-sheet-page"
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#ffffff',
                    color: '#0f172a',
                    width: '8.5in',
                    minHeight: '11in',
                    padding: '0.75in',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
                    borderRadius: '4px',
                }}
            >
                <ReviewSheetContent
                    reviewsheet={reviewsheet}
                    currentschoolyear={currentschoolyear}
                    isLoading={isLoading}
                    loadError={loadError}
                />
            </div>

            {/* Print-only styles: hide everything except the sheet when printing */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .review-sheet-page, .review-sheet-page * {
                        visibility: visible;
                    }
                    .review-sheet-toolbar {
                        display: none !important;
                    }
                    .review-sheet-overlay {
                        position: static !important;
                        background: none !important;
                        backdrop-filter: none !important;
                        padding: 0 !important;
                        display: block !important;
                    }
                    .review-sheet-page {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        min-height: auto;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }
                }
            `}</style>
        </div>,
        document.body
    );
}



const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const money = (value: number | string | null | undefined) => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
};

interface ReviewSheetContentProps {
    reviewsheet: ReviewSheet;
    currentschoolyear?: string;
    isLoading: boolean;
    loadError: string | null;
}

function ReviewSheetContent({
    reviewsheet,
    currentschoolyear,
    isLoading,
    loadError,
}: ReviewSheetContentProps) {
    const now = new Date();
    const printDate = now.toLocaleDateString('en-US');
    const printTime = now.toLocaleTimeString('en-US');

    if (isLoading) {
        return (
            <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
                Loading review sheet…
            </div>
        );
    }

    if (loadError) {
        return (
            <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'Arial, sans-serif', color: '#b91c1c' }}>
                {loadError}
            </div>
        );
    }

    const adjustmentTotals = reviewsheet.adjustments.reduce((totals, adjustment) => {
        if (currentschoolyear && adjustment.school_year !== currentschoolyear) return totals;

        const subAccountId = Number(adjustment.sub_account_id);
        const current = totals.get(subAccountId) ?? { additional: 0, deduction: 0, approved: null };
        current.additional += money(adjustment.additional);
        current.deduction += money(adjustment.deduction);
        if (current.approved == null && adjustment.sub_account_approved_total_cost != null) {
            current.approved = money(adjustment.sub_account_approved_total_cost);
        }
        totals.set(subAccountId, current);
        return totals;
    }, new Map<number, { additional: number; deduction: number; approved: number | null }>());

    const capexAccounts = reviewsheet.parentaccounts.filter(account => Number(account.id) === 355);
    const nonCapexAccounts = reviewsheet.parentaccounts.filter(account => Number(account.id) !== 355);

    const renderCategory = (label: 'CAPEX' | 'NON-CAPEX', parentAccounts: ParentAccounts[]) => {
        if (parentAccounts.length === 0) return null;

        return (
            <section style={{ marginBottom: '18px' }}>
                <div
                    style={{
                        fontWeight: 800,
                        fontSize: '13px',
                        textDecoration: 'underline',
                        borderBottom: '2px solid #0f172a',
                        paddingBottom: '4px',
                        marginBottom: '14px',
                    }}
                >
                    {label}
                </div>

                {parentAccounts.map(acct => (
                    <div key={acct.id} style={{ marginBottom: '22px' }}>
                        <div style={{ fontWeight: 800, fontSize: '13px', textDecoration: 'underline', marginBottom: '2px' }}>
                            {acct.account_code} {acct.account_name}
                        </div>

                        {reviewsheet.accountheader
                            .filter(subacc => Number(subacc.account_parent_id) === Number(acct.id))
                            .map(subacc => {
                                // Adjustment entries reference the child accounts.id, while
                                // accountheader.sub_account_id is the budget sub_accounts row ID.
                                // accountheader.account_id is the shared identifier between them.
                                const adjustments = adjustmentTotals.get(Number(subacc.account_id));
                                const approved = subacc.approved_total_cost != null
                                    ? money(subacc.approved_total_cost)
                                    : (adjustments?.approved ?? 0);

                                return (
                                    <React.Fragment key={subacc.sub_account_id}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                borderTop: '1px solid #94a3b8',
                                                paddingTop: '4px',
                                                marginLeft: '18px',
                                                marginTop: '16px',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                                                <div style={{ fontWeight: 900, marginBottom: '4px' }}>
                                                    {subacc.account_code} {subacc.account_name}
                                                </div>
                                                <div>
                                                    <div style={{ color: '#334155' }}>Current Budget Performance:</div>
                                                    <div style={{ fontWeight: 700 }}>{subacc.school_year}</div>
                                                </div>
                                            </div>

                                            <div style={{ textAlign: 'right', minWidth: '160px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                                                    <span style={{ color: '#334155' }}>Approved:</span>
                                                    <span style={{ fontWeight: 700 }}>{fmt(approved)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                                                    <span style={{ color: '#334155' }}>Additional:</span>
                                                    <span style={{ fontWeight: 700 }}>{fmt(adjustments?.additional ?? 0)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                                                    <span style={{ color: '#334155' }}>Deduction:</span>
                                                    <span style={{ fontWeight: 700 }}>{fmt(adjustments?.deduction ?? 0)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 100px 80px 140px',
                                                borderTop: '1px solid #94a3b8',
                                                paddingTop: '4px',
                                                marginTop: '8px',
                                                fontWeight: 750,
                                            }}
                                        >
                                            <div style={{ color: '#334155' }}>Proposed Items</div>
                                            <div style={{ textAlign: 'right' }}>Unit Cost</div>
                                            <div style={{ textAlign: 'right' }}>Quantity</div>
                                            <div style={{ textAlign: 'right' }}>Unit of Measurement</div>
                                        </div>

                                        {reviewsheet.proposalentryitems
                                            .filter(item => Number(item.sub_account_id) === Number(subacc.sub_account_id))
                                            .map(item => (
                                                <div
                                                    key={item.id}
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr 100px 80px 140px',
                                                        borderTop: '1px solid #cbd5e1',
                                                        paddingTop: '2px',
                                                    }}
                                                >
                                                    <div>{item.description}</div>
                                                    <div style={{ textAlign: 'right' }}>{fmt(money(item.unit_cost))}</div>
                                                    <div style={{ textAlign: 'right' }}>{item.quantity}</div>
                                                    <div style={{ textAlign: 'right' }}>{item.unit_measurement}</div>
                                                </div>
                                            ))}

                                        <div style={{ textAlign: 'right', marginTop: '4px' }}>
                                            <span style={{ color: '#334155' }}>SUB ACCT TOTAL: </span>
                                            <span style={{ fontWeight: 700 }}>{fmt(money(subacc.total_cost))}</span>
                                        </div>
                                    </React.Fragment>
                                );
                            })}

                        <div style={{ textAlign: 'right', marginTop: '10px', fontWeight: 800 }}>
                            <span>MAIN ACCT TOTAL: </span>
                            <span>{fmt(
                                reviewsheet.accountheader
                                    .filter(subacc => Number(subacc.account_parent_id) === Number(acct.id))
                                    .reduce((sum, subacc) => sum + money(subacc.total_cost), 0)
                            )}</span>
                        </div>
                    </div>
                ))}
            </section>
        );
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#0f172a' }}>
            {/* ── Header ── */}
            <div style={{ marginBottom: '18px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.02em', margin: 0 }}>
                    ADAMSON UNIVERSITY
                </h1>
                <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
                    BUDGET PROPOSAL REVIEW SHEET
                </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ color: '#475569' }}>School Year:</span>
                    <span style={{ fontWeight: 700 }}>{currentschoolyear ?? '—'}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#475569' }}>Office/Department:</span>
                    <span style={{ fontWeight: 700 }}>{reviewsheet.office}</span>
                </div>
            </div>

            {renderCategory('NON-CAPEX', nonCapexAccounts)}
            {renderCategory('CAPEX', capexAccounts)}

            {/* ── Footer ── */}
            <div
                style={{
                    borderTop: '2px solid #0f172a',
                    marginTop: '10px',
                    paddingTop: '6px',
                    fontSize: '10px',
                    color: '#334155',
                }}
            >
                =-xXx-= | Source: ABMS | Print Date: {printDate} | Time: {printTime} | Printed By: {reviewsheet.fullname}
            </div>
        </div>
    );
}
