# ABMS-RS-20260722-012 — RS Account Picker Pagination

### Task ID

ABMS-RS-20260722-012

### Feature / Context

ABMS Budget Request Entry RS creation Get Account picker and account endpoint.

### Objective

Allow requesters to search and navigate every eligible account through stable 10-account pages ordered by account name.

---

### Requirements

- Paginate only the RS-creation account lookup at 10 accounts per page.
- Order creation accounts by `account_name` ascending and `account_id` ascending.
- Apply account-code or account-name search before pagination.
- Return and consume next/previous cursor values.
- Provide Previous and Next controls and a current page indicator.
- Reset to page 1 when search or typed-unit/school-year scope changes.
- Prevent stale responses from replacing newer search/page results.
- Preserve ID-based account selection and current balance values.
- Preserve the requisition-process referenced-account response contract.

---

### Acceptance Criteria

- Get Account displays no more than 10 eligible accounts per page.
- The first and subsequent pages are globally ordered alphabetically by account name.
- Next and Previous navigate the active typed-unit and school-year result.
- Navigation disables appropriately on the first/final page and while loading.
- Partial account-code or account-name search begins at page 1 and remains paginated.
- Selecting any page row returns its exact `account_id`, parent ID, code, name, and balance.
- Requisition Process still receives all referenced accounts for an existing RS.
- Invalid or stale cursors do not change account identity behavior.
- Targeted frontend lint/build and backend syntax/format checks succeed.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Exact department or section ID, school year, optional search, and cursor.

**Outputs:**

- One ordered page of up to 10 eligible account allocations with navigation cursors.

---

### Agent Assignment

- frontend_agent: Add server-backed search and cursor navigation to Get Account.
- backend_agent: Paginate and order only the creation-mode account query.
- qa_agent: Verify scope, ordering, search, pagination, selection identity, and regression behavior.
- reviewer_agent: Review typed-unit isolation, ID identity, cursor stability, and query behavior.
- project_manager: Maintain this task record and continuity documentation.

---

### Dependencies

- `VAccountWithSubAccount` typed-unit allocation view.
- Budget Request Entry account endpoint and `SelectAccountModal`.
- Existing requisition-process account lookup by `requisitionId`.

---

### Edge Cases

- Fewer than or exactly 10 eligible accounts.
- Duplicate account names or codes.
- Department and section sharing a numeric ID.
- No search matches.
- Scope/search change during an in-flight request.
- Final partial page.
- Invalid cursor.

---

### Notes

- State: IN_REVIEW
- Pagination applies before selection; persisted account identity remains `accounts.id`.
- Verification: targeted frontend ESLint, the ABMS production build, backend PHP syntax validation, and diff checks passed. Targeted Pint continues to report pre-existing whole-controller formatting differences.
