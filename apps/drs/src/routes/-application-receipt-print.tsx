import { formatStatusLabel } from '@/components/drs-ui.tsx';

import {
  formatPrintDateTime,
  formatPrintMoney,
  formatPrintReceiveMode,
  valueOrDash,
} from './-lib/print-format.ts';
import {
  displayApplicationRef,
  type DRSApplicationDetail,
} from './-lib/types/applications.ts';

type ApplicationReceiptPrintProps = {
  app: DRSApplicationDetail;
  printedAt: Date | null;
};

type ReceiptLine = {
  id: string;
  label: string;
  quantity: number;
  unitPrice: number | null;
  amount: number | null;
};

function receiptLinesFor(app: DRSApplicationDetail): ReceiptLine[] {
  return (
    app.lines
      ?.filter((line) => !line.is_cancelled)
      .map((line) => {
        const unitPrice = line.assessed_unit_price ?? null;
        return {
          id: line.id,
          label: line.request_name,
          quantity: line.quantity,
          unitPrice,
          amount: unitPrice == null ? null : unitPrice * line.quantity,
        };
      }) ?? []
  );
}

function receiptTotalsFor(app: DRSApplicationDetail, lines: ReceiptLine[]) {
  const lineSubtotal = lines.reduce((sum, line) => sum + (line.amount ?? 0), 0);
  const otherFees =
    app.assessment_other_fees?.map((fee, index) => ({
      id: `${fee.fee_name}-${index}`,
      label: fee.fee_name,
      amount: fee.amount,
    })) ?? [];
  const otherFeesTotal = otherFees.reduce((sum, fee) => sum + fee.amount, 0);
  const computedTotal = lineSubtotal + otherFeesTotal;
  const currency = app.payment_currency ?? app.assessment_currency ?? 'PHP';
  const total =
    typeof app.payment_total === 'number' ? app.payment_total : computedTotal;

  return {
    lineSubtotal,
    otherFees,
    otherFeesTotal,
    total,
    currency,
    hasAmount:
      lines.some((line) => line.amount != null) ||
      otherFees.length > 0 ||
      total > 0,
  };
}

function ReceiptField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="drs-receipt-field">
      <dt>{label}</dt>
      <dd>{valueOrDash(value)}</dd>
    </div>
  );
}

export function ApplicationReceiptPrint({
  app,
  printedAt,
}: ApplicationReceiptPrintProps) {
  const requestReference = displayApplicationRef(app);
  const lines = receiptLinesFor(app);
  const totals = receiptTotalsFor(app, lines);
  const paymentSubmission = app.payment_submission;
  const paymentVerification = app.payment_verification;
  const clearances = app.clearances ?? [];

  return (
    <section className="drs-print-receipt" aria-label="DRS receipt print view">
      <div className="drs-receipt-paper">
        <header className="drs-receipt-header">
          <div>
            <p className="drs-receipt-kicker">Document Request Service</p>
            <h1>Student Receipt</h1>
            <p>Adamson University Registrar</p>
          </div>
          <div className="drs-receipt-reference">
            <span>DRS reference</span>
            <strong>{requestReference}</strong>
          </div>
        </header>

        <section className="drs-receipt-section">
          <h2>Student Details</h2>
          <dl className="drs-receipt-grid">
            <ReceiptField label="Student no." value={app.student_no} />
            <ReceiptField label="Student name" value={app.student_name} />
            <ReceiptField
              label="Course"
              value={app.course_name ?? app.course_id}
            />
            <ReceiptField
              label="School year / Semester"
              value={`${app.school_year || '-'} / ${app.semester || '-'}`}
            />
            <ReceiptField label="Email" value={app.email} />
            <ReceiptField label="Contact no." value={app.contact_no} />
            {app.receive_mode === 'delivery' ? (
              <ReceiptField
                label="Delivery address"
                value={app.delivery_address}
              />
            ) : null}
          </dl>
        </section>

        <section className="drs-receipt-section">
          <h2>Clearance Details</h2>
          {clearances.length > 0 ? (
            <table className="drs-receipt-table">
              <thead>
                <tr>
                  <th scope="col">Clearance office</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {clearances.map((row) => (
                  <tr key={row.id}>
                    <td>{row.clearance_name}</td>
                    <td>{formatStatusLabel(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="drs-receipt-note">No clearance offices recorded.</p>
          )}
        </section>

        <section className="drs-receipt-section">
          <h2>Document Details</h2>
          <table className="drs-receipt-table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Qty</th>
                <th scope="col">Unit price</th>
                <th scope="col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.length > 0 ? (
                lines.map((line) => (
                  <tr key={line.id}>
                    <td>{line.label}</td>
                    <td>{line.quantity}</td>
                    <td>
                      {line.unitPrice == null
                        ? '-'
                        : formatPrintMoney(line.unitPrice, totals.currency)}
                    </td>
                    <td>
                      {line.amount == null
                        ? '-'
                        : formatPrintMoney(line.amount, totals.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>No requested documents recorded.</td>
                </tr>
              )}
              {totals.otherFees.map((fee) => (
                <tr key={fee.id}>
                  <td>{fee.label}</td>
                  <td>1</td>
                  <td>-</td>
                  <td>{formatPrintMoney(fee.amount, totals.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={3}>
                  Line subtotal
                </th>
                <td>{formatPrintMoney(totals.lineSubtotal, totals.currency)}</td>
              </tr>
              <tr>
                <th scope="row" colSpan={3}>
                  Other fees
                </th>
                <td>
                  {formatPrintMoney(totals.otherFeesTotal, totals.currency)}
                </td>
              </tr>
              <tr>
                <th scope="row" colSpan={3}>
                  Total amount
                </th>
                <td>{formatPrintMoney(totals.total, totals.currency)}</td>
              </tr>
            </tfoot>
          </table>
          <dl className="drs-receipt-grid">
            <ReceiptField
              label="Purpose of request"
              value={app.purpose}
            />
          </dl>
          {!totals.hasAmount ? (
            <p className="drs-receipt-note">
              No assessed payment amount has been recorded for this request.
            </p>
          ) : null}
        </section>

        <section className="drs-receipt-section">
          <h2>Timestamp Details</h2>
          <dl className="drs-receipt-grid">
            <ReceiptField
              label="Date printed"
              value={formatPrintDateTime(printedAt ?? new Date())}
            />
            <ReceiptField
              label="Date submitted"
              value={formatPrintDateTime(app.created_at)}
            />
            <ReceiptField
              label="Current stage"
              value={app.current_stage?.name ?? formatStatusLabel(app.status)}
            />
            <ReceiptField
              label="Receive mode"
              value={formatPrintReceiveMode(app.receive_mode)}
            />
            <ReceiptField
              label="Date paid"
              value={formatPrintDateTime(paymentSubmission?.submitted_at)}
            />
            <ReceiptField
              label="Date payment verified"
              value={formatPrintDateTime(paymentVerification?.verified_at)}
            />
            <ReceiptField
              label="Mode of payment"
              value={app.payment_method?.name}
            />
          </dl>
        </section>

        <footer className="drs-receipt-footer">
          <p>
            This receipt is generated from the Document Request Service student
            application record.
          </p>
          <p>Keep this copy for your records.</p>
        </footer>
      </div>
    </section>
  );
}
