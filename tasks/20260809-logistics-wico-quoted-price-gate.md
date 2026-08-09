# ABMS-RS-20260809-005 — Logistics WICO Quoted-Price Gate

### Task ID

ABMS-RS-20260809-005

### Feature / Context

ABMS Logistics quoted-price and purchase workflow.

### Objective

Prevent Logistics from sending a For Purchase requisition to WICO until every live item has a quoted price accepted by Administration.

---

### Requirements

- Allow Logistics to submit one or more positive quoted prices while an RS is `for pricing` or `for purchase` at Logistics.
- Leave blank item quote inputs unchanged so remaining items can be priced in a later For Purchase cycle.
- Treat only item prices changed during the current editor session as the submitted batch; do not resubmit untouched stored prices.
- Keep Administration-accepted prices editable during later For Purchase pricing rounds so Logistics can submit a revised value for another approval cycle.
- Preserve the existing confirmation and Budget Office acceptance flow for every submitted quote batch.
- Keep Administration able to accept a partial quoted-price batch and mark the RS `for purchase` under the existing acceptance rule.
- Keep quoted-price entry available to Logistics while the RS is `for purchase` at Logistics.
- Disable `Send RS to WICO` in the frontend unless every live item has a positive quoted price and every stored unit cost equals its quoted price in cents.
- Independently enforce the same gate on the backend while locking the current requisition and live items.
- Require authenticated `logistics-access`, `status = for purchase`, and `location = logistics` for the WICO transition.
- On success, set `status = po on process`, `location = stockroom`, and `from = logistics`.
- Preserve items, accepted prices, totals, allocations, proposal balances, notes, attachments, Controller state, and liquidation flags.

---

### Acceptance Criteria

- Logistics can submit a positive quote for only some items and blank items remain unquoted.
- Administration can accept the submitted subset and return the RS to For Purchase.
- Logistics can enter remaining quotes during For Purchase and repeat the Administration acceptance cycle.
- Entering one positive price on an unaccepted item enables Review & Save even when other items remain null.
- The confirmation and API payload contain only prices changed in the current round; previously accepted items remain unchanged.
- Changing a previously accepted price includes only that item in the new batch and requires Administration to accept the revised value again.
- `Send RS to WICO` is disabled and the API returns `422` when any live item has no positive quoted price.
- `Send RS to WICO` is disabled and the API returns `422` when every quote exists but any quoted price has not been accepted into its unit cost.
- An authorized For Purchase RS with every item quoted and accepted moves to PO on Process at Stockroom.
- Unauthorized users receive `403`, while wrong status or location receives `422` without changes.
- Idempotent replay does not repeat the successful transition or audit.
- Focused backend tests, PHP formatting, targeted frontend lint, and the ABMS production build pass, or unrelated pre-existing failures are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Logistics quoted-price drafts for one or more existing item IDs.
- A Send RS to WICO action for a requisition currently at the Logistics For Purchase stage.

**Outputs:**

- Partial quotes saved and forwarded for Administration acceptance, or a guarded WICO transition/error based on complete accepted item pricing.

---

### Agent Assignment

- frontend_agent: Support blank quote drafts and mirror the complete accepted-price WICO gate.
- backend_agent: Add the locked, authorized WICO transition validation.
- qa_agent: Cover partial, missing, unaccepted, authorized, unauthorized, stale-stage, and idempotent cases.
- reviewer_agent: Review acceptance inference, locking, authorization, financial preservation, and workflow compatibility.
- project_manager: Maintain this task record and ABMS continuity documentation.

---

### Dependencies

- Existing Logistics quoted-price endpoint and Administration quoted-price acceptance endpoint.
- Existing `budget_request_entry_items.quoted_price`, `unit_cost`, and soft-delete behavior.
- Existing idempotent generic requisition-process transition endpoint.

---

### Edge Cases

- No live requisition items.
- A null, zero, or negative quoted price.
- A quote equals the unit cost before or after Administration acceptance under the existing equality-based contract.
- A mix of accepted and unaccepted quoted items.
- A soft-deleted item has no quote.
- The RS changes status or location before the Logistics action is committed.
- A repeated request uses the same idempotency key.

---

### Notes

- State: IN_REVIEW
- No accepted-price schema flag currently exists; the established application contract treats exact-cent equality between `unit_cost` and `quoted_price` as accepted.
- No migration, backfill, or deployment-time data mutation is required.
- Backend regression result: 56 tests passed with 405 assertions across the requisition return/WICO workflow, balance-integrity, and financial-idempotency suites; the expanded two-cycle partial-quote case separately passed with 19 assertions.
- PHP syntax and Pint checks pass for the changed controller and feature test.
- ABMS `pnpm build` passes. `pnpm lint` remains blocked by the existing repository baseline of 113 errors and 11 warnings; the changed modal's targeted lint reports 29 existing errors and one warning, while its new quote-gate code compiles in the production build.
- Follow-up UI correction: the pricing editor tracks changed item IDs separately from displayed stored values and excludes untouched rows from validation/review/submission. Accepted prices remain editable; only an accepted price that Logistics changes is sent through another Administration approval cycle. The ABMS production build passes after this correction; targeted lint remains at the same 29-error/one-warning baseline.
- Authenticated browser smoke testing and deployment were not performed in this workspace.
