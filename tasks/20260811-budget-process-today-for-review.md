# ABMS-RS-20260811-002 — Budget Process-Today For-Review Scope

### Task ID

ABMS-RS-20260811-002

### Feature / Context

ABMS Budget Requisition Process worklist filtering.

### Objective

Limit Budget's `RS to Process Today` pseudo-status to current For Review requisitions while continuing to exclude PNB Credit Card Payment.

---

### Requirements

- For `budget-access`, map `RS to Process Today` to `status = for review`.
- Continue including every RS type for Budget.
- Continue including null, blank, and non-PNB payment forms.
- Continue excluding trimmed, case-insensitive exact `PNB Credit Card Payment` values.
- Preserve Administration's existing status-wide `RS to Process Today` behavior.
- Preserve OR behavior when the pseudo-status is combined with ordinary status filters.
- Preserve other filter families, cursor pagination, and stable sorting.
- Add no schema, workflow, balance, item, or historical-data mutation.

---

### Acceptance Criteria

- Budget returns non-PNB For Review requisitions for Cashier, Logistics, and Stockroom RS types.
- Budget excludes non-PNB requisitions whose current status is not For Review.
- Budget excludes PNB Credit Card Payment at For Review, regardless of surrounding whitespace or casing.
- Administration continues returning non-PNB requisitions across statuses.
- Null and blank payment forms remain included when the role/status rules match.
- Combining Budget's pseudo-status with another ordinary status returns their union without weakening the pseudo-status's For Review predicate.
- Focused backend tests and formatting pass, or unrelated baseline failures are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Role, selected status labels, current requisition status, RS type, and payment form.

**Outputs:**

- A cursor-paginated worklist matching the role-specific process-today predicate.

---

### Agent Assignment

- backend_agent: Add the Budget-only For Review predicate without changing Administration or OR grouping.
- frontend_agent: Preserve the existing filter option and request contract.
- qa_agent: Cover role differences, RS types, status exclusions, PNB normalization, and OR behavior.
- reviewer_agent: Review query grouping, role isolation, and pagination compatibility.
- project_manager: Maintain the task record and ABMS continuity documentation.

---

### Dependencies

- Existing `RS to Process Today` pseudo-status token.
- Existing status/payment-form grouped query and cursor pagination.

---

### Edge Cases

- Null or whitespace-only payment forms.
- PNB payment form with mixed casing and surrounding whitespace.
- Non-For Review requisitions with otherwise qualifying payment forms.
- The pseudo-status is combined with another ordinary status.
- A non-Budget role submits the shared pseudo-status token.

---

### Notes

- State: IN_REVIEW
- No frontend contract or label change is required.
- No migration or deployment-time data update is required.
- Verification: the focused role/status/payment-form case passes with 25 assertions; the complete adjacent requisition suite passes with 47 tests and 325 assertions; PHP syntax checks and Laravel Pint pass for the changed backend files.
- Authenticated browser smoke testing was not run because no deployed-like authenticated environment was provided.
