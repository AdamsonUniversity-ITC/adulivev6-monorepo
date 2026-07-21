### Task ID

ABMS-RPT-PRINT-20260719-001

### Feature / Context

Print previews for all ABMS report pages.

### Objective

Standardize every report preview and printed report to a readable US Letter landscape layout.

---

### Requirements

- Use a reusable print stylesheet across all report pages.
- Render screen previews at the Letter landscape aspect and maximum width.
- Print on Letter landscape with consistent margins and no horizontal clipping.
- Repeat table headers and preserve rows, headings, totals, and footers where practical.
- Remove misleading hardcoded page counts and allow long report groups to paginate.
- Do not change filters, APIs, calculations, or report data.

---

### Acceptance Criteria

- Every report declares Letter landscape printing with consistent margins.
- Preview sheets have consistent dimensions across all report pages.
- Wide tables fit within the printable page and multi-page reports retain readable headings.
- Long groups are not forced outside a page and hardcoded Page 1 of 1 labels are absent.
- Targeted lint and the ABMS production build pass.

---

### Inputs / Outputs

**Inputs:**

- Existing report preview content and browser Print action.

**Outputs:**

- Uniform Letter-sized screen previews and browser print output.

---

### Agent Assignment

- frontend_agent: Shared print stylesheet and report preview integration.
- qa_agent: Layout, pagination, lint, build, and browser print verification.
- reviewer_agent: Cross-report CSS isolation and overflow review.
- project_manager: Maintain the confirmed Letter landscape print contract.

---

### Dependencies

- Existing ABMS report preview components and browser print support.

---

### Edge Cases

- Wide detail tables, long descriptions, multi-page account groups, per-unit forced page breaks, empty reports, totals near page boundaries, and browser print scaling.

---

### Notes

- State: IN_REVIEW
- Browser-generated pagination replaces manual page numbering.
