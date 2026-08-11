# ABMS-RS-20260811-003 — Stockroom RS Print Stage Restriction

### Task ID

ABMS-RS-20260811-003

### Feature / Context

ABMS Budget Request Entry and Stockroom Requisition Process printing.

### Objective

Prevent Stockroom-type requisitions from being printed in Budget Request Entry or the Stockroom role until they reach Certified or Served status.

---

### Requirements

- Apply the restriction only in Budget Request Entry and the `stockroom-access` Requisition Process view.
- Treat an RS as restricted only when its normalized `rstype` is exactly `stockroom`.
- Permit Stockroom RS printing at Certified or Served workflow states, including the established `certified rs`, `served rs`, and `served by wico` aliases.
- Disable Print RS for every other Stockroom RS status in the two applicable entry points.
- Display an explanation that Stockroom RS printing requires Certified or Served status.
- Prevent guarded click handlers from opening the preview even if invoked while disabled.
- Leave Logistics, Administration, Controller, Budget-role Requisition Process, and other role views unchanged.
- Preserve existing duplicate-print warnings, print-event recording, preview content, and paper controls for eligible printing.
- Add no backend, schema, workflow, balance, item, attachment, or history mutation.

---

### Acceptance Criteria

- Budget Request Entry disables Print RS for a Stockroom RS at For Review, Reprocess, On Process, and PO On Process.
- Budget Request Entry enables Print RS for a Stockroom RS at Certified or Served.
- Stockroom role applies the same eligibility rule.
- A non-Stockroom RS remains printable at the same statuses as before in both entry points.
- Logistics, Administration, and Controller can print a Stockroom RS regardless of its current status.
- Eligible Stockroom-role printing still performs the existing other-user print-history check.
- Disabled actions do not open a preview or append a print event.
- Targeted frontend lint and the ABMS production build pass, or unrelated baseline failures are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Active frontend entry point or role, requisition type, and current requisition status.

**Outputs:**

- An enabled or disabled Print RS action with an explanatory message.

---

### Agent Assignment

- frontend_agent: Implement the shared eligibility rule and apply it only at the two requested print entry points.
- qa_agent: Verify type/status combinations, role isolation, click guards, and build output.
- reviewer_agent: Review scope isolation and compatibility with duplicate-print history.
- project_manager: Maintain the task record and ABMS continuity documentation.

---

### Dependencies

- Shared RS print preview and append-only print-event behavior.
- Budget Request Entry `RSViewModal`.
- Role-aware Requisition Process `RSProcessModal`.

---

### Edge Cases

- Type and status values contain whitespace or mixed casing.
- Legacy display/status aliases represent Certified or Served.
- A non-Stockroom RS has an otherwise restricted status.
- A Stockroom user has already triggered a print-history lookup before row data changes.
- A disabled button handler is invoked programmatically.

---

### Notes

- State: IN_REVIEW
- This is an entry-point-specific UI workflow restriction, not a global print-event API authorization rule.
- No migration or backend deployment is required.
- Verification: `pnpm --filter abms build` passed on 2026-08-11.
- Verification: focused ESLint passed for `stockroomPrintEligibility.ts`.
- Verification: component ESLint remains blocked by the pre-existing `RSProcessModal.tsx` baseline (29 errors and 1 warning); no finding was reported for `RSViewModal.tsx` or the new eligibility helper.
- Verification: `git diff --check` passed.
