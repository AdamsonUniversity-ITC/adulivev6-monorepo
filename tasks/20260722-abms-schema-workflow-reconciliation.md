# ABMS-DOC-20260722-001 — Schema and Workflow Reconciliation

### Task ID

ABMS-DOC-20260722-001

### Feature / Context

ABMS frontend and `finance_service` schema/workflow continuity after the July 21 requisition changes.

### Objective

Reconcile the canonical ABMS documentation with the current frontend, backend routes, models, migrations, and requisition workflow.

---

### Requirements

- Compare both repositories and treat current source and migrations as authoritative.
- Document every newly introduced persistent ABMS field and its allowed states.
- Document the Controller permission, decision endpoint, transition guards, resubmission behavior, and failure responses.
- Document newly enforced requisition finalization, refund, account-selection, and quoted-price-preview behavior.
- Preserve account-ID and typed organizational identity invariants.
- Do not change transaction or report implementation as part of this documentation reconciliation.

---

### Acceptance Criteria

- The ERD includes `budget_request_entry.is_controlled` with its three meanings and default.
- Business rules describe the happy path from Budget review through Controller approval and onward routing.
- Business rules describe 403/422 outcomes for permission, invalid decision, repeated decision, invalid stage, and onward routing without approval.
- The requisition lifecycle diagram includes Controller approval, disapproval, resubmission, and guarded onward routing.
- System context identifies the Controller role/view and the relevant backend route family.
- Documentation dates and source-review notes reflect verification on 2026-07-22.
- Markdown fences remain balanced and both repositories remain free of unintended edits.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- `apps/abms` at commit `13ddfa6`, including ABMS changes introduced by `d05001e`.
- `../finance_service` at commit `d2c22cc`, including ABMS changes introduced by `4f4101e`.
- Current ABMS migrations, models, controllers, routes, and canonical documentation.

**Outputs:**

- Updated `docs/abms/system-context.md`.
- Updated `docs/abms/erd.md`.
- Updated `docs/abms/business-rules.md`.
- Updated `docs/abms/flowcharts.md`.
- This reconciliation task record.

---

### Agent Assignment

- frontend_agent: Validate the Controller UI, requisition modal guards, and frontend API contracts.
- qa_agent: Validate documentation structure, repository diffs, and available frontend/backend checks.
- reviewer_agent: Review authorization, state-transition, balance, schema rollback, and identity risks.
- project_manager: Reconcile and maintain the canonical ABMS documentation and task record.

---

### Dependencies

- `ABMS-CONT-20260719-001` durable continuity documentation.
- Backend migration `2026_07_21_014812_alter_budget_request_entry_table.php`.
- Frontend Controller workflow introduced by commit `d05001e`.
- Backend Controller workflow introduced by commit `4f4101e`.

---

### Edge Cases

- The Controller lacks `controller-access`.
- A decision is not `1` or `2`, is submitted outside `on process`, or is submitted twice.
- Administration forwards an entry that is not awaiting Controller review or resubmission.
- Administration tries to route an entry onward before Controller approval.
- A department and section share the same numeric ID.
- A requisition has no items, has an invalid account allocation, or is a Cashier request below the minimum.
- A quoted-price preview references an inaccessible requisition or an unresolved allocation.
- Cancellation or disapproval encounters an item that cannot be mapped for refund.

---

### Notes

- State: IN_REVIEW
- Scope is documentation reconciliation and review; no production workflow code is changed.
- Source and migrations remain authoritative over this task record.
- Review finding: the Controller decision endpoint verifies `controller-access`, but the generic requisition-process list and transition endpoints do not consistently enforce the role supplied or implied by the request. This remains implementation work and is now called out in the canonical context/rules.
- Verification: ABMS production build passed. Documentation diff/fence checks passed. ABMS lint reported 172 existing errors and 14 warnings. Laravel tests could not start because host PHP 8.3.6 is below the installed dependencies' PHP 8.4 requirement. Pint reported existing style drift across the ABMS module.
