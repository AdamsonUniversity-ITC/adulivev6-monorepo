# ABMS Financial and Reporting Rules

Last verified: 2026-07-24

## Shared Financial Identity

- Account identity is the positive `accounts.id`. Codes and SAP numbers are non-unique labels.
- A typed unit key is `department:{id}` or `section:{id}`. Never merge these namespaces.
- A proposal allocation is the tuple of school year, typed unit, proposal, and child account represented by `budget_proposal_entry` plus `sub_accounts`.
- Current account hierarchy and organization relationships are used for report grouping. Emit a warning when a current relationship cannot be established reliably.

## Budget Performance Formula

- A proposal participates only when its current `created_at` is inside the inclusive application-timezone From/To boundaries. Approved Budget and Balance come directly from the included allocation's latest `approved_total_cost` and `balance`.
- Adjustment Additional and Deduction come from the latest values of live adjustment entries created inside the range.
- Released and Unused Amount come from the latest `total_cost` and `unused_amount` of live items whose current live requisition header was created inside the range.
- Balance is a stored current allocation value and is not recomputed from the other displayed period columns.
- A later update to any included current row intentionally changes a report for the row's original creation date. An update does not move an entry into a range when its `created_at` is outside that range.
- Aggregate by typed unit and child allocation first, then roll up to a parent, division, or university level. This prevents cross-unit and cross-account leakage.
- Return all financial fields as backend-formatted two-decimal strings. Category, group, and grand totals are calculated by the backend.
- Root account code `355` is CAPEX; every other root account is NON-CAPEX.

## Live Date-Range Projection

- Date-ranged report services do not query OwenIt audits for inclusion, dates, values, snapshots, lifecycle reconstruction, or reconciliation.
- Convert From and To to explicit start-of-day and end-of-day strings in the application timezone before querying `created_at`; this preserves midnight and end-of-day inclusivity without connection-timezone shifts.
- Missing audit history is not a report data-quality error. Current invalid organizational identity, unresolved account identity, ambiguous legacy code mapping, and current total inconsistencies may still produce warnings.

## Requisition Snapshot and Balance Rules

- Requested-item reports include current live, numbered requisitions whose current header `created_at` is inside the range.
- Request number, payee, organizational ownership, description, account, unit cost, quantity, and total cost all come from the latest stored live header and item rows.
- Drafts, soft-deleted headers/items, and requests whose current status is cancelled or disapproved do not qualify for requested-item reports.
- Requested amount is the current stored item `total_cost`; the frontend does not multiply unit cost by quantity.
- Modern requisition items must resolve their stored `account_id` to the exact school-year typed-unit allocation.
- A legacy missing/zero `account_id` may fall back to account code only when the scoped allocation yields exactly one account. Ambiguous or missing mappings are rejected for balance-changing deletion and excluded/warned in historical reports. Ambiguity checks include soft-deleted historical allocation matches, so one active match plus one trashed match is still ambiguous.
- Whole-requisition deletion first preflights every item mapping before opening the transaction. Inside the transaction it locks the header/items, re-resolves and locks each allocation/proposal, applies refunds, and deletes; any later failure rolls the entire transaction back. Do not remove the locked revalidation merely because the preflight passed.
- Refund only the still-consumed portion: `max(total_cost - unused_amount, 0)`. This avoids refunding returned value twice.
- Status transitions such as cancelled or disapproved affect report eligibility. Do not assume they refund balances; balance mutation must be traced to the specific controller/service action before changing or documenting it.

### Current Requisition Entry and Finalization Guards

- Budget Proposal Entry and Budget Request Entry automatically select the user's Department or Section only when the combined authorized typed-unit list contains exactly one option. Users with zero or multiple authorized units retain an empty selector and must choose explicitly where applicable.
- During initial RS creation, Print RS and Chat/Message actions are not shown. After the requisition has been created, its Budget Request Entry viewing modal provides Chat and the same printable RS preview used by Requisition Process. Unsaved requisitions with number `0` cannot be printed.
- Stockroom requisition items must be selected from the live Office Supplies catalog. The selected catalog ID is required; description, unit cost, and unit of measurement are copied from the server-side catalog record and cannot be supplied manually. Quantity remains requester-entered because it represents the amount being requested.
- Account choices for a new requisition come from the exact school-year typed-unit allocation. When reviewing an existing requisition, the backend scopes choices to its stored positive item `account_id` values; account codes remain display-only.
- The backend always recalculates `total_amount` from stored live item `total_cost` values and does not trust a client-supplied total.
- Finalization requires at least one item. A Cashier requisition must total at least PHP 1,000 unless its stored payment form is exactly `PNB Credit Card Payment`; drafts may still synchronize below that threshold.
- `Reprocess RS` uses the dedicated database status `reprocess`, sets `location = department`, records the prior location in `from`, and resets Controller decision state. Reprocess actions are hidden once an entry is already in `reprocess`.
- Department-side item editing is allowed only for unsaved requisitions or entries with `status = reprocess` and `location = department`. Editable rows may change description, quantity, unit cost, and unit of measurement; every save recalculates item totals and applies only the account/proposal balance delta inside one transaction.
- Item add/remove/update routes reject non-editable finalized requisitions. Modern rows resolve by stored `account_id`; legacy rows may fall back to account code only when the selected school-year typed-unit allocation resolves uniquely.
- Cancelling or disapproving through the current requisition-process action handler locks the requisition, resolves each item by stored `account_id`, refunds the still-consumed amount, and updates the status atomically. If any item lacks an exact allocation/proposal mapping, the action fails without partial balance or status changes.
- The department quoted-price preview is read-only. The requester may view it; otherwise the user needs a typed permission matching the requisition's exact department or section. It aggregates all item deltas per allocation before projecting the balance and returns unresolved allocations explicitly rather than changing balances.
- Administration and Budget users may toggle `for_liquidation` on a Cashier requisition at any workflow location or status except `cancelled` and `disapproved`. The backend returns 403 without either permission and 422 for a non-Cashier or terminal requisition. The toggle remains reversible and changes only the tag; it does not approve, liquidate, reroute, or mutate balances.
- Administration and Budget users may toggle `is_cash_advance` on a Cashier requisition only after it has a nonzero requisition number and while status is not `cancelled` or `disapproved`. The tag is independent from `for_liquidation` and changes no balances, approval state, status, location, or routing.

## Controller Approval Gate

- `budget_request_entry.is_controlled` has three states: `0` pending, `1` approved, and `2` disapproved. It must not be treated as a boolean.
- Administration may first use `Forward to Controller` only when the requisition is at `status = for budget director` and `location = budget office`. The transition sets `status = on process`, keeps the location at Budget Office, records the prior location in `from`, and resets `is_controlled = 0`.
- A user with general `controller-access` may submit exactly one decision while `status = on process` and `is_controlled = 0`. Decision `1` approves and decision `2` disapproves; the endpoint locks the requisition before checking and writing the state.
- A Controller-disapproved requisition remains `on process` at Budget Office with `is_controlled = 2`. Administration may forward it to the Controller again, which resets the decision to pending. `Reprocess RS` instead returns it to Department review and also resets the decision.
- Administration may perform the guarded onward actions (`Send RS to Staff`, `For Pricing`, or forwarding to Stockroom, BAO, Accounting, Accounting Director, HRMDO, or Cash Management) only while `status = on process` and `is_controlled = 1`.
- The decision endpoint returns 403 without `controller-access`; validation rejects decisions outside `1` or `2`; and it returns 422 when the requisition is not `on process` or has already received a decision. Invalid initial forwarding, invalid resubmission, and onward routing without approval also return 422 without applying the requested transition.
- Current security caveat: `PUT /api/abms/requisition-process/{id}` enforces these state prerequisites but does not independently verify that the authenticated caller has the role implied by the requested action. Likewise, list filtering accepts a client-supplied role. Do not interpret frontend button visibility or these state checks as complete authorization; add server-side permission checks before relying on the workflow as a security boundary.

### Requisition Role Filter Defaults

- Initial status filters are role-specific: Budget Office uses `For Review`, Administration uses `For Budget Director`, Controller uses `For Controller`, Purchasing/Logistics uses `For Pricing`, and Stockroom uses `To Process RS`.
- Administration's display label `For Budget Director` maps to the backend's legacy `For Certification` filter token, which resolves database status `for budget director`.
- Accounting and Cashier retain the shared `All` default. Users may still select `All` or combine non-All statuses after the initial load.

### Controller Dashboard

- Controller dashboard metrics are scoped to the selected school year.
- Pending Controller Review requires both `status = on process` and `is_controlled = 0`; the recent work queue uses the same predicate.
- Controller Approved counts requisitions with `is_controlled = 1`, and Controller Disapproved counts requisitions with `is_controlled = 2`, regardless of their later workflow location.
- Total RS and status distribution cover every requisition in the selected school year. The dashboard does not mutate workflow or financial state.
- `controller-access` authorizes the Controller dashboard, Requisition Process, the Administration and report destinations explicitly shown to Controller users, and the corresponding report APIs. Users lacking all allowed permissions continue to receive frontend unauthorized routing or backend 403 responses.

## Liquidation Returned Amounts

- Only authenticated users with general `admin-access` or `budget-access` may save returned amounts.
- Every live requisition item must be included, and each returned amount must be between zero and that item's total cost.
- Allocation and proposal balances/unused totals change only by `new returned amount - previously saved returned amount` for each item.
- The requisition header stores the complete latest summary: `returned_amount` is the sum of all submitted item returns and `liquidated_amount` is the sum of all live item total costs less that returned total.
- A successful save overwrites `liquidated_by` with the authenticated username, `liquidation_date` with the application-timezone save time, and sets `is_liquidated` true.
- Item returns, allocation/proposal balance changes, and header summary fields commit in one locked transaction. Any validation or persistence failure rolls back all of them.
- Saving returned amounts does not set `is_approve` and does not clear `for_liquidation`; approval remains a separate action.

## Report Families

### Budget Performance Per Department

- Departmental scopes one typed department/section.
- Grand Summary scopes all units under the selected division.
- Detailed includes child accounts beneath parent accounts.
- Presentation groups NON-CAPEX before CAPEX and reconciles category and overall totals.

### Budget Performance Per Account

- Summary selects one root account, aggregates its allocated children, and returns one row per typed department/section.
- Detailed groups typed unit rows under each applicable child account; an optional child filter narrows the result.

### Budget Performance University

- Summary returns university-wide root-account rows.
- Detailed groups allocated children under each root.
- Optional Summary grouping resolves typed units through their division to the directory `type` table. Missing mappings belong to UNCLASSIFIED and generate a warning.

### Item Requested Per Account

- Hierarchy is root account -> child account -> tagged department/section.
- Summary returns current unit totals; Detailed returns current live items and unit/sub/root/grand totals.
- All-account and all-unit switches widen scope explicitly; both default off.

### Items Requested by Payee

- Returns one row per qualifying current live item with a nonblank current payee.
- Multi-item requisitions repeat payee, RS number, and RS date.
- Sort by payee case-insensitively, then request date, request number, and item ID.

### Adjustments Per Department

- Summary and Detailed use typed unit -> category -> root -> child hierarchy.
- Summary aggregates each qualifying current adjustment once. Detailed exposes one current row per adjustment with its entry creation date and current remarks and amounts.
- Detailed per Date requires the same From and To date and returns a flat group sorted by unit, root, child, and adjustment ID.

### Budget Liquidation

- Requires general `admin-access`, `budget-access`, or `controller-access` and includes only live, numbered requisitions whose current status is not cancelled or disapproved.
- R.S. Date filtering uses `budget_request_entry.created_at` inside inclusive application-timezone day boundaries.
- For Liquidation scopes `for_liquidation = true`; Liquidated scopes `is_liquidated = true`; Both uses their union and returns a matching requisition once. The independent Cash Advances checkbox adds `is_cash_advance = true` to the selected liquidation scope.
- All-unit output groups by `(unit_type, unit_id)` and starts every Department/Section print section on a new page.
- Standard Summary returns one requisition row. Detailed adds current live item rows and displays accounts as root code plus child code.
- Pending requisitions expose unavailable liquidation metadata as null and contribute zero Returned and Liquidated amounts. Saved header liquidation fields are authoritative for liquidated requisition summaries.
- `liquidated_by` is stored as a username but report output resolves it through `teachers.emp_no` and displays the concatenated available `fname`, `mname`, and `lname` values. A missing directory match falls back to the stored username and emits a warning.
- Summary per Department and Account rolls current live item totals through typed unit -> current root account -> current child account. Its unit and grand Total Amount values reconcile to that item breakdown.
- Modern items map by `account_id`. A missing legacy ID may use account code only when the school-year typed-unit proposal allocation resolves exactly one account. Unresolved amounts remain under Unmapped Account and generate a warning.
- Saved header totals are reconciled against current live item totals and returns. Differences do not rewrite data; they generate structured data-quality warnings.

### Budget Proposal Reports

- The Details and Status report is a current live snapshot scoped by school year and exact typed Department/Section; it has no date range.
- Blank account filters include every allocated child account. Main-only includes its children, while Main plus Sub-Account narrows to that exact allocation account.
- Proposed Amount comes from each live proposal item's `total_cost`; Approved Amount comes from `approved_total_cost`, with null normalized to zero.
- Budget Review Details permits `approved_total_cost` to be greater than the proposal item's `total_cost`; only negative approved amounts are invalid. Saved approved values roll up to Sub-Account and Budget Proposal approved totals and balances as entered.
- Status codes are 0 Pending, 1 Approved, and 2 Disapproved. Approved and Disapproved timestamps use the item's current `updated_at` converted to the application timezone; Pending has no status timestamp.
- Sub-Account, Main Account, and Grand Totals are recalculated from live items and returned as fixed two-decimal strings.
- Missing account hierarchy is preserved under Unmapped Account with a warning so proposal value is not silently removed.
- University Budget is a school-year-wide live snapshot that does not require a unit filter. It groups Main Account -> Sub-Account -> typed Department/Section and aggregates item quantity, proposed amount, and approved amount.
- University Budget keeps Department and Section identities distinct, merges duplicate allocations for the same typed unit and child account without double-counting items, and permits the same optional Main/Sub-Account narrowing.
- Missing organizational or account relationships remain under explicit Unmapped groups with warnings so university totals reconcile.
- Approved Budget is a school-year and exact typed-unit live snapshot. It always includes every allocated account for the selected Department/Section and disables Main/Sub-Account filtering.
- Approved Budget groups Main Account -> Sub-Account and aggregates live item quantity, proposed amount, and approved amount. Null approved values are zero; child, root, and grand totals are backend-calculated.
- Approved Budget merges duplicate allocations for the same child account without counting the same proposal item ID twice and preserves unresolved account relationships under Unmapped Account with warnings.
- Approved Items per Account requires one root Main Account, permits an optional child Sub-Account, and permits either one exact typed Department/Section or all units for the school year.
- Approved Items per Account groups typed unit -> child account -> live proposal item. It displays description, quantity, and current `approved_total_cost`; null and zero approved values remain visible as `0.00`.
- Approved Items per Account returns backend child, unit, and grand totals. All-unit printing starts each Department/Section on a new Letter landscape page, and unresolved units are preserved with warnings.
- Approved Items per Account/Department uses the same required root, optional child, and optional exact typed-unit scope, but groups child account -> typed Department/Section -> live proposal item.
- Approved Items per Account/Department displays description, quantity, proposed `total_cost`, and approved `approved_total_cost`, then calculates typed-unit, child-account, selected-main-account, and grand totals on the backend. Null approved values remain visible as `0.00`.
- Percentage of Proposed versus Approved Budget requires one exact typed Department/Section and permits optional Main/Sub-Account narrowing. It groups current live proposal item values as root account -> child account.
- Its backend-calculated percentage is `(approved amount / proposed amount) * 100`, formatted to two decimals for every child, root total, and grand total. Total percentages use aggregated amounts rather than averaging row percentages; a zero proposed denominator returns `0.00`. Percentages may exceed `100.00` when Budget Review approves more than the proposed amount.
- Percentage of Approved Budget, Previous versus Current School Year treats the selected report `school_year` as the previous year and resolves the current year only from `budget_settings.current_school_year`. The years must differ.
- It scopes both years to the same exact typed unit and optional Main/Sub-Account filters, then groups the union of current account identities present in either year. Missing-year values are zero rather than causing the account row to disappear.
- Its percentage is `(current approved amount / previous approved amount) * 100`. Child, root, and grand percentages use aggregated approved cents; a zero previous approved denominator returns `0.00`.
- Other unimplemented legacy proposal report choices are visible but disabled until their rules are implemented.

### Unserved RS Report

- The report includes current live requisition headers with a nonzero requisition number and excludes only current statuses `served` and `served by wico`, case-insensitively.
- Its inclusive application-timezone From/To period applies to the live header's `created_at`. Current status, location, organization ownership, and total amount are displayed; audits do not determine period inclusion.
- Blank Location includes every current location. A selected normalized Location scopes exactly; null or blank locations are grouped as Unassigned.
- Output groups current Location -> current Status -> requisition rows. Current cancelled and disapproved requisitions remain included because they are not served.
- Date Certified is display metadata from the first requisition-header audit, ordered by timestamp and audit ID, whose new status is `certified`. Missing certification evidence displays as unavailable and does not remove the row.
- Typed organizational identity is preserved, money is formatted by the backend, and status, location, and grand totals reconcile to current header `total_amount` values.

## UI and Print Contract

- All displayed monetary values use thousands separators and exactly two decimal places in screen tables, modals, report previews, and printed output. Numeric form controls and API payloads remain unformatted machine-readable numbers.
- Validate required filters before opening a preview.
- Loading or API failure must not open stale or zero-filled data.
- Show incomplete-history warnings as toasts, not as an inline block in the report preview or print body.
- `printed_by` is the authenticated user's resolved full name.
- Tag every organizational row as Department or Section; label inactive historical units where selectable.
- Every ABMS report preview and browser print uses US Letter landscape (`11in × 8.5in`) with `0.35in` margins.
- Screen previews use the same Letter aspect and maximum width as the printed sheet; tables must remain within the printable width and repeat table headers across printed pages.
- Do not render hardcoded page numbers because browser pagination depends on content and print settings.
- Allow long account and requisition groups to flow across pages while keeping individual rows, headings, subtotals, totals, and footers together where practical.

## Core Financial Transaction Safety

- Proposal saving serializes by school year plus typed organizational unit using a deterministic MySQL advisory-lock name no longer than MySQL's 64-character limit, then locks the proposal, allocation, and affected items. Header/allocation creation, item changes, and live-item rollups commit or roll back together.
- Requisition item creation and amount increases lock both the exact account allocation and its proposal. Both projected balances must remain nonnegative before any financial write.
- Final RS numbering uses a locked calendar-year sequence row. Draft number `0` is reusable; once a requisition has a nonzero number, later finalization or reprocessing preserves it.
- Core financial mutations require an `Idempotency-Key` UUID in production. A completed retry with the same user, action, key, and payload replays the stored response; changed payloads fail with `422`, and a concurrent in-progress request fails with `409`.
- The browser retains one idempotency key across transport-error retries for the same action and clears it after a definitive HTTP response.
- Balance mutations use integer-cent or exact decimal-string arithmetic for decisions and persist two-decimal values. Binary floating-point values are not authoritative for affordability checks.
- Completed idempotency records expire after 30 days and are pruned by the scheduled `abms:prune-financial-idempotency` command.
