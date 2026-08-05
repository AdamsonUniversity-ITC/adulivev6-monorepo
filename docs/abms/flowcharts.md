# ABMS Architecture and Workflow Flowcharts

Last verified: 2026-08-05

## System Context

```mermaid
flowchart LR
    U[Authenticated user] --> FE[ABMS React/Vite frontend]
    FE -->|Finance API requests| API[Laravel finance_service]
    API --> AUTH[Authentication and permission services]
    API --> FDB[(Finance database)]
    API --> ORG[(db116_adamson organization directory)]
    API --> PEOPLE[(aduollms teacher directory)]
    FDB --> AUDIT[(OwenIt audits)]
    FDB --> PRINTS[(Append-only RS print events)]
    FDB --> MEDIA[(Spatie media)]
    API --> FE
    FE --> PREVIEW[Screen preview, toast warnings, browser print]
```

## Protected Route Bootstrap

```mermaid
flowchart TD
    A[User enters a protected ABMS route] --> B[Show full-screen ABMS loading screen]
    B --> C[Verify finance service and authenticated session]
    C --> D{Authenticated and ABMS access allowed?}
    D -- No --> E[Use existing login, maintenance, or unauthorized redirect]
    D -- Yes --> F[Load finance profile]
    F --> G[Load general permissions and typed unit assignments]
    G --> H[Build protected route context]
    H --> I[Render authorized page]
```

The protected route owns this bootstrap state. Its pending component appears immediately and remains visible briefly to prevent protected content from flashing before permission resolution. Production login redirects use `VITE_ADU_LIVE_PRODUCTION_URL`; localhost remains the development fallback.

## Proposal and Allocation

```mermaid
flowchart TD
    A[Choose school year and typed unit] --> B{Authorized and entry window open?}
    B -- No --> X[Reject request]
    B -- Yes --> C[Create or load proposal header]
    C --> D[Choose root and child accounts by ID]
    D --> E[Create child allocation in sub_accounts]
    E --> F[Add proposal line items]
    F --> G[Calculate requested totals]
    G --> H[Review and store approved_total_cost]
    H --> I[Approved Budget becomes school-year baseline]
    I --> J[Released, unused, and balance evolve through transactions]
```

## Budget Adjustment Entry

```mermaid
flowchart TD
    A[Open add-adjustment modal] --> B[Display current school year from Budget Settings]
    B --> C[Submit typed unit, account IDs, description, and amounts]
    C --> D[Backend resolves current school year from Budget Settings]
    D --> E[Resolve and lock exactly one typed-unit proposal]
    E --> F{Exact live allocation exists?}
    F -- Yes --> G[Lock existing allocation]
    F -- No --> H{Positive net and no deleted or duplicate allocation?}
    H -- No --> X[Return validation error; change nothing]
    H -- Yes --> I[Create zero-approved allocation with opening balance]
    G --> J[Project allocation and proposal balances in integer cents]
    I --> J
    J --> K{Balances nonnegative and within schema range?}
    K -- No --> X
    K -- Yes --> L[Create adjustment and commit allocation and proposal balances atomically]
```

## Requisition and Balance Lifecycle

```mermaid
flowchart TD
    A[Create draft requisition for typed unit and school year] --> B[Select allocated child account by account ID]
    B --> C{Exact scoped allocation exists?}
    C -- No or ambiguous --> Z[Return validation error; change nothing]
    C -- Yes --> D[Lock header, proposal, and allocation]
    D --> E{Sufficient balance and valid item?}
    E -- No --> Z
    E -- Yes --> F[Debit allocation/proposal and create item atomically]
    F --> G[Finalize by assigning nonzero requisition number]
    G --> H[Initial request audit cutoff]
    H --> I[Budget review marks for Budget Director]
    I --> IA[Administration forwards to Controller and resets decision to pending]
    IA --> IB{Controller-access user decides once while on process?}
    IB -- Disapprove --> IC[Keep at Budget Office with decision 2]
    IC --> ID{Administration response}
    ID -- Resubmit --> IA
    ID -- Reprocess --> IE[Set status reprocess and return to Department]
    IE --> IE2[Requester edits/adds/removes items; backend applies balance deltas]
    IE2 --> G
    IB -- Approve --> IF[Set decision 1]
    IF --> IG[Allow guarded onward routing]
    IG --> J{Unused or returned amount?}
    J -- Yes --> K[Record unused amount and restore eligible balance]
    J -- No --> L[Continue fulfillment/liquidation]
    K --> L
    L --> M{Deletion or explicit refund operation?}
    M -- No --> N[Completed/current state]
    M -- Yes --> O[Preflight every item mapping before transaction]
    O --> P{Modern account_id valid?}
    P -- Yes --> R[Refund max of total_cost minus unused_amount and zero]
    P -- No --> Q{Legacy code resolves to exactly one scoped allocation?}
    Q -- No --> Z
    Q -- Yes --> R
    R --> S[Open transaction; lock header and items]
    S --> T[Re-resolve and lock each allocation and proposal]
    T --> V[Apply refunds and delete; rollback all on any failure]

    CA[Enable Cash Advance tag on eligible Cashier RS] --> CB[Set is_cash_advance and for_liquidation true together]
    CB --> CC[Include RS in liquidation queue]
    CD[Disable Cash Advance tag] --> CE[Clear is_cash_advance and preserve for_liquidation]
```

## Requisition Header Payee Rules

```mermaid
flowchart TD
    A[Create requisition header] --> B{Cashier request?}
    B -- No --> C[Discard payment form and payee details]
    C --> D[Create Stockroom or Logistics draft]
    B -- Yes --> E{Payment form selected?}
    E -- No --> X[Return validation error]
    E -- Yes --> F{Supplier/Water?}
    F -- Yes --> G[Require numeric TIN and exactly one VAT classification]
    G --> H[Force AdU Employee false]
    F -- No --> I{Honorarium?}
    I -- Yes --> J[Require numeric TIN and exactly one AdU or Non AdU Employee classification]
    J --> JA[Force VAT and Non-VAT false]
    I -- No --> K[Apply normal Cashier payee rules]
    H --> L[Create Cashier draft and payee details]
    JA --> L
    K --> L
```

## Requisition Process Today Worklist

```mermaid
flowchart TD
    A[Budget or Administration selects RS to Process Today] --> B[Apply organizational school-year date search and sort filters]
    B --> C[Include null blank and non-PNB payment forms across every RS type]
    C --> D[Exclude trimmed case-insensitive exact PNB Credit Card Payment]
    D --> E[Apply stable cursor pagination]
    E --> F[Return rows for the normal RS process modal]
```

## Budget Review RS Item Editing

```mermaid
flowchart TD
    A[Budget user opens an RS] --> B{For review at Budget Office?}
    B -- No --> X[Hide editor and reject writes]
    B -- Yes --> C[Load uniquely allocated accounts from RS year and typed unit]
    C --> D[Edit account and quantity plus non-Stockroom description UOM and unit cost]
    D --> E[Lock header items destination accounts allocations and proposals in ID order]
    E --> F[Aggregate old-account refunds and destination-account debits in integer cents]
    F --> G{Mappings valid and every projected balance in range?}
    G -- No --> X
    G -- Yes --> H[Update allocation and proposal balances]
    H --> I[Update item account fields and backend-calculated totals]
    I --> J[Recalculate the complete RS header total and commit once]
```

## Requisition Finalization and Quoted-Price Preview

```mermaid
flowchart TD
    A[Save or finalize requisition] --> B[Load live stored items]
    B --> C[Recalculate header total from item total_cost]
    C --> D{Finalizing?}
    D -- No --> E[Persist synchronized total]
    D -- Yes --> F{At least one item?}
    F -- No --> X[Return validation error]
    F -- Yes --> FP{Payee requirement satisfied?}
    FP -- No --> X
    FP -- Yes --> G{Cashier request below PHP 1,000 without PNB exemption?}
    G -- Yes --> X
    G -- No --> H[Assign requisition number and persist calculated total]

    P[Department user opens quoted-price preview] --> Q{Requester or exact typed-unit permission?}
    Q -- No --> Y[Return 403]
    Q -- Yes --> R[Resolve each stored account ID within school year and typed unit]
    R --> S[Aggregate item price deltas per allocation]
    S --> T[Return current and projected totals and balances]
    T --> U[Do not mutate items, allocations, proposals, or header]
```

## Logistics Quoted-Price Confirmation

```mermaid
flowchart TD
    A[Logistics enters every quoted price] --> B{Every draft is finite and positive?}
    B -- No --> C[Keep Save disabled and continue editing]
    B -- Yes --> D[Open read-only verification modal]
    D --> E[Show account item quantity UOM quoted unit price line total and grand total]
    E --> F{User decision}
    F -- Back or close --> G[Return to editing with drafts preserved]
    F -- Confirm and Save --> H[Call existing idempotent quoted-price endpoint once]
    H --> I{Save succeeds?}
    I -- No --> J[Keep review open and show server error]
    I -- Yes --> K[Close pricing and forward RS to Budget Office]
```

## Live Date-Range Report Projection

### Scoped Report Access

```mermaid
flowchart TD
    A[Open one of four scoped-capable reports] --> B{Admin, Budget, or Controller?}
    B -->|Yes| C[Return all qualifying source-backed units]
    B -->|No| D[Resolve typed Request and Proposal Entry assignments]
    D --> E{At least one assignment?}
    E -->|No| F[Return 403]
    E -->|Yes| G[Intersect assignments with qualifying report rows]
    G --> H{Exactly one eligible unit?}
    H -->|Yes| I[Frontend selects typed unit automatically]
    H -->|No| J[User selects one typed unit]
    I --> K[Preview revalidates typed unit scope]
    J --> K
    K --> L{Assigned typed unit and single-unit mode?}
    L -->|No| M[Return 403]
    L -->|Yes| N[Build existing read-only report]
```

```mermaid
flowchart TD
    A[Load report filters] --> AU[Derive typed unit options from qualifying live backing rows]
    AU --> AV[Keep referenced inactive units and omit unreferenced directory units]
    AV --> AX{Report backing entry}
    AX -- Requisition-backed --> AA[Return earliest live requisition date per school year and current application date]
    AX -- Adjustments --> AA2[Return earliest live adjustment date per school year and current application date]
    AA --> AB[Selecting a school year defaults From and To; user may edit either date]
    AA2 --> AB
    AB --> B[Authorize and validate dates, scope, and preview type]
    B --> C[Convert dates to explicit application-timezone start and end strings]
    C --> D[Select live proposal, adjustment, or requisition headers by created_at]
    D --> E[Exclude entries created outside the range even if updated inside it]
    E --> F[Load latest stored headers, items, allocations, and balances]
    F --> G[Resolve current typed units and account IDs]
    G --> H{Current identity and relationships valid?}
    H -- No --> J[Exclude or preserve under an explicit unmapped group and warn]
    H -- Yes --> K[Use current stored values]
    J --> L[Aggregate allocation or entry rows]
    K --> L
    L --> M[Roll up by requested unit, account, division, or university hierarchy]
    M --> N[Backend computes subtotals and grand totals]
    N --> O[Format money as two-decimal strings]
    O --> P[Frontend opens fresh preview]
    P --> Q{Warnings present?}
    Q -- Yes --> R[Show toast; omit warning block from printed report]
    Q -- No --> S[Render normally]
```

## Liquidation Returned-Amount Save

```mermaid
flowchart TD
    A[Admin or Budget user submits every live item return] --> B{Authorized and pending liquidation?}
    B -- No --> X[Return 403 or 422; change nothing]
    B -- Yes --> C[Lock requisition and live items]
    C --> D{Every item belongs to entry and return is within total cost?}
    D -- No --> X
    D -- Yes --> E[Resolve typed-unit, school-year allocations by account ID]
    E --> F[Aggregate each allocation's old-to-new return delta]
    F --> G[Lock allocations and proposals; validate resulting balances]
    G --> H[Update allocation/proposal balances and unused totals]
    H --> I[Update each item's unused_amount]
    I --> J[Sum complete returned amount and live item total cost]
    J --> K[Set header liquidated amount, returned amount, username, date, and is_liquidated]
    K --> L[Commit atomically; keep for_liquidation and is_approve unchanged]
```

## Requested-Item Live Projection

```mermaid
flowchart TD
    A[Load live numbered requisition] --> B{Current status valid and header not deleted?}
    B -- No --> X[Exclude]
    B -- Yes --> C[Filter current header created_at through inclusive From and To]
    C --> D{Entry created inside range?}
    D -- No --> X
    D -- Yes --> G[Read current payee, number, account, description, price, quantity, and amount]
    G --> H[Apply school-year, account, unit, and payee filters]
    H --> I[Exclude deleted items and unreliable account mappings]
    I --> J[Return each qualifying item once]
    J --> K[Backend groups or sorts and calculates totals]
```

## Budget Liquidation Report

```mermaid
flowchart TD
    A[Admin or Budget user selects school year, typed unit scope, status, preview, and R.S. dates] --> B[Validate filters and inclusive application-timezone boundaries]
    B --> C[Load live numbered requisitions by school year and created_at]
    C --> D[Exclude cancelled, disapproved, and soft-deleted records]
    D --> E{Liquidation scope}
    E -- For Liquidation --> F[Keep for_liquidation]
    E -- Liquidated --> G[Keep is_liquidated]
    E -- Both --> H[Keep union once]
    F --> I[Group by typed Department or Section]
    G --> I
    H --> I
    I --> CA{Cash Advances only?}
    CA -- Yes --> CB[Keep is_cash_advance]
    CA -- No --> J
    CB --> J
    J{Presentation}
    J -- Summary --> K[Return one aligned requisition row]
    J -- Detailed --> L[Attach current live item rows and ID-based account paths]
    J -- Summary per Account --> M[Roll live item totals through root and child accounts]
    L --> N{Legacy account ID missing?}
    N -- Unique scoped code --> O[Use unique allocation mapping and warn]
    N -- Missing or ambiguous --> P[Preserve under Unmapped Account and warn]
    K --> Q[Reconcile saved header liquidation summary with live items]
    O --> Q
    P --> Q
    M --> Q
    Q --> R[Return fixed money strings, backend totals, quality metadata, and printed full name]
    R --> S[Frontend shows warnings as toast and prints each unit on a new page]
```

## Budget Proposal Details and Status Report

```mermaid
flowchart TD
    A[Admin or Budget user selects school year and typed unit] --> B[Optionally select root and child account]
    B --> C[Validate typed unit and current account hierarchy]
    C --> D[Load live proposal headers, allocations, and items]
    D --> E[Apply optional root and child account scope]
    E --> F[Map allocations to current root and child accounts]
    F --> G{Hierarchy resolved?}
    G -- No --> H[Preserve value under Unmapped Account and warn]
    G -- Yes --> I[Group root to child to item]
    H --> J[Calculate live item subtotals and grand totals]
    I --> J
    J --> K[Map current status and localized updated timestamp]
    K --> L[Return fixed money strings and printed full name]
    L --> M[Frontend renders preview; warnings appear as toast]
```

## University Budget Proposal Report

```mermaid
flowchart TD
    A[Admin or Budget user selects school year] --> B[Optionally select root and child account]
    B --> C[Validate current account hierarchy]
    C --> D[Load all live university proposal headers, allocations, and items for the year]
    D --> E[Map each proposal to a typed Department or Section]
    E --> F[Map each allocation to its current root and child account]
    F --> G{Relationships resolved?}
    G -- No --> H[Preserve values under Unmapped groups and warn]
    G -- Yes --> I[Group root to child to typed unit]
    H --> J[Aggregate quantity, proposed amount, and approved amount]
    I --> J
    J --> K[Calculate child, root, and university totals]
    K --> L[Return fixed money strings, quality metadata, and printed full name]
    L --> M[Frontend renders tagged unit rows and warning toasts]
```

## Approved Budget Proposal Report

```mermaid
flowchart TD
    A[Select school year and typed Department or Section] --> B[Validate exact typed unit and prohibit account filters]
    B --> C[Load live proposal headers, allocations, and items]
    C --> D[Map each allocation to its current root and child account]
    D --> E{Hierarchy resolved?}
    E -- No --> F[Preserve values under Unmapped Account and warn]
    E -- Yes --> G[Group root account to child account]
    F --> H[Aggregate item quantity, proposed amount, and approved amount]
    G --> H
    H --> I[Merge duplicate allocations and count each live item ID once]
    I --> J[Calculate child, root, and grand totals]
    J --> K[Return fixed money strings, quality metadata, and printed full name]
    K --> L[Frontend renders the full selected unit budget and warning toasts]
```

## Approved Items per Account Proposal Report

```mermaid
flowchart TD
    A[Select school year and required root account] --> B[Optionally select child account and typed unit]
    B --> C[Validate root-child relationship and paired unit filter]
    C --> D[Load live proposal headers, allocations, and items]
    D --> E[Apply account and optional exact typed-unit scope]
    E --> F[Map each proposal to a Department, Section, or Unmapped unit]
    F --> G[Group unit to child account to item rows]
    G --> H[Return description, quantity, and approved amount]
    H --> I[Calculate child, unit, and grand totals]
    I --> J[Format money and attach quality warnings and printed full name]
    J --> K[Render each typed unit as a separate Letter print section]
```

## Approved Items per Account/Department Proposal Report

```mermaid
flowchart TD
    A[Select school year and required root account] --> B[Optionally select child account and typed unit]
    B --> C[Validate root-child relationship and paired unit filter]
    C --> D[Load live proposal headers, allocations, and items]
    D --> E[Apply account and optional exact typed-unit scope]
    E --> F[Map current child account and typed organizational identity]
    F --> G[Group child account to Department or Section to item rows]
    G --> H[Return description, quantity, proposed amount, and approved amount]
    H --> I[Calculate unit, child, selected-main-account, and grand totals]
    I --> J[Format money and attach quality warnings and printed full name]
    J --> K[Render the grouped Letter landscape report]
```

## Proposed versus Approved Percentage Proposal Report

```mermaid
flowchart TD
    A[Select school year and required typed unit] --> B[Optionally select root and child account]
    B --> C[Validate typed unit and root-child relationship]
    C --> D[Load live proposal headers, allocations, and items]
    D --> E[Map current root and child account identity]
    E --> F[Aggregate proposed and approved cents per child and root]
    F --> G[Calculate approved divided by proposed times 100]
    G --> H{Proposed amount is zero?}
    H -- Yes --> I[Return 0.00 percent]
    H -- No --> J[Round percentage to two decimals]
    I --> K[Return backend child, root, and grand totals]
    J --> K
    K --> L[Render Letter landscape preview with warnings and printed full name]
```

## Previous versus Current Approved Budget Report

```mermaid
flowchart TD
    A[Select previous school year and required typed unit] --> B[Read current school year from Budget Settings]
    B --> C{Current year exists and differs?}
    C -- No --> D[Return validation error]
    C -- Yes --> E[Optionally validate root and child account scope]
    E --> F[Load live proposals, allocations, and items for both years]
    F --> G[Map the union of current root and child account identities]
    G --> H[Aggregate previous and current approved cents independently]
    H --> I[Calculate current divided by previous times 100]
    I --> J{Previous approved amount is zero?}
    J -- Yes --> K[Return 0.00 percent]
    J -- No --> L[Round percentage to two decimals]
    K --> M[Return child, root, and grand totals]
    L --> M
    M --> N[Render Letter landscape preview with warnings and printed full name]
```

## Unserved RS Report

```mermaid
flowchart TD
    A[Select inclusive From and To dates] --> B[Optionally select current Location]
    B --> C[Validate dates, location, and report permission]
    C --> D[Load live numbered requisitions by created_at]
    D --> E[Exclude current Served and Served by WICO statuses]
    E --> F[Resolve typed Department or Section]
    F --> G[Read first certified-status audit for display date]
    G --> H[Group current Location to current Status to RS rows]
    H --> I[Calculate status, location, and grand totals]
    I --> J[Return fixed money strings, warnings, and printed full name]
    J --> K[Render each location as a Letter landscape print section]
```

## Authorization and Unit Scope

```mermaid
flowchart TD
    A[Authenticated identity] --> B[Load general permissions]
    A --> C[Load typed user_permissions]
    C --> D[Department assignments]
    C --> E[Section assignments]
    B --> F{General access grants requested operation?}
    D --> G{Requested department matches?}
    E --> H{Requested section matches?}
    F -- Yes --> I[Authorize broad scope]
    G -- Yes --> J[Authorize department scope]
    H -- Yes --> K[Authorize section scope]
    F -- No --> L{Typed assignment grants scope?}
    J --> M[Proceed]
    K --> M
    L -- No --> N[Return authorization error]
    L -- Yes --> M
    I --> M
```

## Change Impact Checklist

```mermaid
flowchart LR
    A[Proposed ABMS change] --> B{Changes schema or identity?}
    A --> C{Changes financial write path?}
    A --> D{Changes audits or reports?}
    A --> E{Changes authorization or UI contract?}
    B -- Yes --> F[Review ERD, migrations, rollback, ID/code lookups]
    C -- Yes --> G[Review locks, atomicity, balances, unused/refund behavior]
    D -- Yes --> H[Review created_at boundaries, live-value sources, warnings, and precision]
    E -- Yes --> I[Review typed scope, stale preview, loading/error, print]
    F --> J[Focused tests and regression suite]
    G --> J
    H --> J
    I --> J
    J --> K[Update docs/abms and task handoff]
```

## Uniform Report Printing

```mermaid
flowchart LR
    A[Open any ABMS report preview] --> B[Render shared 11 by 8.5 inch Letter landscape sheet]
    B --> C[Apply readable shared typography and a matching 0.30 inch preview inset]
    C --> D[Constrain tables and content to printable width]
    D --> E[Print with one printer-safe 0.30 inch page margin and no duplicate sheet padding]
    E --> F[Repeat table headers and preserve rows/totals]
    F --> G[Allow long groups to continue onto following Letter pages]
```

The shared Requisition Slip is the portrait exception: its screen preview is
8.5 by 11 inches, and print mode uses a 0.2-inch Letter page margin with no
duplicate inner print padding. Requisition Process and Budget Request Entry
both consume this same component.

## Auditable RS Printing

```mermaid
flowchart TD
    A[Open shared RS print preview] --> B[Choose paper preset]
    B --> C[Click Print]
    C --> D[Disable controls and show Preparing]
    D --> E[POST authenticated print event with UUID idempotency key]
    E --> F{Event recorded or replayed?}
    F -- No --> G[Keep preview and preset open; show retryable error]
    F -- Yes --> H[Refresh footer print date and time]
    H --> I[Open browser print dialog]
    I --> J[Later history request]
    J --> K[Load OwenIt audits and print events separately]
    K --> L[Map source-qualified history rows]
    L --> M[Merge with stable newest-first order]
```

Opening, closing, or changing paper creates no event. `Printed` records dialog initiation only. Print events remain outside OwenIt audits and therefore outside report and financial-history reconstruction.

## Uniform Report Excel Export

```mermaid
flowchart LR
    A[Open any ABMS report preview] --> B[Shared portal adds Export to Excel beside Print]
    B --> C[Read the active rendered preview only]
    C --> D[Preserve titles filters groups rows subtotals totals and footer]
    D --> E[Keep IDs codes requisition numbers labels and dates as text]
    D --> F[Write recognized money percentages and quantities as numeric cells]
    E --> G[Apply wrapping widths fills borders and hierarchy styles]
    F --> G
    G --> H[Generate Letter-landscape XLSX in an on-demand browser chunk]
    H --> I[Download descriptive filename without changing report data]
```

## Idempotent Financial Mutation

```mermaid
flowchart TD
    A[User starts one financial action] --> B[Frontend assigns UUID idempotency key]
    B --> C[Backend locks user plus action plus key]
    C --> D{Existing key?}
    D -- Completed same payload --> E[Replay original response]
    D -- Different payload --> F[Return 422]
    D -- In progress --> G[Return 409]
    D -- No --> H[Begin database transaction]
    H --> I[Lock financial rows and validate projected balances]
    I --> J{All checks pass?}
    J -- No --> K[Rollback mutation and key]
    J -- Yes --> L[Apply deltas and authoritative rollups]
    L --> M[Store completed response with 30-day expiry]
    M --> N[Commit once]
    N --> O[Return response]
```

## Finalized RS Numbering

```mermaid
flowchart TD
    A[Finalize locked requisition] --> B[Lock live items and recalculate header total]
    B --> C{Already has nonzero RS number?}
    C -- Yes --> D[Preserve current number]
    C -- No --> E[Lock calendar-year sequence row]
    E --> F[Increment last sequence]
    F --> G[Compose year plus six-digit sequence]
    D --> H[Save number total route status and timestamp]
    G --> H
    H --> I[Commit atomically]
```
