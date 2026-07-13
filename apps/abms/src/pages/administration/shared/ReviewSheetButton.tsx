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
    kind?: string;
    unitid?: number;
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
    adjusment_id: number;
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
    const [reviewSheet, setReviewSheet] = useState<ReviewSheet>({
        accountheader: [],
        proposalentryitems: [],
        office: '',
        username: '',
        fullname: '',
        parentaccounts: [],
        adjustments: [],
    });

    const handleReviewSheet = async () => {
        setIsOpen(true);
        try {
            const payload: Record<string, string> = {
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
        catch (err) {
            console.log('error loading');
        } finally {
            console.log('done loading');
        }
    }

    return (
        <>
            <button
                onClick={handleReviewSheet}
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
                />}
        </>
    );
}

interface ReviewSheetOverlayProps {
    onClose: () => void;
    reviewsheet: ReviewSheet;
}

// ─────────────────────────────────────────────────────────────────────────────
// Overlay + printable sheet
// ─────────────────────────────────────────────────────────────────────────────

function ReviewSheetOverlay({
    onClose,
    reviewsheet,
    currentschoolyear
}: ReviewSheetOverlayProps) {
    console.log(reviewsheet)
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



interface ProposedItem {
    name: string;
    unitCost: number;
    quantity: number;
    unit: string;
}

interface SubAccount {
    code: string;
    name: string;
    label: string; // e.g. "[5] OFFICE"
    schoolYear: string;
    approved: number;
    additional: number;
    deduction: number;
    items: ProposedItem[];
    subAcctTotal?: number;
    mainAcctTotal?: number;
}

const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SUB_ACCOUNTS: SubAccount[] = [
    {
        code: '[954]',
        name: 'SUPPLIES OFFICE & LAB',
        label: '[5] OFFICE',
        schoolYear: '2025-2026',
        approved: 40000,
        additional: 14360,
        deduction: 0,
        items: [{ name: 'OFFICE SUPPLIES', unitCost: 70000, quantity: 1, unit: 'PHP' }],
    },
    {
        code: '[955]',
        name: 'POSTAGE, TELEGRAPH',
        label: '[1] POSTAGE',
        schoolYear: '2025-2026',
        approved: 50000,
        additional: 0,
        deduction: 0,
        items: [{ name: 'POSTAGE', unitCost: 25000, quantity: 1, unit: 'PHP' }],
    },
    {
        code: '[956]',
        name: 'TELEPHONE',
        label: '[1] CELLPHONE',
        schoolYear: '2025-2026',
        approved: 40000,
        additional: 0,
        deduction: 0,
        items: [{ name: 'CELLPHONE FOR OFFICE', unitCost: 40000, quantity: 1, unit: 'PHP' }],
    },
    {
        code: '[960]',
        name: 'PERMITS, TAXES & LIC.',
        label: '[2] PERMITS, TAXES & LICENSES',
        schoolYear: '2025-2026',
        approved: 100000,
        additional: 0,
        deduction: 0,
        items: [{ name: 'PERMITS, TAXES & LICENSES', unitCost: 200000, quantity: 1, unit: 'PHP' }],
    },
];

interface ReviewSheetContentProps {
    reviewsheet: ReviewSheet;
    currentschoolyear: string;
}

function ReviewSheetContent({
    reviewsheet,
    currentschoolyear,
}: ReviewSheetContentProps) {
    console.log(reviewsheet);
    console.log(currentschoolyear);
    const now = new Date();
    const printDate = now.toLocaleDateString('en-US');
    const printTime = now.toLocaleTimeString('en-US');
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
                    <span style={{ fontWeight: 700 }}>{currentschoolyear}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#475569' }}>Office/Department:</span>
                    <span style={{ fontWeight: 700 }}>{reviewsheet.office}</span>
                </div>
            </div>

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
                NON-CAPEX
            </div>

            {/* ── Sub-account blocks ── */}

            {reviewsheet.parentaccounts.map((acct, idx) => {
                // const subtotalCost = reviewsheet.accountheader.reduce(
                //     (sum, acct) => sum + (acct.balance ?? 0),
                //     0
                // );
                return (
                    <div key={acct.id} style={{ marginBottom: '22px' }}>
                        {/* Main account header */}
                        <div style={{ fontWeight: 800, fontSize: '13px', textDecoration: 'underline', marginBottom: '2px' }}>
                            {acct.account_code} {acct.account_name}
                        </div>
                        {reviewsheet.accountheader
                            .filter((subacc) => subacc.account_parent_id === acct.id)
                            .map((subacc) => {
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
                                                    <span style={{ fontWeight: 700 }}>{fmt(10000)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                                                    <span style={{ color: '#334155' }}>Additional:</span>
                                                    <span style={{ fontWeight: 700 }}>{fmt(10000)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                                                    <span style={{ color: '#334155' }}>Deduction:</span>
                                                    <span style={{ fontWeight: 700 }}>{fmt(10000)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Proposed items table */}
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
                                            .filter((items) => items.sub_account_id === subacc.sub_account_id)
                                            .map((items) => (
                                                <div
                                                    key={items.id}
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr 100px 80px 140px',
                                                        borderTop: '1px solid #cbd5e1',
                                                        paddingTop: '2px',
                                                    }}
                                                >
                                                    <div>{items.description}</div>
                                                    <div style={{ textAlign: 'right' }}>{fmt(items.unit_cost)}</div>
                                                    <div style={{ textAlign: 'right' }}>{items.quantity}</div>
                                                    <div style={{ textAlign: 'right' }}>{items.unit_measurement}</div>
                                                </div>
                                            ))}
                                        <div style={{ textAlign: 'right', marginTop: '4px' }}>
                                            <span style={{ color: '#334155' }}>SUB ACCT TOTAL: </span>
                                            <span style={{ fontWeight: 700 }}>{fmt(subacc.total_cost ?? 0)}</span>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        {/* Totals */}
                        <div style={{ textAlign: 'right', marginTop: '10px' }}>
                            {/* <div>
                                <span style={{ color: '#334155' }}>SUB ACCT TOTAL: </span>
                                <span style={{ fontWeight: 700 }}>{10000}</span>
                            </div> */}
                            {idx < reviewsheet.parentaccounts.length - 1 && (
                                <div style={{ fontWeight: 800, marginTop: '2px' }}>
                                    <span>MAIN ACCT TOTAL: </span>
                                    <span>{fmt(
                                        reviewsheet.accountheader
                                            .filter((subacc) => subacc.account_parent_id === acct.id)
                                            .reduce((sum, subacc) => sum + (subacc.total_cost ?? 0), 0)
                                    )}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

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