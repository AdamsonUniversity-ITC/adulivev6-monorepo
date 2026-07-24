# ABMS Continuity Status

Last verified: 2026-07-24

## Current Scope

The principal ABMS workflow is implemented across Budget Proposal Entry, Budget Request Entry, the role-based requisition process, and Liquidation Submission. Reporting covers budget performance, requested items, adjustments, liquidation, proposal reports, and unserved requisitions.

The frontend also contains a protected Budget User Guides infographic page for users having Budget Proposal Entry or Budget Request Entry access. Its final artwork is served as static files from `apps/abms/public/infographics/`.

Canonical behavioral details remain in:

- `system-context.md` for repositories, modules, routes, authorization boundaries, and verification status.
- `business-rules.md` for financial calculations, workflow rules, report scopes, typed identity, and printing.
- `erd.md` for finance-domain tables and logical cross-database relationships.
- `flowcharts.md` for end-to-end workflows and report projections.
- `../../tasks/` for implementation-specific acceptance criteria and verification notes.

## Implemented Report Inventory

- Budget Performance per Department: Departmental, Grand Summary, and Detailed.
- Budget Performance per Account: Summary and Detailed.
- Budget Performance University: Summary, grouped Summary, and Detailed.
- Item Requested per Account: Summary and Detailed.
- Items Requested by Payee.
- Adjustments per Department: Summary, Detailed, and Detailed per Date.
- Budget Liquidation: Summary, Detailed, and Summary per Department and Account.
- Budget Proposal Reports:
  - Budget Proposal with Details and Status
  - University Budget
  - Approved Budget
  - Approved Items per Account
  - Approved Items per Account/Department
  - Percentage of Proposed versus Approved Budget
  - Percentage of Approved Budget, Previous versus Current School Year
- Unserved RS, optionally scoped by current workflow location.

## Non-Negotiable Finance Rules

- Use account IDs as identity. Account codes and SAP numbers are display values and may repeat.
- Use typed organizational keys: `department:{id}` and `section:{id}` remain distinct when their numeric IDs match.
- Financial writes that affect allocations or balances must remain atomic and lock the affected records.
- Requisition refund and reversal paths resolve modern items by stored `account_id`; ambiguous legacy code-only mappings fail safely.
- Liquidation returned amounts are reversible: a resave applies only the delta and overwrites the requisition header's latest liquidation summary atomically.
- Reports return backend-calculated fixed two-decimal money strings. The frontend formats but does not recompute financial totals.
- Current live date-range reports use inclusive application-timezone `created_at` boundaries and current stored values. They do not reconstruct period activity from audits unless a report's documented rule explicitly uses an audit event for metadata.
- Missing or ambiguous historical relationships produce structured data-quality warnings shown as toasts.
- Browser reports use US Letter landscape with 0.35-inch margins and the authenticated user's resolved full name.
- Core production financial mutations use UUID idempotency keys and replay completed identical requests without repeating writes.
- Finalized RS numbers come from a locked yearly sequence; unsaved drafts remain `0`, and finalized numbers are preserved.
- Core monetary storage is standardized to `DECIMAL(15,2)` and affordability decisions use exact integer-cent arithmetic.

## Resume Checklist

Before changing finance behavior in a new session:

1. Read `skills/abms-system-knowledge/SKILL.md`.
2. Read this file and the routed documents above.
3. Inspect current source and migrations; they override stale documentation.
4. Locate the applicable task record or create one using the repository's required task format.
5. Preserve unrelated working-tree changes.
6. Run focused tests for the changed workflow, then the relevant regression suite, frontend lint/build, and authenticated browser flow when available.

## Local Workflow Seed

After rebuilding a local finance database, optionally set
`ABMS_LOCAL_DEMO_DEPARTMENT_ID` (defaults to logical Department ID `1`) and
run:

```bash
php artisan migrate:fresh --seed
```

`ABMS_LOCAL_DEMO_SCHOOL_YEAR` is an optional override. `DatabaseSeeder`
creates no user record and calls only the local ABMS finance-schema seeder.
The seeder does not query or write external organization, teacher, or
authentication schemas, refuses to run in production, and creates a
reconciled proposal/account baseline. Draft requisitions, routing, returns,
and liquidation should be exercised through the UI so transaction behavior
is tested rather than bypassed.

The finance-service base PHPUnit `TestCase` refuses to start when the active
connection is MySQL and the database name does not contain `test`. This guard
must remain in place even when configuration is cached.

## Known Follow-ups

- The generic requisition-process endpoints retain documented server-side authorization debt; role/action context must not be treated as a security boundary.
- The frontend production build reports a large JavaScript chunk advisory.
- Some authenticated end-to-end report and workflow checks require a seeded integration environment and cannot be proven by compilation or isolated feature tests alone.
- Existing `router.tsx` lint debt should be handled separately from feature changes to avoid mixing unrelated cleanup with production fixes.
