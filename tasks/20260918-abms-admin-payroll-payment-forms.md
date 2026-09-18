# ABMS-RS-20260918-001 — Administration Payroll Payment Forms

### Task ID

ABMS-RS-20260918-001

### Feature / Context

ABMS Budget Request Entry, Cash Valued Items requisition slips.

### Objective

Allow Administration to create payroll based requisition items from db116 procedure results while preserving draft balance and refund behavior.

---

### Requirements

- Show Gross Income Employees, Employer Share, and Allowance of SA only to `admin-access` users.
- Query `spBudgetPayroll` gross, `spBudgetPayroll` ec, and `spBudgetOZPayroll` gross respectively on `db116_adamson`.
- Pass month name, year, section flag `0` or department flag `1`, and typed unit ID; sum the selected column across rows.
- Preview the amount, require confirmation and a scoped account, then create one item with quantity 1, UOM peso, and unit cost equal to the authoritative payroll amount.
- Require the ordinary RS save to finalize; discard refunds the item.
- Make the Add New Item upper-right close control visible and labeled.

---

### Acceptance Criteria

- Admin sees all three forms and can create the correct payroll item in an unsaved Cashier RS.
- Non-admin cannot see the forms or use payroll preview and creation endpoints.
- Invalid or empty payroll results, insufficient balance, duplicate item, and changed preview amount do not deduct funds.
- Saving the RS follows the existing Cashier process; discarding it restores the allocation and proposal balances.

---

### Inputs / Outputs (if applicable)

**Inputs:** Payment form, month, year, typed department/section, account ID, confirmed amount.

**Outputs:** Fixed two-decimal payroll preview or persisted draft item; validation error on failure.

---

### Agent Assignment

- frontend_agent: Payment-form, payroll, account-selection, RS-form, and close-control UI.
- qa_agent: Focused permission, procedure, balance, save, and discard validation.
- reviewer_agent: Authorization, typed identity, precision, and balance integrity review.
- project_manager: This task record and ABMS continuity documentation.

---

### Dependencies

- Existing Budget Request Entry draft, account allocation, save, and discard workflow.
- db116 stored procedures and `admin-access` permission service.

---

### Edge Cases

- Invalid month or year, absent result rows, malformed or negative values, amount changed after preview.
- No scoped allocation, multiple allocations, insufficient balance, duplicate payroll item, non-admin API calls.

---

### Notes

- State: IN_REVIEW
- The second form is Employer Share and reads `ec`; multiple rows are summed.
- The server re-queries before writing and compares the result with the confirmed preview.
- No migration or change to existing payment forms is required.
- Verification: 70 focused payroll, permission, deduction/refund, and requisition regression tests passed (464 assertions) in the PHP 8.4 finance container. After removing an unsupported Laravel validation rule, the focused payroll preview and permission tests passed again (8 tests, 36 assertions), including missing and conflicting typed units. The ABMS production build and changed-file ESLint pass. ABMS-wide lint and TypeScript checks retain unrelated existing failures. No authenticated ABMS Playwright suite exists in this workspace.
- Live db116 procedure signatures/results were not queried from this development environment; verify month-name parameter and result columns before production rollout. Deploy finance API before the frontend.
- Follow-up: the shared finance Axios interceptor now recognizes `/abms/budget-request-entry/payroll-items` as a financial mutation and supplies its required UUID `Idempotency-Key` header. The ABMS production build passed after this correction.
- Follow-up: db116 procedure calls now skip SQL Server row-count result sets with no fields and read the first result set containing the required `gross` or `ec` column. The focused backend regression set passed (71 tests, 498 assertions); live db116 results remain unverified from this development environment.
