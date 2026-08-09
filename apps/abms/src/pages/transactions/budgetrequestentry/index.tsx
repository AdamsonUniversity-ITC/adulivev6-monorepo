import React, { useEffect, useRef, useState } from 'react';
import AdamsonBudgetLayout from '../../../layouts/Screenlayout';
import { RefreshCw, FilePlus, ClipboardList, Search, Copy } from 'lucide-react';
import { budgetrequestentryRoute } from '../../../router';
import { useRouteContext } from '@tanstack/react-router';
import { financeSvc } from '@repo/axios-config/finance-service';
import { T } from './theme';
import type { DeptOption, RSRecord, RSType, ThemeTokens, ToastItem, ToastKind } from './types';
import { LIQUIDATION_COLOR, fmt, formatRequisitionNumber, liquidationRowBg, liquidationRowHoverBg, normalizeEntryStatus } from './utils';
import { Btn, Checkbox, DeptDropdown, StatusBadge, Toasts } from './components/common';
import { NewRSModal } from './components/NewRSModal';
import { RSFormModal } from './components/RSFormModal';
import { RSViewModal } from './components/RSViewModal';
import { PageHeader } from '../../../components/ui/Page';
import { organizationalUnitKey } from '../../../lib/organizationalUnit';
import { InfiniteScrollSentinel } from '../../../components/InfiniteScrollSentinel';

function BudgetRequestEntryInner({
    t, isDark,
}: { t: ThemeTokens; isDark: boolean }) {

    const { departments, sections, current_school_year: currentSchoolYear } = budgetrequestentryRoute.useLoaderData();
    const { user } = useRouteContext({ strict: false });


    const deptOptions: DeptOption[] = [
        ...departments.map((d: { id: string; name: string }) => ({
            id: String(d.id),
            name: d.name,
            kind: 'Department' as const,
        })),
        ...sections.map((s: { id: string; name: string }) => ({
            id: String(s.id),
            name: s.name,
            kind: 'Section' as const,
        })),
    ];
    // ── Filter state ──────────────────────────────────────────────────────────
    const [viewAll, setViewAll] = useState(true);
    const [viewServedByWico, setViewServedByWico] = useState(false);
    const [filterByDate, setFilterByDate] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedDept, setSelectedDept] = useState(() =>
        deptOptions.length === 1 ? organizationalUnitKey(deptOptions[0].kind, deptOptions[0].id) : ''
    );
    const [search, setSearch] = useState('');

    // ── Table state ───────────────────────────────────────────────────────────
    const [records, setRecords] = useState<RSRecord[]>([]);
    const [isLoadingRecords, setIsLoadingRecords] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [hovered, setHovered] = useState<number | null>(null);

    // ── Cursor pagination state ────────────────────────────────────────────────
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const perPage = 20;

    // ── Modal state ───────────────────────────────────────────────────────────
    const [showNewRS, setShowNewRS] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewModalId, setViewModalId] = useState<number | null>(null);
    const [showRSForm, setShowRSForm] = useState(false);
    const [rsFormType, setRSFormType] = useState<RSType>(null);
    const [rsHeaderId, setRsHeaderId] = useState<number | null>(null);
    const [isCreatingRS, setIsCreatingRS] = useState(false);

    // Stores the full header data returned by the store endpoint
    interface RSHeaderData {
        id: number;
        requisition_number: string;
        department: string;
        school_year: string;
        created_at: string;
        payee: string | null;
        payment_form: string | null;
        payeeFromModal: boolean;
    }
    const [rsHeaderData, setRsHeaderData] = useState<RSHeaderData | null>(null);

    // ── Toast state ───────────────────────────────────────────────────────────
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const toastCounter = useRef(0);

    function addToast(kind: ToastKind, message: string) {
        const id = ++toastCounter.current;
        setToasts(prev => [...prev, { id, kind, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }

    // ── School-year toggle ────────────────────────────────────────────────────
    const [usePrevSY, setUsePrevSY] = useState(false);

    // Derive the active school year from the loader value
    // currentSchoolYear format: "2024–2025"
    const activeSchoolYear = (() => {
        if (!usePrevSY) return currentSchoolYear ?? '';
        // Shift both years back by 1: "2024–2025" → "2023–2024"
        const match = (currentSchoolYear ?? '').match(/(\d{4})[–-](\d{4})/);
        if (!match) return currentSchoolYear ?? '';
        return `${parseInt(match[1]) - 1}–${parseInt(match[2]) - 1}`;
    })();

    // Reset loaded state when the scope (dept/section or school year) changes
    // so the "click Refresh" hint reappears
    useEffect(() => {
        setRecords([]);
        setHasLoaded(false);
    }, [selectedDept, activeSchoolYear]);

    function handleToggleSY() {
        const next = !usePrevSY;
        setUsePrevSY(next);
        if (next) {
            // Compute what the prev SY label will be
            const match = (currentSchoolYear ?? '').match(/(\d{4})[–-](\d{4})/);
            const prevLabel = match
                ? `${parseInt(match[1]) - 1}–${parseInt(match[2]) - 1}`
                : 'previous school year';
            addToast('info', `Switched to previous school year: ${prevLabel}`);
        } else {
            addToast('success', `Switched back to current school year: ${currentSchoolYear ?? ''}`);
        }
    }

    // ── Handlers ──────────────────────────────────────────────────────────────
    const buildParams = (cursor?: string | null) => {
        const selectedOpt = deptOptions.find(d => organizationalUnitKey(d.kind, d.id) === selectedDept);
        const params: Record<string, string> = {
            schoolYear: activeSchoolYear,
            perPage: String(perPage),
        };
        if (selectedOpt?.kind === 'Department') params.departmentId = selectedOpt.id;
        else if (selectedOpt?.kind === 'Section') params.sectionId = selectedOpt.id;
        if (filterByDate && dateFrom) params.dateFrom = dateFrom;
        if (filterByDate && dateTo) params.dateTo = dateTo;
        if (viewServedByWico) params.viewServedByWico = 'true';
        if (search.trim()) params.search = search.trim();
        if (cursor) params.cursor = cursor;
        return params;
    };

    const handleRefresh = async () => {
        if (!selectedDept) {
            addToast('info', 'Select a Department or Section first before refreshing.');
            return;
        }
        setIsLoadingRecords(true);
        setNextCursor(null);
        setHasMore(false);
        try {
            const res = await financeSvc.get('/abms/budget-request-entry/entries', { params: buildParams() });
            const raw: Array<{
                id: number; date: string; requisitionNo: string;
                payee: string; requestedBy: string; requestedByName: string;
                totalAmount: number; status: string; forLiquidation?: boolean;
            }> = res.data?.entries ?? [];

            const mapped: RSRecord[] = raw.map(e => ({
                id: e.id, date: e.date, requisitionNo: e.requisitionNo,
                payee: e.payee, requestedBy: e.requestedBy,
                requestedByName: e.requestedByName,
                totalAmount: e.totalAmount, status: normalizeEntryStatus(e.status, e.requisitionNo),
                forLiquidation: !!e.forLiquidation,
            }));
            setRecords(mapped);
            setNextCursor(res.data?.next_cursor ?? null);
            setHasMore(res.data?.has_more ?? false);
            setHasLoaded(true);
            addToast('success', `${mapped.length} ${mapped.length === 1 ? 'record' : 'records'} loaded.`);
        } catch {
            addToast('error', 'Failed to load records. Please try again.');
        } finally {
            setIsLoadingRecords(false);
        }
    };

    const handleLoadMore = async () => {
        if (!nextCursor || isLoadingMore) return false;
        setIsLoadingMore(true);
        try {
            const res = await financeSvc.get('/abms/budget-request-entry/entries', {
                params: buildParams(nextCursor),
            });
            const raw: Array<{
                id: number; date: string; requisitionNo: string;
                payee: string; requestedBy: string; requestedByName: string;
                totalAmount: number; status: string; forLiquidation?: boolean;
            }> = res.data?.entries ?? [];
            const mapped: RSRecord[] = raw.map(e => ({
                id: e.id, date: e.date, requisitionNo: e.requisitionNo,
                payee: e.payee, requestedBy: e.requestedBy,
                requestedByName: e.requestedByName,
                totalAmount: e.totalAmount, status: normalizeEntryStatus(e.status, e.requisitionNo),
                forLiquidation: !!e.forLiquidation,
            }));
            setRecords(prev => [...prev, ...mapped]);
            setNextCursor(res.data?.next_cursor ?? null);
            setHasMore(res.data?.has_more ?? false);
            return true;
        } catch {
            addToast('error', 'Failed to load more records. Please try again.');
            return false;
        } finally {
            setIsLoadingMore(false);
        }
    };

    // ── Derived rows — all filtering is server-side; display records as-is ───
    const displayed = records;

    const grandTotal = displayed.reduce((s, r) => s + r.totalAmount, 0);

    const COLS = [
        { label: 'Date', width: '116px', align: 'left' as const },
        { label: 'Requisition No.', width: '172px', align: 'left' as const },
        { label: 'Payee', width: 'auto', align: 'left' as const },
        { label: 'Requested By', width: '220px', align: 'left' as const },
        { label: 'Total Amount', width: '164px', align: 'right' as const },
        { label: 'Status', width: '160px', align: 'left' as const },
    ];

    return (
        <>
            {/* RS View Modal */}
            <RSViewModal
                open={showViewModal}
                recordId={viewModalId}
                onClose={() => { setShowViewModal(false); setViewModalId(null); }}
                onUpdated={() => { handleRefresh(); }}
                t={t}
                isDark={isDark}
                currentUser={user ? { id: user.username ?? '', name: user.name ?? user.username ?? '' } : { id: '', name: '' }}
            />

            {/* Toasts */}
            <Toasts
                items={toasts}
                isDark={isDark}
                onDismiss={id => setToasts(p => p.filter(t => t.id !== id))}
            />

            {/* New RS Modal */}
            <NewRSModal
                open={showNewRS}
                onClose={() => setShowNewRS(false)}
                onConfirm={async (type, paymentForm, payeeDetails) => {
                    if (!type) return;
                    setIsCreatingRS(true);
                    try {
                        const selectedOpt = deptOptions.find(d => organizationalUnitKey(d.kind, d.id) === selectedDept);
                        const res = await financeSvc.post('/abms/budget-request-entry', {
                            rstype: type,
                            department_id: selectedOpt?.kind === 'Department' ? selectedOpt.id : null,
                            section_id: selectedOpt?.kind === 'Section' ? selectedOpt.id : null,
                            requested_by: user?.username ?? null,
                            school_year: activeSchoolYear,
                            status: 'unsaved',
                            payment_form: paymentForm || null,
                            payee_details: payeeDetails ? {
                                payee: payeeDetails.payee,
                                tin: payeeDetails.tinNo || null,
                                is_adu_employee: payeeDetails.aduEmployee,
                                is_non_adu_employee: payeeDetails.nonAduEmployee,
                                is_vat_registered: payeeDetails.vatRegistered,
                                is_non_vat_registered: payeeDetails.nonVatRegistered,
                                is_cheque: payeeDetails.mopCheque,
                                is_bank: payeeDetails.mopBankTransfer,
                                bank_name: payeeDetails.bankName || null,
                                account_name: payeeDetails.accountName || null,
                                account_number: payeeDetails.accountNumber || null,
                                bank_address: payeeDetails.bankAddress || null,
                            } : null,
                        });
                        setShowNewRS(false);
                        setRSFormType(type);
                        setRsHeaderId(res.data.id);
                        setRsHeaderData({
                            id: res.data.id,
                            requisition_number: String(res.data.requisition_number),
                            department: selectedOpt?.name ?? '—',
                            school_year: res.data.school_year,
                            created_at: res.data.created_at,
                            payee: payeeDetails?.payee ?? null,
                            payment_form: paymentForm || null,
                            payeeFromModal: payeeDetails !== null,
                        });
                        setShowRSForm(true);
                    } catch {
                        addToast('error', 'Failed to create Requisition Slip. Please try again.');
                    } finally {
                        setIsCreatingRS(false);
                    }
                }}
                isLoading={isCreatingRS}
                t={t}
                isDark={isDark}
            />

            {/* RS Form Modal */}
            <RSFormModal
                open={showRSForm}
                rsType={rsFormType}
                rsHeaderId={rsHeaderId}
                rsHeaderData={rsHeaderData}
                department={
                    deptOptions.find(d => organizationalUnitKey(d.kind, d.id) === selectedDept)?.name ?? '—'
                }
                onClose={() => setShowRSForm(false)}
                onSaveSuccess={(rsNumber) => {
                    setShowRSForm(false);
                    setRsHeaderId(null);
                    setRsHeaderData(null);
                    setRSFormType(null);
                    addToast('success', `Requisition Slip ${rsNumber} saved successfully.`);
                    // Auto-refresh so the new RS appears in the table
                    handleRefresh();
                }}
                onDiscard={async () => {
                    if (rsHeaderId !== null) {
                        try {
                            await financeSvc.delete(`/abms/budget-request-entry/${rsHeaderId}`);
                        } catch {
                            addToast('error', 'Failed to discard the Requisition Slip. Please try again.');
                            throw new Error('Failed to discard the Requisition Slip.');
                        }
                    }
                    setShowRSForm(false);
                    setRsHeaderId(null);
                    setRsHeaderData(null);
                    setRSFormType(null);
                }}
                t={t}
                isDark={isDark}
                departmentId={deptOptions.find(d => organizationalUnitKey(d.kind, d.id) === selectedDept && d.kind === 'Department')?.id ?? ''}
                sectionId={deptOptions.find(d => organizationalUnitKey(d.kind, d.id) === selectedDept && d.kind === 'Section')?.id ?? ''}
                currentSchoolYear={activeSchoolYear}
            />

            {/* ── Page title ─────────────────────────────────────────────── */}
            <PageHeader
                className="mb-5"
                title="Budget Request Entry"
                description="Manage and track Requisition Slips (RS) across departments and sections."
            />

            {/* ── Single card ────────────────────────────────────────────── */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    boxShadow: t.cardShadow,
                }}
            >

                {/* ══ Filter workspace ═════════════════════════════════════ */}
                <div
                    className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-3"
                    style={{
                        background: t.cardHeaderBg,
                        borderBottom: `1px solid ${t.cardHeaderBorder}`,
                    }}
                >
                    {/* View-option checkboxes */}
                    <div className="flex min-h-24 flex-col justify-between gap-3 rounded-xl border p-4" style={{ background: t.inputBg, borderColor: t.inputBorder }}>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: t.tableHeadText }}>View Options</p>
                            <p className="mt-1 text-[10px]" style={{ color: t.cellMuted }}>Choose which requisition slips to display.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                            <Checkbox checked={viewAll} onChange={v => { setViewAll(v); if (v) setViewServedByWico(false); }} label="View All" t={t} isDark={isDark} />
                            <Checkbox checked={viewServedByWico} onChange={v => { setViewServedByWico(v); if (v) setViewAll(false); }} label="Served by WICO" t={t} isDark={isDark} />
                        </div>
                    </div>

                    {/* Date filter */}
                    <div className="flex min-h-24 flex-col justify-between gap-3 rounded-xl border p-4" style={{ background: t.inputBg, borderColor: t.inputBorder }}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: t.tableHeadText }}>Date Range</p>
                                <p className="mt-1 text-[10px]" style={{ color: t.cellMuted }}>Limit results to a specific period.</p>
                            </div>
                            <Checkbox checked={filterByDate} onChange={v => { setFilterByDate(v); if (!v) { setDateFrom(''); setDateTo(''); } }} label="Enable" t={t} isDark={isDark} />
                        </div>
                        <div className="grid min-w-0 grid-cols-1 items-center gap-2 min-[480px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} disabled={!filterByDate} className="min-w-0 rounded-lg border px-2.5 py-2 text-[11px] font-semibold outline-none transition-all duration-150" style={{ background: t.cardHeaderBg, borderColor: t.inputBorder, color: dateFrom ? t.inputText : t.inputPlaceholder, colorScheme: isDark ? 'dark' : 'light', opacity: filterByDate ? 1 : 0.38, cursor: filterByDate ? 'default' : 'not-allowed' }} />
                            <span className="hidden text-[10px] font-bold min-[480px]:inline" style={{ color: t.cellMuted }}>to</span>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} disabled={!filterByDate} className="min-w-0 rounded-lg border px-2.5 py-2 text-[11px] font-semibold outline-none transition-all duration-150" style={{ background: t.cardHeaderBg, borderColor: t.inputBorder, color: dateTo ? t.inputText : t.inputPlaceholder, colorScheme: isDark ? 'dark' : 'light', opacity: filterByDate ? 1 : 0.38, cursor: filterByDate ? 'default' : 'not-allowed' }} />
                        </div>
                    </div>

                    {/* Department dropdown */}
                    <div className="flex min-h-24 min-w-0 flex-col justify-between gap-3 rounded-xl border p-4" style={{ background: t.inputBg, borderColor: t.inputBorder }}>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: t.tableHeadText }}>Department / Section</p>
                            <p className="mt-1 text-[10px]" style={{ color: t.cellMuted }}>Select the requesting organizational unit.</p>
                        </div>
                        <DeptDropdown value={selectedDept} onChange={setSelectedDept} options={deptOptions} t={t} isDark={isDark} />
                    </div>
                </div>

                {/* ══ Balanced action strip ═══════════════════════════════ */}
                <div className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-2 xl:grid-cols-4" style={{ background: t.cardHeaderBg, borderBottom: `1px solid ${t.cardHeaderBorder}` }}>
                    <Btn className="h-10 w-full justify-center" token={t.btnRefresh} icon={<RefreshCw className={`w-3.5 h-3.5${isLoadingRecords ? ' animate-spin' : ''}`} />} label={isLoadingRecords ? 'Loading…' : 'Refresh Records'} onClick={handleRefresh} disabled={isLoadingRecords} t={t} />
                    <div className="flex" title={!selectedDept ? 'Please select a Department or Section first' : ''}><Btn className="h-10 w-full justify-center" token={t.btnNew} icon={<FilePlus className="w-3.5 h-3.5" />} label="New Requisition Slip" onClick={() => setShowNewRS(true)} disabled={!selectedDept} t={t} /></div>
                    <Btn className="h-10 w-full justify-center" token={usePrevSY ? t.btnNew : t.btnPrevSY} icon={usePrevSY ? <RefreshCw className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} label={usePrevSY ? 'Use Current School Year' : 'Use Previous School Year'} onClick={handleToggleSY} t={t} />
                    <div className="flex h-10 items-center justify-center gap-2 rounded-lg border px-3" style={{ borderColor: `${LIQUIDATION_COLOR}55`, background: isDark ? `${LIQUIDATION_COLOR}1a` : `${LIQUIDATION_COLOR}14` }}><span className="h-2 w-2 rounded-full" style={{ background: LIQUIDATION_COLOR }} /><span className="text-[11px] font-bold tracking-wide" style={{ color: isDark ? '#fde047' : '#854d0e' }}>Yellow rows require liquidation</span></div>
                </div>

                {/* ══ ROW 2 — Search + count pill ═══════════════════════════ */}
                <div
                    className="flex flex-col items-stretch gap-2 px-4 py-2.5 min-[480px]:flex-row min-[480px]:items-center sm:px-5"
                    style={{
                        background: t.cardHeaderBg,
                        borderBottom: `1px solid ${t.cardHeaderBorder}`,
                    }}
                >
                    {/* Count pill */}
                    <span
                        className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shrink-0"
                        style={{ background: t.pillBg, color: t.pillText, border: `1px solid ${t.pillBorder}` }}
                    >
                        {displayed.length} {displayed.length === 1 ? 'record' : 'records'}{hasMore ? '+' : ''}
                    </span>

                    {/* Search */}
                    <div className="relative min-w-0 flex-1">
                        <Search
                            className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ color: t.cellMuted }}
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by RS number, payee, or requested by…"
                            className="w-full pl-8 pr-3 py-2 rounded-xl text-[11px] font-semibold border outline-none transition-all duration-150"
                            style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText }}
                            onFocus={e => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)'; }}
                            onBlur={e => { (e.target as HTMLElement).style.borderColor = t.inputBorder; }}
                        />
                    </div>

                    {/* Active filter indicator */}
                    {(viewServedByWico || (filterByDate && (dateFrom || dateTo)) || selectedDept) && (
                        <span className="text-[10px] font-semibold ml-auto" style={{ color: t.cellAmber }}>
                            {[
                                viewServedByWico ? 'Served by WICO only' : null,
                                filterByDate && (dateFrom || dateTo)
                                    ? `${dateFrom || '—'} → ${dateTo || '—'}`
                                    : null,
                                selectedDept
                                    ? deptOptions.find(d => organizationalUnitKey(d.kind, d.id) === selectedDept)?.name
                                    : null,
                            ].filter(Boolean).join(' · ')}
                        </span>
                    )}
                </div>

                {/* ══ Table ════════════════════════════════════════════════ */}
                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr style={{ background: t.tableHeadBg }}>
                                {COLS.map(col => (
                                    <th
                                        key={col.label}
                                        className="px-4 py-3 font-bold uppercase tracking-widest whitespace-nowrap"
                                        style={{
                                            fontSize: '11px',
                                            color: t.tableHeadText,
                                            textAlign: col.align,
                                            width: col.width,
                                            borderBottom: `2px solid ${t.tableHeadBorder}`,
                                            borderRight: col.label !== 'Status'
                                                ? `1px solid ${t.tableHeadBorder}`
                                                : 'none',
                                        }}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {isLoadingRecords ? (
                                <tr>
                                    <td
                                        colSpan={COLS.length}
                                        className="px-4 py-16 text-center text-xs"
                                        style={{ color: t.cellMuted }}
                                    >
                                        <RefreshCw className="w-8 h-8 mx-auto mb-2.5 opacity-30" style={{ color: t.cellMuted, animation: 'spin 1s linear infinite' }} />
                                        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                                        Loading records…
                                    </td>
                                </tr>
                            ) : displayed.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={COLS.length}
                                        className="px-4 py-16 text-center text-xs"
                                        style={{ color: t.cellMuted }}
                                    >
                                        <ClipboardList className="w-8 h-8 mx-auto mb-2.5 opacity-30" style={{ color: t.cellMuted }} />
                                        {search.trim()
                                            ? <>No records match <strong style={{ color: t.cellBlue }}>"{search}"</strong>.</>
                                            : hasLoaded
                                                ? 'No requisition slips found for the selected filters.'
                                                : 'Select a Department or Section, then click Refresh to load records.'
                                        }
                                    </td>
                                </tr>
                            ) : displayed.map((row, i) => {
                                const tagged = !!row.forLiquidation;
                                const baseBg = tagged
                                    ? liquidationRowBg(isDark)
                                    : (i % 2 === 0 ? t.rowEvenBg : t.rowOddBg);
                                const activeBg = hovered === row.id
                                    ? (tagged ? liquidationRowHoverBg(isDark) : t.rowHoverBg)
                                    : baseBg;
                                return (
                                    <tr
                                        key={row.id}
                                        onClick={() => { setViewModalId(row.id); setShowViewModal(true); }}
                                        onMouseEnter={() => setHovered(row.id)}
                                        onMouseLeave={() => setHovered(null)}
                                        style={{
                                            background: activeBg,
                                            borderBottom: `1px solid ${t.rowBorder}`,
                                            transition: 'background 0.12s ease',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {/* Date */}
                                        <td
                                            className="px-4 py-4 font-mono text-[14px] whitespace-nowrap"
                                            style={{
                                                color: t.cellMuted,
                                                borderRight: `1px solid ${t.rowBorder}`,
                                                fontVariantNumeric: 'tabular-nums',
                                            }}
                                        >
                                            {new Date(row.date).toLocaleDateString('en-PH', {
                                                month: 'short', day: 'numeric', year: 'numeric',
                                            })}
                                        </td>

                                        {/* Requisition No. */}
                                        <td
                                            className="px-4 py-4 font-mono font-bold text-[15px] whitespace-nowrap"
                                            style={{ color: t.cellBlue, borderRight: `1px solid ${t.rowBorder}` }}
                                        >
                                            {formatRequisitionNumber(row.requisitionNo)}
                                        </td>

                                        {/* Payee */}
                                        <td
                                            className="px-4 py-4 text-[15px] font-semibold"
                                            style={{ color: t.cellText, borderRight: `1px solid ${t.rowBorder}` }}
                                        >
                                            {row.payee}
                                        </td>

                                        {/* Requested By — avatar + name + employee no */}
                                        <td
                                            className="px-4 py-3"
                                            style={{ borderRight: `1px solid ${t.rowBorder}` }}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Avatar */}
                                                {row.requestedBy && row.requestedBy !== '—' ? (
                                                    <img
                                                        src={`https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${row.requestedBy}_2`}
                                                        alt={row.requestedByName}
                                                        className="rounded-full shrink-0 object-cover"
                                                        style={{
                                                            width: 42, height: 42,
                                                            border: `2px solid ${isDark ? 'rgba(100,160,255,0.30)' : 'rgba(37,99,235,0.20)'}`,
                                                        }}
                                                        onError={e => {
                                                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                            const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                                                            if (sib) sib.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                {/* Fallback initials avatar */}
                                                <div
                                                    className="rounded-full shrink-0 items-center justify-center font-bold text-[13px] select-none"
                                                    style={{
                                                        width: 42, height: 42,
                                                        background: isDark ? 'rgba(59,130,246,0.22)' : 'rgba(219,234,254,0.80)',
                                                        border: `2px solid ${isDark ? 'rgba(100,160,255,0.35)' : 'rgba(37,99,235,0.25)'}`,
                                                        color: isDark ? '#93c5fd' : '#1d4ed8',
                                                        display: (row.requestedBy && row.requestedBy !== '—') ? 'none' : 'flex',
                                                    }}
                                                >
                                                    {row.requestedByName !== '—'
                                                        ? row.requestedByName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                                                        : row.requestedBy.slice(0, 2).toUpperCase()
                                                    }
                                                </div>
                                                {/* Name + employee no */}
                                                <div className="min-w-0">
                                                    <p
                                                        className="text-[15px] font-semibold truncate leading-snug"
                                                        style={{ color: t.cellText }}
                                                    >
                                                        {row.requestedByName}
                                                    </p>
                                                    <p
                                                        className="text-[12px] font-mono mt-0.5 truncate"
                                                        style={{ color: t.cellMuted }}
                                                    >
                                                        {row.requestedBy}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Total Amount */}
                                        <td
                                            className="px-4 py-4 text-right font-bold font-mono text-[15px] whitespace-nowrap"
                                            style={{
                                                color: t.cellGreen,
                                                borderRight: `1px solid ${t.rowBorder}`,
                                                fontVariantNumeric: 'tabular-nums',
                                            }}
                                        >
                                            ₱ {fmt(row.totalAmount)}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-4">
                                            <StatusBadge status={row.status} t={t} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* ══ Infinite-scroll cursor sentinel ══════════════════════ */}
                {hasMore && (
                    <div
                        className="px-5 py-2"
                        style={{
                            background: t.cardHeaderBg,
                            borderTop: `1px solid ${t.cardHeaderBorder}`,
                            color: t.cellMuted,
                        }}
                    >
                        <InfiniteScrollSentinel
                            key={nextCursor}
                            hasMore={hasMore}
                            loading={isLoadingMore}
                            onLoadMore={handleLoadMore}
                        />
                    </div>
                )}

                {/* ══ Footer — grand total ═══════════════════════════════════ */}
                {displayed.length > 0 && (
                    <div
                        className="px-5 py-3 flex flex-wrap items-center gap-4"
                        style={{
                            background: t.cardHeaderBg,
                            borderTop: `2px solid ${t.cardHeaderBorder}`,
                        }}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.cellMuted }}>
                            {displayed.length} {displayed.length === 1 ? 'record' : 'records'}
                        </span>

                        <div className="flex items-center gap-3 ml-auto">
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.totalLabel }}>
                                Grand Total
                            </span>
                            <div
                                className="px-5 py-1.5 rounded-lg text-xs font-bold text-right"
                                style={{
                                    background: t.totalBg,
                                    border: `1px solid ${t.totalBorder}`,
                                    color: t.cellGreen,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontVariantNumeric: 'tabular-nums',
                                    minWidth: '160px',
                                }}
                            >
                                ₱ {fmt(grandTotal)}
                            </div>
                        </div>
                    </div>

                )}
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export — render-prop pattern (same as BudgetAdjustmentEntry)
// isDark comes directly from the layout's useTheme(); no MutationObserver needed
// ─────────────────────────────────────────────────────────────────────────────
export default function BudgetRequestEntry() {
    return (
        <AdamsonBudgetLayout>
            {(isDark: boolean) => {
                const t = isDark ? T.dark : T.light;
                return <div className="mx-auto max-w-7xl"><BudgetRequestEntryInner t={t} isDark={isDark} /></div>;
            }}
        </AdamsonBudgetLayout>
    );
}
