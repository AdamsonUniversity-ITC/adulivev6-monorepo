# ABMS-RS-20260811-007 — Cashier Reimbursement/Replenishment Minimum

### Task ID

ABMS-RS-20260811-007

### Feature / Context

ABMS Budget Request Entry Cashier requisition finalization.

### Objective

Apply the PHP 1,000 Cashier finalization minimum only to the exact `Reimbursement/Replenishment` payment form.

---

### Requirements

- Require at least PHP 1,000 only when a Cashier requisition uses the exact stored payment form `Reimbursement/Replenishment`.
- Allow every other Cashier payment form, including Supplier/Water, Honorarium, Cash Advance, Employee Benefits, and PNB Credit Card Payment, to finalize below PHP 1,000.
- Enforce the same rule in the frontend finalization controls and the authoritative backend finalization endpoint.
- Keep the existing minimum inclusive so exactly PHP 1,000 remains valid.
- Preserve item, payee, form-specific payee-detail, numbering, balance, and workflow validation.
- Do not migrate or modify existing requisitions.

---

### Acceptance Criteria

- A valid Cashier `Reimbursement/Replenishment` requisition totaling PHP 999.99 receives the minimum validation error and remains unnumbered and unrouted.
- A valid Cashier `Reimbursement/Replenishment` requisition totaling exactly PHP 1,000 finalizes normally.
- A valid Cashier requisition using Supplier/Water, PNB Credit Card Payment, or another payment form can finalize below PHP 1,000.
- The frontend disables Save and displays the payment-form-specific warning only for a below-minimum Cashier `Reimbursement/Replenishment` requisition.
- Draft total synchronization remains available below PHP 1,000.
- Focused backend tests and the ABMS production build pass, or unrelated pre-existing failures are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Cashier requisition type, exact stored payment form, stored live items, payee details, and backend-calculated total.

**Outputs:**

- Normal finalization for eligible requests, or a `422` `total_amount` validation response for a below-minimum `Reimbursement/Replenishment` request.

---

### Agent Assignment

- frontend_agent: Narrow the RS form minimum guard and warning to Reimbursement/Replenishment.
- backend_agent: Narrow the authoritative transactional minimum validation.
- qa_agent: Verify the restricted form, boundary, and unrestricted payment-form paths.
- reviewer_agent: Review exact-form matching and unchanged financial/workflow behavior.
- project_manager: Maintain this task record and ABMS continuity documentation.

---

### Dependencies

- Existing Cashier payment-form options and payee validation.
- Existing transactional requisition finalization and backend total recalculation.

---

### Edge Cases

- Reimbursement/Replenishment totals of PHP 999.99 and exactly PHP 1,000.
- Another Cashier payment form below PHP 1,000.
- A below-minimum draft total synchronization that is not finalization.
- A missing payee or empty item list independent of the minimum rule.
- A non-Cashier requisition below PHP 1,000.

---

### Notes

- State: IN_REVIEW
- Payment-form matching uses the canonical exact option value after frontend and backend whitespace trimming.
- This supersedes the broader rule recorded in task `ABMS-RS-20260809-003`.
- No migration, backfill, or deployment-time data mutation is required.
- Verification: five focused minimum-rule tests passed with 17 assertions; the full adjacent backend feature file passed with 54 tests and 362 assertions; PHP syntax checks, focused Pint, diff checks, and the ABMS production build passed.
- Focused lint reports only the four pre-existing `react-refresh/only-export-components` findings in `RSFormModal.tsx`; the modified minimum-rule expressions add no lint finding. The ABMS-wide lint remains at its existing baseline of 108 errors and 11 warnings, and monorepo lint stops earlier because the shared UI package has 14 pre-existing warnings under a zero-warning policy.
