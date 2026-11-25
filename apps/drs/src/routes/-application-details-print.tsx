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

type ApplicationDetailsPrintProps = {
  app: DRSApplicationDetail;
  printedAt: Date | null;
};

type DetailLine = {
  id: string;
  label: string;
  quantity: number;
  unitPrice: number | null;
  amount: number | null;
  isCancelled: boolean;
  optionAnswers: Array<{ label: string; value: string }>;
};

function detailLinesFor(app: DRSApplicationDetail): DetailLine[] {
  return (
    app.lines?.map((line) => {
      const unitPrice = line.assessed_unit_price ?? null;
      return {
        id: line.id,
        label: line.request_name,
        quantity: line.quantity,
        unitPrice,
        amount: unitPrice == null ? null : unitPrice * line.quantity,
        isCancelled: Boolean(line.is_cancelled),
        optionAnswers:
          line.option_answers?.map((answer) => ({
            label: answer.option_label,
            value: answer.choice_label || answer.value || '-',
          })) ?? [],
      };
    }) ?? []
  );
}

function detailTotalsFor(app: DRSApplicationDetail, lines: DetailLine[]) {
  const activeLines = lines.filter((line) => !line.isCancelled);
  const lineSubtotal = activeLines.reduce(
    (sum, line) => sum + (line.amount ?? 0),
    0,
  );
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
      activeLines.some((line) => line.amount != null) ||
      otherFees.length > 0 ||
      total > 0,
  };
}

function DetailField({
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

export function ApplicationDetailsPrint({
  app,
  printedAt,
}: ApplicationDetailsPrintProps) {
  const requestReference = displayApplicationRef(app);
  const lines = detailLinesFor(app);
  const totals = detailTotalsFor(app, lines);
  const paymentSubmission = app.payment_submission;
  const paymentVerification = app.payment_verification;
  const clearances = app.clearances ?? [];

  return (
    <section
      className="drs-print-details"
      aria-label="DRS application details print view"
    >
      <div className="drs-receipt-paper">
        <header className="drs-receipt-header">
          <div>
            <p className="drs-receipt-kicker">Document Request Service</p>
            <h1>Application Details</h1>
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
            <DetailField label="Student no." value={app.student_no} />
            <DetailField label="Student name" value={app.student_name} />
            <DetailField
              label="Course"
              value={app.course_name ?? app.course_id}
            />
            <DetailField
              label="School year / Semester"
              value={`${app.school_year || '-'} / ${app.semester || '-'}`}
            />
            <DetailField label="Email" value={app.email} />
            <DetailField label="Contact no." value={app.contact_no} />
            {app.receive_mode === 'delivery' ? (
              <DetailField
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
                    <td>
                      {line.label}
                      {line.isCancelled ? ' (cancelled)' : ''}
                      {line.optionAnswers.length > 0 ? (
                        <ul className="drs-receipt-note">
                          {line.optionAnswers.map((answer) => (
                            <li key={`${line.id}-${answer.label}`}>
                              {answer.label}: {answer.value}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
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
            <DetailField label="Purpose of request" value={app.purpose} />
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
            <DetailField
              label="Date printed"
              value={formatPrintDateTime(printedAt ?? new Date())}
            />
            <DetailField
              label="Date submitted"
              value={formatPrintDateTime(app.created_at)}
            />
            <DetailField
              label="Current stage"
              value={app.current_stage?.name ?? formatStatusLabel(app.status)}
            />
            <DetailField
              label="Receive mode"
              value={formatPrintReceiveMode(app.receive_mode)}
            />
            <DetailField
              label="Date paid"
              value={formatPrintDateTime(paymentSubmission?.submitted_at)}
            />
            <DetailField
              label="Date payment verified"
              value={formatPrintDateTime(paymentVerification?.verified_at)}
            />
            <DetailField
              label="Mode of payment"
              value={app.payment_method?.name}
            />
          </dl>
        </section>

        <footer className="drs-receipt-footer">
          <p>
            This printout is generated from the Document Request Service staff
            application record.
          </p>
          <p>For internal use.</p>
        </footer>
      </div>
    </section>
  );
}
