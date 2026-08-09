# ABMS-RS-20260809-004 — Stockroom Incoming Source Filters

### Task ID

ABMS-RS-20260809-004

### Feature / Context

ABMS Stockroom Requisition Process worklist filtering.

### Objective

Allow Stockroom users to filter active incoming requisitions by Logistics or Budget Office origin.

---

### Requirements

- Add `RS from Logistics` and `RS from Budget Office` to the Stockroom status filter area.
- Define `RS from Logistics` as a requisition currently at Stockroom, originating from Logistics, with `po on process` or legacy `p.o. on process` status.
- Define `RS from Budget Office` as a requisition currently at Stockroom, originating from Budget Office, with `certified` status.
- Exclude served, mismatched-stage, and already-departed requisitions from both source-specific filters.
- Preserve the existing `To Process RS` default, `Processed RS`, `Served`, and `All` behavior.
- Require `To Process RS` rows to be currently located at Stockroom as well as having a certified or supported PO-on-process status.
- Preserve OR behavior when source-specific and other non-All filters are selected together.
- Do not mutate requisition workflow state, audit history, financial data, or balances.

---

### Acceptance Criteria

- `RS from Logistics` returns current Stockroom PO arrivals for both supported PO status spellings and no other rows.
- `RS from Budget Office` returns current certified Stockroom arrivals from Budget Office and no other rows.
- Selecting both source filters returns their union without duplicates.
- Served, wrong-stage, wrong-origin, and already-departed requisitions are excluded.
- Stockroom still opens with `To Process RS` selected by default.
- `To Process RS` excludes a certified or PO-on-process requisition whose current location is no longer Stockroom.
- Backend feature tests and the ABMS production build pass, or unrelated pre-existing failures are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Stockroom role and one or more selected filter labels.
- Stored requisition `status`, `location`, and `from` values.

**Outputs:**

- A cursor-paginated Stockroom worklist matching the selected incoming source predicates.

---

### Agent Assignment

- frontend_agent: Add the two Stockroom filter choices.
- backend_agent: Map the source pseudo-statuses to exact grouped workflow predicates.
- qa_agent: Verify individual, combined, and exclusion behavior plus build/lint results.
- reviewer_agent: Review status/location/origin matching and multi-select query grouping.
- project_manager: Maintain this task record and ABMS continuity documentation.

---

### Dependencies

- Existing Stockroom historical-visibility query and status filter panel.
- Existing `budget_request_entry.status`, `location`, and `from` workflow fields.

---

### Edge Cases

- Legacy `p.o. on process` status from Logistics.
- A served row retains `from = logistics` while still located at Stockroom.
- A row has the expected origin but an unexpected status.
- A former Stockroom row has already moved to another office.
- A certified requisition previously visited Stockroom but is currently at Budget Office.
- Both source filters are selected with another Stockroom filter.
- A non-Stockroom client submits a Stockroom-only source token.

---

### Notes

- State: IN_REVIEW
- These are read-only worklist filters and cause no workflow or financial writes.
- No migration, backfill, or deployment-time data mutation is required.
- Verification: the focused Stockroom filter test passed with 15 assertions; the complete adjacent backend feature file passed with 46 tests/312 assertions; focused Pint and the previously completed targeted constants lint and ABMS production build passed.
- Full ABMS lint retains the existing baseline of 113 errors and 11 warnings outside this change.
