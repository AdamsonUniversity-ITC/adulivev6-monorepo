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
- Let the Office Supplies list search match either the client-provided item code or item name.
- Add Item Code to the supported frontend and backend sort fields with ascending and descending directions.
- Preserve stable cursor pagination by retaining the record ID as the secondary sort key.
- Add no database migration or historical-data rewrite.

---

### Acceptance Criteria

- Creating an item saves the exact trimmed client-provided code.
- Missing or whitespace-only item codes receive `422` and a field error.
- A duplicate live or soft-deleted item code receives `422` and no write occurs.
- Editing can retain the same code or save an unused code.
- Editing cannot use another item's code.
- Office Supply create, update, and delete require `stockroom-access`; Logistics-only and otherwise unauthorized users remain forbidden.
- Add and Edit dialogs show editable string inputs for Item Code.
- Searching by a full or partial item code returns matching supplies, while item-name search remains supported.
- Selecting Item Code sorting returns codes in ascending or descending database order with stable ID tie-breaking.
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
- Listing follow-up: search now covers Item Code and Item Name, and Item Code is available as an A–Z/Z–A sort option.
- Listing follow-up verification: the focused frontend ESLint check and ABMS production build passed; the PHP 8.4 Docker feature suite passed with 6 tests and 37 assertions; Laravel Pint passed for both changed backend files.
- Authorization correction: Office Supplies ownership follows the Stockroom page route and sidebar. Backend create, update, and delete now require `stockroom-access` and return `Stockroom access is required.` when forbidden; authenticated listing remains shared with requisition item pickers.
- Authorization verification: the PHP 8.4 Docker feature suite passed with 7 tests and 44 assertions, targeted Office Supplies frontend ESLint passed, and Laravel Pint passed for the corrected controller and tests.
- Default-sort follow-up: the Office Supplies page and API now default to Item Code ascending with the stable ID tie-breaker; established requisition item pickers continue explicitly requesting Item Name order.
- Default-sort verification: the focused PHP 8.4 Docker suite passed with 8 tests and 48 assertions, targeted frontend ESLint passed, and the ABMS production build passed with only its established large-chunk advisory.
