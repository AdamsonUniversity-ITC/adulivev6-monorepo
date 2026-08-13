# ABMS Continuity Status

Last verified: 2026-08-11

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
- Purchasing Accomplishment Report, restricted to Logistics and summarized by Logistics arrival period.

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
- Cashier Payee Details require form-specific classification: Supplier/Water uses VAT/Non-VAT, while Honorarium requires TIN and AdU/Non AdU Employee. Shared RS printing omits classifications that do not belong to the selected payment form. The PHP 1,000 Cashier finalization minimum applies only to the exact stored `Reimbursement/Replenishment` payment form; all other Cashier payment forms may finalize below that amount.
- Requisition Process Budget and Administration roles expose `RS to Process Today`, and both include every RS type while excluding PNB Credit Card Payment. Budget additionally limits this pseudo-status to the current `for review` stage; Administration retains its broad all-status interpretation. The filter action card uses a single full-width Requery action.
- Every explicit ABMS Load More surface uses a shared observer-driven infinite-scroll sentinel while retaining bounded cursor pages. This covers the five cursor-paginated Requisition Process role tables, Budget Request Entry, User Access, and each expanded Main Account sub-account list; a failed automatic page exposes Retry without looping. Purchasing, Stockroom, and Accounting distinguish initial loading from cursor append loading, keep existing rows mounted, deduplicate by requisition ID, and reset the sentinel guard by cursor without remounting its DOM node, preventing viewport jumps. Explicit Previous/Next pagination in selection modals and administration tables remains unchanged.
- Administration keeps its broad `On Process` filter and can narrow that stage to Controller Pending, Approved, or Disapproved using the stored `is_controlled` state; multi-status selections remain OR-based.
- Controller worklist rows are audit-tagged when a prior Controller approval is followed by a later reprocess action. The current cursor page uses one ordered audit query, and qualifying rows show a purple tint/marker plus `REPROCESSED AFTER APPROVAL`; a matching Controller-only purple legend appears immediately after the `For Liquidation` legend. Reprocess RS continues to reset the live decision to pending, and liquidation coloring can coexist with the persistent marker/tag.
- Stockroom can narrow its active incoming queue to `RS from Logistics` or `RS from Budget Office`; these exact source filters require the matching current Stockroom location and PO-on-process or certified stage, and combine with other Stockroom filters using OR behavior.
- Stockroom's default `To Process RS` also requires the requisition's current location to be Stockroom; historical visits remain available through `Processed RS` but no longer leak certified records from another office into the active queue.
- The shared RS Process modal displays the stored RS type as `For Office Supplies`, `For Purchase`, or `For Cash Valued Items` in its unchanged metadata grid.
- At the Logistics pricing/purchase stage, authenticated Logistics users have a description-only RS item editor. P.O. on Process is excluded after the RS leaves Logistics. Its dedicated locked/idempotent endpoint accepts no other item fields and leaves every financial and account value unchanged; quoted-price entry remains a separate control.
- Logistics Workflow V2 is implemented behind disabled-by-default `ABMS_LOGISTICS_WORKFLOW_V2`. Changed unresolved prices become pending Administration acceptance; acceptance applies exact financial deltas and resets Controller approval while retaining `for approval`. Controller price cycles support pending/disapproved review, audit-derived approval counts, and a teal Price Reapproval marker/legend. Controller approval gates For Purchase.
- V2 WICO forwarding dispatches all currently accepted unresolved lines when at least one is eligible. Stockroom can individually or bulk tag eligible lines Pending, Served, or Unavailable; Select All is one idempotent request and remains reversible before finalization. Header Served requires every live line resolved. Partial return preserves completed lines and clears only unresolved dispatch. Certified Stockroom quantity zero/restore maps to Unavailable/Pending with the established exact balance reconciliation.
- The additive migration backfills only exact-cent acceptance and supported active dispatch flags, leaving every header state and financial value untouched. Terminal records show `Legacy resolved` without invented fulfillment history. API capability metadata and separate legacy-serve compatibility support backend-first, frontend-second production deployment.
- The Logistics Requisition Process worklist defaults its sort option to `Requisition No.` descending. Users may still select every existing sort column and direction, and other roles retain their established defaults.
- Guarded returns let Logistics send either `for pricing` or a Logistics-type `for purchase` RS and let Stockroom send `certified` back to Administration at `on process`, retaining the Controller decision. The For Purchase path supports delivery-fee correction without requiring a quoted-price edit; Administration can route normally or select Reprocess RS, which alone resets Controller approval and returns the RS to Department. The interfaces label this action `Return to Budget` while preserving the stable `Return to Administration` backend value and database location `budget office`. Stockroom can instead return either PO-on-process spelling to Logistics at `for purchase` while retaining approval and quoted prices. These idempotent, audited transitions enforce the matching role, lock and revalidate the header, and change no item or financial data.
- Partially fulfilled Logistics RS corrections preserve completed-line immutability. Budget/Administration and Department reprocess editors keep Served and Unavailable lines visible but locked and submit only Pending lines. The backend tolerates unchanged resolved lines from a backward-compatible full-form payload, ignores them while updating Pending/new lines, and rejects actual resolved-line edits or deletion without financial mutation. A newly added delivery-fee line remains Pending.
- Administration onward routing is constrained by stored RS type in both UI and API: Stockroom may go only to Stockroom; Logistics may use only For Pricing and the later For Purchase stage; Cashier cannot use those Stockroom/Logistics destinations. Send RS to Staff remains available across types for eligible Controller-approved on-process records and returns them to `for review` at Budget Office with Controller state reset to pending.
- Accounting now defaults to Certified and is scoped by current location to `accounting office`, `bao`, or `hrmdo`, with independent `accounting-access` enforcement. Its shared modal is read-only except for `Return to Budget` on a Certified Cashier RS. That locked, idempotent action preserves all request and financial data, records the exact previous office in `from`, and returns the RS to `for budget director` at Budget Office with Controller pending.
- Administration can edit returned Cashier items using the existing account-ID, typed-unit, integer-cent balance editor while the RS remains `for budget director` at Budget Office. It must then be manually forwarded to Controller and approved before any established Cashier destination is available. Future HRMDO forwarding stores `hrmdo`; no deployed historical record is rewritten.
- Controller responses derive workflow-arrival `controller_review_count` independently from successful `controller_approval_count`. A count above one displays an ordinal label such as `CONTROLLER RE-REVIEW · 2ND APPROVAL`; active Logistics price reviews use the same `1ST/2ND/3RD APPROVAL` wording. The Controller modal centers the larger sent, approved, price-reapproved, and active approval-cycle text in the Requested Items header, leaving the action footer stable. Incomplete audit history contributes zero.
- Purchasing/Logistics, Stockroom, and Accounting do not display `Mark as Cancelled` in the shared RS modal; established cancellation visibility for the remaining roles is unchanged.
- Office Supplies list search matches client-provided item codes and item names. Users can sort by Item Code, Item Name, or Unit Cost in either direction; Item Code ascending is the default and cursor ordering retains an ID tie-breaker.
- Office Supplies ownership belongs to Stockroom: the page route/sidebar and backend create, update, and delete mutations require `stockroom-access`. The authenticated list endpoint remains available to established requisition item pickers.
- The shared RS print preview defaults to General/PDF Letter portrait. General/PDF is limited to Letter, Legal, and A4 in portrait and landscape orientations. Epson LX-300-II is limited to Letter, Legal, and Half Legal (`8.5in × 7in`). Fixed formats retain explicit physical dimensions during printing; safety margins live inside the RS while the CSS page margin stays zero. A browser cannot register printer-driver forms, so Half Legal must exist in the Epson driver when physical output requires that custom form.
- Every shared RS Print-button click first appends an authenticated, idempotent print event and then opens the browser print dialog. Requisition Process History merges these `Printed` rows with requisition-header and active/soft-deleted child-item OwenIt audits without placing print activity in `audits`; reports and audit-based finance reconstruction therefore remain unaffected. Item events identify the affected description, and the UI converts database keys, Controller `0/1/2`, booleans, money, dates, workflow text, and nested JSON-like values into readable budget-staff language while retaining raw API values for compatibility.
- Logistics, Stockroom, Budget, and Administration perform a read-only latest-print-history check before opening the RS preview. The newest event is used even when the current user printed it; any prior print shows the existing Yes/No warning with RS number, printer name, and timestamp. No or lookup failure creates no event, while Controller and other roles retain direct preview opening.
- Budget Request Entry and the Stockroom Requisition Process role disable Print RS when `rstype = stockroom` unless the current state is Certified or Served (including established Certified RS, Served RS, and Served by WICO aliases). The guarded click paths also refuse to open the preview. Non-Stockroom requests and Logistics, Administration, Controller, and other Requisition Process roles retain their prior printing behavior.
- The shared print footer adds `Approved By: Office Head` and `Received By: Office Representative` signature lines for Stockroom-type RS only. They share the existing row with print metadata and `Budget Certified By: Controller`; non-Stockroom layouts remain unchanged.
- Office Supply item codes are required client-provided strings, trimmed before persistence and editable during create or update. Backend validation and the existing database unique index reserve codes across both live and soft-deleted rows; automatic `OS-xxxxx` generation is no longer used.
- Stockroom access can edit only item quantities on a Stockroom-type RS while it is `certified` at Stockroom, including setting a quantity to zero for unavailable stock. A dedicated locked/idempotent endpoint recalculates item and header totals and applies exact allocation/proposal balance deltas atomically; Served and all other stages remain locked.
- Requisition Process View Accounts uses the selected RS ID in every role handler. The independently authorized backend derives the stored school year and exact typed unit, then returns every live scoped allocation without pagination—including unreferenced and zero-remaining-balance accounts—plus any referenced legacy account needed for a data-quality warning. Each ID must resolve to exactly one live scoped allocation for a balance; missing or ambiguous mappings remain visible as `Unavailable`.
- Department reprocess editing lets requestors transfer Pending items to another account from the RS's exact school-year typed-unit allocation set and change the other established item fields. The backend atomically refunds the old allocation, charges the destination, and recalculates proposal/item/header values in integer cents. Served and Unavailable items remain fully locked, including their account binding.
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
- Enable `ABMS_LOGISTICS_WORKFLOW_V2` only after the migration, backend, and refreshed Administration/Controller/Logistics/Stockroom clients are deployed and active-stage smoke tests pass; retire `ABMS_ACCEPT_LEGACY_SERVE` after confirming adoption.
