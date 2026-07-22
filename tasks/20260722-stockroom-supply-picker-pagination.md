# ABMS-RS-20260722-011 — Stockroom Supply Picker Pagination

### Task ID

ABMS-RS-20260722-011

### Feature / Context

ABMS Budget Request Entry Stockroom Office Supplies picker.

### Objective

Allow requesters to navigate every alphabetically ordered Office Supply through 10-item pages.

---

### Requirements

- Keep the picker page size at 10 supplies.
- Explicitly request `item_name` ascending order.
- Consume the API's next and previous cursor values.
- Provide Previous and Next page controls with a current page indicator.
- Disable navigation when its cursor is unavailable or a request is loading.
- Reset pagination to page 1 whenever item-name search changes.
- Prevent stale search/page responses from replacing newer results.
- Preserve row selection and Stockroom item population behavior.

---

### Acceptance Criteria

- The first picker page shows at most 10 supplies ordered alphabetically by item name.
- Next opens the following 10 alphabetically ordered supplies when available.
- Previous returns to the preceding page when available.
- Previous is disabled on page 1 and Next is disabled on the final page.
- Searching by partial item name starts at page 1 and paginates only matching supplies.
- Rapid search changes cannot display an older request's results.
- Selecting an item from any page fills the Stockroom item fields.
- Targeted lint and the ABMS production build succeed.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Optional item-name search and opaque next/previous cursor values.

**Outputs:**

- One alphabetically ordered page of up to 10 selectable Office Supplies.

---

### Agent Assignment

- frontend_agent: Add cursor navigation and stale-response protection to the picker.
- qa_agent: Verify ordering, forward/back navigation, search reset, final page, lint, and build.
- reviewer_agent: Review cursor handling and selection-state preservation.
- project_manager: Maintain this task record and continuity documentation.

---

### Dependencies

- Office Supplies cursor-paginated index endpoint.
- Budget Request Entry `SelectSupplyModal` and Stockroom item selection flow.

---

### Edge Cases

- Fewer than 10 supplies.
- Exactly 10 supplies.
- Hundreds or thousands of supplies.
- Final partial page.
- No search matches.
- Search changed while a page request is in flight.
- Failed page request followed by Retry.

---

### Notes

- State: IN_REVIEW
- The backend already supplies stable `item_name ASC, id ASC` cursor pages; no backend mutation is required.
- Verification: targeted ESLint, the ABMS production build, and diff checks passed.
