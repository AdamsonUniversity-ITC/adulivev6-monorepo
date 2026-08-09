# ABMS Continuity Status

Last verified: 2026-08-09

## Current Scope

The principal ABMS workflow is implemented across Budget Proposal Entry, Budget Request Entry, the role-based requisition process, and Liquidation Submission. Liquidation Submission enforces authenticated typed-unit confidentiality for non-Administration/non-Budget users and locks a sole assigned unit in its filter. Reporting covers budget performance, requested items, adjustments, liquidation, proposal reports, and unserved requisitions.

Budget Request Entry is visible and route-authorized for users having `allow-budget-request-entry`, `admin-access`, or `budget-access`. Administration and Budget general roles can select every proposal-backed Department and Section, while ordinary request-entry users remain limited to their assigned typed units.

The frontend also contains a protected Budget User Guides infographic page for users having Budget Proposal Entry or Budget Request Entry access. Its final artwork is served as static files from `apps/abms/public/infographics/`.

The shared frontend shell preserves the expanded navigation and existing spacing at the 1920×1080 baseline. Below 1536 CSS pixels, navigation becomes a dismissible overlay drawer so 1366×768, 1280×720, tablet, and phone displays retain the full content width. Shared page primitives constrain long headings and action rows; dense forms stack on narrow displays, while wide data tables and print-preview paper retain local scrolling rather than widening the application viewport.

Global shell navigation includes a compact AdU Live redirect beside the theme toggle and a clickable Adamson/ABMS sidebar brand that returns to the dashboard in both expanded and collapsed states.

All non-print ABMS dialogs are dynamic-viewport safe. Shared shadcn dialogs and alert dialogs receive global height, width, and overflow constraints, while custom administration, requisition, liquidation, attachment, account, payee, item, chat, and audit overlays use a scrollable backdrop or a fixed-header/scrollable-body/fixed-footer structure. The New Requisition Slip and Add Item actions therefore remain reachable on short displays. Report paper, RS print previews, and printable review sheets are intentionally excluded and retain their printable dimensions inside local preview scrolling.

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
- Combined Department/Section selectors in Budget Proposal Entry, Budget Request Entry, Requisition Process, and reports must compare and key options by that typed identity; API requests still send the raw ID together with the matching unit type.
- Financial writes that affect allocations or balances must remain atomic and lock the affected records.
- Requisition refund and reversal paths resolve modern items by stored `account_id`; ambiguous legacy code-only mappings fail safely.
- Liquidation returned amounts are reversible: a resave applies only the delta and overwrites the requisition header's latest liquidation summary atomically.
- Reports return backend-calculated fixed two-decimal money strings. The frontend formats but does not recompute financial totals.
- Current live date-range reports use inclusive application-timezone `created_at` boundaries for period activity and current stored values. Budget Performance proposal/allocation baselines are selected by school year and typed scope rather than proposal creation date. Reports do not reconstruct period activity from audits unless a report's documented rule explicitly uses an audit event for metadata.
- Budget Review and report Department/Section selectors expose only typed units with qualifying live rows in the applicable proposal, adjustment, requisition, or liquidation source. Referenced inactive units remain selectable, and report unit option panels widen within the viewport for long names.
- Missing or ambiguous historical relationships produce structured data-quality warnings shown as toasts.
- Browser reports use readable shared typography on US Letter landscape with printer-safe 0.30-inch margins and the authenticated user's resolved full name. Financial table columns and total bands reserve non-wrapping numeric space through the supported `DECIMAL(15,2)` width so large values do not overlap.
- Every browser report preview exposes a shared `.xlsx` export beside Print. The workbook preserves the visible report hierarchy and backend totals, stores recognized money/percentage/quantity cells numerically, and applies readable wrapping and Letter-landscape settings.
- Core production financial mutations use UUID idempotency keys and replay completed identical requests without repeating writes.
- Finalized RS numbers come from a locked yearly sequence; unsaved drafts remain `0`, and finalized numbers are preserved.
- Cashier Payee Details require form-specific classification: Supplier/Water uses VAT/Non-VAT, while Honorarium requires TIN and AdU/Non AdU Employee. Shared RS printing omits classifications that do not belong to the selected payment form. Cashier finalization keeps the PHP 1,000 minimum for ordinary payment forms but exempts the exact stored `Payment for Supplier/Water` and `PNB Credit Card Payment` forms.
- Requisition Process Budget and Administration roles expose `RS to Process Today`, a worklist filter that includes every RS type and excludes only PNB Credit Card Payment; the filter action card now uses a single full-width Requery action.
- Every explicit ABMS Load More surface uses a shared observer-driven infinite-scroll sentinel while retaining bounded cursor pages. This covers the five cursor-paginated Requisition Process role tables, Budget Request Entry, User Access, and each expanded Main Account sub-account list; a failed automatic page exposes Retry without looping. Explicit Previous/Next pagination in selection modals and administration tables remains unchanged.
- Administration keeps its broad `On Process` filter and can narrow that stage to Controller Pending, Approved, or Disapproved using the stored `is_controlled` state; multi-status selections remain OR-based.
- Controller worklist rows are audit-tagged when a prior Controller approval is followed by a later reprocess action. The current cursor page uses one ordered audit query, and qualifying rows show a purple tint/marker plus `REPROCESSED AFTER APPROVAL`; a matching Controller-only purple legend appears immediately after the `For Liquidation` legend. Reprocess RS continues to reset the live decision to pending, and liquidation coloring can coexist with the persistent marker/tag.
- Stockroom can narrow its active incoming queue to `RS from Logistics` or `RS from Budget Office`; these exact source filters require the matching current Stockroom location and PO-on-process or certified stage, and combine with other Stockroom filters using OR behavior.
- Stockroom's default `To Process RS` also requires the requisition's current location to be Stockroom; historical visits remain available through `Processed RS` but no longer leak certified records from another office into the active queue.
- The shared RS Process modal displays the stored RS type as `For Office Supplies`, `For Purchase`, or `For Cash Valued Items` in its unchanged metadata grid.
- At the Logistics pricing/purchase stage, authenticated Logistics users have a description-only RS item editor. P.O. on Process is excluded after the RS leaves Logistics. Its dedicated locked/idempotent endpoint accepts no other item fields and leaves every financial and account value unchanged; quoted-price entry remains a separate control.
- Logistics may submit partial positive quoted-price batches during `for pricing` or `for purchase`, with each batch returning to Administration for acceptance. Only prices changed in the current editor session are validated, reviewed, and submitted; untouched null rows do not block Review & Save. Previously accepted prices remain editable, and a changed accepted price enters the next Administration approval batch. Logistics cannot send a For Purchase RS to WICO until every live item has a positive quote and every quote has been accepted into the matching unit cost; the guarded, locked transition then moves it to `po on process` at Stockroom.
- Guarded misrouting returns let Logistics send `for pricing` and Stockroom send `certified` back to Administration at `on process` while retaining the Controller decision, so Administration can choose the correct destination without another approval cycle. Stockroom can instead return either PO-on-process spelling to Logistics at `for purchase` while retaining approval and quoted prices. These idempotent, audited transitions enforce the matching role, lock and revalidate the header, and change no item or financial data.
- The shared RS print preview defaults to US Letter portrait and offers Half Legal Crosswise (`8.5in × 7in`), institution Half Legal/Long Bond (`8.5in × 6.5in`), Letter, standard `8.5in × 14in` Legal, institution `8.5in × 13in` Legal/Long Bond, A4 portrait and landscape presets, and a browser-controlled Printer Default / Any Paper mode. Both half formats have exact, legacy-Letter, and applicable full-sheet choices. Fixed formats retain explicit physical dimensions during printing; safety margins live inside the RS while the CSS page margin stays zero to prevent browser URL/date headers from shifting the layout. Older drivers that scale unsupported custom media can use a recommended Letter-media compatibility mode with reduced top spacing and an unlabeled dashed cut guide.
- The same selector groups Epson LX-300-II presets for Letter, Legal, institutional `8.5in × 13in`, and half-institutional `8.5in × 6.5in`. Whole Epson Institution Legal uses the exact configured 13-inch driver form; Epson Half Institution Legal retains an unscaled Letter-driver compatibility canvas with its content in the upper `6.5in`. A browser cannot register printer-driver forms, so the matching custom form must exist in the Epson driver.
- The `margin` value on either Epson institutional option is authoritative for the inner RS sheet padding in preview and print; it is not replaced by a separate hardcoded Epson margin.
- Epson whole Institution Legal is now sent as an exact `8.5in × 13in` page at `1.0` scale with `0.6in` top, `0.5in` horizontal, and zero bottom inner padding. The half-institutional Epson preset remains on the Letter-driver compatibility path.
- Every shared RS Print-button click first appends an authenticated, idempotent print event and then opens the browser print dialog. Requisition Process History merges these `Printed` rows with Laravel audit rows without placing print activity in `audits`; reports and audit-based finance reconstruction therefore remain unaffected.
- Logistics and Stockroom perform a read-only latest-other-user print-history check before opening the RS preview. A prior other-user print shows an explicit Yes/No warning with the RS number, printer name, and latest timestamp; No or lookup failure creates no event, while all other roles retain direct preview opening.
- Budget Performance Per Department, Item Requested Per Account, Budget Proposal Reports, and Budget Liquidation accept typed Budget Request/Proposal Entry permissions. Entry-permission-only users see and may preview only the union of their assigned typed units, with a sole eligible unit selected automatically.
- Core monetary storage is standardized to `DECIMAL(15,2)` and affordability decisions use exact integer-cent arithmetic.
- Budget Adjustment Entry can open a previously unallocated child account only through a deliberate positive current-year adjustment under exactly one typed-unit proposal. The runtime allocation starts with zero proposed/approved/unused amounts, receives only the net balance, and remains at zero after safe reversal; no migration or deployment-time data mutation supports this behavior.
- Budget Request Entry dialogs ignore backdrop clicks and Escape, requiring explicit closure. Persisted number-`0` items can be edited one at a time: Cashier/Logistics permit Account, Description, Quantity, and Unit Cost with fixed UOM; Stockroom permits Account and Quantity only. Account moves refund/debit exact typed-unit allocations and reconcile proposal/item/header balances atomically in cents.

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

To add alternative funded accounts to an existing RS specifically for testing
the Budget item editor, set `ABMS_RS_EDITING_REQUISITION_ID` to an RS currently
at `for review` in `budget office`, then run:

```bash
php artisan db:seed --class='Modules\Abms\Database\Seeders\AbmsRsEditingAccountsSeeder'
```

This standalone local-only seeder derives the school year and exact typed
Department/Section from the RS. It adds three idempotent demo allocations and
matching approved proposal items, increasing the proposal totals and balance
by the same amount. It is intentionally not called by `DatabaseSeeder`, does
not reset balances on reruns, and rejects previously deleted demo allocations
rather than attempting to reconstruct their financial history.

The finance-service base PHPUnit `TestCase` refuses to start when the active
connection is MySQL and the database name does not contain `test`. This guard
must remain in place even when configuration is cached.

## Known Follow-ups

- The generic requisition-process endpoints retain documented server-side authorization debt; role/action context must not be treated as a security boundary.
- The frontend production build reports a large JavaScript chunk advisory.
- Some authenticated end-to-end report and workflow checks require a seeded integration environment and cannot be proven by compilation or isolated feature tests alone.
- Existing `router.tsx` lint debt should be handled separately from feature changes to avoid mixing unrelated cleanup with production fixes.
