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
    const selectedRsType = (row.rstype || '').toLowerCase();
    const isSelectedRsType = (id: typeof RS_TYPE_OPTIONS[number]['id']) => selectedRsType.includes(id)
        || (id === 'stockroom' && (selectedRsType.includes('office supplies') || selectedRsType.includes('wico')))
        || (id === 'logistics' && selectedRsType.includes('purchase'))
        || (id === 'cashier' && (selectedRsType.includes('cash valued') || selectedRsType.includes('accounting')));
    const rsTypeLabel = RS_TYPE_OPTIONS.find(option => isSelectedRsType(option.id))?.label || row.rstype || '—';
    const [reviewedDate, setReviewedDate] = useState<string | null>(null);
    const [certifiedDate, setCertifiedDate] = useState<string | null>(null);
    const [printAccountCodes, setPrintAccountCodes] = useState<Record<number, string>>({});

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
            <button onClick={() => window.print()}><Printer size={16} /> Print</button>
            <button onClick={onClose}><X size={16} /> Close</button>
        </div>
        <article className="rs-print-page" onClick={event => event.stopPropagation()}>
            <div className="rs-sheet">
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
                        {payeeDetail && <div className="rs-payee-summary">
                            <i>Payee Details:</i>
                            <span>
                                TIN: {payeeDetail.tin || '—'} · {payeeDetail.is_vat_registered ? 'VAT Registered' : 'Non-VAT Registered'}
                                {' · '}{payeeDetail.is_adu_employee ? 'AdU Employee' : 'Non-AdU Employee'}
                                {modeOfPayment && ` · ${modeOfPayment}`}
                                {payeeDetail.is_bank && payeeDetail.bank_name && ` · ${payeeDetail.bank_name}`}
                                {payeeDetail.is_bank && payeeDetail.account_name && ` / ${payeeDetail.account_name}`}
                                {payeeDetail.is_bank && payeeDetail.account_number && ` / ${payeeDetail.account_number}`}
                            </span>
                        </div>}
                        {!payeeDetail && row.payment_form && <div><i>Mode of Payment:</i><span>{row.payment_form}</span></div>}
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
        </article>
        <style>{`
            .rs-print-overlay{position:fixed;inset:0;z-index:20000;background:rgba(15,23,42,.76);overflow:auto;padding:70px 20px 40px}
            .rs-print-toolbar{position:fixed;right:24px;top:18px;z-index:20001;display:flex;gap:8px}
            .rs-print-toolbar button{display:flex;align-items:center;gap:7px;border:1px solid #000;border-radius:7px;background:#fff;color:#000;padding:9px 15px;font:700 12px Arial;cursor:pointer}
            .rs-print-page{box-sizing:border-box;width:8.5in;min-height:11in;margin:auto;background:#fff;color:#000;padding:2.5mm;font:12px Arial,sans-serif;box-shadow:0 10px 40px #000}
            .rs-sheet{box-sizing:border-box;min-height:calc(11in - 5mm);padding:6mm 5mm 4mm;display:flex;flex-direction:column}
            .rs-report-header{min-height:16mm}
            .rs-review-dates{display:grid;grid-template-columns:auto 1fr;align-self:flex-start;gap:3px 8px;width:58mm;font-size:10px;padding:0 0 2mm}
            .rs-title{text-align:center}.rs-title h1{font-size:22px;font-weight:400;letter-spacing:.5px;margin:0;color:#000}.rs-title h2{font-size:14px;margin:3px 0 0;color:#000}
            .rs-information-box{border:1px solid #000;display:flex;flex:1;flex-direction:column}
            .rs-document-meta{display:grid;grid-template-columns:1.5fr 1fr}
            .rs-document-meta>div{box-sizing:border-box;display:flex;gap:8px;min-height:8mm;align-items:center;padding:4px 7px;border-bottom:1px solid #000}
            .rs-document-meta>div:nth-child(odd){border-right:1px solid #000}
            .rs-document-meta b{font-size:10px;font-weight:400}.rs-document-meta span{font-size:12px}
            .rs-status{text-transform:uppercase}
            .rs-items{width:100%;border-collapse:collapse;table-layout:fixed}.rs-items th,.rs-items td{border:1px solid #000;padding:6px 7px;vertical-align:middle}.rs-items th:first-child,.rs-items td:first-child{border-left:0}.rs-items th:last-child,.rs-items td:last-child{border-right:0}
            .rs-items th{font-size:10px;font-weight:400;text-align:center}.rs-items th:nth-child(1){width:12%}.rs-items th:nth-child(2){width:35%}.rs-items th:nth-child(3){width:9%}.rs-items th:nth-child(4){width:10%}.rs-items th:nth-child(5),.rs-items th:nth-child(6){width:17%}
            .rs-items tbody td{font-size:12px;height:9mm}.rs-items tfoot td{font-size:12px;border-top:0}.rs-items tfoot td:last-child{font-weight:700;font-size:14px}.right{text-align:right}.center{text-align:center}.empty{text-align:center;padding:14px!important}
            .rs-details{box-sizing:border-box;min-height:34mm;padding:6mm 8mm 5mm}.rs-details>div{display:grid;grid-template-columns:25mm 1fr;gap:7px;min-height:7mm;align-items:start}.rs-details i{font-size:11px}.rs-details strong{font-size:13px}.rs-payee-summary span{font-size:11px;line-height:1.5}
            .rs-signing-space{flex:1;min-height:45mm}
            .rs-certification{display:grid;grid-template-columns:1fr auto;column-gap:14mm;align-items:end;padding:0 3mm 3mm}
            .rs-print-info{display:flex;flex-direction:column;font-size:9px;line-height:1.5}
            .rs-budget-certification{width:48mm;font-size:9px;text-align:left}
            .rs-controller-signature{width:48mm;text-align:center;font-size:10px}.rs-controller-signature div{height:5mm;border-bottom:1px solid #000}.rs-controller-signature span{display:block;margin-top:2px}
            .rs-footer{font-size:8px;line-height:1.25;padding-top:4mm;text-align:justify}
            .rs-footer p{margin:2mm 0 0}
            @media print{
                body *{visibility:hidden!important}.rs-print-page,.rs-print-page *{visibility:visible!important}
                .rs-print-page{position:absolute;left:0;top:0;width:8.5in;min-height:11in;margin:0;padding:2.5mm;box-shadow:none}
                .rs-print-overlay{position:static;background:none!important;padding:0}.rs-print-toolbar{display:none!important}
                @page{size:Letter portrait;margin:0}
            }
        `}</style>
    </div>, document.body);
}
