# ABMS System Context

Last verified: 2026-07-22

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
- shared searchable filter: `shared/ReportFilterCombobox.tsx`

Routes are registered in `apps/abms/src/router.tsx`. Finance requests use the shared finance-service Axios configuration. Protected routing must derive production redirects from the Vite production URL environment setting rather than hardcoded localhost values.

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

Transaction families include proposal entry, adjustment entry, requisition entry/process, liquidation submission, transfer account, settings, status, accounts, departments, and user access.

Office Supplies list queries default to `item_name` ascending with an `id` tie-breaker before cursor pagination. The administration UI filters by partial item name and permits Item Name or Unit Cost sorting in either direction. The Budget Request Entry Stockroom picker consumes the same 10-row cursor pages with Previous/Next navigation and always requests alphabetical item-name order.

The requisition-process frontend has role-specific views for Budget, Administration, Controller, Logistics/Purchasing, Accounting, Stockroom, and Cashier. Controller decisions use `PATCH /api/abms/requisition-process/{id}/controller-approval`; general requisition transitions continue through `PUT /api/abms/requisition-process/{id}`. Department-facing requisition review also exposes a read-only quoted-price projection at `GET /api/abms/budget-request-entry/{id}/quoted-price-preview`.

The shared dashboard at `/` exposes authorized role and typed-unit scopes. A Controller role scope reports pending, approved, and disapproved Controller decisions for the selected school year; its current work queue contains only requisitions with `status = on process` and `is_controlled = 0`.

The User Department Access index supports case-insensitive displayed-name search and stable A–Z/Z–A name ordering before cursor pagination. Equal displayed names use employee number as the tie-breaker, and missing teacher-directory records fall back to employee number.

During RS creation, the account picker queries only the exact school-year typed-unit allocation and returns 10-row cursor pages ordered by account name with account ID as the tie-breaker. Account code/name search is applied before pagination. The requisition-process `requisitionId` account lookup remains an unpaginated list of only the accounts already referenced by that RS.

### Report Route-to-Service Map

| API prefix | Controller | Primary service/projector |
|---|---|---|
| `/api/abms/budget-performance-per-department` | `BudgetPerformancePerDepartmentController` | `BudgetPerformanceReportService`, `BudgetPerformanceAuditProjector` |
| `/api/abms/budget-performance-per-account` | `BudgetPerformancePerAccountController` | `BudgetPerformancePerAccountReportService`, `BudgetPerformanceAuditProjector` |
| `/api/abms/budget-performance-university` | `BudgetPerformanceUniversityController` | `BudgetPerformanceUniversityReportService`, `BudgetPerformanceAuditProjector` |
| `/api/abms/item-requested-per-account` | `ItemRequestedPerAccountController` | `ItemRequestedPerAccountReportService`, `RequestedItemAuditSnapshotService` |
| `/api/abms/items-requested-by-payee` | `ItemsRequestedByPayeeController` | `ItemsRequestedByPayeeReportService`, `RequestedItemAuditSnapshotService` |
| `/api/abms/adjustments-per-department` | `AdjustmentsPerDepartmentController` | `AdjustmentsPerDepartmentReportService`, `AdjustmentAuditEventProjector` |
| `/api/abms/budget-liquidation` | `BudgetLiquidationController` | `BudgetLiquidationReportService` |
| `/api/abms/budget-proposal-reports` | `BudgetProposalReportsController` | `BudgetProposalReportService` |

Each report prefix exposes `GET /` for filter data and `GET /preview` for calculated report output, protected by `auth:api`.

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

Known authorization debt: the generic requisition-process listing and transition endpoints currently trust client-supplied role/action context and do not consistently verify the corresponding general permission server-side. The state guards described in `business-rules.md` protect workflow order, but they do not replace actor authorization. Treat this as an implementation risk until each role-specific read/write endpoint enforces its permission independently.

Historical calculations use OwenIt audits. Missing creation evidence, incomplete old/new values, changed relationships, ambiguous legacy account-code mappings, or writes that bypassed auditing must produce structured data-quality warnings. The UI displays these warnings as toasts; printed report bodies remain focused on report data.

## Documentation Maintenance

Update these files in the same change whenever durable behavior changes:

- relationship or column meaning: `erd.md`
- calculations, identity, authorization, or audit rules: `business-rules.md`
- process or integration sequence: `flowcharts.md`
- repository/module entry points: this file

Source code and migrations win if documentation is stale. Correct the documentation once the discrepancy is verified.
