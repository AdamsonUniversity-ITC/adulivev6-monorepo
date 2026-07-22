# ABMS-ACCESS-20260722-008 — User Access Name Search and Ordering

### Task ID

ABMS-ACCESS-20260722-008

### Feature / Context

ABMS User Department Access list and API pagination.

### Objective

Allow administrators to search access users by displayed name and order the complete result by name.

---

### Requirements

- Add a debounced name-search field to the User Access List card.
- Add Name A–Z and Name Z–A ordering options.
- Apply search and ordering before pagination so results remain globally consistent.
- Use employee number as the stable tie-breaker for equal names.
- Reset pagination whenever search or order changes.
- Preserve existing row editing, assignment display, and load-more behavior.

---

### Acceptance Criteria

- The default list is ordered by displayed name A–Z.
- A partial, case-insensitive name query returns matching access users.
- Z–A reverses name order across the complete filtered result, not only the loaded page.
- Loading more appends the next page using the active search and order.
- Clearing search restores all access users in the selected order.
- Equal names have deterministic employee-number ordering.
- Invalid order values fall back to ascending.
- No matching names displays the existing empty state.
- Targeted lint, the ABMS production build, and backend syntax validation succeed.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Optional `search`, `order`, and cursor query parameters.

**Outputs:**

- Filtered, name-ordered, cursor-paginated access-user records and total count.

---

### Agent Assignment

- frontend_agent: Add search/order controls and preserve active filters during pagination.
- qa_agent: Verify search, both directions, pagination, empty results, lint, and build.
- reviewer_agent: Review deterministic pagination and cross-database user-name handling.
- project_manager: Maintain this task record and continuity documentation.

---

### Dependencies

- User Department Access index endpoint.
- Teacher directory names and permission/general-permission user IDs.

---

### Edge Cases

- Blank or whitespace-only search.
- Mixed-case partial search.
- Duplicate displayed names.
- Access user missing from the teacher directory.
- Invalid order or cursor.
- Search/order changes while a previous request is pending.

---

### Notes

- State: IN_REVIEW
- Search is scoped to the displayed full name; missing teacher records display and search using employee number.
- Verification: targeted frontend ESLint, the ABMS production build, frontend diff checks, backend PHP syntax validation, and targeted Pint checks passed.
