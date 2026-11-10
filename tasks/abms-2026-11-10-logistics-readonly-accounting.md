# Task Specification

### Task ID
ABMS-2026-11-10-LOGISTICS-READONLY-ACCOUNTING

### Feature / Context
ABMS Requisition Process, role assignment, Logistics dashboard and reports.

### Objective
Add independent Logistics observer access and enable Accounting purchase monitoring and note editing.

### Requirements
- Add logistics-readonly-access to the auth catalog and ABMS general-role assignment.
- Reuse Logistics visibility, default filters, sorting, dashboard metrics and reports.
- Observer users may view, print and download; block all requisition, chat and attachment mutations in UI and API.
- Printing and message-read metadata remain permitted.
- Independently assigned writable roles remain usable; request-entry assignments retain exact typed-unit scope.
- Accounting defaults to For Purchase anywhere; Certified RS means certified at accounting office; All is their union.
- Accounting rejects unsupported statuses; missing/empty selections default to For Purchase.
- Accounting may edit/clear notes on all eligible slips, with 255-character validation, locked state revalidation, auditing and idempotency.
- Preserve existing Accounting Return to Budget eligibility and all financial data.

### Acceptance Criteria
- Observer and Logistics worklists, dashboard metrics and reports agree for matching filters.
- Direct mutation requests from observer-only users return 403 without business-data changes.
- Role spoofing cannot widen observer privileges; independent writable roles retain their existing capabilities.
- Accounting filters enforce the exact status/location grouping through pagination and other filters.
- Eligible note changes succeed, including clearing; invalid notes and ineligible/stale slips are rejected without other changes.
- Existing Logistics workflows and Accounting return tests remain green.

### Inputs / Outputs
**Inputs:** Authenticated permission assignments, selected role, query filters, requisition ID and optional note.
**Outputs:** Scoped cursor pages, unchanged dashboard/report contracts, audited note saves or authorization/validation failures.

### Agent Assignment
- frontend_agent: Primary agent handles frontend integration.
- qa_agent: Primary agent handles focused regression checks.
- reviewer_agent: Primary agent reviews authorization and compatibility.
- project_manager: Primary agent maintains this task and continuity references.
- backend_agent: Primary agent handles finance and auth catalog changes.

### Dependencies
- Deploy auth catalog migration, finance API, then ABMS frontend; assign observers afterward.
- Authenticated E2E requires an available test session; backend tests use isolated SQLite.

### Edge Cases
- Combined observer/writable roles; typed department and section IDs that collide.
- Empty, unsupported, combined and All Accounting status selections.
- Certified slips at BAO/HRMDO are excluded from the new worklist without changing return rules.
- Notes cleared, too long or saved after the slip becomes ineligible.
- Alternate write endpoints, attachments, chat, price/fulfillment actions and forged role parameters.

### Notes
State: DONE. Approved plan and clarified choices are recorded in the originating conversation.
No existing user assignments or financial records are migrated.

## Verification

- Finance: `docker compose exec -T app php artisan test --compact --colors=never` passed 302 tests / 2,662 assertions.
- Auth catalog migration: two isolated tests passed / nine assertions, covering repeatability, rollback, existing assignments and missing ABMS group. The migration was not applied to the running database.
- ABMS: `pnpm.cmd --filter abms build` passed (existing bundle-size advisory remains).
- ABMS lint reports 78 existing errors and 10 warnings. Comparing all nine edited frontend files with HEAD found 39 diagnostics before and after, with zero added diagnostics. No unrelated lint cleanup was performed.
- Playwright/Edge component smoke checks passed for observer action suppression and message viewing, retained view/print/file/history tools, normal Logistics actions/chat, Accounting status choices/default, and note save with an idempotency key. API responses were mocked for this browser check; authenticated Laravel API tests cover enforcement. No live authenticated browser session or production data was used.
- Existing Logistics workflows and Accounting return eligibility at all three offices remain covered. New failure cases cover forged roles, alternate note writes, overlength/stale notes, all mutation families, mixed grants and unavailable permission catalog resolution.

## Deployment

1. Deploy and run auth_service migration `2026_11_10_000001_add_abms_logistics_readonly_permission.php`.
2. Deploy finance_service, then ABMS.
3. Refresh the permission catalog/session as needed and assign Logistics (Read Only) through User Access.

No user role assignments or financial records were changed during implementation.
