# ABMS System Context

Last verified: 2026-07-28

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

- The finance database owns accounts, proposals, allocations, adjustments, requisitions, settings, statuses, permissions, audits, and media.
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

All nine report previews use `shared/ReportPrintPortal.tsx` and `shared/report-print.css` for authoritative US Letter landscape sizing, readable shared typography, a `0.30in` printer-safe margin, and matching preview content inset. Page-local table layouts remain responsible for report-specific columns, grouping, and page-break rules.

Routes are registered in `apps/abms/src/router.tsx`. Finance requests use the shared finance-service Axios configuration. Protected routing must derive production redirects from the Vite production URL environment setting rather than hardcoded localhost values.

The shared protected route renders `components/LoadingScreen.tsx` immediately while it verifies the authenticated session, ABMS access, finance profile, general permissions, and typed Department/Section assignments. Protected content is rendered only after that context resolves. The screen remains visible for at least 500 ms to avoid flashing on fast responses and preserves the existing login, maintenance, and unauthorized redirects. The production redirect base is the single Vite setting `VITE_ADU_LIVE_PRODUCTION_URL`.

Every routed page uses `layouts/Screenlayout.tsx`. At 1536 CSS pixels and wider, it preserves the existing expanded-sidebar desktop layout. Below that breakpoint, `components/Sidebar.tsx` is an inert off-canvas drawer while closed and can be opened from the header, dismissed through its backdrop or Escape, and closes after navigation. `components/ui/Page.tsx` provides responsive shared page width, header, action, and surface constraints. Application-level horizontal overflow is suppressed; intentionally wide tables must remain inside their page-owned scroll container, and report paper retains its printable width inside the preview's scroll container.

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

Office Supplies list queries default to `item_name` ascending with an `id` tie-breaker before cursor pagination. The administration UI filters by partial item name and permits Item Name or Unit Cost sorting in either direction. Both the Budget Request Entry Stockroom item picker and the New RS Stockable / Inventoriable Items reference panel consume the same 10-row cursor pages with Previous/Next navigation and always request alphabetical item-name order.

The requisition-process frontend has role-specific views for Budget, Administration, Controller, Logistics/Purchasing, Accounting, Stockroom, and Cashier. Administration includes a `For Approval` status filter that selects current requisition headers whose status is `for approval`, while retaining `For Budget Director` as its default filter. Controller decisions use `PATCH /api/abms/requisition-process/{id}/controller-approval`; general requisition transitions continue through `PUT /api/abms/requisition-process/{id}`. Department-facing requisition review also exposes a read-only quoted-price projection at `GET /api/abms/budget-request-entry/{id}/quoted-price-preview`.

The shared dashboard at `/` exposes authorized role and typed-unit scopes. A Controller role scope reports pending, approved, and disapproved Controller decisions for the selected school year; its current work queue contains only requisitions with `status = on process` and `is_controlled = 0`.

The User Department Access index supports case-insensitive displayed-name search and stable A–Z/Z–A name ordering before cursor pagination. Equal displayed names use employee number as the tie-breaker, and missing teacher-directory records fall back to employee number.

During RS creation, the account picker queries only the exact school-year typed-unit allocation and returns 10-row cursor pages ordered by account name with account ID as the tie-breaker. Account code/name search is applied before pagination and also matches parent/main account code or name. Picker rows display `Main Code - Sub Code` and `Main Name - Sub Name`, while selection and persistence continue using the child account ID and child account code. The requisition-process `requisitionId` account lookup remains an unpaginated list of only the accounts already referenced by that RS.

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

Budget Settings, Budget Review (including its details route), Budget Transfer Account, and Budget Adjustment Entry are frontend-authorized only by `admin-access` or `controller-access`; general `budget-access` does not expose or route-authorize those destinations. Budget Proposal Entry remains independently gated by `allow-budget-proposal-entry`.

Known authorization debt: the generic requisition-process listing and transition endpoints currently trust client-supplied role/action context and do not consistently verify the corresponding general permission server-side. The state guards described in `business-rules.md` protect workflow order, but they do not replace actor authorization. Treat this as an implementation risk until each role-specific read/write endpoint enforces its permission independently.

Every report with From and To filters selects live proposal, adjustment, or requisition headers through inclusive application-timezone `created_at` boundaries and reads the latest stored header, item, allocation, and balance fields. Updates made after the selected To date intentionally change the report for the entry's original date, while an entry created outside the range remains excluded even if updated inside it. Date-ranged report services do not query OwenIt audits. Current relationship or legacy account-mapping problems still produce structured data-quality warnings; the UI displays warnings as toasts while printed report bodies remain focused on report data.

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
