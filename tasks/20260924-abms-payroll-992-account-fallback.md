### Task ID

20260924-abms-payroll-992-account-fallback

### Feature / Context

ABMS Budget Request Entry, Administration payroll Cashier requisitions.

### Objective

Allow Employee's Payroll and Employer Share to use an eligible child account under parent code 992 when the default 992-5 allocation cannot fund the requisition.

---

### Requirements

- Keep 992-5 automatic when its unique live allocation covers the amount for the RS's exact school year and typed department or section.
- When that default allocation is missing or insufficient, show all active direct children of a live parent account with code 992.
- Display balances and availability reasons; allow selection only for one live scoped allocation with enough account and proposal balance.
- Identify the selected account by `accounts.id`, including duplicate parent and child codes.
- Recheck the default and selected account under transaction locks before deduction; reject forged or stale choices without mutation.
- Apply draft amount edits and discard refunds to the item's stored account ID.
- Keep Allowance of SA on its fixed 979-3 account and keep existing saved records unchanged.

---

### Acceptance Criteria

- Both 992 payroll forms use the default account when funded and an explicitly selected eligible child when it is missing or insufficient.
- Preview returns the payroll amount and read-only account choices when fallback is needed; manual entry receives the same choices without db116.
- Unallocated, ambiguous, wrong typed unit or school year, deleted, wrong-parent, and insufficient accounts cannot be selected.
- Non-admin, forged, stale-balance, and ambiguous-default requests fail without changing balances.
- Draft edits and discard refunds use the selected account; RS save preserves its charged item.
- Allowance of SA retains its existing account and rejects client account IDs.

---

### Inputs / Outputs (if applicable)

**Inputs:** Payment form, period, amount or manual amount, RS typed unit and school year, optional fallback account ID.

**Outputs:** Payroll amount and account availability list, or a persisted item charged to the validated account ID.

---

### Agent Assignment

- frontend_agent: Payroll modal account list, availability, and selection.
- qa_agent: Fallback, permission, balance, save, edit, and refund regression checks.
- reviewer_agent: Typed scope, duplicate codes, authorization, precision, and transaction integrity.
- project_manager: Task record and ABMS continuity documentation.

---

### Dependencies

- Existing admin payroll preview and manual amount workflows.
- Exact school-year typed-unit allocation and existing idempotent item creation.

---

### Edge Cases

- Missing or zero default allocation, insufficient account or proposal balance, changed amount, duplicate account codes, ambiguous allocation, stale selection, deleted account, and department/section ID collision.

---

### Notes

- State: IN_REVIEW
- No migration or backfill; account preview remains read-only.
- Deploy the compatible finance API before the ABMS frontend.
- UI follow-up: wait for payroll preview/account lookup to finish before showing fallback availability, so a funded 992-5 does not briefly appear unallocated.
- Verified: finance feature regressions passed (76 tests, 674 assertions); changed-file ESLint and ABMS build passed. Full ABMS lint reports 78 existing errors outside the changed files; the TypeScript project check reports existing diagnostics, with none in the changed payroll modal. Authenticated browser and live db116 integration were unavailable locally.
