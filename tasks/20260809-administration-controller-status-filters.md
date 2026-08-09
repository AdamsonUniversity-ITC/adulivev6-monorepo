# ABMS-RS-20260809-002 — Administration Controller-Decision Status Filters

### Task ID

ABMS-RS-20260809-002

### Feature / Context

ABMS Administration Requisition Process worklist filtering.

### Objective

Allow Administration users to narrow on-process requisitions by pending, approved, or disapproved Controller decision.

---

### Requirements

- Preserve the existing general `On Process` Administration filter.
- Add `On Process - Pending`, `On Process - Approved`, and `On Process - Disapproved` status choices.
- Map the choices to `status = on process` with `is_controlled = 0`, `1`, and `2`, respectively.
- Keep multiple selected status choices OR-based, including combinations with ordinary requisition statuses.
- Do not change requisition workflow state, Controller decisions, balances, or historical data.

---

### Acceptance Criteria

- Each Controller-decision filter returns only on-process rows with its matching decision value.
- The existing `On Process` filter continues to return all three Controller-decision states.
- Selecting a decision filter with another ordinary status returns the union without duplicate rows.
- Other roles retain their existing status choices and filtering behavior.
- Backend tests and the ABMS production build pass, or unrelated pre-existing failures are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Administration role and one or more selected status labels.
- Stored requisition `status` and `is_controlled` values.

**Outputs:**

- A cursor-paginated Administration worklist matching the selected status/decision predicates.

---

### Agent Assignment

- frontend_agent: Add the three Administration-only filter choices.
- backend_agent: Map the filter tokens to grouped status and Controller-decision predicates.
- qa_agent: Verify individual decision filters, multi-select union behavior, and regression results.
- reviewer_agent: Review query grouping, role isolation, and pagination compatibility.
- project_manager: Maintain this task record and ABMS continuity documentation.

---

### Dependencies

- `budget_request_entry.status` and three-state `is_controlled` contract.
- Existing Requisition Process multi-status filter and cursor pagination.

---

### Edge Cases

- On-process legacy rows with null or unexpected Controller values.
- Selecting generic `On Process` together with a decision-specific option.
- Selecting more than one decision-specific option.
- Combining a decision-specific option with an ordinary status.
- A non-Administration client submits an Administration-only filter token.

---

### Notes

- State: IN_REVIEW
- Generic `On Process` intentionally supersedes any narrower on-process option when selected together.
- Verification: the focused filter test passed with 18 assertions; the complete adjacent requisition, return-workflow, and idempotency suites passed with 51 tests/356 assertions; targeted Pint and the ABMS production build passed.
- Full ABMS lint retains the previously recorded application-wide lint debt; this change adds no new dependency, migration, or browser test setup.
