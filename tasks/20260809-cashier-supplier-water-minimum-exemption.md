# ABMS-RS-20260809-003 — Cashier Supplier/Water Minimum Exemption

### Task ID

ABMS-RS-20260809-003

### Feature / Context

ABMS Budget Request Entry Cashier requisition finalization.

### Objective

Allow Cashier requisitions using `Payment for Supplier/Water` to be finalized below PHP 1,000.

---

### Requirements

- Exempt the exact stored payment form `Payment for Supplier/Water` from the PHP 1,000 Cashier finalization minimum.
- Preserve the existing exact `PNB Credit Card Payment` exemption.
- Enforce the same exemption in the frontend finalization controls and backend finalization endpoint.
- Keep the PHP 1,000 minimum for every other Cashier payment form.
- Preserve existing payee, TIN, and VAT/Non-VAT validation for Supplier/Water requisitions.
- Do not change requisition amounts, balances, numbering, workflow routing, or historical data outside normal finalization behavior.

---

### Acceptance Criteria

- A valid Supplier/Water Cashier requisition with at least one item and a total below PHP 1,000 can be finalized.
- The frontend Save action is not blocked by the minimum solely because a valid Supplier/Water total is below PHP 1,000.
- The existing PNB Credit Card Payment exemption continues to work.
- Another Cashier payment form below PHP 1,000 receives the existing validation error and is not numbered or routed.
- Supplier/Water payee, TIN, and VAT classification requirements remain unchanged.
- Focused backend tests and the ABMS production build pass, or unrelated pre-existing failures are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- A Cashier requisition with stored payment form, valid payee details, at least one live item, and a backend-calculated total.

**Outputs:**

- Successful normal finalization for exempt forms below PHP 1,000, or the existing `422` minimum validation response for non-exempt forms.

---

### Agent Assignment

- frontend_agent: Update the RS form minimum guard for the Supplier/Water exemption.
- backend_agent: Update the authoritative finalization rule for both exact exempt forms.
- qa_agent: Verify both exemptions and the non-exempt failure path.
- reviewer_agent: Review exact payment-form matching and unchanged financial/workflow behavior.
- project_manager: Maintain this task record and ABMS continuity documentation.

---

### Dependencies

- Existing Cashier payment-form options and Supplier/Water payee validation.
- Existing requisition finalization and numbering transaction.

---

### Edge Cases

- A Supplier/Water requisition is below PHP 1,000 but has no items.
- A Supplier/Water requisition is missing its payee or required payee classifications.
- A non-exempt Cashier payment form is below PHP 1,000.
- A client submits a near-match rather than the exact stored exempt payment-form value.
- A non-Cashier requisition is finalized below PHP 1,000.

---

### Notes

- State: IN_REVIEW
- The exemption changes only the Cashier minimum guard; it does not bypass other creation or finalization validation.
- No migration, backfill, or deployment-time data mutation is required.
- Verification: the three focused minimum-rule tests passed with 11 assertions; the full adjacent backend feature file passed with 45 tests/297 assertions; focused Pint and the ABMS production build passed.
- ABMS lint retains the existing baseline of 113 errors and 11 warnings, including four pre-existing Fast Refresh findings in `RSFormModal.tsx`; the new exemption lines add no reported lint finding. The monorepo-wide build is separately blocked by the existing `online-2nd-5th-month-evaluation` TypeScript `NodeNext` configuration, while the ABMS build succeeds.
