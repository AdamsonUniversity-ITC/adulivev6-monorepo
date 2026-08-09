# ABMS-RS-20260809-008 — Logistics and Stockroom Reprint Warning

### Task ID

ABMS-RS-20260809-008

### Feature / Context

ABMS Requisition Process printing for Logistics and Stockroom.

### Objective

Warn Logistics and Stockroom users before opening an RS print preview when another user has previously printed the requisition.

---

### Requirements

- Apply the pre-print history check only when `Print RS` is selected from the Logistics or Stockroom role.
- Read print history from the existing append-only requisition print-event records that are merged into RS Process History.
- Select the latest print event belonging to a different authenticated user, ordered by creation time and event ID.
- If another user previously printed the RS, show: `This RSno.{requisition no} is already printed by {name} last {date}. do you want to continue?`
- Present explicit `Yes` and `No` buttons in a modal.
- `Yes` opens the existing print preview; `No` closes the warning and leaves the RS modal open.
- If no other user printed the RS, open the existing print preview without an additional prompt.
- Keep the actual print-event write immediately before the browser print dialog; the history check and `No` action must not create a print event.
- Preserve the existing idempotent print-event write, printed-by identity resolution, printable content, and paper controls.
- Do not add a migration or modify financial, workflow, item, attachment, or audit data.

---

### Acceptance Criteria

- Logistics receives the warning when the latest qualifying prior print belongs to another user.
- Stockroom receives the same warning under the same condition.
- The warning shows the exact RS number, resolved printer name, and formatted prior print date/time.
- Selecting `Yes` opens the current print preview without recording a print until its Print button is used.
- Selecting `No` creates no print event and leaves the requisition modal usable.
- A prior print by only the current user does not produce the warning.
- Multiple other-user prints return the latest one by timestamp and ID.
- Other Requisition Process roles retain the existing direct Print RS behavior.
- A failed history lookup displays an error and does not silently bypass the duplicate-print check for Logistics or Stockroom.
- Backend feature tests, targeted frontend lint, and the ABMS production build pass, or unrelated baseline failures are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Requisition ID, authenticated user identity, active Requisition Process role, and append-only print events.

**Outputs:**

- Latest other-user print metadata or null, followed by either a Yes/No warning modal or the existing print preview.

---

### Agent Assignment

- backend_agent: Return the latest other-user append-only print event without creating or mutating history.
- frontend_agent: Integrate the role-scoped pre-print check, modal, and failure feedback.
- qa_agent: Verify role scope, latest-event selection, Yes/No behavior, and regressions.
- reviewer_agent: Review identity comparison, history ordering, privacy, race behavior, and event-write timing.
- project_manager: Maintain the task record and ABMS continuity documentation.

---

### Dependencies

- Existing `budget_request_entry_print_events` append-only history.
- Existing Requisition Process `Print RS` action and `RSPrintPreview` component.
- Existing authenticated finance-service identity.

---

### Edge Cases

- The current user printed the RS after an earlier print by another user.
- Multiple print events have the same timestamp.
- A print-event name is blank and must fall back to its stored username.
- The prior print timestamp is missing or cannot be formatted.
- The history lookup fails or the requisition does not exist.
- The user clicks Print RS repeatedly while the history request is pending.
- The RS is printed by another user after the check but before the browser print action.

---

### Notes

- State: IN_REVIEW
- Print events appear in RS Process History but remain separate from OwenIt audits by design.
- No migration or backfill is required.
- Verification: the focused print-history backend suite passes in the PHP 8.4 container with isolated SQLite (8 tests, 48 assertions); host PHP syntax checks pass.
- Laravel Pint passes for all three changed backend files, and the ABMS production build passes. Targeted `RSProcessModal.tsx` lint retains its pre-existing baseline (29 errors and one warning); none of the findings point to the new print-history types, lookup, modal, or button-state lines.
- Authenticated Logistics/Stockroom browser smoke testing was not run because no deployed-like authenticated environment was provided.
