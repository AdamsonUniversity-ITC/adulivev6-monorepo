# ABMS-RS-20260722-015 — RS Account Hierarchy Labels

### Task ID

ABMS-RS-20260722-015

### Feature / Context

ABMS Budget Request Entry RS creation Select Account modal.

### Objective

Display each selectable account using its main-account and sub-account code and name hierarchy.

---

### Requirements

- Add separate main-account code and name fields to creation-mode account results.
- Display account code as `Main Account Code - Sub Account Code`.
- Display account name as `Main Account Name - Sub Account Name`.
- Fall back to the existing child code/name if parent metadata is unavailable.
- Match account search against both child and main account code/name.
- Preserve the selected child `account_id`, child code, parent ID, and balance.
- Do not replace persistence identity with display labels.
- Preserve pagination and typed-unit/school-year scoping.

---

### Acceptance Criteria

- A normal child account row shows both its main and sub code separated by ` - `.
- The same row shows both its main and sub name separated by ` - `.
- Searching a main account code or name returns its eligible child rows.
- Selecting the combined row still sends the child account ID and child code when saving an RS item.
- Missing or soft-deleted parent display data does not prevent selection; the child label is shown as fallback.
- Duplicate account codes do not affect account identity.
- Existing 10-row pagination and alphabetical ordering continue to operate.
- Targeted frontend lint/build and backend syntax validation succeed.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Eligible child allocation account, its parent account ID, and optional search.

**Outputs:**

- Separate parent metadata plus combined hierarchy labels in the picker.

---

### Agent Assignment

- frontend_agent: Compose hierarchy labels without changing selection payloads.
- backend_agent: Enrich paginated account rows and parent-aware search.
- qa_agent: Verify display, search, fallback, pagination, selection identity, lint, and build.
- reviewer_agent: Review ID/code separation, soft-deleted parent handling, and query count.
- project_manager: Maintain this task record and continuity documentation.

---

### Dependencies

- `accounts.parent_id` hierarchy.
- RS creation account cursor endpoint.
- `SelectAccountModal` and `AddItemModal` selection handler.

---

### Edge Cases

- Missing or soft-deleted parent account.
- Duplicate main or sub account codes/names.
- Search matching only the main account.
- Same child label under different main accounts.
- Final partial cursor page.

---

### Notes

- State: IN_REVIEW
- Combined labels are display-only; persisted identity remains the child `accounts.id`.
- Verification: targeted frontend ESLint, the ABMS production build, backend PHP syntax validation, and diff checks passed. Targeted Pint continues to report pre-existing whole-controller formatting differences.
