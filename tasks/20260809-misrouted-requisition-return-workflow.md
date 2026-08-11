# ABMS-RS-20260809-001 — Misrouted Requisition Return Workflow

### Task ID

ABMS-RS-20260809-001

### Feature / Context

ABMS Requisition Process routing between Administration, Controller, Logistics, and Stockroom.

### Objective

Allow Logistics and Stockroom users to safely return misrouted requisitions to the correct prior workflow stage without changing financial or purchasing data.

---

### Requirements

- Allow Logistics to return an RS from `for pricing` at `logistics` to `on process` at `budget office`.
- Allow Stockroom to return an RS from `certified` at `stockroom` to `on process` at `budget office`.
- Preserve `is_controlled` whenever an RS returns to Administration so an existing Controller approval remains valid and Administration can immediately choose the correct destination.
- Allow Stockroom to return `po on process` and legacy `p.o. on process` at `stockroom` to `for purchase` at `logistics` without resetting `is_controlled`.
- Require the matching `logistics-access` or `stockroom-access` permission server-side.
- Lock and validate the requisition inside a transaction before changing its workflow state.
- Keep `Return RS to Budget` as a backward-compatible alias for the Stockroom-certified return.
- Preserve requisition items, accepted quoted prices, totals, allocations, proposal balances, notes, attachments, and liquidation flags.
- Show only the return action valid for the authenticated role and current status/location, with an explicit confirmation message.
- Label the Logistics and Stockroom Administration-return action as `Return to Budget` in the interface while retaining `Return to Administration` as the stable backend action value.
- Add no schema migration or historical-data backfill.

---

### Acceptance Criteria

- Logistics can return only `for pricing` requisitions currently at Logistics to Administration.
- Stockroom can return only `certified` requisitions currently at Stockroom to Administration.
- Stockroom can return either supported PO-on-process spelling currently at Stockroom to Logistics.
- Administration returns set `status = on process`, `location = budget office`, and the correct `from` value while retaining `is_controlled`.
- A Stockroom-to-Logistics return sets `status = for purchase`, `location = logistics`, `from = stockroom`, and preserves `is_controlled` and accepted quoted prices.
- Users without the required role receive `403`; valid-role requests from an invalid stage receive `422` without writes.
- Successful transitions are audited and do not alter financial or item data.
- Idempotent retries replay the successful response without applying another transition.
- Logistics and Stockroom display `Return to Budget` on the eligible button, confirmation, and success toast without changing the guarded transition payload.
- Frontend lint/build and focused backend tests pass, or unrelated pre-existing failures are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Authenticated Logistics or Stockroom user.
- Requisition ID and one of `Return to Administration`, `Return to Logistics`, or legacy `Return RS to Budget`.
- Current requisition status, location, and Controller decision state.

**Outputs:**

- Updated requisition workflow state and an audited transition.
- A success toast and refreshed role worklist in the frontend.
- A `403` or `422` response with no mutation for unauthorized or invalid transitions.

---

### Agent Assignment

- frontend_agent: Add stage-gated actions, confirmation copy, response handling, and worklist refresh.
- backend_agent: Implement authorized, locked, idempotent return transitions and compatibility handling.
- qa_agent: Add and run transition, authorization, preservation, audit, and regression tests.
- reviewer_agent: Review authorization, concurrency, audit coverage, and financial immutability.
- project_manager: Maintain this task record and ABMS continuity documentation.

---

### Dependencies

- Existing Controller gate using `budget_request_entry.is_controlled`.
- Existing requisition-process mutation endpoint and financial-idempotency middleware.
- Existing Logistics quoted-price and Stockroom PO routing workflow.
- OwenIt auditing on `BudgetRequisitionEntry`.

---

### Edge Cases

- Logistics attempts to return a `for purchase` RS to Administration.
- Stockroom attempts an Administration return for a PO-on-process RS.
- Stockroom attempts a Logistics return for a certified RS.
- A requisition changes status or location between display and confirmation.
- A user has Logistics permission while operating on a Stockroom-stage RS, or vice versa.
- The database contains the legacy `p.o. on process` status spelling.
- A browser retries the same successful request with the same idempotency key.

---

### Notes

- State: IN_REVIEW
- Button availability is stage-based and does not compare the stored RS type.
- Return actions require confirmation but no persisted return-reason field.
- Administration continues to use the stored location `budget office`.
- Administration returns are correction routes after Controller review; they do not start a new Controller approval cycle.
- `Return to Budget` is the user-facing name for the existing return to the Administration role at database location `budget office`; it is not the separate Cashier action with the same wording.
- Verification: focused return-workflow tests passed in PHP 8.4 Docker with 5 tests/57 assertions; adjacent idempotency and requisition suites passed with 45 tests/281 assertions; targeted Pint and the ABMS production build passed.
- Label follow-up verified on 2026-08-11: the ABMS production build passes, and targeted lint retains only the existing Logistics, Stockroom, and shared-modal baseline findings; the new display-label and toast lines introduce no reported finding.
- Full ABMS lint remains blocked by 113 pre-existing errors and 11 warnings across the application, including existing debt in the requisition-process files; the changed action/configuration lines introduced no reported lint violation.
- Authenticated browser smoke testing was unavailable because this repository has no ABMS Playwright configuration or authenticated test environment.
