# ABMS-RS-20261020-001 — VPF Approval Routing

### Task ID

ABMS-RS-20261020-001

### Feature / Context

ABMS requisition approvals, general permissions, dashboards, and RS printing across the frontend, finance API, and authentication permission catalog.

### Objective

Select Controller below PHP 50,000 and VPF at PHP 50,000 or above at existing approval checkpoints without changing workflow stages or historical decisions.

---

### Requirements

- Use the saved RS grand total and exact integer cents to select the approving officer at existing Controller checkpoints; apply to every RS type.
- Add general `vpf-access` with display name `Vice President for Finance Access` in the authentication permission catalog and User Access; resolve IDs dynamically.
- Give VPF Controller-equivalent intended page/report access, its own dashboard and queue, and the existing role picker for multiple permissions.
- Keep permissions distinct and authenticate role-selected queries and decisions on the server. No implicit Administration permission is granted.
- Re-evaluate pending routing on reads, forwarding/resubmission, and locked decisions, including existing Logistics V2 price-review cycles when enabled.
- Preserve all existing review, forwarding, resubmission, reprocess, fulfillment, release, and approval-reset behavior. Stockroom quantity corrections do not cause reapproval. An amount change alone does not introduce a new approval checkpoint.
- Retain `is_controlled` values 0/1/2; add nullable `approval_role` for new Controller/VPF decisions, clear it only at existing resets, and audit it. Legacy decisions with null metadata retain Controller attribution without invented names/times.
- Keep Controller's endpoint; add VPF's endpoint with decision 1/2 using a shared backend policy. Lock and validate the RS's current total, stage, location, decision, and authenticated permission before writing.
- Preserve existing API fields and stored statuses; add `required_approval_role`, `approval_role`, `display_status`, and capability `vpf_approval_enabled`.
- Reuse a shared configurable approval-role view and the existing filters, cursor pages, modal, attachments, chat, history, account view, light/dark themes, and print tools.
- Display `For VPF` wherever awaiting VPF approval, use shared `Approval` wording, and display the recorded decision role in history and print. Unsigned forms must not imply completed approval.
- Attribute dashboard decisions by recorded role; legacy null decisions count as Controller. Current totals must not relabel completed decisions.
- Add disabled-by-default `ABMS_VPF_APPROVAL_ENABLED`. Deploy additive permission/schema, backend, then frontend before activation and user assignment verification.
- Do not run production migrations, enable the flag, assign real users, or change production data as part of local implementation. No financial/status backfill, renumbering, or balance recalculation is permitted at deployment.
- Update ABMS continuity documentation and retain compatible backend/schema when rolling back after VPF decisions exist.

---

### Acceptance Criteria

- PHP 49,999.99 selects Controller; PHP 50,000.00 and PHP 50,000.01 select VPF. Pending crossings in either direction change the queue and prevent the former officer's stale decision.
- Missing permissions return 403; incorrect officers, invalid/stale stages and duplicate decisions return 422 without writes.
- Existing reprocess/resubmission cycles select the officer by the new total; either officer's valid approval satisfies the existing onward gate.
- Stockroom quantity edits preserve the decision and release behavior. Logistics V2 enabled/disabled paths retain their established checkpoints.
- Existing high-value Controller-approved records remain valid. Schema migration preserves every existing financial/workflow value and timestamp.
- Controller/VPF access, role forgery, dashboard attribution, status labels, history, and print behavior have focused regression coverage.
- Run focused backend tests, frontend `pnpm lint && pnpm build`, and `pnpm playwright test`; record unrelated baseline failures and unavailable E2E infrastructure explicitly.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Authenticated permissions, RS ID, saved grand total, current workflow/decision state, and approval/disapproval decision.

**Outputs:**

- Correct approval queue/display label, authorized audited decision, and unchanged financial data; authorization/validation failures leave storage unchanged.

---

### Agent Assignment

- frontend_agent: Frontend access, shared approval view, status displays, dashboard and print presentation.
- backend_agent: Permission registration, additive finance schema/config, shared policy, APIs, authorization and attribution.
- qa_agent: Automated regression tests, migration preservation, builds and E2E availability evidence.
- reviewer_agent: Architecture, authorization, concurrency, workflow and balance-integrity review.
- project_manager: Requirements, task state, continuity documentation and deployment instructions.

---

### Dependencies

- Existing Controller gate, RS model audits, general permission assignments and authentication permission catalog.
- Existing Logistics Workflow V2 configuration; a designated VPF user and authenticated staging environment for rollout verification.

---

### Edge Cases

- Exact threshold, simultaneous amount edit/approval, duplicates, stale clients and forged permissions/roles.
- Both/neither officer permissions; invalid/missing total; legacy incomplete audit evidence.
- Stockroom adjustments, partial fulfillment, V2 price review and approval-preserving returns.

---

### Notes

- State: DONE
- The user's final clarification supersedes the earlier suggestion to reset approval after every total change: only officer selection at established approval checkpoints changes.
- Implemented across the frontend, finance service, and authentication permission catalog. The Controller compatibility component now wraps the shared configurable approval-role view. All stored stages and financial mutation algorithms remain unchanged.
- New arrival audits snapshot `approval_review_role` without another database column. New decision audits include the recorded role even when a V2 disapproval is approved without changing that role; historical audits are read-only and untagged arrivals remain legacy Controller evidence.
- Verification: full finance backend suite passed in isolated Docker PHP 8.4/SQLite memory: **287 tests, 2,560 assertions**. Coverage includes exact boundaries/all RS types, pending crossings both directions, stale/wrong-role/duplicate decisions, recorded-role dashboards/history, V2 reapproval, Stockroom approval preservation, and additive schema up/down/up value preservation.
- Authentication migration passed **13 isolated checks** for group dependencies, dynamic group ID, labels/guard, preserving existing Controller permission, idempotency, conflict rejection, and attribution-preserving rollback/rerun. No live database was used.
- ABMS production build passed; focused ESLint on the shared approval view, Controller wrapper, requisition entrypoint, requester common controls, and print preview passed. Targeted implementation/test Pint checks passed. Diff whitespace checks passed with `cr-at-eol`, preserving incumbent newline conventions.
- Root `pnpm lint` remains blocked by pre-existing shared UI warnings under `--max-warnings 0`; root `pnpm build` remains blocked by the unrelated `online-2nd-5th-month-evaluation` TS5110 module/NodeNext mismatch. Full ABMS lint still reports 82 existing issues (73 errors, 9 warnings), and full TypeScript checking retains existing application errors; the new shared approval module passes focused lint/type inspection.
- `pnpm playwright test` cannot run because Playwright is not installed/configured at the root. Authenticated browser workflows, print-layout inspection, and a real concurrent MySQL transaction test remain staging checks; SQLite verifies sequential stale-decision and duplicate-submit behavior, not production lock scheduling.
- Mechanical UI inspection found one pre-existing requester side-tab border-width warning; it was left unchanged. No production migration, activation, user assignment, or business-data mutation was performed.

Deployment handoff (run through the normal staging/production release process):

1. Keep `ABMS_VPF_APPROVAL_ENABLED=false`; deploy the authentication migration `database/migrations/2026_10_20_000001_add_abms_vpf_permission.php` and finance migration `app-modules/abms/database/migrations/2026_10_20_000001_add_requisition_approval_role.php`. Deploy compatible backend code before the frontend. Use targeted migration paths if other pending migrations are outside this release.
2. Verify the permission catalog resolves the new dynamic ID, assign `vpf-access` to the designated user through existing User Access, and verify Controller-equivalent intended access. Existing assignments must remain unchanged.
3. In authenticated staging, verify threshold boundaries, both pending crossings, V2 on/off behavior, approved high-value legacy RS, Stockroom quantity release, and Controller/VPF/legacy/unsigned print layouts on the supported paper profiles.
4. Enable `ABMS_VPF_APPROVAL_ENABLED=true` through finance environment/config deployment, refresh cached configuration using the existing release procedure, and refresh stale sessions. Monitor authorization/validation failures and queue counts; an old Controller client must fail safely for a VPF-assigned RS.
5. Keep both additive migrations' retained data and a compatible backend on application rollback. Their `down()` methods intentionally preserve attribution and permission assignments; their `up()` methods support a subsequent rerun. Do not remove the role column or delete VPF decisions/grants automatically.
