import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import type { RSLineItem, RSProcessRow } from './RSProcessModal';

interface PayeeDetail {
    tin: string | null; is_adu_employee: boolean; is_vat_registered: boolean;
    is_cheque: boolean; is_bank: boolean; bank_name: string | null;
    account_name: string | null; account_number: string | null; bank_address: string | null;
}

const RS_TYPE_OPTIONS = [
    { id: 'stockroom', label: 'For Office Supplies / Stockable Items / Inventoriable Items (WICO / Stockroom)' },
    { id: 'logistics', label: 'For Purchase (Logistics Office)' },
    { id: 'cashier', label: 'For Cash Valued Items / Cash Advance / Payments (Accounting / Cashier)' },
] as const;

const RS_PAPER_OPTIONS = [
    { id: 'letter-portrait', group: 'General / PDF', label: 'Letter — Portrait (8.5 × 11 in)', width: '8.5in', height: '11in', layoutHeight: '11in', pageSize: 'Letter portrait', margin: '.2in', compact: false },
    { id: 'epson-letter-portrait', group: 'Epson LX-300-II', label: 'Letter (8.5 × 11 in)', width: '8.5in', height: '11in', layoutHeight: '11in', pageSize: 'Letter portrait', margin: '.3in', scale: .97, compact: false },
    { id: 'epson-legal-portrait', group: 'Epson LX-300-II', label: 'Legal (8.5 × 14 in)', width: '8.5in', height: '14in', layoutHeight: '14in', pageSize: 'Legal portrait', margin: '.3in',scale: .90, compact: false },
    { id: 'epson-half-legal', group: 'Epson LX-300-II', label: 'Half Legal (8.5 × 7 in)', width: '8.5in', height: '7in', layoutHeight: '7in', pageSize: '8.5in 7in', margin: '.3in', scale: .95, compact: true },
    { id: 'legal-portrait', group: 'General / PDF', label: 'Legal — Portrait (8.5 × 14 in)', width: '8.5in', height: '14in', layoutHeight: '14in', pageSize: 'Legal portrait', margin: '.3in', compact: false },
    { id: 'a4-portrait', group: 'General / PDF', label: 'A4 — Portrait (210 × 297 mm)', width: '210mm', height: '297mm', layoutHeight: '297mm', pageSize: 'A4 portrait', margin: '.3in', compact: false },
    { id: 'letter-landscape', group: 'General / PDF', label: 'Letter — Landscape (11 × 8.5 in)', width: '11in', height: '8.5in', layoutHeight: '8.5in', pageSize: 'Letter landscape', margin: '.3in', compact: false },
    { id: 'legal-landscape', group: 'General / PDF', label: 'Legal — Landscape (14 × 8.5 in)', width: '14in', height: '8.5in', layoutHeight: '8.5in', pageSize: 'Legal landscape', margin: '.3in', compact: false },
    { id: 'a4-landscape', group: 'General / PDF', label: 'A4 — Landscape (297 × 210 mm)', width: '297mm', height: '210mm', layoutHeight: '210mm', pageSize: 'A4 landscape', margin: '.3in', compact: false },
] as const;

type RsPaperId = typeof RS_PAPER_OPTIONS[number]['id'];

function formatDate(value: string | Date | null | undefined) {
    if (!value) return '—';
    const normalized = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00`
        : typeof value === 'string' ? value.replace(' ', 'T') : value;
    const date = value instanceof Date ? value : new Date(normalized);
    return Number.isNaN(date.getTime()) ? value.toString() : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function valuesOf(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object') return value as Record<string, unknown>;
    if (typeof value !== 'string') return {};
    try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
}

export function RSPrintPreview({ row, items, payeeDetail, printedBy, onClose }: {
    row: RSProcessRow; items: RSLineItem[]; payeeDetail: PayeeDetail | null; printedBy: string; onClose: () => void;
}) {
    const isStockroomRs = String(row.rstype ?? '').trim().toLowerCase() === 'stockroom';
    const money = (value: number | null | undefined) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);
    const [printedAt, setPrintedAt] = useState(() => new Date());
    const [isPreparingPrint, setIsPreparingPrint] = useState(false);
    const [printError, setPrintError] = useState<string | null>(null);
    const printRequestInFlight = useRef(false);
    const printDate = formatDate(printedAt);
    const printTime = printedAt.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
    const modeOfPayment = payeeDetail
        ? [payeeDetail.is_cheque && 'Cheque', payeeDetail.is_bank && 'Bank Transfer'].filter(Boolean).join(', ')
        : '';
    const isSupplierPayment = row.payment_form === 'Payment for Supplier/Water';
    const isHonorariumPayment = row.payment_form === 'Payment for Honorarium';
    const classification = payeeDetail
        ? isSupplierPayment
            ? (payeeDetail.is_vat_registered ? 'VAT Registered' : 'Non-VAT Registered')
            : isHonorariumPayment
                ? (payeeDetail.is_adu_employee ? 'AdU Employee' : 'Non AdU Employee')
                : ''
        : '';
    const selectedRsType = (row.rstype || '').toLowerCase();
    const isSelectedRsType = (id: typeof RS_TYPE_OPTIONS[number]['id']) => selectedRsType.includes(id)
        || (id === 'stockroom' && (selectedRsType.includes('office supplies') || selectedRsType.includes('wico')))
        || (id === 'logistics' && selectedRsType.includes('purchase'))
        || (id === 'cashier' && (selectedRsType.includes('cash valued') || selectedRsType.includes('accounting')));
    const rsTypeLabel = RS_TYPE_OPTIONS.find(option => isSelectedRsType(option.id))?.label || row.rstype || '—';
    const [reviewedDate, setReviewedDate] = useState<string | null>(null);
    const [certifiedDate, setCertifiedDate] = useState<string | null>(null);
    const [printAccountCodes, setPrintAccountCodes] = useState<Record<number, string>>({});
    const [paperId, setPaperId] = useState<RsPaperId>('letter-portrait');
    const selectedPaper = RS_PAPER_OPTIONS.find(option => option.id === paperId) ?? RS_PAPER_OPTIONS[0];
    const contentScale = 'scale' in selectedPaper ? selectedPaper.scale : 1;
    const isHalfLegal = selectedPaper.compact;
    const printPaperHeight = selectedPaper.height;
    const printLayoutHeight = selectedPaper.layoutHeight;
    const printPageSize = selectedPaper.pageSize;
    const sheetPadding = selectedPaper.margin;

    const handlePrint = async () => {
        if (printRequestInFlight.current) return;

        printRequestInFlight.current = true;
        setIsPreparingPrint(true);
        setPrintError(null);

        try {
            const response = await financeSvc.post(`/abms/budget-request-entry/${row.id}/print-events`);
            const confirmedAt = new Date(response.data?.data?.created_at ?? Date.now());
            setPrintedAt(Number.isNaN(confirmedAt.getTime()) ? new Date() : confirmedAt);
            await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
            window.print();
        } catch (error: unknown) {
            const apiMessage = (error as { response?: { data?: { message?: string } } })
                .response?.data?.message;
            setPrintError(apiMessage || 'Print history could not be recorded. Please try again.');
        } finally {
            printRequestInFlight.current = false;
            setIsPreparingPrint(false);
        }
    };

    useEffect(() => {
        let active = true;
        financeSvc.get(`/abms/budget-request-entry/${row.id}/audit-history`)
            .then(response => {
                if (!active) return;
                const audits = (response.data.audits ?? []) as Array<{ created_at: string; new_values: unknown }>;
                const ordered = [...audits].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                const transitionDate = (status: string) => ordered.find(audit =>
                    String(valuesOf(audit.new_values).status ?? '').trim().toLowerCase() === status
                )?.created_at ?? null;
                setReviewedDate(transitionDate('for budget director'));
                setCertifiedDate(transitionDate('certified'));
            })
            .catch(() => { /* Audit dates are optional in the printable report. */ });
        return () => { active = false; };
    }, [row.id]);

    useEffect(() => {
        let active = true;
        const resolveCode = async (item: RSLineItem) => {
            if (!item.account_id) return [item.id, item.account_code] as const;
            try {
                const accountResponse = await financeSvc.get(`/abms/sub-accounts/${item.account_id}`);
                const account = accountResponse.data?.data ?? accountResponse.data?.account ?? accountResponse.data;
                if (!account?.parent_id) return [item.id, account?.account_code ?? item.account_code] as const;
                const parentResponse = await financeSvc.get(`/abms/main-accounts/${account.parent_id}`);
                const parent = parentResponse.data?.data ?? parentResponse.data?.account ?? parentResponse.data;
                const subCode = account.account_code ?? item.account_code;
                return [item.id, parent?.account_code ? `${parent.account_code} - ${subCode}` : subCode] as const;
            } catch {
                return [item.id, item.account_code] as const;
            }
        };
        Promise.all(items.map(resolveCode)).then(entries => {
            if (active) setPrintAccountCodes(Object.fromEntries(entries));
        });
        return () => { active = false; };
    }, [items]);

    return createPortal(<div className="rs-print-overlay" onClick={() => { if (!isPreparingPrint) onClose(); }}>
        <div className="rs-print-toolbar" onClick={event => event.stopPropagation()}>
            {printError && <span className="rs-print-error" role="alert">{printError}</span>}
            <label className="rs-paper-selector">
                <span>Paper</span>
                <select value={paperId} disabled={isPreparingPrint} onChange={event => setPaperId(event.target.value as RsPaperId)} aria-label="Requisition Slip paper size">
                    <optgroup label="Epson LX-300-II">
                        {RS_PAPER_OPTIONS.filter(option => 'group' in option && option.group === 'Epson LX-300-II').map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                    </optgroup>
                    <optgroup label="General / PDF">
                        {RS_PAPER_OPTIONS.filter(option => !('group' in option) || option.group !== 'Epson LX-300-II').map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                    </optgroup>
                </select>
            </label>
            <button onClick={handlePrint} disabled={isPreparingPrint}><Printer size={16} /> {isPreparingPrint ? 'Preparing…' : 'Print'}</button>
            <button onClick={onClose} disabled={isPreparingPrint}><X size={16} /> Close</button>
        </div>
        <article
            className={`rs-print-page${isHalfLegal ? ' rs-paper-half-legal' : ''}`}
            style={{ width: selectedPaper.width, minHeight: selectedPaper.height }}
            onClick={event => event.stopPropagation()}
        >
            <div className="rs-sheet" style={{ width: selectedPaper.width, minHeight: selectedPaper.layoutHeight, padding: sheetPadding, transform: `scale(${contentScale})`, transformOrigin: 'top center' }}>
                <header className="rs-report-header">
                    <div className="rs-title">
                        <h1>ADAMSON UNIVERSITY</h1>
                        <h2>Requisition Slip (RS)</h2>
                    </div>
                </header>
                <div className="rs-review-dates">
                    <span>Date Reviewed:</span><span>{formatDate(reviewedDate)}</span>
                    <span>Date Certified:</span><span>{formatDate(certifiedDate)}</span>
                </div>

                <section className="rs-information-box">
                    <section className="rs-document-meta">
                        <div><b>Department:</b><span>{row.department_section || '—'}</span></div>
                        <div><b>Requisition No.:</b><span>{row.requisition_no || '—'}</span></div>
                        <div><b>Requisition Date:</b><span>{formatDate(row.date)}</span></div>
                        <div><b>Status:</b><span className="rs-status">{row.status || '—'}</span></div>
                    </section>

                    <table className="rs-items">
                        <thead><tr><th>Account Code</th><th>Description</th><th>Qty</th><th>UOM</th><th>Unit Cost</th><th>Total Amount</th></tr></thead>
                        <tbody>{items.length ? items.map(item => <tr key={item.id}>
                            <td>{printAccountCodes[item.id] || item.account_code || '—'}</td><td>{item.description || '—'}</td><td className="center">{item.quantity}</td>
                            <td className="center">{item.unit_of_measurement || '—'}</td><td className="right">{money(item.unit_cost)}</td><td className="right">{money(item.total_cost)}</td>
                        </tr>) : <tr><td colSpan={6} className="empty">No requisition items.</td></tr>}</tbody>
                        <tfoot><tr><td colSpan={5} className="right">Total Amount:</td><td className="right">{money(row.total_amount)}</td></tr></tfoot>
                    </table>

                    <section className="rs-details">
                        <div><i>Note:</i><span>{row.note || '—'}</span></div>
                        <div><i>RS Type:</i><strong>{rsTypeLabel}</strong></div>
                        <div><i>Payee:</i><strong>{row.payee || '—'}</strong></div>
                        {row.payment_form && <div><i>Payment Form:</i><span>{row.payment_form}</span></div>}
                        {payeeDetail && <div className="rs-payee-summary">
                            <i>Payee Details:</i>
                            <span>
                                TIN: {payeeDetail.tin || '—'}
                                {classification && ` · ${classification}`}
                                {modeOfPayment && ` · ${modeOfPayment}`}
                                {payeeDetail.is_bank && payeeDetail.bank_name && ` · ${payeeDetail.bank_name}`}
                                {payeeDetail.is_bank && payeeDetail.account_name && ` / ${payeeDetail.account_name}`}
                                {payeeDetail.is_bank && payeeDetail.account_number && ` / ${payeeDetail.account_number}`}
                                {payeeDetail.is_bank && payeeDetail.bank_address && ` / ${payeeDetail.bank_address}`}
                            </span>
                        </div>}
                    </section>
                    <div className="rs-signing-space" />
                </section>

                <footer className="rs-footer">
                    <section className={`rs-certification${isStockroomRs ? ' rs-certification-stockroom' : ''}`}>
                        <div className="rs-print-info">
                            <span>Print Date: {printDate}</span><span>Print Time: {printTime}</span>
                            <span>Printed By: {printedBy || '—'}</span>
                        </div>
                        {isStockroomRs && <>
                            <div className="rs-signature-certification">
                                <span>Approved By:</span>
                                <div className="rs-footer-signature"><div /><span>Office Head</span></div>
                            </div>
                            <div className="rs-signature-certification">
                                <span>Received By:</span>
                                <div className="rs-footer-signature"><div /><span>Office Representative</span></div>
                            </div>
                        </>}
                        <div className="rs-budget-certification">
                            <span>Budget Certified By:</span>
                            <div className="rs-footer-signature"><div /><span>Controller</span></div>
                        </div>
                    </section>
                    <p>“In compliance with the requirement of the Data Privacy Act, we would like to secure your consent on the general use and sharing of information obtained from you in the course of transaction/s with any employee of the Adu Finance department. These data, which includes your sensitive or personal information, may be collected, processed or stored in accordance with the AdU retention and disposal policies for legitimate purposes. They may be used to implement transactions which you request, allow or authorize, and to comply with the AdU internal policies and its reporting obligations to government authorities under applicable laws.”</p>
                </footer>
            </div>
        </article>
        <style>{`
            .rs-print-overlay{position:fixed;inset:0;z-index:200000;background:rgba(15,23,42,.76);overflow:auto;padding:70px 20px 40px}
            .rs-print-toolbar{position:fixed;right:24px;top:18px;z-index:200001;display:flex;align-items:stretch;gap:8px;max-width:calc(100vw - 48px)}
            .rs-print-toolbar button{display:flex;align-items:center;gap:7px;border:1px solid #000;border-radius:7px;background:#fff;color:#000;padding:9px 15px;font:700 12px Arial;cursor:pointer}
            .rs-print-toolbar button:disabled,.rs-paper-selector select:disabled{cursor:not-allowed;opacity:.6}
            .rs-print-error{display:flex;align-items:center;max-width:340px;border:1px solid #dc2626;border-radius:7px;background:#fff;color:#b91c1c;padding:7px 10px;font:700 11px/1.3 Arial}
            .rs-paper-selector{display:flex;align-items:center;gap:8px;border:1px solid #000;border-radius:7px;background:#fff;color:#000;padding:5px 8px 5px 10px;font:700 12px Arial}
            .rs-paper-selector select{max-width:min(330px,45vw);border:0;background:#fff;color:#000;padding:4px 24px 4px 4px;font:600 12px Arial;cursor:pointer;outline:none}
            .rs-print-page{box-sizing:border-box;margin:auto;background:#fff;color:#000;padding:0;font:13.5px Arial,sans-serif;box-shadow:0 10px 40px #000}
            .rs-sheet{box-sizing:border-box;display:flex;flex-direction:column}
            .rs-report-header{min-height:17mm}
            .rs-review-dates{display:grid;grid-template-columns:auto 1fr;align-self:flex-start;gap:4px 9px;width:66mm;font-size:11px;padding:0 0 2.5mm}
            .rs-title{text-align:center}.rs-title h1{font-size:27px;font-weight:500;letter-spacing:.6px;margin:0;color:#000}.rs-title h2{font-size:17px;margin:4px 0 0;color:#000}
            .rs-information-box{border:1px solid #000;display:flex;flex:1;flex-direction:column}
            .rs-document-meta{display:grid;grid-template-columns:1.5fr 1fr}
            .rs-document-meta>div{box-sizing:border-box;display:flex;gap:9px;min-height:9mm;align-items:center;padding:5px 8px;border-bottom:1px solid #000}
            .rs-document-meta>div:nth-child(odd){border-right:1px solid #000}
            .rs-document-meta b{font-size:11.5px;font-weight:500}.rs-document-meta span{font-size:13.5px}
            .rs-status{text-transform:uppercase}
            .rs-items{width:100%;border-collapse:collapse;table-layout:fixed}.rs-items th,.rs-items td{border:1px solid #000;padding:7px 8px;vertical-align:middle}.rs-items th:first-child,.rs-items td:first-child{border-left:0}.rs-items th:last-child,.rs-items td:last-child{border-right:0}
            .rs-items th{font-size:11.5px;font-weight:500;text-align:center}.rs-items th:nth-child(1){width:13%}.rs-items th:nth-child(2){width:36%}.rs-items th:nth-child(3){width:8%}.rs-items th:nth-child(4){width:9%}.rs-items th:nth-child(5),.rs-items th:nth-child(6){width:17%}
            .rs-items tbody td{font-size:13.5px;height:10.5mm;line-height:1.25}.rs-items tfoot td{font-size:13.5px;border-top:0}.rs-items tfoot td:last-child{font-weight:800;font-size:16px}.right{text-align:right}.center{text-align:center}.empty{text-align:center;padding:16px!important}
            .rs-details{box-sizing:border-box;min-height:38mm;padding:6mm 8mm 4mm}.rs-details>div{display:grid;grid-template-columns:27mm 1fr;gap:8px;min-height:8mm;align-items:start}.rs-details i{font-size:12.5px}.rs-details strong,.rs-details span{font-size:14px}.rs-payee-summary span{font-size:12.5px;line-height:1.45}
            .rs-signing-space{flex:1;min-height:34mm}
            .rs-certification{display:grid;grid-template-columns:1fr auto;column-gap:14mm;align-items:end;padding:0 3mm 3mm}
            .rs-certification-stockroom{grid-template-columns:minmax(35mm,1fr) repeat(3,minmax(36mm,45mm));column-gap:6mm}
            .rs-print-info{display:flex;flex-direction:column;font-size:10.5px;line-height:1.5}
            .rs-budget-certification{width:52mm;font-size:10.5px;text-align:left}
            .rs-signature-certification{width:100%;font-size:10.5px;text-align:left}
            .rs-footer-signature{width:100%;text-align:center;font-size:11.5px}.rs-footer-signature div{height:6mm;border-bottom:1px solid #000}.rs-footer-signature span{display:block;margin-top:2px;white-space:nowrap}
            .rs-footer{font-size:9.5px;line-height:1.28;padding-top:4mm;text-align:justify}
            .rs-footer p{margin:2mm 0 0}
            .rs-paper-half-legal{font-size:11.5px}
            .rs-paper-half-legal .rs-report-header{min-height:10mm}
            .rs-paper-half-legal .rs-title h1{font-size:22px}
            .rs-paper-half-legal .rs-title h2{font-size:14px;margin-top:2px}
            .rs-paper-half-legal .rs-review-dates{gap:2px 7px;font-size:9.5px;padding-bottom:1.5mm}
            .rs-paper-half-legal .rs-document-meta>div{min-height:7mm;padding:3px 6px}
            .rs-paper-half-legal .rs-document-meta b{font-size:10px}
            .rs-paper-half-legal .rs-document-meta span{font-size:11.5px}
            .rs-paper-half-legal .rs-items th,.rs-paper-half-legal .rs-items td{padding:4px 6px}
            .rs-paper-half-legal .rs-items th{font-size:10px}
            .rs-paper-half-legal .rs-items tbody td{font-size:11.5px;height:7.5mm}
            .rs-paper-half-legal .rs-items tfoot td{font-size:11.5px}
            .rs-paper-half-legal .rs-items tfoot td:last-child{font-size:13px}
            .rs-paper-half-legal .rs-details{min-height:25mm;padding:3mm 5mm 2mm}
            .rs-paper-half-legal .rs-details>div{grid-template-columns:24mm 1fr;min-height:5.5mm}
            .rs-paper-half-legal .rs-details i{font-size:10.5px}
            .rs-paper-half-legal .rs-details strong,.rs-paper-half-legal .rs-details span{font-size:11.5px}
            .rs-paper-half-legal .rs-payee-summary span{font-size:10px;line-height:1.25}
            .rs-paper-half-legal .rs-signing-space{min-height:8mm}
            .rs-paper-half-legal .rs-certification{column-gap:8mm;padding:0 2mm 1.5mm}
            .rs-paper-half-legal .rs-print-info,.rs-paper-half-legal .rs-budget-certification,.rs-paper-half-legal .rs-signature-certification{font-size:8.5px}
            .rs-paper-half-legal .rs-budget-certification{width:45mm}
            .rs-paper-half-legal .rs-certification-stockroom{grid-template-columns:minmax(31mm,1fr) repeat(3,minmax(31mm,39mm));column-gap:3mm}
            .rs-paper-half-legal .rs-footer-signature{font-size:9px}
            .rs-paper-half-legal .rs-footer-signature div{height:3mm}
            .rs-paper-half-legal .rs-footer{font-size:8px;line-height:1.18;padding-top:1.5mm}
            .rs-paper-half-legal .rs-footer p{margin-top:1mm}
            @media(max-width:720px){.rs-print-overlay{padding:118px 12px 28px}.rs-print-toolbar{left:12px;right:12px;top:12px;flex-wrap:wrap}.rs-paper-selector{order:3;flex:1 0 100%}.rs-paper-selector select{max-width:none;min-width:0;flex:1}}
            @media print{
                html,body{margin:0!important;padding:0!important;width:auto!important;min-height:auto!important}
                body>*:not(.rs-print-overlay){display:none!important}
                body *{visibility:hidden!important}.rs-print-page,.rs-print-page *{visibility:visible!important}
                .rs-print-overlay{position:static!important;width:auto!important;background:none!important;padding:0!important}
                .rs-print-page{position:static!important;width:${selectedPaper.width}!important;min-height:${printPaperHeight}!important;margin:0!important;padding:0!important;box-shadow:none!important}
                .rs-sheet{width:${selectedPaper.width}!important;min-height:${printLayoutHeight}!important;padding:${sheetPadding}!important;-webkit-box-decoration-break:clone;box-decoration-break:clone}
                .rs-print-toolbar{display:none!important}
                @page{size:${printPageSize};margin:0}
            }
        `}</style>
    </div>, document.body);
}
