### Task ID

20260918-abms-requisition-process-record-count

### Feature / Context

ABMS Requisition Process records card for all seven role views.

### Objective

Show the number of loaded requisition records in every role view, matching the Budget Request Entry count convention.

---

### Requirements

- Display the count in the shared records card for Administration, Budget, Controller, Logistics, Accounting, Stockroom, and Cashier.
- Count the rows currently loaded by the selected role's active query.
- Append `+` when a cursor-paginated role has more pages available.
- Keep existing filters, loading, role access, table actions, and API behavior unchanged.

---

### Acceptance Criteria

- Each role shows `0 records` before records are loaded or when the query returns no rows.
- Each role shows the loaded count after Requery; a single row shows `1 record`.
- Paginated roles show `+` while more records are available and update the count after loading another page.
- Switching roles shows the newly selected role's count, and failed queries do not report nonexistent rows.

---

### Inputs / Outputs (if applicable)

**Inputs:** Role-owned query results and cursor availability.

**Outputs:** Loaded-record count badge in the shared Requisition Process records card.

---

### Agent Assignment

- frontend_agent: Shared count display and role-owned count props.
- qa_agent: Verify empty, single-row, paginated, and role-switch states.
- reviewer_agent: Review count semantics and unchanged workflow behavior.
- project_manager: Record the requirement and update ABMS continuity documentation.

---

### Dependencies

- Existing shared `RolePage` and seven role views.

---

### Edge Cases

- Zero rows, an incomplete cursor page, a failed query, and switching roles.

---

### Notes

- State: IN_REVIEW
- The count represents loaded rows, consistent with Budget Request Entry; `+` signals additional unloaded rows.
- Verification: the ABMS production build, shared-component ESLint, and `git diff --check` passed. Repository-wide `pnpm lint` reports 78 existing errors and 10 warnings, including unrelated `no-explicit-any`, unused import, and hook dependency findings in role files; no authenticated Playwright environment was used.
