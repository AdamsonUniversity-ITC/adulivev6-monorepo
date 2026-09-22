### Task ID

20260922-abms-manual-payroll-amounts

### Feature / Context

ABMS Administration payroll Cashier requisitions.

### Objective

Allow manual payroll amounts and pre-save unit-cost changes for the three current admin payroll payment forms.

---

### Requirements

- After Get payroll amount, offer manual entry whether db116 succeeds or fails.
- Validate a positive amount with no more than two decimals and show the charged amount and server-selected account.
- Resolve the configured account independently when the procedure fails.
- Keep procedure recheck for queried amounts; bypass only that comparison for explicitly manual amounts.
- Permit an admin to edit only the unit cost of the single generated item in an unsaved RS.
- Atomically adjust the allocation and proposal by the edit difference and reject insufficient balance.
- Keep fixed account, description, quantity, peso unit, payee, finalization, and discard refund.

---

### Acceptance Criteria

- All three forms can create a valid manual item after successful or failed query.
- Queried creation still rejects changed procedure results.
- Invalid values, missing/ambiguous account, insufficient balance, non-admin use, and post-save edits fail without balance changes.
- Increasing or decreasing draft cost adjusts balances; save uses the edited total and discard refunds the edited amount.

---

### Inputs / Outputs (if applicable)

**Inputs:** Form, period, typed unit, school year, chosen amount source and amount; later draft unit cost.

**Outputs:** Account preview, saved draft item, updated amount and account balance, or validation error.

---

### Agent Assignment

- frontend_agent: Payroll modal and draft RS amount editor.
- qa_agent: Finance regression cases and frontend verification.
- reviewer_agent: Authorization, precision, locking, and balance integrity.
- project_manager: Task record and continuity documentation.

---

### Dependencies

- Existing admin payroll creation, allocation resolution, RS finalization, and discard refund.

---

### Edge Cases

- db116 unavailable, changed queried result, invalid decimal, empty amount, duplicate item, saved RS, and insufficient allocation or proposal balance.

---

### Notes

- State: IN_REVIEW
- No override reason is required. Manual choice is available after every Get payroll amount attempt.
- Verification: changed-file frontend ESLint, ABMS production build, PHP syntax checks for changed finance files, and both repository diff checks passed. Repository-wide ABMS lint retains 78 existing errors and 10 warnings. Focused Laravel tests were added but could not run: host PHP is 8.3 while installed Composer dependencies require 8.4, and the local Docker daemon timed out. No authenticated Playwright environment was available.
- App TypeScript checking also retains existing project errors, including duplicate declarations in RSFormModal; no new diagnostics appeared on the modified payroll lines.
