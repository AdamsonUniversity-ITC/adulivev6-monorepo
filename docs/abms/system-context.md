# ABMS System Context

Last verified: 2026-08-09

## Purpose

This directory is the durable architecture memory for the AdULive ABMS finance domain. It complements task specifications and source code so a fresh chat can recover the system model without relying on earlier agents.

## Repository Map

| Concern | Location | Notes |
|---|---|---|
| ABMS frontend | `apps/abms` | React, Vite, TanStack Router, Tailwind CSS, shadcn/ui |
| Shared frontend code | `packages/` | Axios/service configuration and reusable packages |
| Finance API | `../finance_service` | Sibling Laravel service |
| ABMS backend module | `../finance_service/app-modules/abms` | Routes, controllers, requests, services, resources, and models |
| Backend migrations | `../finance_service/database/migrations` and module migrations | Inspect both before schema work |
| Backend tests | `../finance_service/tests` | Feature and unit coverage |
| Frontend tests | `tests/`, `playwright/`, `e2e/` | Availability varies by flow |
| Requirements | `tasks/` | Canonical task specifications and acceptance criteria |
| Durable domain documentation | `docs/abms/` | Context, ERD, rules, and flowcharts |

## Runtime Data Boundaries

ABMS spans several databases/services:

- The finance database owns accounts, proposals, allocations, adjustments, requisitions, settings, statuses, permissions, audits, append-only RS print events, and media.
- `db116_adamson` owns the organization directory: divisions, departments, sections, and division types.
- `aduollms` owns teacher/employee directory data used for names such as `printed_by` and `requested_by`.
- Authentication and permission identity values are shared across services and are not always protected by physical cross-database foreign keys.

Cross-database relationships are logical. Code must handle missing, inactive, or historically changed directory records without confusing department and section IDs.

## Frontend Entry Points

The report pages live in `apps/abms/src/pages/reports/`:

- `BudgetPerformanceDepartment.tsx`
- `BudgetPerformanceAccount.tsx`
- `BudgetPerformanceUniversity.tsx`
- `ItemRequestedPerAccount.tsx`
- `ItemsRequestedByPayee.tsx`
- `AdjustmentsPerDepartment.tsx`
- `BudgetLiquidation.tsx`
- `BudgetProposalReports.tsx`
- `UnservedRs.tsx`
- shared searchable filter: `shared/ReportFilterCombobox.tsx`

All nine report previews use `shared/ReportPrintPortal.tsx` and `shared/report-print.css` for authoritative US Letter landscape sizing, readable shared typography, a `0.30in` printer-safe margin, matching preview content inset, and shared overlap prevention for long metadata, headings, and table content. Page-local table layouts remain responsible for report-specific columns, grouping, and page-break rules. The same portal injects `shared/ReportExcelButton.tsx` beside Print; `shared/reportExcel.ts` dynamically loads ExcelJS and converts the active rendered preview into a styled `.xlsx` workbook without fetching or recalculating report data.

Routes are registered in `apps/abms/src/router.tsx`. Finance requests use the shared finance-service Axios configuration. Protected routing must derive production redirects from the Vite production URL environment setting rather than hardcoded localhost values.

The shared protected route renders `components/LoadingScreen.tsx` immediately while it verifies the authenticated session, ABMS access, finance profile, general permissions, and typed Department/Section assignments. Protected content is rendered only after that context resolves. The screen remains visible for at least 500 ms to avoid flashing on fast responses and preserves the existing login, maintenance, and unauthorized redirects. The production redirect base is the single Vite setting `VITE_ADU_LIVE_PRODUCTION_URL`.

Every routed page uses `layouts/Screenlayout.tsx`. At 1536 CSS pixels and wider, it preserves the existing expanded-sidebar desktop layout. Below that breakpoint, `components/Sidebar.tsx` is an inert off-canvas drawer while closed and can be opened from the header, dismissed through its backdrop or Escape, and closes after navigation. `components/ui/Page.tsx` provides responsive shared page width, header, action, and surface constraints. Application-level horizontal overflow is suppressed; intentionally wide tables must remain inside their page-owned scroll container, and report paper retains its printable width inside the preview's scroll container.

The shared header places a compact AdU Live link beside the theme toggle. It resolves `VITE_ADU_LIVE_PRODUCTION_URL` with `https://live.adamson.edu.ph` as fallback and navigates in the current tab. The expanded and collapsed sidebar Adamson/ABMS brand is a keyboard-accessible dashboard control targeting `/`; sidebar expansion remains a separate action.

All non-print workflow dialogs are bounded by the dynamic viewport rather than being centered at an unrestricted natural content height. Global rules constrain the shared shadcn `DialogContent` and `AlertDialogContent` primitives. Custom administration, requisition, liquidation, attachment, account, payee, item, chat, and audit overlays use the `abms-modal-backdrop` scroll contract or a fixed-header/scrollable-body/fixed-footer structure. On short displays the backdrop aligns custom content from the visible top and can scroll to every action. The New Requisition Slip and Add Item dialogs keep their headers and action footers visible while only their bodies scroll. Report paper, RS print previews, and printable review sheets remain outside this rule so their printable dimensions are preserved inside their existing local preview scrolling.

The static Budget User Guides page lives at `pages/infographics/BudgetUserGuides.tsx` and `/infographics/budget-user-guides`. Its sidebar item and route both allow either `allow-budget-proposal-entry` or `allow-budget-request-entry`. Approved artwork is served from `public/infographics/`; the page makes no finance API request and changes no transaction behavior.

## Backend Entry Points

ABMS route files are under `../finance_service/app-modules/abms/routes/`. Report endpoint families include:

- `budget-performance-per-department.php`
- `budget-performance-per-account.php`
- `budget-performance-university.php`
- `item-requested-per-account.php`
- `items-requested-by-payee.php`
- `adjustments-per-department.php`
- `budget-liquidation.php`
- `budget-proposal-reports.php`
- `unserved-rs.php`

Transaction families include proposal entry, adjustment entry, requisition entry/process, liquidation submission, transfer account, settings, status, accounts, departments, and user access.

Budget Adjustment Entry preserves its existing current-school-year allocated-account workflow. If the exact typed-unit proposal exists but the selected child account has never had an allocation, a positive net adjustment may create one runtime `sub_accounts` row with zero proposed/approved/unused amounts and an opening balance equal to the adjustment net. Missing or ambiguous proposals, duplicate or deleted allocation history, and nonpositive opening adjustments fail atomically. Adjustment mutations use exact cents and the shared financial-idempotency contract; this behavior requires no schema migration, backfill, dependency, or deployment-time data operation.

Office Supplies list queries default to `item_name` ascending with an `id` tie-breaker before cursor pagination. The administration UI filters by partial item name and permits Item Name or Unit Cost sorting in either direction. Both the Budget Request Entry Stockroom item picker and the New RS Stockable / Inventoriable Items reference panel consume the same 10-row cursor pages with Previous/Next navigation and always request alphabetical item-name order.

The requisition-process frontend has role-specific views for Budget, Administration, Controller, Logistics/Purchasing, Accounting, Stockroom, and Cashier. Administration includes a `For Approval` status filter that selects current requisition headers whose status is `for approval`, while retaining `For Budget Director` as its default filter. Controller decisions use `PATCH /api/abms/requisition-process/{id}/controller-approval`; general requisition transitions continue through `PUT /api/abms/requisition-process/{id}`. Department-facing requisition review also exposes a read-only quoted-price projection at `GET /api/abms/budget-request-entry/{id}/quoted-price-preview`.

In the shared RS Process modal, Logistics quoted-price Save first opens a responsive read-only verification modal showing all entered unit prices and calculated line/grand totals. Closing or cancelling preserves the drafts; the existing idempotent quoted-price mutation and workflow transition run only after explicit confirmation.
Logistics may leave item quote inputs blank and submit at least one positive quote per pricing round. Review & Save considers only item prices changed during the current editor session, so untouched null rows do not block the batch and untouched stored prices are excluded from its confirmation and payload. Stored prices already accepted by Administration remain editable; changing one includes it in the new batch and requires Administration to accept the revision. Administration may accept that submitted subset and return the RS to `for purchase`, where Logistics can price remaining items through the same approval cycle. The `Send RS to WICO` control and backend transition remain blocked until every live item has a positive quote and its accepted `unit_cost` exactly matches that quote; the backend rechecks the locked current state and requires `logistics-access`.

The shared Requisition Process payment-form filter includes `All Except PNB Credit Card Payment`. The backend treats it as a query sentinel before cursor pagination, returning only populated payment forms whose trimmed, case-insensitive value is not PNB Credit Card Payment; existing individual options remain exact filters. Separately, Budget and Administration status pills include the `RS to Process Today` worklist sentinel, which returns every RS type including null/blank payment forms and excludes only trimmed, case-insensitive PNB Credit Card Payment. Other roles do not receive this status option.

Administration's status choices retain the broad `On Process` option and add Pending, Approved, and Disapproved Controller-decision variants. The backend groups each variant as `status = on process` plus the matching three-state `is_controlled` value and ORs that group with any other selected ordinary statuses before cursor pagination.

The Controller requisition-process response also derives an informational reprocess-history flag from OwenIt audits for the current cursor page. One batched, ordered query identifies an `is_controlled = 1` audit followed by a later `status = reprocess` audit; malformed, reversed, or incomplete evidence does not qualify. Qualifying Controller rows use a purple history tint and inset marker plus a `REPROCESSED AFTER APPROVAL` tag. If the row is also for liquidation, the liquidation background remains while the purple marker and tag preserve both meanings. Reprocessing continues to reset the live Controller decision to pending.

Stockroom's status area also provides source-specific incoming queues. `RS from Logistics` resolves both PO-on-process spellings currently at Stockroom with `from = logistics`; `RS from Budget Office` resolves certified requisitions currently at Stockroom with `from = budget office`. These pseudo-statuses use the stored status, location, and origin together and participate in the existing OR-based multi-selection behavior.
The default `To Process RS` queue likewise requires the current location to remain Stockroom in addition to a certified or supported PO-on-process status. Stockroom's audit-based historical visibility continues to support `Processed RS`, but cannot leak an active-stage row from another current office into `To Process RS`.

The shared filter action card contains only Requery; the obsolete View RS action has been removed, and Requery spans the available action width and height above the liquidation legend with a proportionally enlarged label and refresh icon.

ABMS worklists that formerly appended cursor pages through Load More now share an `IntersectionObserver` sentinel with a 320-pixel prefetch margin. Administration, Budget, Controller, Logistics, and Stockroom Requisition Process tables, Budget Request Entry, User Access, and expanded Main Account sub-account lists retain their existing cursor APIs and bounded page sizes but request the next cursor automatically. Each rendered cursor can trigger only once and concurrent calls are guarded; failures stop automatic retries and expose a manual Retry action. Filters and Requery clear the active cursor before replacing the first page. Existing Previous/Next controls in selection modals and explicitly paged administration screens are not part of this behavior.

Budget Request Entry treats payment form and payee details as Cashier-only header data. The New RS modal requires a payment form for Cash Valued Items, while Stockroom and Logistics omit Payee entry and the API strips any stale values submitted for those types. Supplier/Water payees require a numeric TIN and exactly one VAT classification with AdU Employee disabled; Honorarium payees retain the AdU Employee option but omit and clear VAT classifications. Cashier RS finalization normally requires at least PHP 1,000, with exact stored-form exemptions for `Payment for Supplier/Water` and `PNB Credit Card Payment` enforced consistently by the UI and API.

The shared RS Process modal preloads the selected RS attachment list and displays its total on the View Files toolbar action. This is a total-file count only, has no read/unread meaning, and reuses the preloaded list when the attachment viewer opens. Its existing information band also displays a compact request-type badge after the Date, styled consistently with the RS number/status metadata and without adding a grid row: Stockroom is `For Office Supplies`, Logistics is `For Purchase`, and Cashier is `For Cash Valued Items`.

The shared RS print preview used by Requisition Process and Budget Request Entry defaults to US Letter portrait and exposes its paper selector beside Print. Fixed presets include Half Legal Crosswise (`8.5in × 7in`), institution Half Legal/Long Bond (`8.5in × 6.5in`), Letter, standard Legal (`8.5in × 14in`), Institution Legal / Long Bond (`8.5in × 13in`), and A4 in portrait and landscape orientations; the screen sheet follows the selected dimensions. Both half formats provide an exact custom page, a recommended Letter-media legacy mode, and a full source-sheet placement where applicable. Every `6.5in` institution-half variant retains normal RS typography, keeps the centered title fixed, and moves Date Reviewed/Certified `8mm` upward into the left side of the title band. Its signing spacer consumes remaining vertical room and can shrink to zero as item rows increase; users choose a larger preset when content cannot fit naturally. The signature-line height remains `3mm`. Its recommended legacy and full-sheet legacy-driver variants use identical typography and a `0.15in` top inset. The latter retains a full `8.5in × 13in` screen preview but sends a Letter print canvas to prevent older drivers from scaling an unsupported 13-inch CSS page; the full physical institution sheet must be loaded at the printer and its trailing two inches remain blank. Printer Default / Any Paper uses CSS `@page size: auto` so the browser and installed printer driver control the physical paper. Other fixed formats declare both their CSS page and explicit printable dimensions. The browser page margin is zero to remove the URL/date header-footer area, while the RS sheet itself retains internal printer-safe spacing in preview and print. Legacy modes preserve the RS in the upper target area with reduced top spacing and an unlabeled dashed cut guide. Long item lists may continue to another page rather than overlap or silently omit content.

Both RS print entry points pass the authenticated current user into the shared preview for `Printed By`; the requisition’s original requester remains separate and unchanged.

The shared Print button posts to `POST /api/abms/budget-request-entry/{id}/print-events` through the financial-idempotency contract before invoking `window.print()`. The endpoint rejects missing, soft-deleted, or zero-number drafts and snapshots the authenticated user ID, employee number, and teacher-resolved full name in `budget_request_entry_print_events`; it ignores client identity fields. A recording failure leaves the preview and paper selection open. The existing `GET /api/abms/budget-request-entry/{id}/audit-history` response keeps its top-level `audits` array but merges Laravel audit rows and print rows into a stable newest-first timeline with source-qualified keys. Print events never enter OwenIt `audits`, so report and financial-history readers remain unchanged.

Logistics and Stockroom add a read-only pre-preview check through `GET /api/abms/budget-request-entry/{id}/latest-other-print-event`. It returns the newest append-only print event by a user other than the authenticated actor, or null. A returned event drives the shared Yes/No reprint warning; declining or a failed lookup never appends an event. The preview's existing Print action remains the sole print-event write point.

The shared dashboard at `/` exposes authorized role and typed-unit scopes. A Controller role scope reports pending, approved, and disapproved Controller decisions for the selected school year; its current work queue contains only requisitions with `status = on process` and `is_controlled = 0`.

The User Department Access index supports case-insensitive displayed-name search and stable A–Z/Z–A name ordering before cursor pagination. Equal displayed names use employee number as the tie-breaker, and missing teacher-directory records fall back to employee number.

During RS creation, the account picker queries only the exact school-year typed-unit allocation and returns 10-row cursor pages ordered by account name with account ID as the tie-breaker. Account code/name search is applied before pagination and also matches parent/main account code or name. Picker rows display `Main Code - Sub Code` and `Main Name - Sub Name`, while selection and persistence continue using the child account ID and child account code. The requisition-process `requisitionId` account lookup remains an unpaginated list of only the accounts already referenced by that RS.

Persisted number-`0` rows in the initial RS Form expose a per-item Add/Edit dialog. `GET /api/abms/budget-request-entry/{id}/editable-accounts` derives the draft's school year and typed owner server-side and returns searchable cursor pages of every uniquely allocated live child account. `PUT /api/abms/budget-request-entry/{id}/items` accepts an optional `account_id` only for an unsaved draft, transfers the old/new item totals between exact allocations, and returns authoritative item and balance values. Cashier/Logistics edit Account, Description, Quantity, and Unit Cost with fixed UOM; Stockroom edits Account and Quantity while retaining stored catalog fields. Existing reprocess payloads that omit `account_id` remain compatible.

Budget Request Entry custom workflow dialogs are intentionally non-light-dismissable: backdrop clicks and Escape do nothing. Explicit X/Cancel/Close/Discard controls, successful selections, and successful saves retain their normal behavior. The initial RS Form X and Discard controls both wait for the idempotent server-side discard/refund operation, and failures leave the modal open.

Budget-role item review uses `GET /api/abms/requisition-process/{id}/editable-accounts` for searchable 10-row cursor pages of uniquely allocated live accounts derived from the RS school year and exact typed owner. `PUT /api/abms/requisition-process/{id}/items` independently verifies authenticated `budget-access` plus `for review` at Budget Office, then applies item/account changes and exact balance transfers atomically. Administration no longer receives the item-edit control.

Logistics item-description maintenance is isolated at `PUT /api/abms/requisition-process/{id}/item-descriptions`. It independently verifies authenticated `logistics-access` and the existing `for pricing`/`for purchase` stage at Logistics; P.O. on Process is excluded after the RS leaves Logistics. It locks the RS and submitted items and accepts only item IDs plus required descriptions. It does not reuse the Budget financial editor and cannot change any account, quantity, UOM, price, total, allocation, or proposal value. The shared modal keeps description editing separate from quoted-price editing.

The idempotent generic requisition-process mutation endpoint has three independently authorized misrouting corrections. Logistics can return `for pricing` at Logistics to Administration; Stockroom can return `certified` at Stockroom to Administration; and Stockroom can return either stored PO-on-process spelling to Logistics at `for purchase`. Administration returns use `on process` at Budget Office and preserve `is_controlled`, allowing an existing Controller approval to remain valid; the PO return likewise preserves Controller state and accepted quoted prices. Each path locks and revalidates the header and changes no item, financial, attachment, note, or liquidation data. The old `Return RS to Budget` action remains a Stockroom-certified compatibility alias for staggered backend/frontend deployment.

Local environments may seed three alternative funded accounts for a specific
editable RS with `AbmsRsEditingAccountsSeeder` and
`ABMS_RS_EDITING_REQUISITION_ID`. The seeder derives the proposal scope from
the RS, reconciles the new allocation and proposal totals atomically, is
idempotent, and is never part of the default database seeder.

Saved RS item and account read responses expose `main_account_code` separately from the stored child `account_code`, allowing Budget Request Entry and Requisition Process to consistently render `parent - child` without changing financial payload identity. The visible tagging actions read `For Liquidation - Supplier` and `For Liquidation - Cash Advance`, while continuing to submit the established `For Liquidation` and `Cash Advance` action keys.

Cashier Payee Details enforce payment-form-specific classification at both the React form and `StoreBudgetRequisitionRequest`. Supplier/Water uses VAT versus Non-VAT, while Honorarium uses AdU Employee versus Non AdU Employee and also requires TIN. The shared RS print preview uses the stored header payment form to omit inapplicable classification fields.

The Requisition Process `Cash Advance` action now synchronizes liquidation eligibility: enabling it also sets `for_liquidation`, while disabling it preserves the liquidation flag. Administration and Budget modal state consumes both flags from the same response.

The Budget Request Entry sidebar item and frontend route accept any of `allow-budget-request-entry`, `admin-access`, or `budget-access`. Its loader resolves organizational scope from the authenticated finance identity: general `admin-access` and `budget-access` both receive every Department and Section referenced by live proposal headers, while other request-entry users receive only their assigned `allow-budget-request-entry` typed units. The frontend no longer supplies Admin or Budget permission IDs to establish this elevated scope.

### Report Route-to-Service Map

| API prefix | Controller | Primary service/projector |
|---|---|---|
| `/api/abms/budget-performance-per-department` | `BudgetPerformancePerDepartmentController` | `BudgetPerformanceReportService` |
| `/api/abms/budget-performance-per-account` | `BudgetPerformancePerAccountController` | `BudgetPerformancePerAccountReportService` |
| `/api/abms/budget-performance-university` | `BudgetPerformanceUniversityController` | `BudgetPerformanceUniversityReportService` |
| `/api/abms/item-requested-per-account` | `ItemRequestedPerAccountController` | `ItemRequestedPerAccountReportService` |
| `/api/abms/items-requested-by-payee` | `ItemsRequestedByPayeeController` | `ItemsRequestedByPayeeReportService` |
| `/api/abms/adjustments-per-department` | `AdjustmentsPerDepartmentController` | `AdjustmentsPerDepartmentReportService` |
| `/api/abms/budget-liquidation` | `BudgetLiquidationController` | `BudgetLiquidationReportService` |
| `/api/abms/budget-proposal-reports` | `BudgetProposalReportsController` | `BudgetProposalReportService` |
| `/api/abms/unserved-rs` | `UnservedRsController` | `UnservedRsReportService` |

Each report prefix exposes `GET /` for filter data and `GET /preview` for calculated report output, protected by `auth:api`.

Report loaders scope typed Department/Section options to qualifying live rows in each report's backing source instead of returning the entire organization directory. Proposal-backed pages use `budget_proposal_entry`; Adjustments uses `budget_adjustment_entry`; Item Requested uses eligible numbered requisitions; and Liquidation uses eligible numbered requisitions marked for liquidation or liquidated. Referenced inactive units remain available. Budget Performance Per Department, Item Requested Per Account, Budget Proposal Reports, and Budget Liquidation also accept typed `allow-budget-request-entry` or `allow-budget-proposal-entry` access; for users without a report-wide Admin/Budget/Controller role, their qualifying unit options are intersected with the union of those typed assignments and their previews must remain within one selected unit. The frontend defaults an only unit and otherwise requires selection. The shared report combobox provides an opt-in, moderately wide option panel used by unit filters; it aligns inward over the report card and remains capped to the viewport.

The index loaders for Budget Performance Per Department, Budget Performance Per Account, Budget Performance University, Item Requested Per Account, Items Requested By Payee, and Budget Liquidation return `requisition_first_dates` keyed by school year plus the application-timezone `current_date`. Their school-year selectors use this metadata to default From to the first live budget request entry date and To to the current date. Adjustments Per Department uses the parallel `adjustment_first_dates` contract sourced from live budget adjustments. Unserved RS does not use either default contract.

## Identity Rules

- `accounts.id` is account identity. Account codes and SAP account numbers are allowed to repeat.
- `parent_id IS NULL` identifies a root/main account; a non-null `parent_id` identifies a child/sub-account.
- `sub_accounts` means a school-year proposal allocation of an account. It is not the account hierarchy table.
- Organizational identity is `(unit_type, unit_id)`, never numeric ID alone.
- In valid financial ownership, exactly one of `department_id` and `section_id` is populated.
- Use IDs in selectors and request payloads; names/codes are display labels.

## Authorization and Data Quality

Authorization combines general permissions with typed department/section assignments. Inactive historical units can remain relevant to finance reports when allocations or transactions reference them.

The Controller workflow uses the general `controller-access` permission. The backend decision endpoint verifies that permission independently of frontend visibility; UI role selection is not an authorization boundary.

Sidebar permission declarations and `router.tsx` guards must remain identical. Controller-visible reports also enforce `controller-access` in their backend report controllers; frontend visibility alone is insufficient.

The four entry-permission-accessible reports return `unit_scope_restricted` from their index loaders. Scoped users cannot use grand, university-wide, or all-unit variants, and each preview endpoint rejects a typed unit outside the authenticated user's assignments. General `admin-access`, `budget-access`, and `controller-access` preserve the existing report-wide behavior.

Budget Settings, Budget Review (including its details route), Budget Transfer Account, and Budget Adjustment Entry are frontend-authorized only by `admin-access` or `controller-access`; general `budget-access` does not expose or route-authorize those destinations. Budget Proposal Entry remains independently gated by `allow-budget-proposal-entry`.

Known authorization debt: the generic requisition-process listing and most transition actions still trust client-supplied role/action context and do not consistently verify the corresponding general permission server-side. The Logistics/Stockroom misrouted-return actions are explicit exceptions and enforce their roles independently. Other state guards described in `business-rules.md` do not replace actor authorization.

Date-ranged reports select period activity through inclusive application-timezone `created_at` boundaries and read the latest stored header and item values. Budget Performance is the deliberate exception for its proposal baseline: proposals and their current allocations are selected by school year plus typed organizational/account scope, while From/To applies to adjustment and requisition activity. Updates made after the selected To date intentionally change included activity for its original date, while activity created outside the range remains excluded even if updated inside it. Date-ranged report services do not query OwenIt audits. Current relationship or legacy account-mapping problems still produce structured data-quality warnings; the UI displays warnings as toasts while printed report bodies remain focused on report data.

## Documentation Maintenance

Update these files in the same change whenever durable behavior changes:

- relationship or column meaning: `erd.md`
- calculations, identity, authorization, or audit rules: `business-rules.md`
- process or integration sequence: `flowcharts.md`
- repository/module entry points: this file

Source code and migrations win if documentation is stale. Correct the documentation once the discrepancy is verified.

## Verification Baseline

As of 2026-07-28:

- The ABMS production frontend build completes successfully.
- The shared shell and all non-print modal systems target the 1920×1080 baseline, 720p-class compact displays, and mobile breakpoints, and the responsive changes compile successfully; authenticated visual browser validation still depends on an available seeded ABMS environment.
- Targeted lint checks for the newly added report pages and protected-route loading screen pass.
- The focused Budget Proposal Reports backend suite passes with 19 tests and 266 assertions.
- The focused Unserved RS backend suite passes with 4 tests and 38 assertions.
- Relevant changed backend files pass Laravel Pint.
- The Vite build retains its existing large-chunk advisory; this is a performance follow-up, not a build failure.
- Full authenticated browser workflows depend on an available seeded ABMS environment and should be rerun before deployment when that environment is available.
- `router.tsx` retains pre-existing lint debt unrelated to the loading screen (`isRedirect` unused and explicit `any` usage); production compilation succeeds.
