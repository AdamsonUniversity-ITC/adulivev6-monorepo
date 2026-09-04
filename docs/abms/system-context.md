# ABMS System Context

Last verified: 2026-08-11

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

Office Supplies list queries default to `item_code` ascending with an `id` tie-breaker before cursor pagination. The administration UI filters by partial item code or item name and permits Item Code, Item Name, or Unit Cost sorting in either direction. Both the Budget Request Entry Stockroom item picker and the New RS Stockable / Inventoriable Items reference panel consume the same 10-row cursor pages with Previous/Next navigation and explicitly request alphabetical item-name order.

The requisition-process frontend has role-specific views for Budget, Administration, Controller, Logistics/Purchasing, Accounting, Stockroom, and Cashier. Administration defaults its multi-status checklist to `For Budget Director`, `On Process`, and `For Approval`; the `For Approval` selection targets current requisition headers whose status is `for approval`. Logistics/Purchasing defaults its checklist to `For Pricing` and `For Purchase`. Controller decisions use `PATCH /api/abms/requisition-process/{id}/controller-approval`; general requisition transitions continue through `PUT /api/abms/requisition-process/{id}`. Department-facing requisition review also exposes a read-only quoted-price projection at `GET /api/abms/budget-request-entry/{id}/quoted-price-preview`.

In the shared RS Process modal, Logistics quoted-price Save first opens a responsive read-only verification modal showing all entered unit prices and calculated line/grand totals. Closing or cancelling preserves the drafts; the existing idempotent quoted-price mutation and workflow transition run only after explicit confirmation.
Logistics Workflow V2 is an additive, disabled-by-default capability exposed in requisition API metadata. When enabled, Logistics may leave unresolved quote inputs blank and submits only actually changed lines; fulfilled lines are locked. Administration acceptance stores item acceptance evidence, applies exact financial deltas, resets Controller approval, and leaves the header `for approval` at Budget Office. Controller can decide that price cycle, and Administration can mark `for purchase` only after approval. Logistics may then dispatch all currently accepted unresolved lines to WICO even when other lines remain unquoted. Stockroom uses the idempotent `PUT /api/abms/requisition-process/{id}/stockroom-fulfillment` batch endpoint for Pending/Served/Unavailable item states, Select All, and untagging; the header cannot be finalized until all live lines are resolved.

The V2 item metadata is stored on `budget_request_entry_items`. Exact-cent matching active legacy quotes are compatibility-accepted; matching PO-at-Stockroom lines are compatibility-dispatched. Header workflow, Controller state, financial values, and terminal history are not rewritten. The frontend uses legacy behavior while the flag is disabled, and legacy Mark Served compatibility is separately controlled by `ABMS_ACCEPT_LEGACY_SERVE` during client rollout.

The shared Requisition Process payment-form filter includes `All Except PNB Credit Card Payment`. The backend treats it as a query sentinel before cursor pagination, returning only populated payment forms whose trimmed, case-insensitive value is not PNB Credit Card Payment; existing individual options remain exact filters. Separately, Budget and Administration status pills include the `RS to Process Today` worklist sentinel, which returns every RS type including null/blank payment forms and excludes only trimmed, case-insensitive PNB Credit Card Payment. Other roles do not receive this status option.

Administration's status choices retain the broad `On Process` option and add Pending, Approved, and Disapproved Controller-decision variants. The backend groups each variant as `status = on process` plus the matching three-state `is_controlled` value and ORs that group with any other selected ordinary statuses before cursor pagination.

The Controller requisition-process response also derives informational workflow history from OwenIt audits for the current cursor page. One batched, ordered query identifies an `is_controlled = 1` audit followed by a later `status = reprocess` audit and separately counts successful approvals whose effective status was `for approval`; malformed, reversed, or incomplete evidence contributes no fabricated history. Qualifying Controller rows use the existing purple `REPROCESSED AFTER APPROVAL` treatment and can add `PREVIOUSLY PRICE REAPPROVED · N TIME(S)` without changing the current-status precedence. Reprocessing continues to reset the live Controller decision to pending.

The shared `PUT /api/abms/requisition-process/{id}` return action accepts Logistics-type `for purchase` records currently at Logistics. Its independently authorized, header-locked transition produces `on process` at Budget Office with `from = logistics` while preserving Controller approval and all child/financial data. The existing Administration Reprocess action is the deliberate second step for delivery-fee item correction and resets Controller approval before the department workflow resumes.

During that correction workflow, fulfillment state remains authoritative across both item-write APIs. The Requisition Process Budget/Administration editor and Budget Request Entry department reprocess editor lock Served and Unavailable lines; the department deletion endpoint applies the same locked-state check. Existing Pending reprocess rows expose description, quantity, unit-cost, and UOM editing but show their account as locked; the backend rejects any submitted `account_id` after numbering. New delivery-fee lines select one initial scoped account and then inherit that lock. For compatibility with already loaded/full-form clients, the backend ignores a resolved line only when every submitted editable field still matches storage, then processes Pending/new lines normally; an actual resolved-line change returns 422 atomically.

The Budget Request Entry detail response includes each item's normalized `fulfillment_status`. The department form normalizes every loaded row before rendering, so Served and Unavailable state cannot be lost between the API response and its disabled controls.

Accounting Requisition Process is a current-location worklist for `accounting office`, `bao`, and `hrmdo`, independently guarded by `accounting-access` and defaulted to Certified. Its shared RS modal is read-only except that a Certified Cashier RS at one of those locations can be returned through the idempotent requisition transition endpoint. The locked return records the exact office in `from`, moves the header to `for budget director` at Budget Office, and resets Controller state without touching financial or descriptive data. Cashier view remains unchanged.

The existing exact-balance Requisition Process item endpoints accept either Budget `for review` records or Administration Cashier corrections at `for budget director` in Budget Office, with independent permission and state checks. Administration correction saves preserve the stage and pending decision. Forward to Controller then creates `on process`; established Controller approval gates all Cashier destinations. New HRMDO transitions use location `hrmdo`, while Accounting/Accounting Director use `accounting office` and BAO uses `bao`; no historical location rewrite occurs.

Controller page projections also return audit-derived `controller_review_count` for transitions into `on process`, separately from successful `controller_approval_count`. Repeated arrivals receive a Controller-only ordinal reapproval badge (`2ND APPROVAL`, `3RD APPROVAL`, and so on), and active Logistics price reapproval uses the same wording. The shared Controller modal centers a larger audit-count summary in the Requested Items header instead of the action footer. That shared modal suppresses `Mark as Cancelled` for Purchasing/Logistics, Stockroom, and Accounting while retaining existing behavior for other roles. Absent audit evidence returns zero rather than inferred history.

Stockroom's status area also provides source-specific incoming queues. `RS from Logistics` resolves both PO-on-process spellings currently at Stockroom with `from = logistics`; `RS from Budget Office` resolves certified requisitions currently at Stockroom with `from = budget office`. These pseudo-statuses use the stored status, location, and origin together and participate in the existing OR-based multi-selection behavior.
The default `To Process RS` queue likewise requires the current location to remain Stockroom in addition to a certified or supported PO-on-process status. Stockroom's audit-based historical visibility continues to support `Processed RS`, but cannot leak an active-stage row from another current office into `To Process RS`.

The shared filter action card contains only Requery; the obsolete View RS action has been removed, and Requery spans the available action width and height above the liquidation legend with a proportionally enlarged label and refresh icon.

ABMS worklists that formerly appended cursor pages through Load More now share an `IntersectionObserver` sentinel with a 320-pixel prefetch margin. Administration, Budget, Controller, Logistics, and Stockroom Requisition Process tables, Budget Request Entry, User Access, and expanded Main Account sub-account lists retain their existing cursor APIs and bounded page sizes but request the next cursor automatically. Each rendered cursor can trigger only once and concurrent calls are guarded; failures stop automatic retries and expose a manual Retry action. Filters and Requery clear the active cursor before replacing the first page. Existing Previous/Next controls in selection modals and explicitly paged administration screens are not part of this behavior.

Budget Request Entry treats payment form and payee details as Cashier-only header data. The New RS modal requires a payment form for Cash Valued Items, while Stockroom and Logistics omit Payee entry and the API strips any stale values submitted for those types. Supplier/Water payees require a numeric TIN and exactly one VAT classification with AdU Employee disabled; Honorarium payees retain the AdU Employee option but omit and clear VAT classifications. The PHP 1,000 Cashier finalization minimum applies only to the exact stored `Reimbursement/Replenishment` payment form; all other Cashier payment forms may finalize below PHP 1,000. The UI and API enforce the same rule.

The shared RS Process modal preloads the selected RS attachment list and displays its total on the View Files toolbar action. This is a total-file count only, has no read/unread meaning, and reuses the preloaded list when the attachment viewer opens. Its existing information band also displays a compact request-type badge after the Date, styled consistently with the RS number/status metadata and without adding a grid row: Stockroom is `For Office Supplies`, Logistics is `For Purchase`, and Cashier is `For Cash Valued Items`.

Unread requisition chat counts use the authenticated user's `budget_request_entry_chat_reads.last_read_chat_id` pointer and are exposed in the Budget Request Entry worklist plus the six Requisition Process worklists that open the shared process modal. The badge overlays the requester avatar without adding or resizing table columns, caps its visible label at `99+`, and stays synchronized through a reference-counted shared Echo subscription, 60-second and window-focus reconciliation, pagination-aware batch requests, and modal read callbacks. Cashier is excluded because its worklist does not currently open the chat modal. The unread-count endpoint accepts bounded requisition ID batches, derives identity from the authenticated request, and returns the existing requisition-ID-to-count object.

The primary shared RS Process work modal uses a presentation-only responsive shell capped at 1280 pixels, ABMS display/sans typography, 44-pixel controls, readable metadata and item tables, wrapping action groups, and stacked phone summaries. Its Requested Items table uses fixed semantic column proportions with the largest share reserved for Description; long descriptions and other values wrap into taller rows instead of expanding the table or requiring horizontal navigation. The notes/total summary is deliberately compact so the item workspace receives more height, while the phone shell uses dynamic viewport height so all existing controls remain reachable. These rules are scoped to the main modal and do not restyle its confirmation, files, payee, chat, history, account-picker, print-preview, or other nested dialogs. The Budget role marker and Administration For Pricing action use the Philippine peso icon; role visibility, actions, API calls, and transitions are unchanged.

The shared RS print preview used by Requisition Process and Budget Request Entry exposes its paper selector beside Print. It defaults to General/PDF US Letter portrait except when opened from the Logistics/Purchasing Requisition Process view, which defaults to Epson Half Legal. General/PDF contains Letter, standard Legal (`8.5in × 14in`), and A4 in portrait and landscape orientations. Epson LX-300-II contains Letter, Legal, and Half Legal on the upper half of a portrait Legal sheet: the physical page remains `8.5in × 14in`, while the RS layout is fixed at exactly `7in` and leaves the lower half blank. Every Epson preset uses the same enlarged Tahoma Regular typography throughout its header, metadata, items, details, certifications, and footer while preserving that preset's configured scale and page layout. Half Legal alone hides its unused signatory spacer, lets the bordered details panel absorb remaining form height, and anchors the footer at the bottom of the fixed upper-half layout regardless of item count. Requisitions whose items do not fit must use Epson Letter or Legal rather than expanding the Half Legal form. General/PDF typography remains unchanged. Each preset declares its screen dimensions, explicit CSS print page, and internal printer-safe spacing; the browser page margin remains zero to remove the URL/date header-footer area.

Both RS print entry points pass the authenticated current user into the shared preview for `Printed By`; the requisition’s original requester remains separate and unchanged.

The shared Print button posts to `POST /api/abms/budget-request-entry/{id}/print-events` through the financial-idempotency contract before invoking `window.print()`. The endpoint rejects missing, soft-deleted, or zero-number drafts and snapshots the authenticated user ID, employee number, and teacher-resolved full name in `budget_request_entry_print_events`; it ignores client identity fields. A recording failure leaves the preview and paper selection open. The existing `GET /api/abms/budget-request-entry/{id}/audit-history` response keeps its top-level `audits` array but merges requisition-header audits, all active/soft-deleted child-item audits, and print rows into a stable newest-first timeline with source-qualified keys and readable entity metadata. Existing header `audit:{id}` and print keys remain compatible; item keys use `item-audit:{id}`. The frontend preserves raw old/new values but projects readable labels, decisions, booleans, money, dates, workflow values, and nested data. Print events never enter OwenIt `audits`, so report and financial-history readers remain unchanged.

Logistics, Stockroom, Budget, and Administration run a read-only pre-preview check through `GET /api/abms/budget-request-entry/{id}/latest-print-event`. It returns the newest append-only print event regardless of whether it belongs to the authenticated actor, or null, ordered by timestamp and event ID. A returned event drives the shared Yes/No reprint warning; declining or a failed lookup never appends an event. The preview's existing Print action remains the sole print-event write point. The former `/latest-other-print-event` URL is retained as a compatibility alias with the same latest-any-user semantics.

The shared frontend helper at `pages/transactions/shared/stockroomPrintEligibility.ts` gates Stockroom-type printing only in Budget Request Entry and the Stockroom Requisition Process role. It accepts Certified/Served status variants and disables plus guards Print RS at earlier stages. Other role modals intentionally do not consume this gate, so their Stockroom-type print behavior is unchanged.

The shared `RSPrintPreview` conditionally expands its certification footer for Stockroom-type requisitions. The same row contains print metadata, Office Head approval, Office Representative receipt, and Controller budget certification; other RS types retain the original print-metadata and Controller layout.

Office Supplies CRUD sends the client-provided `item_code` on create and update. `OfficeSupplyRequest` trims and validates the required unique string, ignoring only the current record for update; the existing database unique index also covers soft-deleted rows and guards concurrent duplication. The frontend route/sidebar and backend create, update, and delete endpoints consistently require `stockroom-access`; authenticated reads remain shared with established requisition item pickers.

Stockroom Certified quantity changes use `PUT /api/abms/requisition-process/{id}/stockroom-quantities`. The endpoint is independently Stockroom-authorized, accepts only item ID/quantity pairs, revalidates type/status/location after locking, and atomically reconciles item totals, the full RS total, ID-based allocations, and typed-unit proposal balances. The shared process modal exposes this editor only for the same exact stage.

After a successful Stockroom quantity save, `StockroomView` consumes the modal callback without issuing another mutation: it keeps the Certified modal open, synchronizes the authoritative returned items and total into modal/table state, and displays a quantity-update success toast.

Every Requisition Process View Accounts handler calls `GET /api/abms/budget-request-entry/accounts` with `requisitionId`. That independently Budget/Admin/Controller/Logistics-authorized branch derives school year and typed unit from the saved RS and returns the union of every live scoped allocation plus distinct positive item account references, without cursor pagination. Unreferenced and zero-remaining-balance allocations therefore remain visible. It resolves accounts by ID and requires exactly one live allocation for a balance; missing or ambiguous referenced mappings return `balance = null` with a warning rendered as `Unavailable`. The broader Department/Section account-selection branch remains cursor-paginated for creation workflows only.

The shared dashboard at `/` exposes authorized role and typed-unit scopes. A Controller role scope reports pending, approved, and disapproved Controller decisions for the selected school year; its current work queue contains only requisitions with `status = on process` and `is_controlled = 0`. The Logistics role scope applies the selected school year to only live RS records with a readable header-audit arrival at Logistics in `for pricing` or `for purchase`; all Logistics totals, status distribution, workload amount, and queue rows therefore represent records that reached Purchasing rather than every RS in ABMS. Its Processed RS card uses the same recognized post-arrival Logistics exits as the Purchasing Accomplishment Report and excludes currently cancelled/disapproved records; its Served card retains the current-status count. The Stockroom role scope likewise limits all counts, status distribution, workload amount, and queue rows to live finalized RS records with a readable arrival audit at Stockroom in `certified`, `po on process`, or `p.o. on process`; repeated visits count once, while direct Budget and Logistics/WICO arrivals both qualify.

The User Department Access index supports case-insensitive displayed-name search and stable A–Z/Z–A name ordering before cursor pagination. Equal displayed names use employee number as the tie-breaker, and missing teacher-directory records fall back to employee number.

During RS creation and department reprocessing, the account picker queries only the exact school-year typed-unit allocation and returns 10-row cursor pages ordered by account name with account ID as the tie-breaker. Account code/name search is applied before pagination and also matches parent/main account code or name. Picker rows display `Main Code - Sub Code` and `Main Name - Sub Name`, while selection and persistence continue using the child account ID and child account code. The Requisition Process `requisitionId` balance lookup is separately authorized and returns all allocated accounts in the exact scope without pagination.

Persisted number-`0` rows in the initial RS Form expose a per-item Add/Edit dialog. `GET /api/abms/budget-request-entry/{id}/editable-accounts` derives the editable draft or department-reprocess RS school year and typed owner server-side and returns searchable cursor pages of every uniquely allocated live child account. `PUT /api/abms/budget-request-entry/{id}/items` accepts an optional account ID for a Pending editable item, transfers the old/new item totals between exact allocations, and returns authoritative item and balance values. Cashier/Logistics draft rows edit Account, Description, Quantity, and Unit Cost with fixed UOM; Stockroom draft rows edit Account and Quantity while retaining stored catalog fields. Department reprocess rows may edit the account and established item fields unless fulfillment is Served or Unavailable; payloads that omit `account_id` remain compatible.

Budget Request Entry custom workflow dialogs are intentionally non-light-dismissable: backdrop clicks and Escape do nothing. Explicit X/Cancel/Close/Discard controls, successful selections, and successful saves retain their normal behavior. The initial RS Form X and Discard controls both wait for the idempotent server-side discard/refund operation, and failures leave the modal open.

The Budget Request Entry list page uses a responsive dashboard layout: three independent cards contain View Options, the switch-enabled Date Range, and typed Department/Section selection; a separate four-action row contains Refresh, New Requisition Slip, school-year switching, and the liquidation legend; and the count/search controls plus requisition table live in their own records card. These presentation boundaries do not change the established server-side filters, cursor loading, workflow actions, or modal behavior.

The shared Requisition Process role page follows the same summary-first presentation language, display/sans typography tokens, and `1600px` maximum workspace as Budget Request Entry. Its larger page header identifies the active role and conditionally exposes Switch Role. Every configured filter remains visible inside one compact adaptive surface: Status uses a draft checkbox popover with explicit Apply/Cancel/Reset behavior; Department/Section uses the Budget Request Entry-style searchable typed-unit dropdown with long-name handling and an All Departments option; and requisition number, school year, payment form, and date fields automatically maintain the existing `FilterState` enable flags from their values. The surface also exposes the active-filter count, role-default reset, compact legends, sort direction, and Requery action. Each role-owned table sits in a separate rounded records card with enlarged headers, rows, and state text. Cashier now sends its already-supported `schoolYear`, `dateFrom`, and `dateTo` query parameters when those visible controls have values. The shared shell supplies consistent hover, pressed, and keyboard-focus feedback in light and dark themes. These width and typography rules are scoped to the Requisition Process page and do not resize its modals. Role-specific permissions, columns, cursor loading, row actions, modals, and workflow transitions remain owned by the existing role views and are unchanged by this presentation boundary.

Budget-role item review uses `GET /api/abms/requisition-process/{id}/editable-accounts` for searchable 10-row cursor pages of uniquely allocated live accounts derived from the RS school year and exact typed owner. `PUT /api/abms/requisition-process/{id}/items` independently verifies authenticated `budget-access` plus `for review` at Budget Office, then applies item/account changes and exact balance transfers atomically. Administration no longer receives the item-edit control.

Logistics item-description maintenance is isolated at `PUT /api/abms/requisition-process/{id}/item-descriptions`. It independently verifies authenticated `logistics-access` and the existing `for pricing`/`for purchase` stage at Logistics; P.O. on Process is excluded after the RS leaves Logistics. It locks the RS and submitted items and accepts only item IDs plus required descriptions. It does not reuse the Budget financial editor and cannot change any account, quantity, UOM, price, total, allocation, or proposal value. The shared modal keeps description editing separate from quoted-price editing.

The idempotent generic requisition-process mutation endpoint has three independently authorized misrouting corrections. Logistics can return `for pricing` at Logistics to Administration; Stockroom can return `certified` at Stockroom to Administration; and Stockroom can return either stored PO-on-process spelling to Logistics at `for purchase`. The first two buttons, confirmations, and success toasts display `Return to Budget`, while requests continue sending the stable `Return to Administration` action. Administration returns use `on process` at Budget Office and preserve `is_controlled`, allowing an existing Controller approval to remain valid; the PO return likewise preserves Controller state and accepted quoted prices. Each path locks and revalidates the header and changes no item, financial, attachment, note, or liquidation data. The old `Return RS to Budget` action remains a Stockroom-certified compatibility alias for staggered backend/frontend deployment.

Administration's office-destination actions are also request-type guarded in the shared process modal and API. A Controller-approved Stockroom RS exposes only Forward to Stockroom; Logistics exposes For Pricing and, after quote acceptance, For Purchase; Cashier hides and rejects those Stockroom/Logistics destinations while retaining its established cashier-office choices. The backend independently requires `admin-access`, locks the header, and validates type, status, location, and Controller stage. `Send RS to Staff` remains a type-independent re-review action and now atomically changes an eligible `on process` approval to `for review` with `is_controlled = 0` at Budget Office.

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
| `/api/abms/purchasing-accomplishment-report` | `PurchasingAccomplishmentReportController` | `PurchasingAccomplishmentReportService` |

Each report prefix exposes `GET /` for filter data and `GET /preview` for calculated report output, protected by `auth:api`.

Purchasing Accomplishment Report additionally requires general `logistics-access` on both endpoints and at the frontend route/sidebar. Its loader returns the application current date, used as the default for both From and To for daily tracking. Its read-only preview selects distinct live numbered requisitions by inclusive application-timezone header-audit arrivals into Logistics at For Pricing or For Purchase, then pairs later recognized exits to Budget Office or Stockroom. Current Cancelled/Disapproved status overrides processed classification; the remaining qualifying records are Pending, so Processed, Pending, and Cancelled/Disapproved reconcile to Total RS. Unreadable evidence produces structured warnings rather than inferred transitions. The shared report portal supplies the single Excel action beside Print.

Budget Request Entry uses a summary-first responsive presentation across its index and modal surfaces. The New Requisition Slip modal uses icon-led request-type cards while retaining cashier payment/payee validation and the stockroom supply lookup. The requisition detail modal keeps its existing state-dependent actions and nested workflows in a wide summary, quotation, and item-table layout. These presentation components must not become alternate authorization or workflow boundaries.

The cashier payment-form control is an accessible in-modal listbox presentation of the existing payment-form values. It is enabled only for Cashier requests and continues to drive the same required validation and conditional payee-details workflow.

Payment-form options use recognizable icons without changing their stored string values. Supplier and Honorarium choices still open the compact Payee Details modal, whose classification, payment-mode, and conditional bank-detail fields preserve the existing mutually exclusive selections and validation contract.

Payee classification is presented as two simple inline checkbox choices beneath the section divider, while mode of payment remains a pair of bordered radio cards. The visual distinction reflects the existing checkbox classification and mutually exclusive payment-mode semantics.

The unsaved requisition editor follows the same summary-first structure with a prominent unsaved requisition card, organizational/date/school-year metadata, action toolbar, editable line-item grid, calculated total display, and requisition note input. Save prerequisites and all item, attachment, discard, payee, and minimum-amount rules remain unchanged.

Because Logistics uses historical requisition visibility, its process modal continues to display stored quoted prices after a requisition leaves Logistics for Budget Office approval or a later stage. Those values are read-only outside an active Logistics For Pricing/For Purchase stage; quote editing and submission authorization are unchanged.

An active Logistics pricing review submits every populated quote draft, including values unchanged from retained legacy data, so the RS can return to Budget Office For Approval. A new `Reprocess RS` transition atomically clears quotation values, acceptance metadata, and item review flags so the restarted approval cycle reaches Logistics with no stale quote state.

The Logistics pricing editor normalizes API decimal-string quoted prices to frontend numbers when review begins. This ensures an unchanged stored quote satisfies the same positive finite-value validation as a newly typed quote.

The existing-requisition view uses the same modal width, header hierarchy, requisition-number card, metadata-card grid, action sizing, bordered line-item table, and total strip as the creation form. It additionally retains status badges, quotation outcomes, projected balances, chat, printing, files, and state-dependent editing controls.

Budget Proposal Entry and Liquidation Submission use the same 1600-pixel transaction workspace, ABMS display/sans typography, readable 14–16-pixel operational text, 44-pixel controls, filter surfaces, and separate records cards as Budget Request Entry and Requisition Process. Proposal scope selection and Requery remain separate from its editable records workspace; Add/Copy live with the records while Total, Cancel, and Save remain in the stable records footer. Both wide tables scroll only inside their records region on narrow screens.

The Liquidation Upload/Approval modal is a responsive operational workspace capped at 1100 pixels with prominent requisition context, readable returned-amount items, document submission and uploaded-file regions, remarks, and a wrapping role-aware footer. Its existing regular-user/admin/approved conditions, balance-return calculations, file validation and signed links, remarks, untagging, approval, and automatic close behavior remain unchanged.

Budget Request Entry's RS creation, saved-RS view/edit, and quoted-price comparison tables use fixed semantic column proportions rather than content-driven minimum widths. Description receives the largest share; long descriptions and other cell values wrap into taller rows, and inline editing controls remain bounded by their columns. This removes table-level sideways navigation without changing item actions, calculations, validation, or workflow behavior.

For desktop readability, the existing-requisition view uses a compact 980-pixel maximum width with 13-pixel body/table text and 10–11-pixel uppercase labels. This avoids scaling the entire interface up while keeping dense quotation and line-item data legible.

Its nested stock list, account and supply selectors, item editor, attachment uploader, and discussion dialog use the same large-format responsive modal system. Search, cursor pagination, row selection, locked stockroom fields, upload validation, and real-time discussion remain behavioral responsibilities of their existing components and services.

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

Known authorization debt: the generic requisition-process listing for roles other than Accounting and most generic transition actions still trust client-supplied role/action context and do not consistently verify the corresponding general permission server-side. Accounting listing/return, Administration correction editing/Controller forwarding, and Logistics/Stockroom misrouted returns are explicit independently authorized paths. Other state guards described in `business-rules.md` do not replace actor authorization.

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
Print RS paper profiles enforce orientation with explicit width-by-height `@page` dimensions in a dedicated head stylesheet loaded after shared report styles. Epson Letter and Legal request their portrait media independently of any landscape report preview previously opened in the application. Epson Half Legal deliberately requests the full `8.5in × 14in` Legal portrait page and confines its compact layout to the upper `7in`, preventing the browser or LX-300 driver from interpreting an `8.5in × 7in` custom page as landscape.
