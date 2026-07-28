import React, { useCallback, useRef, useState } from 'react';
import { Lock, RefreshCw } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import AdamsonBudgetLayout from '../../../layouts/Screenlayout';
import { PageHeader } from '../../../components/ui/Page';
import { liquidationsubmissionRoute } from '../../../router';
import { T } from './theme';
import type { DeptOption, LiquidationRecord, ToastItem, ToastKind } from './types';
import { fmt } from './api';
import { Checkbox, DeptDropdown, StatusBadge, Toasts } from './components/common';
import { LiquidationUploadModal } from './components/LiquidationUploadModal';

function LiquidationSubmissionInner({ t, isDark }: { t: typeof T.dark; isDark: boolean }) {
    const { data } = liquidationsubmissionRoute.useLoaderData();

    const isAdmin: boolean = (data?.data?.isadmin ?? 0) === 1;

    const deptOptions: DeptOption[] = [
        ...(data?.data?.department ?? []),
        ...(data?.data?.sections ?? []),
    ];

    const [selectedDeptId, setSelectedDeptId] = useState('');
    const [selectedDeptKind, setSelectedDeptKind] = useState<'Department' | 'Section' | ''>('');
    const [ascending, setAscending] = useState(false);
    const [descending, setDescending] = useState(true);

    const [records, setRecords] = useState<LiquidationRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [queried, setQueried] = useState(false);

    const [selectedRow, setSelectedRow] = useState<LiquidationRecord | null>(null);

    function handleRowUpdate(updated: Partial<LiquidationRecord>) {
        if (!selectedRow) return;
        const merged = { ...selectedRow, ...updated };
        // When approved, the entry's for_liquidation becomes 0 — remove it from the table
        if (merged.is_approve === 1 || merged.for_liquidation === false) {
            setRecords(prev => prev.filter(r => r.id !== merged.id));
            return;
        }
        setSelectedRow(merged);
        setRecords(prev => prev.map(r => r.id === merged.id ? merged : r));
    }

    // ── Toasts ───────────────────────────────────────────────────────────────
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const toastCounter = useRef(0);
    const addToast = useCallback((kind: ToastKind, title: string, description?: string) => {
        const id = ++toastCounter.current;
        setToasts(prev => [...prev, { id, kind, title, description }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    function openLiquidationModal(row: LiquidationRecord) {
        setSelectedRow(row);
    }

    function handleDeptChange(id: string, kind: 'Department' | 'Section' | '') {
        setSelectedDeptId(id);
        setSelectedDeptKind(kind);
    }

    function handleAscending(v: boolean) {
        setAscending(v);
        if (v) setDescending(false);
    }
    function handleDescending(v: boolean) {
        setDescending(v);
        if (v) setAscending(false);
    }

    const fetchRecords = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, string> = {
                sortDir: ascending ? 'asc' : 'desc',
            };
            if (selectedDeptId && selectedDeptKind) {
                params.department = selectedDeptId;
                params.kind = selectedDeptKind;
            }
            const res = await financeSvc.get('abms/liquidation-submission/rs', { params });
            const rows = res.data.data ?? [];
            setRecords(rows);
            setQueried(true);
            addToast('success', 'Records loaded',
                rows.length === 0
                    ? 'No liquidation records found.'
                    : `${rows.length} record${rows.length !== 1 ? 's' : ''} retrieved.`,
            );
        } catch (err) {
            console.error('Failed to fetch liquidation records:', err);
            addToast('error', 'Failed to load records', 'Could not retrieve liquidation records. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedDeptId, selectedDeptKind, ascending, addToast]);

    const TABLE_COLS = [
        'Date', 'Requisition No.', 'Department / Section',
        'Requested By', 'Total Amount', 'Status', 'Location', 'From',
    ];

    return (
        <>
            <Toasts items={toasts} isDark={isDark} onDismiss={id => setToasts(p => p.filter(t => t.id !== id))} />
            <div className="space-y-5">
            <PageHeader title="Liquidation Submission" description="View and manage liquidation records." />

            <div
                className="rounded-2xl overflow-hidden"
                style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}
            >
                {/* ── Filter Section ── */}
                <div
                    className="grid grid-cols-1 items-center gap-4 px-4 py-3 lg:grid-cols-[minmax(240px,1fr)_minmax(220px,1fr)_auto] lg:px-6"
                    style={{ borderBottom: `1px solid ${t.sectionDivider}` }}
                >
                    <div className="min-w-0 w-full">
                        <DeptDropdown
                            value={selectedDeptId}
                            onChange={handleDeptChange}
                            options={deptOptions}
                            t={t}
                            isDark={isDark}
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-start gap-4 lg:justify-center">
                        <Checkbox checked={ascending} onChange={handleAscending} label="Ascending" t={t} isDark={isDark} />
                        <Checkbox checked={descending} onChange={handleDescending} label="Descending" t={t} isDark={isDark} />
                    </div>

                    <button
                        onClick={fetchRecords}
                        disabled={isLoading}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold transition-all duration-150 select-none sm:w-auto"
                        style={{
                            background: isLoading ? t.btnDisBg : t.btnRefresh.bg,
                            borderColor: isLoading ? t.btnDisBorder : t.btnRefresh.border,
                            color: isLoading ? t.btnDisText : t.btnRefresh.text,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                        }}
                        onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = t.btnRefresh.hover; }}
                        onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = isLoading ? t.btnDisBg : t.btnRefresh.bg; }}
                    >
                        <RefreshCw className={`w-3.5 h-3.5${isLoading ? ' animate-spin' : ''}`} />
                        {isLoading ? 'Loading…' : 'Requery'}
                    </button>
                </div>

                {/* ── Table ── */}
                <div style={{ overflowX: 'auto' }}>
                    <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 900 }}>
                        <thead>
                            <tr style={{ background: t.tableHeadBg }}>
                                {TABLE_COLS.map((col, i) => (
                                    <th
                                        key={col}
                                        style={{
                                            padding: '11px 16px',
                                            fontSize: 11, fontWeight: 700,
                                            textTransform: 'uppercase', letterSpacing: '0.08em',
                                            color: t.tableHeadText,
                                            borderBottom: `2px solid ${t.tableHeadBorder}`,
                                            borderRight: i < TABLE_COLS.length - 1 ? `1px solid ${t.tableHeadBorder}` : 'none',
                                            textAlign: 'left', whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length} style={{ padding: '52px 16px', textAlign: 'center', fontSize: 13, color: t.cellMuted }}>
                                        Loading records…
                                    </td>
                                </tr>
                            ) : !queried ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length} style={{ padding: '52px 16px', textAlign: 'center', fontSize: 13, color: t.cellMuted }}>
                                        Set your filters and press <strong>Requery</strong> to load records.
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length} style={{ padding: '52px 16px', textAlign: 'center', fontSize: 13, color: t.cellMuted }}>
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                records.map((row, idx) => {
                                    const baseBg = idx % 2 === 0 ? t.rowEvenBg : 'transparent';
                                    const cs = (i: number): React.CSSProperties => ({
                                        padding: '11px 16px', fontSize: 13, color: t.cellText,
                                        borderBottom: `1px solid ${t.rowBorder}`,
                                        borderRight: i < TABLE_COLS.length - 1 ? `1px solid ${t.rowBorder}` : 'none',
                                        whiteSpace: 'nowrap',
                                    });
                                    return (
                                        <tr
                                            key={row.id}
                                            onClick={() => void openLiquidationModal(row)}
                                            style={{ background: baseBg, transition: 'background .1s', cursor: 'pointer' }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.rowHoverBg; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = baseBg; }}
                                        >
                                            {/* Date */}
                                            <td style={cs(0)}>
                                                <span style={{ fontSize: 12, color: t.cellMuted, fontVariantNumeric: 'tabular-nums' }}>
                                                    {row.date ? new Date(row.date).toLocaleDateString('en-PH') : '—'}
                                                </span>
                                            </td>
                                            {/* Requisition No. */}
                                            <td style={cs(1)}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.03em', color: t.cellBlue }}>
                                                        {row.requisition_no}
                                                    </span>
                                                    {row.is_approve !== 0 && (
                                                        <Lock style={{ width: 11, height: 11, color: t.cellMuted }} title="Approved — submission locked" />
                                                    )}
                                                </div>
                                            </td>
                                            {/* Department / Section */}
                                            <td style={{ ...cs(2), whiteSpace: 'normal' }}>{row.department_section}</td>
                                            {/* Requested By */}
                                            <td style={{ ...cs(3), whiteSpace: 'normal' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <img
                                                        src={`https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${row.requested_by_empno}_2`}
                                                        alt={row.requested_by}
                                                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `1px solid ${t.rowBorder}` }}
                                                        onError={e => {
                                                            (e.currentTarget as HTMLImageElement).src =
                                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(row.requested_by)}&size=32&background=random`;
                                                        }}
                                                    />
                                                    <span style={{ fontSize: 13, color: t.cellText, fontWeight: 500 }}>{row.requested_by}</span>
                                                </div>
                                            </td>
                                            {/* Total Amount */}
                                            <td style={{ ...cs(4), fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                                                ₱ {fmt(row.total_amount)}
                                            </td>
                                            {/* Status */}
                                            <td style={cs(5)}>
                                                <StatusBadge status={row.status} isDark={isDark} />
                                            </td>
                                            {/* Location */}
                                            <td style={cs(6)}>
                                                <span style={{ color: t.cellMuted, textTransform: 'uppercase' }}>{row.location ?? '—'}</span>
                                            </td>
                                            {/* From */}
                                            <td style={{ ...cs(7), borderRight: 'none' }}>
                                                <span style={{ color: t.cellMuted, textTransform: 'uppercase' }}>{row.from ?? '—'}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Upload Modal ── */}
            {selectedRow && (
                <LiquidationUploadModal
                    row={selectedRow}
                    t={t}
                    isDark={isDark}
                    isAdmin={isAdmin}
                    onClose={() => setSelectedRow(null)}
                    onRowUpdate={handleRowUpdate}
                />
            )}
        </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export
// ─────────────────────────────────────────────────────────────────────────────
export default function LiquidationSubmission() {
    return (
        <AdamsonBudgetLayout>
            {(isDark: boolean) => {
                const t = isDark ? T.dark : T.light;
                return <div className="mx-auto max-w-7xl"><LiquidationSubmissionInner t={t} isDark={isDark} /></div>;
            }}
        </AdamsonBudgetLayout>
    );
}
