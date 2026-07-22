# ABMS-RS-20260722-012 — New RS Stockable Items Pagination

### Task ID

ABMS-RS-20260722-012

### Feature / Context

ABMS Budget Request Entry New RS Stockable / Inventoriable Items reference panel.

### Objective

Allow requesters to browse every stockable item through alphabetically ordered 10-item pages while creating an RS.

---

### Requirements

- Keep the stockable-items reference panel read-only.
- Explicitly request `item_name` ascending order.
- Consume the Office Supplies API next and previous cursor values.
- Show Previous and Next controls with the current page number.
- Disable unavailable navigation and navigation during loading.
- Reset to page 1 when the search changes.
- Prevent stale requests from replacing newer search or page results.

---

### Acceptance Criteria

- The panel displays at most 10 stockable items on each page in alphabetical item-name order.
- Next loads the following page and Previous returns to the preceding page.
- Previous is disabled on page 1 and Next is disabled on the final page.
- Searching starts at page 1 and navigates only matching records.
- A slower outdated request cannot overwrite newer results.
- A failed request can be retried for the same search and page.
- Targeted lint and the ABMS production build succeed.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Optional item-name search and opaque Office Supplies cursor.

**Outputs:**

- One read-only, alphabetically ordered page of up to 10 stockable items.

---

### Agent Assignment

- frontend_agent: Implement cursor navigation, ordering, and stale-response protection.
- qa_agent: Verify search, navigation, final-page behavior, retry, lint, and build.
- reviewer_agent: Review cursor state and read-only behavior.
- project_manager: Maintain this task and ABMS continuity documentation.

---

### Dependencies

- Office Supplies cursor-paginated index endpoint.
- Budget Request Entry New RS modal and `SupplyListPanel`.

---

### Edge Cases

- Fewer than or exactly 10 items.
- Hundreds or thousands of items.
- Final partial page.
- No search matches.
- Search changed while another request is in flight.
- Failed request followed by Retry.

---

### Notes

- State: IN_REVIEW
- The existing backend endpoint already provides 10-row cursor pages.
- Verification: targeted ESLint, the ABMS production build, and `git diff --check` passed.
