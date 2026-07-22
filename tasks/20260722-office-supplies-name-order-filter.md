# ABMS-SUP-20260722-005 — Office Supplies Name Ordering and Filter

### Task ID

ABMS-SUP-20260722-005

### Feature / Context

ABMS Office Supplies list, filtering, sorting, and cursor pagination.

### Objective

Order office-supply rows alphabetically by item name by default and provide item-name filtering and selectable name/cost sorting.

---

### Requirements

- Default Office Supplies ordering to `item_name` ascending.
- Apply ordering in the backend query before cursor pagination.
- Filter the list by partial item-name text.
- Provide a sort-field control for Item Name and Unit Cost.
- Provide ascending/descending direction for either sort field.
- Use a stable `id` tie-breaker so cursor pagination is deterministic.
- Reject unsupported sort fields by falling back to Item Name.

---

### Acceptance Criteria

- The initial page and subsequent cursor pages are globally ordered A–Z by item name.
- Equal item names are ordered deterministically by ascending ID.
- Entering partial item-name text returns matching live supplies case-insensitively under the database collation.
- Clearing the filter restores the full alphabetically ordered list.
- Selecting Unit Cost supports Low-to-High and High-to-Low ordering.
- Selecting Item Name supports A–Z and Z–A ordering.
- Unsupported `sort_by` and `sort` inputs safely fall back to `item_name` and ascending behavior respectively.
- The ABMS production build succeeds.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Optional `search`, `sort_by`, `sort`, and cursor query parameters.

**Outputs:**

- Filtered, deterministically ordered cursor-paginated office-supply rows.

---

### Agent Assignment

- frontend_agent: Add the item-name filter and sort controls/defaults.
- qa_agent: Verify filtering, both sort fields/directions, pagination, build, and invalid inputs.
- reviewer_agent: Review query safety and cursor-order stability.
- project_manager: Maintain this task record and continuity documentation.

---

### Dependencies

- `OfficeSupplies.tsx` list state and cursor pagination.
- `OfficeSupplyService::paginate` backend query.

---

### Edge Cases

- Blank or whitespace-only item-name filter.
- Duplicate item names.
- Mixed-case item names.
- Unsupported sort field or direction.
- Filter or sort changes while viewing a later cursor page.
- No matching supplies.

---

### Notes

- State: IN_REVIEW
- No inventory records or prices are mutated by this change.
- Verification: the Office Supplies page passed targeted ESLint and the ABMS production build. `OfficeSupplyService.php` passed PHP syntax and targeted Pint checks.
