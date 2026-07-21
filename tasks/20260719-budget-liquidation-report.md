### Task ID

ABMS-BLR-20260719-001

### Feature / Context

ABMS Budget Liquidation reporting in the frontend and `finance_service`.

### Objective

Provide typed-unit liquidation summaries, detailed requisition items, and summary-per-account rollups for pending and completed liquidation records.

---

### Requirements

- Provide School Year, merged Department/Section, all-units, liquidation status, Summary/Detailed, Summary per Department and Account, and inclusive R.S. Date filters.
- Use `budget_request_entry.created_at` as R.S. Date.
- Include live numbered requisitions, excluding current cancelled or disapproved statuses.
- Require Administration or Budget access.
- Group all-unit output by typed organizational identity and print each unit on a new page.
- Return standard Summary requisition rows, Detailed live item rows, or Summary-per-Account root/child totals.
- Use current account IDs and hierarchy; preserve ambiguous legacy amounts under Unmapped Account with warnings.
- Treat saved header liquidation fields as authoritative and warn when they do not reconcile with current live items.
- Return fixed two-decimal money strings and backend-calculated totals.
- Surface data-quality notices as toasts and print the authenticated user's full name.
- Keep the implementation read-only with no migration or transaction workflow changes.

---

### Acceptance Criteria

- Department and Section records sharing a numeric ID remain distinct.
- Both scope returns a requisition matching both flags once.
- Inclusive date and status scopes return only qualifying requisitions.
- Pending rows use unavailable metadata and zero returned/liquidated totals.
- Detailed account codes and all unit/account/grand totals reconcile with the applicable presentation.
- Invalid filters and unauthorized requests fail without opening stale preview data.
- Inactive referenced units remain selectable and visible with badges.
- Unmapped accounts and reconciliation differences produce toast-visible structured warnings.

---

### Inputs / Outputs

**Inputs:**

- `GET /api/abms/budget-liquidation` for filter data.
- `GET /api/abms/budget-liquidation/preview` with school year, typed/all-unit scope, liquidation scope, preview flags, and inclusive dates.

**Outputs:**

- Report metadata, stable typed `unit_groups`, requisition/item/account presentations, backend totals, and structured `data_quality`.

---

### Agent Assignment

- frontend_agent: Page, shared filters, preview layouts, route/sidebar, toast, and print behavior.
- qa_agent: Validation, scopes, totals, warnings, access, lint, build, and regression verification.
- reviewer_agent: Account resolution, authorization, query behavior, reconciliation, and precision review.
- project_manager: Preserve the confirmed status, date, and presentation definitions.

---

### Dependencies

- Existing requisition/liquidation header fields and current live item relationships.
- Current typed organization directory and account hierarchy.
- Existing report authorization, shared filters, printed-user lookup, and warning conventions.

---

### Edge Cases

- Equal numeric Department/Section IDs.
- Requisition matching both liquidation flags.
- Inactive or missing directory units.
- Legacy null account ID with unique, ambiguous, or missing allocation mapping.
- Header/item total or return mismatch.
- Same-day date range, empty report, invalid boolean/date/preview combinations, and permission denial.

---

### Notes

- State: IN_REVIEW
- Summary per Account reports original live item Total Amount only.
- Normal browser print pagination replaces the legacy manual unit list and page count.
