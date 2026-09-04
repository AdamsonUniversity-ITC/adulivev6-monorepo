# ABMS-RS-20260811-008 — Administration RS-Type Routing Guards

### Task ID

ABMS-RS-20260811-008

### Feature / Context

ABMS Administration routing after Controller approval and return-to-staff review.

### Objective

Prevent Administration from forwarding Controller-approved requisitions to destinations that do not match their stored RS type.

---

### Requirements

- Apply destination-button visibility and authoritative backend routing validation from the stored normalized `rstype`.
- For `rstype = stockroom`, allow only `Forward to Stockroom` among office-destination actions.
- For `rstype = logistics`, allow only `For Pricing` and the later `For Purchase` action among office-destination actions.
- For `rstype = cashier`, prohibit `Forward to Stockroom`, `For Pricing`, and `For Purchase` while retaining the established Cashier office destinations.
- Keep `Send RS to Staff` available as a non-destination re-review action for a Controller-approved `on process` RS at Budget Office.
- Make `Send RS to Staff` set `status = for review` and `is_controlled = 0`, retaining the Budget Office location.
- Require authenticated `admin-access`, lock the requisition, and revalidate current status, location, Controller state, and RS type before routing.
- Preserve requisition items, amounts, balances, accepted quoted prices, notes, attachments, and liquidation fields.

---

### Acceptance Criteria

- A Controller-approved Stockroom RS at Budget Office displays and accepts only Forward to Stockroom among destination choices.
- A Logistics RS displays For Pricing after Controller approval and may use For Purchase only after its existing quoted-price approval stage.
- A Cashier RS does not display or accept Forward to Stockroom, For Pricing, or For Purchase.
- A forged or stale request for an RS-type-incompatible destination receives `422` without changing the requisition.
- A caller without Administration access receives `403` for these Administration transitions.
- Send RS to Staff changes an eligible RS to `for review`, resets Controller state to pending, and retains its Budget Office location.
- Send RS to Staff rejects a requisition that is not currently Controller-approved and on process at Budget Office.
- Focused backend tests and the ABMS production build pass, or unrelated pre-existing failures are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Authenticated Administration action, requisition ID, stored RS type, status, location, and Controller decision.

**Outputs:**

- A valid type-specific workflow transition, a staff re-review transition, or an unchanged requisition with `403`/`422` response.

---

### Agent Assignment

- frontend_agent: Filter Administration destination actions by stored RS type.
- backend_agent: Authorize, lock, and validate the type-specific Administration transitions and staff reset.
- qa_agent: Verify successful routes, cross-type rejection, stale state, permissions, and Controller reset.
- reviewer_agent: Review workflow compatibility, authorization, audit coverage, and preservation of financial data.
- project_manager: Maintain the task record and ABMS continuity documents.

---

### Dependencies

- Existing Controller approval state and Administration role actions.
- Existing partial quoted-price approval and For Purchase workflow.
- Existing idempotency middleware and requisition audits.

---

### Edge Cases

- Null, blank, mixed-case, or unknown legacy RS types.
- Controller decision pending or disapproved instead of approved.
- Correct RS type at the wrong status or current location.
- Logistics For Purchase with no accepted quoted-price row.
- Direct API submission of a button hidden by the frontend.
- Concurrent Administration routing attempts for the same requisition.

---

### Notes

- State: IN_REVIEW
- `Send RS to Staff` is a re-review action, not an office destination, and remains available for every recognized RS type when its stage is eligible.
- No migration, backfill, or historical requisition rewrite is required.
- Verification: four focused routing/staff tests passed with 28 assertions; the final complete requisition return/routing workflow suite passed with 12 tests and 144 assertions; focused Pint and the ABMS production build passed.
- Focused lint retains the existing `RSProcessModal.tsx` baseline of 29 errors and one warning, while ABMS-wide lint retains its existing 108-error/11-warning baseline. The added routing predicates introduce no reported lint finding.
