# ABMS-RS-20260811-009 — Expanded RS Reprint Warning

### Task ID

ABMS-RS-20260811-009

### Feature / Context

ABMS Requisition Process printing for Logistics, Stockroom, Budget, and Administration.

### Objective

Warn the four applicable roles before opening an RS print preview whenever any prior print event exists, including one created by the current user.

---

### Requirements

- Apply the pre-print history check to Logistics, Stockroom, Budget, and Administration Requisition Process roles.
- Read the latest append-only print event without excluding the authenticated user.
- Order multiple events by `created_at`, then event ID, descending.
- Show the established prompt with RS number, stored resolved printer name, and latest date/time.
- Keep explicit Yes and No actions: Yes opens the existing preview; No keeps the RS modal open.
- Open the preview directly when no print event exists.
- Treat lookup failure as blocking and display the existing error modal.
- Keep the existing legacy latest-other-user route as a compatibility alias, but return the same latest-any-user result.
- Preserve the actual idempotent print-event write immediately before `window.print()`; checking, Yes, and No must not create an event.
- Do not change print content, paper controls, workflow, financial data, audits, or existing Stockroom-type print eligibility.

---

### Acceptance Criteria

- Logistics and Stockroom receive the warning when their own user is the latest prior printer.
- Budget and Administration receive the same warning for any latest prior printer.
- The latest event wins even when it belongs to the current user and an older event belongs to another user.
- Equal timestamps use the higher print-event ID as the latest event.
- No history opens the existing preview directly.
- No creates no print event and leaves the RS modal usable.
- Yes creates no event until the user clicks Print inside the preview.
- The compatibility endpoint returns the same latest event as the new endpoint.
- Backend feature tests and the ABMS production build pass, or unrelated pre-existing failures are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Requisition ID, active Requisition Process role, authenticated request, and append-only print events.

**Outputs:**

- Latest print metadata or null, followed by the existing Yes/No warning or print preview.

---

### Agent Assignment

- frontend_agent: Extend the shared pre-print check to four roles and consume the latest-any-user endpoint.
- backend_agent: Return the latest print event regardless of printer identity and retain the compatibility route.
- qa_agent: Verify same-user history, latest ordering, role scope, no-history behavior, and compatibility.
- reviewer_agent: Review privacy, event ordering, deployment compatibility, and unchanged event-write timing.
- project_manager: Maintain this task record and ABMS continuity documentation.

---

### Dependencies

- Existing append-only requisition print events.
- Existing shared RS Process modal, warning modal, and print preview.
- Existing idempotent print-event recording endpoint.

---

### Edge Cases

- Only the current user has printed the RS.
- The current user printed after another user.
- Several print events share one timestamp.
- Printer display name is blank and stored username is used.
- No print history exists.
- Print-history lookup fails or the requisition no longer exists.
- Repeated Print RS clicks while the lookup is pending.

---

### Notes

- State: IN_REVIEW
- The old `/latest-other-print-event` URL remains available but intentionally adopts latest-any-user semantics.
- Budget Request Entry printing is outside this request; Budget here means the Budget Requisition Process role.
- No migration or backfill is required.
- Verification: the final complete print-history feature suite passed with ten tests and 57 assertions; focused Pint and the ABMS production build passed.
- Focused lint retains the existing `RSProcessModal.tsx` baseline of 29 errors and one warning; the changed role list, endpoint call, and status text add no reported lint finding.
- Authenticated four-role browser smoke testing was not run because no deployed-like authenticated environment was provided.
