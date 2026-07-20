import { formatStatusLabel } from '@/components/drs-ui.tsx';

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

function formatMoney(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return '-';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString();
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatReceiveMode(mode: DRSApplicationDetail['receive_mode']): string {
  const labels: Record<DRSApplicationDetail['receive_mode'], string> = {
    delivery: 'Delivery',
    pickup: 'Pickup',
  };

  return labels[mode] ?? formatStatusLabel(mode);
}

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
  const total =
    typeof app.payment_total === 'number' ? app.payment_total : computedTotal;

  return {
    lineSubtotal,
    otherFees,
    otherFeesTotal,
    total,
    hasAmount:
      lines.some((line) => line.amount != null) ||
      otherFees.length > 0 ||
      total > 0,
  };
}

function valueOrDash(value: string | number | null | undefined): string {
  if (value == null || value === '') return '-';

  return String(value);
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
  const receiptReference =
    paymentVerification?.reference_number ||
    paymentSubmission?.reference_number ||
    requestReference;

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
            <span>Receipt reference</span>
            <strong>{receiptReference}</strong>
          </div>
        </header>

        <dl className="drs-receipt-grid">
          <ReceiptField label="DRS reference" value={requestReference} />
          <ReceiptField
            label="Printed"
            value={formatDateTime(printedAt ?? new Date())}
          />
          <ReceiptField
            label="Submitted"
            value={formatDateTime(app.created_at)}
          />
          <ReceiptField
            label="Current status"
            value={app.current_stage?.name ?? formatStatusLabel(app.status)}
          />
          <ReceiptField
            label="Payment status"
            value={app.is_paid ? 'Paid' : 'Unpaid'}
          />
          <ReceiptField
            label="Receive mode"
            value={formatReceiveMode(app.receive_mode)}
          />
          <ReceiptField
            label="Secure email (PDF)"
            value={app.secure_email_requested ? 'Yes' : 'No'}
          />
        </dl>

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
            {app.delivery_tracking_number ? (
              <ReceiptField
                label="Delivery tracking no."
                value={app.delivery_tracking_number}
              />
            ) : null}
            {app.pickup_date ? (
              <ReceiptField
                label="Pickup date"
                value={formatDate(app.pickup_date)}
              />
            ) : null}
          </dl>
        </section>

        <section className="drs-receipt-section">
          <h2>Requested Documents</h2>
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
                        : formatMoney(line.unitPrice)}
                    </td>
                    <td>
                      {line.amount == null ? '-' : formatMoney(line.amount)}
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
                  <td>{formatMoney(fee.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={3}>
                  Line subtotal
                </th>
                <td>{formatMoney(totals.lineSubtotal)}</td>
              </tr>
              <tr>
                <th scope="row" colSpan={3}>
                  Other fees
                </th>
                <td>{formatMoney(totals.otherFeesTotal)}</td>
              </tr>
              <tr>
                <th scope="row" colSpan={3}>
                  Total amount
                </th>
                <td>{formatMoney(totals.total)}</td>
              </tr>
            </tfoot>
          </table>
          {!totals.hasAmount ? (
            <p className="drs-receipt-note">
              No assessed payment amount has been recorded for this request.
            </p>
          ) : null}
        </section>

        <section className="drs-receipt-section">
          <h2>Payment References</h2>
          <dl className="drs-receipt-grid">
            <ReceiptField
              label="Student payment reference"
              value={paymentSubmission?.reference_number}
            />
            <ReceiptField
              label="Payment submitted"
              value={formatDateTime(paymentSubmission?.submitted_at)}
            />
            <ReceiptField
              label="Mode of payment"
              value={app.payment_method?.name}
            />
            <ReceiptField
              label="Payment notes"
              value={app.payment_method?.description}
            />
            <ReceiptField
              label="Registrar reference / OR no."
              value={paymentVerification?.reference_number}
            />
            <ReceiptField
              label="Verified"
              value={formatDateTime(paymentVerification?.verified_at)}
            />
          </dl>
          {paymentSubmission?.remarks ? (
            <p className="drs-receipt-note">
              Student remarks: {paymentSubmission.remarks}
            </p>
          ) : null}
          {paymentVerification?.remarks ? (
            <p className="drs-receipt-note">
              Registrar remarks: {paymentVerification.remarks}
            </p>
          ) : null}
        </section>

        {app.purpose || app.remarks ? (
          <section className="drs-receipt-section">
            <h2>Request Notes</h2>
            {app.purpose ? (
              <p className="drs-receipt-note">Purpose: {app.purpose}</p>
            ) : null}
            {app.remarks ? (
              <p className="drs-receipt-note">Remarks: {app.remarks}</p>
            ) : null}
          </section>
        ) : null}

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
