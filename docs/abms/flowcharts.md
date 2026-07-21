# ABMS Architecture and Workflow Flowcharts

Last verified: 2026-07-19

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
    FDB --> MEDIA[(Spatie media)]
    API --> FE
    FE --> PREVIEW[Screen preview, toast warnings, browser print]
```

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
    H --> I[Route through department, budget, logistics/cashier, accounting/BAO]
    I --> J{Unused or returned amount?}
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
```

## Historical Report Projection

```mermaid
flowchart TD
    A[Receive report filters] --> B[Authorize and validate dates, scope, and preview type]
    B --> C[Resolve current school-year proposals, typed units, and account IDs]
    C --> D[Build allocation keys: unit type plus unit ID plus child account ID]
    D --> E[Load current approved_total_cost baseline where applicable]
    D --> F[Load relevant audits inside and around the inclusive period]
    F --> G[Order by timestamp then global audit ID]
    G --> H[Project create, update delta, delete reversal, and restore reapply]
    H --> I{Historical evidence complete?}
    I -- No --> J[Keep supported best-effort deltas and add structured warnings]
    I -- Yes --> K[Mark data quality complete]
    E --> L[Aggregate allocation first]
    J --> L
    K --> L
    L --> M[Roll up by requested unit, account, division, or university hierarchy]
    M --> N[Backend computes subtotals, grand total, and reconciliation]
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

## Requested-Item Historical Snapshot

```mermaid
flowchart TD
    A[Load live numbered requisition] --> B{Current status valid and header not deleted?}
    B -- No --> X[Exclude]
    B -- Yes --> C[Find first audit assigning a nonzero requisition number]
    C --> D{Cutoff evidence available?}
    D -- No --> E[Apply documented fallback and warn, or exclude if unsafe]
    D -- Yes --> F[Replay header and item audits through cutoff]
    F --> G[Reconstruct payee, number, date, account, description, price, quantity, amount]
    E --> H[Apply school-year, inclusive date, account, unit, and payee filters]
    G --> H
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
    I --> J{Presentation}
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
    D -- Yes --> H[Review audit ordering, date boundaries, warnings, precision]
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
    B --> C[Constrain tables and content to printable width]
    C --> D[Print with 0.35 inch margins]
    D --> E[Repeat table headers and preserve rows/totals]
    E --> F[Allow long groups to continue onto following Letter pages]
```
