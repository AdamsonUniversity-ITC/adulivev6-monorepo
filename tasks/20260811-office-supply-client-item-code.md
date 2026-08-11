# ABMS-OFFICE-SUPPLY-20260811-001 — Client-Provided Item Codes

### Task ID

ABMS-OFFICE-SUPPLY-20260811-001

### Feature / Context

ABMS Office Supplies CRUD and finance-service office-supply API.

### Objective

Replace generated Office Supply item codes with required client-provided string codes that remain unique across all Office Supply records.

---

### Requirements

- Add a required text Item Code field to both Add Item and Edit Item dialogs.
- Populate the existing item code when editing and permit an authorized user to change it.
- Trim leading and trailing whitespace before persistence.
- Require a non-empty string no longer than 255 characters.
- Enforce uniqueness in backend validation while allowing an update to retain its current code.
- Treat soft-deleted item codes as reserved because the database unique constraint covers every row.
- Preserve the existing database unique constraint as the concurrency backstop.
- Remove automatic `OS-xxxxx` code generation.
- Surface field-specific backend validation errors in the form.
- Preserve existing name, unit measurement, unit cost, listing, viewing, and deletion behavior.
- Add no database migration or historical-data rewrite.

---

### Acceptance Criteria

- Creating an item saves the exact trimmed client-provided code.
- Missing or whitespace-only item codes receive `422` and a field error.
- A duplicate live or soft-deleted item code receives `422` and no write occurs.
- Editing can retain the same code or save an unused code.
- Editing cannot use another item's code.
- Unauthorized create/update requests remain forbidden.
- Add and Edit dialogs show editable string inputs for Item Code.
- Frontend build, focused lint, and backend feature tests pass or baseline failures are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Client-provided item code, item name, unit measurement, and unit cost.

**Outputs:**

- Created or updated Office Supply with its validated unique item code, or structured validation errors.

---

### Agent Assignment

- frontend_agent: Implement editable item-code fields and validation-error display.
- qa_agent: Verify create/update, duplicate handling, permissions, lint, build, and backend tests.
- reviewer_agent: Review uniqueness, soft-delete semantics, authorization, and compatibility.
- project_manager: Maintain task and ABMS continuity documentation.

---

### Dependencies

- Existing `office_supplies.item_code` string column and unique index.
- Existing Office Supplies CRUD API and Logistics authorization.

---

### Edge Cases

- Whitespace-only and whitespace-padded codes.
- Duplicate code belongs to a soft-deleted row.
- Edit submits the record's unchanged code.
- Concurrent duplicate create attempts rely on the database unique index.
- Codes may contain letters, digits, spaces, punctuation, and client formatting.

---

### Notes

- State: IN_REVIEW
- Existing codes and soft-deleted rows are preserved.
- No migration or backfill is required.
- Verification: focused frontend ESLint passed for `OfficeSupplies.tsx`.
- Verification: `pnpm --filter abms build` passed with only the existing large-chunk advisory.
- Verification: isolated PHP 8.4 Docker feature test passed, 4 tests and 23 assertions.
- Verification: frontend and backend `git diff --check` passed.
