# ABMS Financial and Reporting Rules

Last verified: 2026-08-11

## Shared Financial Identity

- Account identity is the positive `accounts.id`. Codes and SAP numbers are non-unique labels.
- A typed unit key is `department:{id}` or `section:{id}`. Never merge these namespaces.
- A combined Department/Section dropdown must store or compare the complete typed key. A raw `cid` alone is not a valid UI selection identity because a Department and Section may legitimately share it.
- A proposal allocation is the tuple of school year, typed unit, proposal, and child account represented by `budget_proposal_entry` plus `sub_accounts`.
- Current account hierarchy and organization relationships are used for report grouping. Emit a warning when a current relationship cannot be established reliably.

## Budget Adjustment Entry

- New adjustment entries always use `budget_settings.current_school_year`; the backend derives this value and does not trust a client-supplied school year.
- Creation resolves exactly one live proposal by current school year and typed Department/Section. When its selected child account has no current or historical allocation, a positive net adjustment creates a zero-proposed/zero-approved allocation whose opening balance equals the adjustment net; proposal items and approved/proposed totals remain unchanged.
- A missing allocation is not created for a zero/negative net adjustment, a missing/duplicate proposal, duplicate allocation, or matching soft-deleted allocation. All such cases fail without partial writes.
- Existing adjustment school years remain immutable. Editing or deleting a historical adjustment continues to resolve and reverse its originally stored school-year allocation.
- Adjustment create, update, and delete use integer cents, locked atomic balance changes, the Proposal Entry typed-unit advisory lock where creation is possible, transaction retries, and financial idempotency keys. Reversal retains an adjustment-created allocation at zero and fails if its funds have already been consumed.

## Frontend Page Permission Boundaries

- Budget Settings, Budget Review and Budget Review Details, Budget Transfer Account, and Budget Adjustment Entry require either general `admin-access` or `controller-access` in both the sidebar and frontend route guards. General `budget-access` alone does not authorize these pages.
- Budget Proposal Entry uses the explicit `allow-budget-proposal-entry` permission and does not depend on general `budget-access`.
- Budget Performance Per Department, Item Requested Per Account, Budget Proposal Reports, and Budget Liquidation accept either existing report-wide `admin-access`/`budget-access`/`controller-access` or a typed assignment under `allow-budget-request-entry`/`allow-budget-proposal-entry`. Entry-permission-only users are restricted to the union of their assigned typed units; report-wide users retain unrestricted qualifying-unit options.
- Scoped report users must select one assigned Department or Section. Grand, university-wide, and all-unit modes are rejected server-side because they bypass typed-unit scope. A single eligible returned unit is selected by the frontend automatically; multiple units remain unselected for an explicit user choice.
- Liquidation Submission is unrestricted only for authenticated users with general `admin-access` or `budget-access`. Every other authorized user is backend-scoped to typed `allow-budget-request-entry` assignments; omitted or manipulated filters cannot widen that scope. Restricted users never receive an All Departments option, and one eligible assigned unit is selected and locked automatically.

## Budget Performance Formula

- A Budget Performance proposal participates when its `school_year` and requested typed organizational/account scope match. Proposal `created_at` is not constrained by From/To because the proposal and its allocations establish the school-year baseline. Approved Budget and Balance come directly from the included allocation's latest `approved_total_cost` and `balance`.
- Adjustment Additional and Deduction come from the latest values of live adjustment entries created inside the range.
- Released and Unused Amount come from the latest `total_cost` and `unused_amount` of live items whose current live requisition header was created inside the range.
- Balance is a stored current allocation value and is not recomputed from the other displayed period columns.
- A later update to an included adjustment or requisition row intentionally changes a report for the row's original creation date. An update does not move that period activity into a range when its `created_at` is outside that range.
- Aggregate by typed unit and child allocation first, then roll up to a parent, division, or university level. This prevents cross-unit and cross-account leakage.
- Return all financial fields as backend-formatted two-decimal strings. Category, group, and grand totals are calculated by the backend.
- Root account code `355` is CAPEX; every other root account is NON-CAPEX.

## Live Date-Range Projection

- Date-ranged report services do not query OwenIt audits for inclusion, dates, values, snapshots, lifecycle reconstruction, or reconciliation.
- Convert From and To to explicit start-of-day and end-of-day strings in the application timezone before querying `created_at`; this preserves midnight and end-of-day inclusivity without connection-timezone shifts.
- On requisition-backed report pages with a school-year selector, selecting a year defaults From to the earliest live `budget_request_entry.created_at` date for that year and To to the current application-timezone date. Users may still edit either date; soft-deleted requisitions do not establish the default.
- On Adjustments Per Department, selecting a year defaults From to the earliest live `budget_adjustment_entry.created_at` date for that year and To to the current application-timezone date. Soft-deleted adjustments do not establish the default.
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

- Budget Request Entry navigation and frontend routing accept `allow-budget-request-entry`, `admin-access`, or `budget-access`. Its loader gives authenticated users with general `admin-access` or `budget-access` every Department and Section referenced by a live Budget Proposal Entry. It resolves those general permissions by name from the authenticated finance identity and does not trust browser-supplied usernames or Admin/Budget permission IDs. Other users remain limited to typed units assigned through `allow-budget-request-entry`.
- Budget Proposal Entry and Budget Request Entry automatically select the user's Department or Section only when the combined authorized typed-unit list contains exactly one option. Users with zero or multiple authorized units retain an empty selector and must choose explicitly where applicable.
- During initial RS creation, Print RS and Chat/Message actions are not shown. After the requisition has been created, its Budget Request Entry viewing modal provides Chat and the same printable RS preview used by Requisition Process. Unsaved requisitions with number `0` cannot be printed.
- Payment form and payee data belong only to Cashier requisitions. Cashier header creation requires a nonblank payment form; Stockroom and Logistics creation neither displays a Payee field nor persists client-supplied payment-form or payee details.
- `Payment for Supplier/Water` requires Payee, a numeric TIN, and exactly one of VAT Registered or Non-VAT Registered. AdU Employee is not offered for this form and is normalized to false by the backend.
- `Payment for Honorarium` requires Payee, a numeric TIN, and exactly one of AdU Employee or Non AdU Employee. It does not offer VAT or Non-VAT classification, and both VAT inputs are normalized to false by the backend.
- Shared RS printing projects payee details by payment form: Supplier/Water prints only its TIN, VAT classification, and applicable payment/bank details; Honorarium prints only its TIN, employee classification, and applicable payment/bank details.
- Shared RS printing resolves `Printed By` from the authenticated user opening the print preview, not from the requisition requester/creator. This is print-time attribution only and does not alter stored ownership.
- A deliberate Print-button click for a numbered live RS must record one append-only print event before the browser dialog opens. Opening or closing the preview and changing paper presets do not create events. `Printed` means the browser dialog was initiated; it does not prove that paper or a PDF was produced.
- Before Logistics, Stockroom, Budget, or Administration opens the shared RS print preview, the frontend requests the latest append-only print event ordered by `created_at`, then event ID, descending. The current authenticated user is not excluded, so a same-user prior print also produces the explicit Yes/No warning containing the RS number, stored resolved printer name, and print date/time. No and history-check failures create no event, while Yes only opens the preview; the actual event remains recorded only when the preview's Print button is used. Controller and other Requisition Process roles retain direct preview opening.
- Budget Request Entry and the Stockroom Requisition Process role apply a view-scoped Stockroom-type print gate before preview opening: normalized `rstype = stockroom` requires a Certified or Served state. `certified`, `certified rs`, `served`, `served rs`, and `served by wico` are the recognized stored/display variants. The disabled action explains the requirement and its handler refuses to open the preview. This gate does not apply in Logistics, Administration, Controller, Budget-role Requisition Process, or other role views and does not change the shared print-event API.
- Print identity comes only from the authenticated backend user. The event snapshots user ID, username/employee number, and teacher-resolved full name, falling back to authenticated name and then username; client identity values are ignored.
- Print-event creation uses the shared UUID idempotency contract. A retry of one interrupted click replays the original response, while a later deliberate click receives a new key and appends another row.
- Requisition Process History merges append-only print rows with OwenIt requisition-header and requisition-item audit rows at read time using source-qualified keys and stable newest-first ordering. Active and soft-deleted items are included by parent requisition ID. Item rows carry an entity label derived from the changed/current description, while raw old/new values remain in the API contract for compatibility. Print rows have no old/new changes block and remain outside `audits`, report selection, and financial audit reconstruction.
- The shared history modal translates audit fields and values for budget staff: Controller `0/1/2` becomes Pending/Approved/Disapproved; booleans become Yes/No; monetary fields use PHP currency; dates are localized; workflow text is title-cased; nested arrays/objects are rendered as readable labeled text. Technical IDs/timestamps are suppressed where they do not explain the change. Created, updated, and deleted details are all displayable. This projection is read-only and never rewrites audit evidence.
- Stockroom requisition items must be selected from the live Office Supplies catalog. The selected catalog ID is required; description, unit cost, and unit of measurement are copied from the server-side catalog record and cannot be supplied manually. Quantity remains requester-entered because it represents the amount being requested.
- Account choices for a new requisition come from the exact school-year typed-unit allocation. When reviewing an existing requisition, the backend scopes choices to its stored positive item `account_id` values; account codes remain display-only.
- The backend always recalculates `total_amount` from stored live item `total_cost` values and does not trust a client-supplied total.
- Finalizing a Cashier requisition requires a nonblank payee, either already stored from Payee Details or submitted by the RS form. Missing payee validation occurs before numbering or workflow changes; non-final total synchronization and non-Cashier requisitions do not require it. Editable legacy unsaved or reprocessed Cashier slips expose a required Payee input so they can satisfy the rule.
- Finalization requires at least one item. The PHP 1,000 minimum applies only when a Cashier requisition's stored payment form is exactly `Reimbursement/Replenishment`; every other Cashier payment form may finalize below that threshold. Drafts may still synchronize below the threshold.
- `Reprocess RS` uses the dedicated database status `reprocess`, sets `location = department`, records the prior location in `from`, and resets Controller decision state. Reprocess actions are hidden once an entry is already in `reprocess`.
- Department-side item editing is allowed only for unsaved requisitions or entries with `status = reprocess` and `location = department`. Pending reprocess rows may change Account, Description, Quantity, Unit Cost, and UOM; Served and Unavailable rows remain fully locked. During initial creation, each persisted draft row has an explicit per-item editor: Cashier/Logistics may change Account, Description, Quantity, and Unit Cost while UOM remains fixed; Stockroom may change only Account and Quantity while its stored catalog fields remain authoritative.
- Draft and department-reprocess account choices are derived from the stored RS school year and exact typed Department/Section. A reassignment resolves accounts by ID, refunds the complete old item total, debits the recalculated destination total, aggregates allocation/proposal effects, and updates the item and header total atomically in integer cents. Missing, ambiguous, out-of-scope, or insufficient destination allocations reject the whole transaction without mutation.
- Budget Request Entry workflow modals ignore backdrop clicks and Escape. They close only through explicit controls, successful selection, or successful save. The unsaved RS Form X and Discard controls both use the server-side discard/refund path; a failed discard keeps the draft open.
- Requisition Process item editing is separately available only to an authenticated user with general `budget-access` while the RS has `status = for review` and `location = budget office`. Administration and every other role are rejected by the backend even if a browser submits the same request.
- Logistics description editing uses a separate idempotent endpoint and requires authenticated general `logistics-access` while the RS has `status = for pricing` or `for purchase` and `location = logistics`. P.O. on Process remains non-editable because that workflow stage has left Logistics. Each submitted row may contain only its existing item ID and a nonblank description; account, quantity, UOM, unit cost, quoted price, item/header totals, allocations, and proposal balances remain unchanged.
- During Budget review, Cashier and Logistics items may change Account, Description, Quantity, Unit of Measurement, and Unit Cost. Stockroom items may change only Account and Quantity; their stored catalog-derived Description, Unit of Measurement, and Unit Cost are retained regardless of client input. This path never adds or removes items.
- A Budget-review account reassignment resolves both allocations by account ID within the RS school year and exact typed unit. It refunds the old item total to the source allocation, debits the recalculated total from the destination allocation, aggregates all item effects per allocation/proposal, and validates every projected balance before writing.
- Budget-review item edits lock the header, items, destination accounts, allocations, and proposals in deterministic ID order and calculate in integer cents. Missing/ambiguous allocations, negative or overflowing projected balances, liquidation metadata, or nonzero item unused amounts reject the complete batch without changing balances, items, or the header total.
- Item add/remove/update routes reject non-editable finalized requisitions. Modern rows resolve by stored `account_id`; legacy rows may fall back to account code only when the selected school-year typed-unit allocation resolves uniquely.
- Cancelling or disapproving through the current requisition-process action handler locks the requisition, resolves each item by stored `account_id`, refunds the still-consumed amount, and updates the status atomically. If any item lacks an exact allocation/proposal mapping, the action fails without partial balance or status changes.
- The department quoted-price preview is read-only. The requester may view it; otherwise the user needs a typed permission matching the requisition's exact department or section. It aggregates all item deltas per allocation before projecting the balance and returns unresolved allocations explicitly rather than changing balances.
- Logistics quoted-price entry requires a read-only confirmation step before saving. The confirmation displays every current draft with account, description, quantity/UOM, quoted unit price, line total, and combined total; cancelling preserves the drafts, and only explicit confirmation calls the existing idempotent save endpoint and forwards the RS to Budget Office.
- With Logistics Workflow V2 enabled, Logistics may submit one or more actually changed positive quoted prices while an RS is `for pricing` or `for purchase` at Logistics; blank unresolved lines remain unquoted. Served and Unavailable lines are locked. Changed lines become unaccepted and undispatched, and the header moves to `for approval` at Budget Office without changing financial values.
- Administration accepts only pending unresolved revisions. In one locked transaction it applies exact-cent item/header/allocation/proposal deltas, records quote acceptance metadata, resets `is_controlled = 0`, and keeps the RS `for approval` at Budget Office. Controller may approve or disapprove that price cycle; a disapproved price cycle may be changed directly to approved after internal discussion. Administration may mark `for purchase` only after Controller approval.
- Administration hides For Purchase while any unresolved quoted-price revision has not been accepted, even if the header still carries approval from the preceding price cycle. Acceptance then resets Controller state, so For Purchase appears only after both Administration acceptance and the new Controller approval. The locked backend independently rejects stale or forged transitions.
- After Administration accepts a Logistics price cycle, its RS modal shows a persistent notice that Controller approval is required before For Purchase becomes available. A Controller-disapproved cycle shows the corresponding disapproval notice until the decision changes to approved.
- With V2 enabled, independently authorized `Send RS to WICO` requires `for purchase` at Logistics and current Controller approval. It dispatches every unresolved line whose accepted quote exactly matches unit cost, requires at least one eligible line, and leaves unquoted/unaccepted lines undispatched for later cycles. The header moves to `po on process` at Stockroom. The capability-disabled path retains the established all-lines gate.
- At Stockroom, Logistics lines can be fulfilled only when dispatched; certified Stockroom-type active lines are all eligible. Before finalization, Stockroom may toggle eligible positive-quantity lines between Pending and Served individually or in one idempotent batch. Unavailable is automatic only when certified Stockroom quantity editing sets quantity to zero; it is displayed as a locked state and cannot be manually tagged. Select All changes all eligible Pending positive-quantity lines to Served and can untag selectable Served lines. Header Mark Served requires every live line to be Served or Unavailable.
- Returning a partial PO to Logistics preserves Served/Unavailable lines and Controller approval and clears dispatch only for unresolved lines. Completed lines cannot be repriced. Stockroom-type quantity zero marks the line Unavailable with the existing exact refund; restoring a positive quantity before finalization returns it to Pending and reapplies the exact deduction.
- Misrouted and delivery-fee return actions are stage-based and independently authorized server-side. Logistics may return a Logistics RS at either `for pricing` or `for purchase` at `logistics` to `on process` at `budget office`; Stockroom may return only `certified` at `stockroom` to the same Administration stage. The interfaces label this action `Return to Budget`, while the stable API action remains `Return to Administration`. These returns set `from` to the returning office and preserve `is_controlled`, accepted prices, fulfillment metadata, and financial data. A returned For Purchase RS therefore needs no new Controller decision unless Administration explicitly selects `Reprocess RS`, which sends it to the department and resets `is_controlled = 0` before the established For Review cycle.
- Item fulfillment is authoritative across correction cycles. Budget/Administration and Department reprocess editors expose only Pending lines for mutation; Served and Unavailable lines remain visible with a Locked marker and cannot be edited or deleted. Both financial endpoints lock and revalidate item state. A backward-compatible full-form save may include an unchanged resolved line, which is ignored while Pending/new lines are processed; any actual resolved-line change returns 422 and leaves item/header totals, allocations, and proposal balances unchanged. Newly added delivery-fee lines start Pending and remain editable.
- Logistics initializes its Requisition Process sort as `Requisition No.` descending; changing the selected column or direction continues to drive the backend's cursor-stable ordering. Other role defaults are unchanged.
- Stockroom may return `po on process` or legacy `p.o. on process` at `stockroom` to `for purchase` at `logistics`. This route preserves Controller state, accepted quoted prices, items, totals, allocations, proposal balances, notes, attachments, and liquidation flags. All return routes lock and revalidate the header, reject missing role permission with `403`, reject stale or invalid stages with `422`, and use the existing idempotent mutation/audit contracts. `Return RS to Budget` remains a compatibility alias only for the Stockroom-certified Administration return.
- Administration and Budget users may toggle `for_liquidation` on a Cashier requisition at any workflow location or status except `cancelled` and `disapproved`. The backend returns 403 without either permission and 422 for a non-Cashier or terminal requisition. The toggle remains reversible and changes only the tag; it does not approve, liquidate, reroute, or mutate balances.
- Administration and Budget users may toggle `is_cash_advance` on a Cashier requisition only after it has a nonzero requisition number and while status is not `cancelled` or `disapproved`. The tag is independent from `for_liquidation` and changes no balances, approval state, status, location, or routing.

## Controller Approval Gate

- Administration destination actions are constrained by stored normalized RS type after Controller approval: Stockroom permits only Forward to Stockroom; Logistics permits only For Pricing and the later For Purchase transition; Cashier excludes those three and retains its established cashier-related office destinations. The UI hides incompatible destinations, and the locked Administration-authorized API rejects forged or stale requests with no mutation.
- `Send RS to Staff` is type-independent but requires a Controller-approved `on process` RS currently at Budget Office. It returns the RS to `for review`, keeps it at Budget Office, and resets `is_controlled` to pending so a later Controller cycle is required.

- `budget_request_entry.is_controlled` has three states: `0` pending, `1` approved, and `2` disapproved. It must not be treated as a boolean.
- Under Logistics Workflow V2, Controller worklists also include Logistics `for approval` records at Budget Office when the decision is pending or disapproved. Audit-derived `controller_approval_count` counts successful transitions to decision `1`; `is_price_reapproval` identifies a current price cycle after an earlier approval. The UI preserves that marker when liquidation or general reprocess coloring takes precedence.
- Controller worklist rows expose `was_reprocessed_after_controller_approval` only when ordered requisition audits contain `is_controlled = 1` before a later `status = reprocess`. The current page's audits are loaded in one batched query and ordered by `created_at`, then audit ID; current fields alone never establish this historical flag. The flag is informational and does not replace the current three-state decision.
- Administration may first use `Forward to Controller` only when the requisition is at `status = for budget director` and `location = budget office`. The transition sets `status = on process`, keeps the location at Budget Office, records the prior location in `from`, and resets `is_controlled = 0`.
- A user with general `controller-access` may submit exactly one decision while `status = on process` and `is_controlled = 0`. Decision `1` approves and decision `2` disapproves; the endpoint locks the requisition before checking and writing the state.
- A Controller-disapproved requisition remains `on process` at Budget Office with `is_controlled = 2`. Administration may forward it to the Controller again, which resets the decision to pending. `Reprocess RS` instead returns it to Department review and also resets the decision.
- Ordered audit reconstruction separately counts successful Controller approvals whose effective workflow status is `for approval`. This `price_reapproval_count` is informational: active `for approval` rows retain the Price Reapproval treatment, while a current `reprocess` row can show `PREVIOUSLY PRICE REAPPROVED · N TIME(S)` alongside `REPROCESSED AFTER APPROVAL`. Missing or malformed evidence contributes zero.
- Administration may perform the guarded onward actions (`Send RS to Staff`, `For Pricing`, or forwarding to Stockroom, BAO, Accounting, Accounting Director, HRMDO, or Cash Management) only while `status = on process` and `is_controlled = 1`.
- The decision endpoint returns 403 without `controller-access`; validation rejects decisions outside `1` or `2`; and it returns 422 when the requisition is not `on process` or has already received a decision. Invalid initial forwarding, invalid resubmission, and onward routing without approval also return 422 without applying the requested transition.
- Current security caveat: the guarded misrouted-return actions on `PUT /api/abms/requisition-process/{id}` independently verify Logistics or Stockroom permission, but the endpoint's other generic actions do not consistently verify the authenticated caller's implied role. Likewise, list filtering accepts a client-supplied role. Do not interpret frontend button visibility or unrelated state checks as complete authorization.

### Logistics Workflow V2 rollout

- `ABMS_LOGISTICS_WORKFLOW_V2` defaults off. APIs expose the capability state; the frontend preserves legacy controls until it is enabled after backend, migration, and client deployment.
- The additive item migration records quote acceptance, dispatch, and fulfillment metadata. It backfills acceptance only for exact-cent quote/unit-cost matches, dispatches supported active PO-at-Stockroom matches, and initializes active fulfillment as Pending. It never changes header status/location/Controller state, quantities, totals, balances, or terminal history; terminal served rows display `Legacy resolved` without fabricated actor/timestamp evidence.
- During the compatibility window, legacy Mark Served requests can atomically mark all eligible lines Served. A legacy request that would incorrectly finalize a partial Logistics RS is rejected with a refresh-required response. Disabling legacy compatibility rejects every stale request rather than bypassing V2 completion rules.

### Requisition Role Filter Defaults

- Initial status filters are role-specific: Budget Office uses `For Review`, Administration uses `For Budget Director`, Controller uses `For Controller`, Purchasing/Logistics uses `For Pricing`, and Stockroom uses `To Process RS`.
- Stockroom `To Process RS` matches only `certified`, `po on process`, or legacy `p.o. on process` requisitions whose current `location = stockroom`. Historical Stockroom visibility must not make an active-stage row appear after it moves to another office.
- Only Budget and Administration display the `RS to Process Today` pseudo-status.
- Administration's display label `For Budget Director` maps to the backend's legacy `For Certification` filter token, which resolves database status `for budget director`.
- Administration retains the broad `On Process` filter and additionally exposes `On Process - Pending`, `On Process - Approved`, and `On Process - Disapproved`. These select only `status = on process` rows with `is_controlled` values `0`, `1`, and `2`, respectively; multiple decision and ordinary status selections remain OR-based.
- Stockroom exposes `RS from Logistics` for current PO-on-process arrivals whose `location = stockroom` and `from = logistics`, including both stored PO spellings. `RS from Budget Office` selects current certified arrivals whose `location = stockroom` and `from = budget office`. Served, mismatched-stage, and already-departed records are excluded; combining either source filter with other Stockroom filters remains OR-based.
- Accounting defaults to `Certified`; Cashier retains the shared `All` default. Users may still select `All` or combine non-All statuses after the initial load.

### Cashier Accounting Correction Cycle

- The Accounting worklist requires `accounting-access` and includes only requisitions whose current location is `accounting office`, `bao`, or `hrmdo`. Historical visits do not qualify. Accounting can inspect, print, view files/history, and chat, but has no posting or certification workflow controls.
- Accounting may return only a Certified Cashier RS at one of those three current locations. The idempotent, locked transition sets `status = for budget director`, `location = budget office`, `from` to the exact returning office, and `is_controlled = 0`; items, payment/payee data, totals, allocations, balances, notes, files, liquidation data, and RS number are preserved.
- `admin-access` may use the established exact-balance item editor on a Cashier RS at `for budget director` in Budget Office. Account identity remains ID-based and the editable fields are account, description, quantity, UOM, and unit cost. A save retains that workflow state and pending Controller decision; onward Cashier routing remains blocked until Administration forwards it to Controller and Controller approves it.
- Future `Forward to HRMDO` transitions store current location `hrmdo`. Existing HRMDO records represented as `accounting office` are not rewritten because their original destination is not safely reconstructable.
- `controller_review_count` counts ordered audit transitions into `on process` separately from successful `controller_approval_count`. Missing or malformed evidence contributes zero. Controller rows use ordinal approval wording, such as `CONTROLLER RE-REVIEW · 2ND APPROVAL`, after more than one arrival; Logistics price reapproval uses the same ordinal wording. The Controller modal centers its larger sent, approved, price-reapproved, and active ordinal counts in the Requested Items header so the footer action positions remain stable.
- The shared Requisition Process modal does not expose `Mark as Cancelled` from Purchasing/Logistics, Stockroom, or Accounting. Other established role visibility and the underlying cancellation workflow remain unchanged.

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
- Enabling the Cash Advance tag on an eligible Cashier RS atomically sets both `is_cash_advance` and `for_liquidation` true. Disabling Cash Advance clears only `is_cash_advance` and preserves the liquidation tag, because the RS may still require liquidation independently.
- The Requisition Process `All Except PNB Credit Card Payment` filter includes requisitions with any nonblank payment form other than a trimmed, case-insensitive PNB Credit Card Payment value. Null and blank payment forms are not treated as another payment form.
- Budget and Administration additionally expose the pseudo-status `RS to Process Today`. It is a worklist label rather than a stored status: both roles include every RS type and null, blank, or non-PNB payment forms, excluding only a trimmed, case-insensitive exact `PNB Credit Card Payment`. Budget also requires the current status to be exactly `for review`; Administration intentionally remains status-wide. Other selected statuses remain OR-based, and other filter families plus cursor pagination still apply.

## Report Families

### Department and Section Filter Sources

- Budget Review, Budget Proposal Reports, and Budget Performance per Department list only typed Departments and Sections referenced by live `budget_proposal_entry` headers.
- Item Requested per Account lists only typed units referenced by live, numbered requisitions whose current status is neither cancelled nor disapproved.
- For the four entry-permission-accessible reports, qualifying source-backed units are additionally intersected with the authenticated user's typed request/proposal entry assignments. Preview authorization rechecks the submitted unit type and ID; a Department and Section sharing the same numeric ID never authorize one another.
- Adjustments per Department lists only typed units referenced by live `budget_adjustment_entry` headers.
- Budget Liquidation lists only typed units referenced by live, numbered, non-cancelled/non-disapproved requisitions marked for liquidation or already liquidated.
- Referenced inactive units remain selectable and are labelled inactive. Active directory units without a qualifying backing row are omitted.
- Report unit option panels may be moderately wider than their triggers for long names. They align inward from the trigger so they remain over the report card and stay capped to the mobile viewport.

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

### Purchasing Accomplishment Report

- Both report endpoints, the frontend route, and its sidebar entry require general `logistics-access`; other ABMS roles do not receive access implicitly.
- Required From/To dates select requisition-header audit arrivals into normalized Logistics at `for pricing` or `for purchase`, using inclusive application-timezone boundaries. Both filters default to the application current date for daily accomplishment tracking.
- Only live requisitions with a nonzero requisition number qualify. Multiple selected arrivals for one requisition count once.
- A nonterminal qualifying requisition is Processed when a later header audit pairs its selected arrival with a recognized Logistics exit: `for approval` or `on process` at Budget Office, or either PO-on-process spelling at Stockroom. A completion before a later selected arrival does not complete that later cycle; completion after To remains valid because the period selects the arrival cohort.
- A qualifying requisition whose current status is `cancelled` or `disapproved` counts only in Cancelled/Disapproved, even if prior completion evidence exists. Processed and terminal totals are mutually exclusive.
- The projection is read-only. It does not infer arrival or completion timestamps from live `created_at`, `updated_at`, status, or location; unreadable evidence yields structured warnings and cannot invent a processed outcome.
- Pending RS is the qualifying distinct arrival cohort minus Processed RS and current Cancelled/Disapproved RS. These three outcome counts are mutually exclusive and reconcile to Total RS.
- The preview body contains Total RS, Processed RS, Pending RS, and Cancelled/Disapproved RS with the standard report heading, date period, print metadata, Print, and Excel export.

## UI and Print Contract

- All displayed monetary values use thousands separators and exactly two decimal places in screen tables, modals, report previews, and printed output. Numeric form controls and API payloads remain unformatted machine-readable numbers.
- Every report preview offers `.xlsx` export beside Print. Export uses the currently rendered, validated preview response: titles, filters, group labels, rows, subtotals, grand totals, empty-state text, and footer are projected without a second request or financial recalculation.
- Excel money, percentage, and quantity cells are numeric with explicit display formats. Identifiers, account codes, requisition numbers, dates, and labels remain text. Workbooks use readable Arial typography, wrapping, styled group/total rows, frozen report headers, and Letter-landscape page settings. Numeric column widths are based on formatted display values—including thousands separators, decimals, signs, and percent symbols—so Excel does not replace valid amounts with `#######`.
- Budget Request Entry and Requisition Process display saved account codes as `parent account code - sub-account code` when both are resolvable. The combined value is display-only: persistence and financial validation continue using the child account ID and stored child code.
- Validate required filters before opening a preview.
- Loading or API failure must not open stale or zero-filled data.
- Show incomplete-history warnings as toasts, not as an inline block in the report preview or print body.
- `printed_by` is the authenticated user's resolved full name.
- Tag every organizational row as Department or Section; label inactive historical units where selectable.
- Every ABMS report preview and browser print uses US Letter landscape (`11in × 8.5in`) with printer-safe `0.30in` margins.
- Screen previews use the same Letter aspect, maximum width, and `0.30in` safe content inset as the printed sheet. Print mode removes the preview's inner padding so the browser page margin is the only printable inset.
- Shared report typography uses a 15px base, 13px table cells, 26px/17px primary titles, 15px/14px group headings, 11px badges, and 12px footers for improved readability. Report-specific column widths, indentation, and alignment remain authoritative; content may flow onto additional pages instead of being reduced to fit.
- Shared report metadata reserves a responsive label column and an explicit label/value gap. Long metadata, headings, unit/account names, and table text wrap within their assigned printable area instead of overlapping adjacent content; total blocks remain capped to the report width.
- Tables must remain within the printable width and repeat table headers across printed pages.
- The shared Requisition Slip preview used by Requisition Process and Budget Request Entry defaults to General/PDF US Letter portrait (`8.5in × 11in`) with a `0.2in` internal safety inset. General/PDF supports Letter, standard Legal (`8.5in × 14in`), and A4 in portrait and landscape orientations. Epson LX-300-II supports Letter, Legal, and compact Half Legal (`8.5in × 7in`). Fixed formats use explicit physical dimensions, CSS `@page` has zero margin, and the RS sheet supplies internal printer-safe spacing. The Epson driver must expose the matching custom Half Legal form when required by the physical printer. Long content flows to another page instead of overlapping.
- Do not render hardcoded page numbers because browser pagination depends on content and print settings.
- Allow long account and requisition groups to flow across pages while keeping individual rows, headings, subtotals, totals, and footers together where practical.

## Core Financial Transaction Safety

### Office Supply identity

- `office_supplies.item_code` is a client-provided display/business identifier, not an application-generated sequence.
- Create and update require a trimmed, non-empty string of at most 255 characters. Codes must be unique across all rows, including soft-deleted records, while an update may retain its own current code.
- The database unique index remains authoritative under concurrent requests; existing item IDs remain the internal record identity.

### Stockroom certified-quantity reconciliation

- Stockroom quantity adjustment is available only to `stockroom-access` for a live requisition whose normalized type, status, and location are `stockroom`, `certified`, and `stockroom` respectively. Served and every other stage are immutable through this path.
- The dedicated request accepts only existing item IDs and nonnegative integer quantities. A zero quantity represents an item that cannot be served and produces a zero item total without deleting the row.
- Each new total is the stored unit cost multiplied by the new quantity in exact cents. The old-to-new deltas are aggregated per ID-resolved allocation and proposal, both balance layers are validated, and the header is rolled up from every live item inside one locked transaction.
- Reductions refund the exact delta; increases require sufficient allocation and proposal balances. Account, description, unit cost, unit of measurement, quoted price, review state, and unused amount remain unchanged.

### Requisition View Accounts

- View Accounts is requisition-scoped: the API derives the selected RS's stored school year and exact typed Department/Section, never the page's current filters.
- It returns every account with a live allocation in that exact scope without the general picker’s cursor limit, including unreferenced accounts and allocations whose remaining balance is zero. Stored positive item `account_id` references are unioned into the result so incomplete legacy mappings remain visible.
- Account identity remains ID-based. The read-only operation displays the current remaining balance only when exactly one live scoped allocation matches; missing or ambiguous referenced mappings show `Unavailable` with a structured data-quality warning and never select an arbitrary allocation.
- The expanded balance view independently requires Budget, Administration, Controller, or Logistics access, matching the roles that receive View Accounts in Requisition Process.

- Proposal saving serializes by school year plus typed organizational unit using a deterministic MySQL advisory-lock name no longer than MySQL's 64-character limit, then locks the proposal, allocation, and affected items. Header/allocation creation, item changes, and live-item rollups commit or roll back together.
- Requisition item creation and amount increases lock both the exact account allocation and its proposal. Both projected balances must remain nonnegative before any financial write.
- Final RS numbering uses a locked calendar-year sequence row. Draft number `0` is reusable; once a requisition has a nonzero number, later finalization or reprocessing preserves it.
- Core financial mutations require an `Idempotency-Key` UUID in production. A completed retry with the same user, action, key, and payload replays the stored response; changed payloads fail with `422`, and a concurrent in-progress request fails with `409`.
- The browser retains one idempotency key across transport-error retries for the same action and clears it after a definitive HTTP response.
- Balance mutations use integer-cent or exact decimal-string arithmetic for decisions and persist two-decimal values. Binary floating-point values are not authoritative for affordability checks.
- Completed idempotency records expire after 30 days and are pruned by the scheduled `abms:prune-financial-idempotency` command.
### Logistics quote resubmission and reprocess reset

- Logistics may review and resubmit populated quoted prices from an active For Pricing or For Purchase stage even when the numeric values are unchanged. Submission resets item review/acceptance markers and sends the RS to Budget Office as For Approval.
- `Reprocess RS` clears each item's `quoted_price`, quoted-price acceptance metadata, and review flag in the same transaction that returns the header to Department. Current unit cost, total cost, allocations, balances, and fulfillment fields are not changed by this reset.
