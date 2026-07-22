# ABMS-UI-20260722-013 — ABMS Money Display Formatting

### Task ID

ABMS-UI-20260722-013

### Feature / Context

All ABMS pages, modal displays, report previews, and printed reports.

### Objective

Display every monetary amount with thousands separators and exactly two decimal places.

---

### Requirements

- Audit ABMS transaction, administration, dashboard, and report monetary displays.
- Add one shared formatter for report money strings and numeric values.
- Format all eight report families' monetary cells, subtotals, and grand totals.
- Preserve existing currency symbols where the page already displays them.
- Do not insert commas into numeric form controls or API request values.
- Preserve backend fixed-decimal response contracts and financial calculations.
- Gracefully retain a nonnumeric legacy display value rather than converting it to zero.

---

### Acceptance Criteria

- `1000` and `1000.00` display as `1,000.00` in every monetary report cell.
- `1000000.5` displays as `1,000,000.50`.
- Unit cost, item amount, approved/proposed budget, adjustments, released, unused, balance, returned, liquidated, subtotals, and grand totals use the same separator/precision rule.
- Transaction and administration displays continue showing comma-separated two-decimal amounts.
- Numeric entry fields remain editable as valid numeric inputs without display commas in submitted values.
- Invalid legacy display text is retained and does not produce `NaN`.
- Targeted lint and the ABMS production build succeed.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Monetary values supplied as numbers or fixed-decimal strings.

**Outputs:**

- Locale-formatted display strings with comma grouping and two decimal places.

---

### Agent Assignment

- frontend_agent: Audit displays and apply the shared formatter.
- qa_agent: Verify small, large, zero, decimal, negative, and invalid legacy values across every report family and representative pages.
- reviewer_agent: Review display-only scope and confirm calculations/API values are unchanged.
- project_manager: Maintain this task record and UI/print documentation.

---

### Dependencies

- Eight ABMS report preview components.
- Existing page-specific currency formatters in transaction and administration views.
- Backend fixed-two-decimal report contracts.

---

### Edge Cases

- Zero and negative monetary values.
- Million-level values.
- Already comma-formatted strings.
- Values prefixed with `PHP` or `₱`.
- Null, blank, or nonnumeric legacy display values.
- Printable reports and on-screen previews.

---

### Notes

- State: IN_REVIEW
- This change is presentation-only and does not recalculate or mutate financial data.
- Verification: targeted ESLint passed across all eight report components and the shared formatter; the ABMS production build and diff checks passed. A follow-up source audit found no remaining direct monetary report-cell rendering outside the formatter.
