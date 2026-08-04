import { useEffect, useState } from 'react';
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
    { id: 'letter-portrait', label: 'Letter — Portrait (8.5 × 11 in)', width: '8.5in', height: '11in', layoutHeight: '11in', pageSize: 'Letter portrait', margin: '.2in', compact: false },
    { id: 'half-legal-crosswise', label: 'Half Legal — PDF / Modern Printer (8.5 × 7 in)', width: '8.5in', height: '7in', layoutHeight: '7in', pageSize: '8.5in 7in', margin: '.3in', compact: true },
    { id: 'half-legal-on-letter', label: 'Half Legal — Legacy Printer on Letter (Recommended)', width: '8.5in', height: '11in', layoutHeight: '7in', pageSize: 'Letter portrait', margin: '.3in', compact: true },
    { id: 'half-legal-on-legal', label: 'Half Legal — On Full Legal Sheet', width: '8.5in', height: '14in', layoutHeight: '7in', pageSize: 'Legal portrait', margin: '.3in', compact: true },
    { id: 'half-institution-legal-crosswise', label: 'Half Institution Legal — PDF / Modern Printer (8.5 × 6.5 in)', width: '8.5in', height: '6.5in', layoutHeight: '6.5in', pageSize: '8.5in 6.5in', margin: '.3in', compact: true },
    { id: 'half-institution-legal-on-letter', label: 'Half Institution Legal — Legacy Printer on Letter (Recommended)', width: '8.5in', height: '11in', layoutHeight: '6.5in', pageSize: 'Letter portrait', margin: '.3in', compact: true },
    { id: 'half-institution-legal-on-full-sheet', label: 'Half Institution Legal — On Full 8.5 × 13 Sheet', width: '8.5in', height: '13in', layoutHeight: '6.5in', pageSize: '8.5in 13in', margin: '.3in', compact: true },
    { id: 'institution-legal-portrait', label: 'Institution Legal / Long Bond — Portrait (8.5 × 13 in)', width: '8.5in', height: '13in', layoutHeight: '13in', pageSize: '8.5in 13in', margin: '.3in', compact: false },
    { id: 'legal-portrait', label: 'Legal — Portrait (8.5 × 14 in)', width: '8.5in', height: '14in', layoutHeight: '14in', pageSize: 'Legal portrait', margin: '.3in', compact: false },
    { id: 'a4-portrait', label: 'A4 — Portrait (210 × 297 mm)', width: '210mm', height: '297mm', layoutHeight: '297mm', pageSize: 'A4 portrait', margin: '.3in', compact: false },
    { id: 'letter-landscape', label: 'Letter — Landscape (11 × 8.5 in)', width: '11in', height: '8.5in', layoutHeight: '8.5in', pageSize: 'Letter landscape', margin: '.3in', compact: false },
    { id: 'institution-legal-landscape', label: 'Institution Legal / Long Bond — Landscape (13 × 8.5 in)', width: '13in', height: '8.5in', layoutHeight: '8.5in', pageSize: '13in 8.5in', margin: '.3in', compact: false },
    { id: 'legal-landscape', label: 'Legal — Landscape (14 × 8.5 in)', width: '14in', height: '8.5in', layoutHeight: '8.5in', pageSize: 'Legal landscape', margin: '.3in', compact: false },
    { id: 'a4-landscape', label: 'A4 — Landscape (297 × 210 mm)', width: '297mm', height: '210mm', layoutHeight: '210mm', pageSize: 'A4 landscape', margin: '.3in', compact: false },
    { id: 'printer-default', label: 'Printer Default / Any Paper', width: '8.5in', height: '11in', layoutHeight: '11in', pageSize: 'auto', margin: '.3in', compact: false },
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

export function RSPrintPreview({ row, items, payeeDetail, onClose }: {
    row: RSProcessRow; items: RSLineItem[]; payeeDetail: PayeeDetail | null; onClose: () => void;
}) {
    const money = (value: number | null | undefined) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);
    const printedAt = new Date();
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
    const isHalfLegal = selectedPaper.compact;
    const isHalfInstitutionLegal = paperId.startsWith('half-institution-legal');
    const isPrinterDefault = paperId === 'printer-default';
    const hasHalfLegalCutGuide = paperId === 'half-legal-on-letter'
        || paperId === 'half-legal-on-legal'
        || paperId === 'half-institution-legal-on-letter'
        || paperId === 'half-institution-legal-on-full-sheet';
    const sheetPadding = paperId === 'half-institution-legal-on-letter'
        ? '.15in .3in .3in'
        : paperId === 'half-legal-on-letter'
            ? '.08in .3in .3in'
            : selectedPaper.margin;

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

    return createPortal(<div className="rs-print-overlay" onClick={onClose}>
        <div className="rs-print-toolbar" onClick={event => event.stopPropagation()}>
            <label className="rs-paper-selector">
                <span>Paper</span>
                <select value={paperId} onChange={event => setPaperId(event.target.value as RsPaperId)} aria-label="Requisition Slip paper size">
                    {RS_PAPER_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
            </label>
            <button onClick={() => window.print()}><Printer size={16} /> Print</button>
            <button onClick={onClose}><X size={16} /> Close</button>
        </div>
        <article
            className={`rs-print-page${isHalfLegal ? ' rs-paper-half-legal' : ''}${isHalfInstitutionLegal ? ' rs-paper-half-institution' : ''}${isPrinterDefault ? ' rs-paper-printer-default' : ''}`}
            style={{ width: selectedPaper.width, minHeight: selectedPaper.height }}
            onClick={event => event.stopPropagation()}
        >
            <div className="rs-sheet" style={{ width: selectedPaper.width, minHeight: selectedPaper.layoutHeight, padding: sheetPadding }}>
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
                    <section className="rs-certification">
                        <div className="rs-print-info">
                            <span>Print Date: {printDate}</span><span>Print Time: {printTime}</span>
                            <span>Printed By: {row.requested_by || '—'}</span>
                        </div>
                        <div className="rs-budget-certification">
                            <span>Budget Certified By:</span>
                            <div className="rs-controller-signature"><div /><span>Controller</span></div>
                        </div>
                    </section>
                    <p>“In compliance with the requirement of the Data Privacy Act, we would like to secure your consent on the general use and sharing of information obtained from you in the course of transaction/s with any employee of the Adu Finance department. These data, which includes your sensitive or personal information, may be collected, processed or stored in accordance with the AdU retention and disposal policies for legitimate purposes. They may be used to implement transactions which you request, allow or authorize, and to comply with the AdU internal policies and its reporting obligations to government authorities under applicable laws.”</p>
                </footer>
            </div>
            {hasHalfLegalCutGuide && <div className="rs-half-legal-cut-guide" aria-hidden="true" />}
        </article>
        <style>{`
            .rs-print-overlay{position:fixed;inset:0;z-index:200000;background:rgba(15,23,42,.76);overflow:auto;padding:70px 20px 40px}
            .rs-print-toolbar{position:fixed;right:24px;top:18px;z-index:200001;display:flex;align-items:stretch;gap:8px;max-width:calc(100vw - 48px)}
            .rs-print-toolbar button{display:flex;align-items:center;gap:7px;border:1px solid #000;border-radius:7px;background:#fff;color:#000;padding:9px 15px;font:700 12px Arial;cursor:pointer}
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
            .rs-print-info{display:flex;flex-direction:column;font-size:10.5px;line-height:1.5}
            .rs-budget-certification{width:52mm;font-size:10.5px;text-align:left}
            .rs-controller-signature{width:52mm;text-align:center;font-size:11.5px}.rs-controller-signature div{height:6mm;border-bottom:1px solid #000}.rs-controller-signature span{display:block;margin-top:2px}
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
            .rs-paper-half-legal .rs-print-info,.rs-paper-half-legal .rs-budget-certification{font-size:8.5px}
            .rs-paper-half-legal .rs-budget-certification,.rs-paper-half-legal .rs-controller-signature{width:45mm}
            .rs-paper-half-legal .rs-controller-signature{font-size:9px}
            .rs-paper-half-legal .rs-controller-signature div{height:3mm}
            .rs-paper-half-legal .rs-footer{font-size:8px;line-height:1.18;padding-top:1.5mm}
            .rs-paper-half-legal .rs-footer p{margin-top:1mm}
            .rs-paper-half-institution .rs-report-header{min-height:8mm}
            .rs-paper-half-institution .rs-review-dates{padding-bottom:.5mm}
            .rs-paper-half-institution .rs-details{min-height:22mm;padding:2mm 5mm 1mm}
            .rs-paper-half-institution .rs-details>div{min-height:5mm}
            .rs-paper-half-institution .rs-signing-space{min-height:3mm}
            .rs-paper-half-institution .rs-certification{padding-bottom:.5mm}
            .rs-paper-half-institution .rs-footer{line-height:1.12;padding-top:.75mm}
            .rs-paper-half-institution .rs-footer p{margin-top:.5mm}
            .rs-half-legal-cut-guide{box-sizing:border-box;width:100%;height:0;border-top:1px dashed #64748b}
            @media(max-width:720px){.rs-print-overlay{padding:118px 12px 28px}.rs-print-toolbar{left:12px;right:12px;top:12px;flex-wrap:wrap}.rs-paper-selector{order:3;flex:1 0 100%}.rs-paper-selector select{max-width:none;min-width:0;flex:1}}
            @media print{
                html,body{margin:0!important;padding:0!important;width:auto!important;min-height:auto!important}
                body>*:not(.rs-print-overlay){display:none!important}
                body *{visibility:hidden!important}.rs-print-page,.rs-print-page *{visibility:visible!important}
                .rs-print-overlay{position:static!important;width:auto!important;background:none!important;padding:0!important}
                .rs-print-page{position:static!important;width:${isPrinterDefault ? '100%' : selectedPaper.width}!important;min-height:${isPrinterDefault ? 'auto' : selectedPaper.height}!important;margin:0!important;padding:0!important;box-shadow:none!important}
                .rs-sheet{width:${isPrinterDefault ? '100%' : selectedPaper.width}!important;min-height:${isPrinterDefault ? 'auto' : selectedPaper.layoutHeight}!important;padding:${sheetPadding}!important;-webkit-box-decoration-break:clone;box-decoration-break:clone}
                .rs-paper-printer-default,.rs-paper-printer-default .rs-sheet{min-height:auto!important}
                .rs-print-toolbar{display:none!important}
                .rs-half-legal-cut-guide{width:${selectedPaper.width}!important}
                @page{size:${selectedPaper.pageSize};margin:0}
            }
        `}</style>
    </div>, document.body);
}
