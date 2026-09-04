# ABMS-RS-20260811-006 — RS View Accounts Completeness

### Task ID

ABMS-RS-20260811-006

### Feature / Context

Requisition Process RS View modal and read-only account-balance display.

### Objective

Ensure View Accounts displays every account referenced by the selected requisition with the balance from its exact school-year and typed-unit allocation scope.

---

### Requirements

- Request View Accounts data using the selected requisition ID in every role handler.
- Let the backend derive the requisition's stored school year, Department/Section type and ID, and distinct item account IDs.
- Return only accounts referenced by live items belonging to the selected requisition.
- Do not use the role page's currently selected school year for RS account lookup.
- Do not use the paginated general account-selection branch for View Accounts.
- Preserve account ID as identity and do not deduplicate by account code.
- Preserve the existing read-only account modal and displayed remaining balance.
- Return every referenced account even when its live allocation is missing or ambiguous; mark that balance unavailable with a data-quality explanation instead of selecting an arbitrary value.
- Do not change financial values, allocations, proposals, requisitions, or items.
- Do not grant View Accounts to a role that does not already expose the button.

---

### Acceptance Criteria

- An RS referencing more than 10 distinct accounts displays all referenced accounts.
- An historical RS displays accounts from its own stored school year even when the page filter/current setting differs.
- A Section RS and Department RS resolve their exact typed allocation independently.
- Duplicate account codes with different account IDs remain distinct.
- Accounts not referenced by the RS are excluded.
- A referenced account with zero or multiple exact-scope live allocations remains visible with an Unavailable balance and data-quality explanation.
- Logistics behavior remains unchanged because it already uses the requisition-scoped contract.
- Budget, Administration, and Controller use the same requisition-scoped contract.
- The dormant Stockroom callback is corrected without exposing a new button.
- ABMS production build passes; focused lint results are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Selected requisition ID.

**Outputs:**

- Complete, unpaginated list of distinct ID-referenced accounts and their scoped remaining balances.

---

### Agent Assignment

- frontend_agent: Replace broad typed-unit account requests with requisition-scoped requests.
- qa_agent: Verify completeness, historical year scope, typed identity, duplicate codes, build, and lint.
- reviewer_agent: Review account identity and read-only financial scope.
- project_manager: Maintain task and continuity documentation.

---

### Dependencies

- Existing `GET /api/abms/budget-request-entry/accounts?requisitionId={id}` contract.
- Stored requisition item `account_id` values.
- Existing `AccountsViewModal`.

---

### Edge Cases

- More than 10 referenced accounts.
- Historical requisition differs from current page school year.
- Row kind metadata is absent or stale.
- Department and Section share the same numeric ID.
- Multiple accounts share the same account code.
- An RS has no positive item account IDs.

---

### Notes

- State: IN_REVIEW
- Root cause: most roles called the paginated general account-selection branch and displayed only its first 10 rows; they also supplied page state instead of authoritative RS scope.
- Backend hardening replaced the requisition branch's legacy-view deduplication with ID-based account plus exact live-allocation resolution; no migration or financial mutation is required.
- Verification: focused View Accounts tests passed, 2 tests and 13 assertions.
- Verification: complete requisition account/refund regression passed, 52 tests and 356 assertions.
- Verification: ABMS production build, focused `AccountsViewModal.tsx` lint, PHP syntax checks, and frontend/backend `git diff --check` passed.
- The four role views retain their existing lint baseline of five explicit-`any` errors and one hook warning per file; the changed request objects introduced no reported finding.
