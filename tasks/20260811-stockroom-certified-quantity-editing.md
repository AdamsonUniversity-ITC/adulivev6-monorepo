# ABMS-RS-20260811-005 — Certified Stockroom Quantity Editing

### Task ID

ABMS-RS-20260811-005

### Feature / Context

Stockroom Requisition Process item fulfillment and financial reconciliation.

### Objective

Allow Stockroom users to adjust item quantities, including zero, only for Certified Stockroom-type requisitions before they are served.

---

### Requirements

- Show quantity editing only for authenticated `stockroom-access` users.
- Require normalized `rstype = stockroom`, `status = certified`, and `location = stockroom`.
- Permit each quantity to be an integer from zero through the supported database range.
- Treat zero quantity as an unserved item and recalculate its total cost to zero.
- Accept only item ID and quantity in the dedicated Stockroom endpoint.
- Lock the requisition, its live items, affected account allocations, and proposals inside one transaction.
- Reject foreign item IDs and ambiguous or missing account allocations without partial writes.
- Recalculate each edited item total from its stored unit cost using exact cents.
- Aggregate allocation and proposal deltas before applying exact balance changes.
- Recalculate the requisition header total from all live items.
- Preserve item account, description, unit cost, unit of measurement, quoted price, review state, and unused amount.
- Reject Served requisitions and every other type, status, location, or unauthorized role.
- Keep liquidated, returned, or unused-amount items locked.
- Use the existing financial idempotency middleware.
- Add no migration or historical-data rewrite.

---

### Acceptance Criteria

- A Stockroom user can change a Certified Stockroom RS item quantity to zero.
- Setting quantity to zero sets that item total to `0.00`, refunds the exact old total to its allocation and proposal, and updates the header total.
- Partial quantities recalculate item, header, allocation, and proposal values exactly.
- Multiple edits sharing an allocation are aggregated before resulting balances are committed.
- Quantity remains the only editable item field in this workflow.
- Served, non-Stockroom-type, wrong-location, foreign-item, invalid-quantity, and unauthorized submissions fail without mutation.
- The Edit Quantities control is absent at Served status.
- Backend feature tests and frontend build pass; lint results are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Certified Stockroom requisition ID and a list of item IDs with nonnegative integer quantities.

**Outputs:**

- Authoritative updated items, requisition total, allocation balances, and proposal balance, or a guarded error with no partial write.

---

### Agent Assignment

- frontend_agent: Add stage-scoped quantity inputs and consume the dedicated endpoint.
- qa_agent: Verify exact calculations, zero quantities, stage/type/location/role failures, build, and regression tests.
- reviewer_agent: Review authorization, locking, idempotency, precision, and balance integrity.
- project_manager: Maintain task and continuity documentation.

---

### Dependencies

- Existing Requisition Process item table and financial idempotency middleware.
- Stored requisition item account IDs and typed-unit proposal allocations.
- Exact-cent `Money` support.

---

### Edge Cases

- All items are changed to zero and the header total becomes zero.
- Several edited items share one allocation.
- An edit increases quantity and requires sufficient allocation and proposal balances.
- A stale Certified modal submits after the RS becomes Served.
- An item has a missing account ID, ambiguous allocation, returned amount, or unsupported monetary total.
- A submitted item belongs to another requisition.

---

### Notes

- State: IN_REVIEW
- Quantity increases remain possible only when both allocation and proposal balances can fund the exact delta; reductions refund the exact delta.
- No migration or backfill is required.
- Verification: focused Stockroom tests passed, 6 tests and 46 assertions.
- Verification: the complete requisition account/refund regression file passed, 50 tests and 343 assertions.
- Verification: `pnpm --filter abms build` passed with only the existing large-chunk advisory.
- Verification: changed PHP files passed syntax validation.
- Verification: frontend and backend `git diff --check` passed.
- Follow-up fix: added `/requisition-process/{id}/stockroom-quantities` to the shared frontend financial-mutation matcher so production requests receive the required UUID `Idempotency-Key` and retain it across transport retries.
- Follow-up verification: the ABMS production build and `git diff --check` passed after the matcher fix. The axios package has no standalone ESLint configuration or TypeScript project; its source is compiled through the passing ABMS build.
- Follow-up fix: Stockroom now handles the modal's successful `Save Items` callback by synchronizing authoritative items and the recalculated total and showing a success toast; it no longer falls through to the generic “isn't wired up” message.
- Callback-fix verification: ABMS production build and `git diff --check` passed. Focused `StockroomView.tsx` lint retains its pre-existing baseline of five explicit-`any` errors and one hook dependency warning; the new callback block introduced no reported finding.
- Verification: focused component ESLint remains blocked by the unchanged `RSProcessModal.tsx` baseline of 29 errors and 1 warning.
- Authenticated browser verification remains for the Certified editor visibility, zero-quantity display, worklist refresh, and Served lock.
