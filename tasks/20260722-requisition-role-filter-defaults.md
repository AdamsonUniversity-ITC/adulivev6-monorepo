# ABMS-REQ-20260722-002 — Requisition Role Filter Defaults

### Task ID

ABMS-REQ-20260722-002

### Feature / Context

ABMS requisition-process role views and status filtering.

### Objective

Set an operationally relevant default status filter for each requested requisition-process role.

---

### Requirements

- Default Budget Office to `For Review`.
- Rename Administration's `For Certification` filter label to `For Budget Director` and make it the default.
- Default Controller to `For Controller`.
- Default Purchasing/Logistics to `For Pricing`.
- Default Stockroom to `To Process RS`.
- Leave Accounting and Cashier default behavior unchanged.
- Preserve the existing backend query contract and multi-status selection behavior.

---

### Acceptance Criteria

- Opening each requested role view shows exactly its configured default status selected.
- The first requery sends the selected default rather than `All`.
- Administration displays `For Budget Director` and retrieves records whose database status is `for budget director`.
- Users can still select `All`, combine non-All statuses, and deselect down to the existing `All` fallback.
- An invalid configured default safely falls back to the first status option.
- The ABMS production build succeeds.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Requisition-process role selected by the authenticated user.
- Shared role filter configuration.

**Outputs:**

- Role-appropriate initial `activeStatuses` state and matching query payload.

---

### Agent Assignment

- frontend_agent: Implement shared status defaults and Administration label compatibility.
- qa_agent: Verify defaults, query payloads, lint, and build.
- reviewer_agent: Review shared-state regressions and backend contract preservation.
- project_manager: Maintain this task specification and continuity note.

---

### Dependencies

- Existing `FilterPanel`, `makeDefaultFilterState`, and role filter configurations.
- Existing backend status-label mapping in `RequisitionProcessController::getrs`.

---

### Edge Cases

- Configured default label is absent from the role's options.
- User selects `All` after loading a role-specific default.
- User combines multiple non-All statuses.
- Administration's display label differs from the backend's legacy query token.
- User changes between roles during the same requisition-process session.

---

### Notes

- State: IN_REVIEW
- This is a frontend filter-default change; it does not alter financial state or backend workflow transitions.
- Verification: targeted shared-filter lint passed; targeted lint for `AdminView.tsx` remains blocked by six pre-existing `no-explicit-any` errors and one existing hook-dependency warning. The ABMS production build passed.
