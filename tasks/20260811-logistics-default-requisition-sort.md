# ABMS-RS-20260811-001 — Logistics Default Requisition Sort

### Task ID

ABMS-RS-20260811-001

### Feature / Context

ABMS Requisition Process Logistics worklist sorting.

### Objective

Default the Logistics worklist sort option to Requisition Number without changing other roles or selectable sorting behavior.

---

### Requirements

- Initialize the Logistics role with `sortBy = Requisition No.`.
- Preserve the existing default descending sort direction.
- Keep every existing Logistics sort option selectable.
- Keep every other role's default sort unchanged.
- Preserve backend cursor pagination and its requisition-number-to-database-column mapping.
- Add no backend, schema, workflow, or financial mutation.

---

### Acceptance Criteria

- Opening Logistics initially displays `Requisition No.` in Sort Options.
- The first Logistics requery submits `sortBy = Requisition No.` and `sortDir = desc`.
- Logistics results are ordered by requisition number descending with the existing ID tie-breaker.
- Users can select another sort option or direction afterward.
- Administration, Budget, Controller, Stockroom, Accounting, and Cashier retain their prior default sort.
- The ABMS production build passes, or unrelated baseline failures are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Logistics role initialization and existing shared sort configuration.

**Outputs:**

- Logistics filter state defaulted to Requisition Number descending.

---

### Agent Assignment

- frontend_agent: Add and consume the role-specific default sort configuration.
- qa_agent: Verify initial state, request parameters, role isolation, and build output.
- reviewer_agent: Review cursor-order stability and shared-config regression risk.
- project_manager: Maintain the task record and ABMS continuity documentation.

---

### Dependencies

- Shared Requisition Process filter configuration and state initializer.
- Existing backend `Requisition No.` sort mapping and ID tie-breaker.

---

### Edge Cases

- A configured default is absent from the role's selectable sort columns.
- The user changes the column or direction after initial load.
- Cursor pagination loads another page after the default sort is applied.
- Another role consumes the shared state initializer.

---

### Notes

- State: IN_REVIEW
- Invalid configured defaults fall back to the first selectable sort column.
- No migration or backend deployment is required.
- Verification: targeted ESLint passes for the changed shared types and constants, the ABMS production build passes, and the existing backend mapping orders `Requisition No.` by `requisition_number` with an ID tie-breaker in the same direction.
- Authenticated browser smoke testing was not run because no deployed-like authenticated environment was provided.
