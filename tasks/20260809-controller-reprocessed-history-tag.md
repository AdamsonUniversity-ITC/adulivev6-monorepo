# ABMS-RS-20260809-007 — Controller Reprocessed-History Tag

### Task ID

ABMS-RS-20260809-007

### Feature / Context

ABMS Controller approval worklist and requisition audit history.

### Objective

Identify and visually distinguish requisitions that were Controller-approved before a later reprocess cycle returned their Controller decision to pending.

---

### Requirements

- Preserve the existing `Reprocess RS` transition to `status = reprocess`, `location = department`, and `is_controlled = 0`.
- Define qualifying history as an audit that records `is_controlled = 1` followed in timestamp-and-ID order by a later audit that records `status = reprocess`.
- Evaluate audit history in one batched query for the current cursor page and avoid per-row audit queries.
- Return a boolean `was_reprocessed_after_controller_approval` on Controller requisition-process rows.
- Do not infer the flag from the current status, location, origin, or Controller state alone.
- Tint qualifying Controller rows with a distinct reprocess-history color.
- Add a persistent visual marker and a clear `REPROCESSED AFTER APPROVAL` tag so the evidence remains visible when liquidation coloring also applies.
- Show a matching `Reprocessed After Approval` purple legend immediately after `For Liquidation` in the Controller filter panel only.
- Leave nonqualifying Controller rows unchanged.
- Make no schema, balance, item, attachment, or workflow-history mutation.

---

### Acceptance Criteria

- A Controller-approved audit followed by a later reprocess audit returns the flag as true.
- Reprocess before approval, approval without reprocess, and reprocess without prior approval return false.
- Multiple cycles return true when at least one valid approval-then-reprocess sequence exists.
- A qualifying RS currently pending for Controller review remains `is_controlled = 0` and is visibly tagged.
- Qualifying rows receive the history tint and left-edge marker in both light and dark themes.
- A row that is also for liquidation keeps liquidation coloring while retaining the reprocess marker and tag.
- The Controller view displays the purple reprocessed legend immediately after the liquidation legend; all other role views retain only the liquidation legend.
- Audit evidence is loaded in one page-level query rather than one query per requisition.
- Existing cursor pagination, filters, Controller actions, and row opening continue to work.
- Backend feature tests, PHP formatting, targeted frontend lint, and the ABMS production build pass, or unrelated baseline failures are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Ordered OwenIt audit rows for the requisitions on the current Controller cursor page.

**Outputs:**

- An audit-derived boolean API field and Controller-only row tint/tag presentation.

---

### Agent Assignment

- backend_agent: Derive and return page-batched ordered audit evidence.
- frontend_agent: Add Controller row coloring, marker, and tag.
- qa_agent: Cover valid and invalid audit sequences, reset behavior, and regressions.
- reviewer_agent: Review audit ordering, query count, historical correctness, and UI precedence.
- project_manager: Maintain the task record and ABMS continuity documentation.

---

### Dependencies

- Existing OwenIt `audits` rows for `BudgetRequisitionEntry` updates.
- Existing Controller decision endpoint and `Reprocess RS` action.
- Existing Controller cursor-paginated requisition-process response.

---

### Edge Cases

- Approval and reprocess audits share the same timestamp and require audit-ID ordering.
- An RS has multiple approval, disapproval, and reprocess cycles.
- Legacy audit JSON stores numeric values as strings.
- Audit rows are missing or contain malformed `new_values`.
- A qualifying row is simultaneously marked for liquidation.
- A non-Controller role consumes the shared requisition-process endpoint.

---

### Notes

- State: IN_REVIEW
- Audit history is used only for the informational tag, not to reconstruct financial values or mutate workflow.
- No migration or backfill is required.
- Verification: focused Controller-history and reprocess tests pass (2 tests, 14 assertions); the related ABMS backend regression suites pass (57 tests, 422 assertions); PHP syntax checks and Pint pass; the ABMS production build passes.
- Targeted lint reports only the pre-existing `ControllerView.tsx` baseline (five explicit-`any` errors and one hook-dependency warning). Repository-wide `pnpm lint` remains blocked earlier by 14 pre-existing warnings in `packages/ui` under its zero-warning policy.
- Authenticated browser smoke testing was not run because no deployed-like authenticated environment was provided.
- Controller-only legend follow-up: the shared filter legend is opt-in, enabled only by `ControllerView`, and the ABMS production build passes. The new shared type and filter-panel code pass targeted ESLint; `ControllerView.tsx` retains the same five explicit-`any` errors and one hook-dependency warning recorded above.
