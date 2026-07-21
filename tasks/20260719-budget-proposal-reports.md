### Task ID

ABMS-BPR-20260719-001

### Feature / Context

ABMS Budget Proposal Reports in the frontend and `finance_service`.

### Objective

Provide a current Budget Proposal with Details and Status report grouped by account for one typed Department/Section and school year.

---

### Requirements

- Add searchable School Year, typed Department/Section, optional Main Account, and optional Sub-Account filters.
- Source school years and report rows from live budget proposal records.
- Group live items by root account and allocated child account.
- Return description, quantity, proposed amount, approved amount, current status, status update time, and remarks.
- Calculate all totals from live items and format money as fixed two-decimal strings.
- Preserve unresolved allocation values under Unmapped Account with warnings.
- Require Administration or Budget access, print the user's full name, and surface warnings as toasts.
- Keep every unimplemented legacy report option visible but disabled with Coming soon treatment.
- Keep the feature read-only with no migration or proposal workflow changes.

---

### Acceptance Criteria

- Equal Department and Section numeric IDs remain distinct.
- Blank, Main-only, and Main/Sub-Account filters return the correct item scope.
- Soft-deleted proposal data is excluded and empty scopes return zero totals.
- Status labels, localized timestamps, remarks, subtotals, and grand totals match live items.
- Invalid units/accounts/options and unauthorized requests fail without opening stale preview data.
- Inactive referenced units remain selectable and unresolved accounts remain visible with warnings.

---

### Inputs / Outputs

**Inputs:**

- Filter-data and preview GET requests under `/api/abms/budget-proposal-reports`.

**Outputs:**

- Typed report metadata, root/child/item groups, backend totals, printed user, and structured data quality.

---

### Agent Assignment

- frontend_agent: Page, filters, preview, route/sidebar, warnings, and print behavior.
- qa_agent: Scope, status, totals, validation, authorization, lint, build, and regression tests.
- reviewer_agent: Query scope, account mapping, precision, authorization, and read-only behavior.
- project_manager: Preserve the confirmed current-snapshot and future-option rules.

---

### Dependencies

- Existing proposal header, allocation, item, account, organization, permission, and employee directory models.
- Existing report filters, loading/error handling, toast, and print conventions.

---

### Edge Cases

- Equal typed unit IDs, inactive units, null approved amount, unknown status, archived or missing accounts, deleted records, no items, and mismatched account filters.

---

### Notes

- State: IN_REVIEW
- Status timestamps use current item `updated_at`, not audit reconstruction.
