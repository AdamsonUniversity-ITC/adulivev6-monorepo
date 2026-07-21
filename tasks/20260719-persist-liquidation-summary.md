# ABMS-LIQ-20260719-001 — Persist Liquidation Summary

### Task ID

ABMS-LIQ-20260719-001

### Feature / Context

ABMS liquidation submission and requisition balance processing in `finance_service`.

### Objective

Persist the latest liquidation totals, authenticated saver, save time, and liquidation state whenever an authorized user saves returned amounts.

---

### Requirements

- Use the existing pending `DECIMAL(15,2)` liquidation columns on `budget_request_entry`.
- Permit the save action only for authenticated users with `admin-access` or `budget-access`.
- Set `returned_amount` to the sum of submitted returns for every live requisition item.
- Set `liquidated_amount` to the sum of live item total costs minus the returned total.
- Set `liquidated_by` to the authenticated username, `liquidation_date` to the application-timezone save time, and `is_liquidated` to true.
- Overwrite the header summary on every successful save.
- Keep item, allocation, proposal, and header changes in the existing locked transaction.
- Keep approval separate and preserve the frontend API contract.
- Update durable ABMS architecture and business-rule documentation.

---

### Acceptance Criteria

- Administration and Budget users can save liquidation summaries.
- Other authenticated users receive `403` without financial or header changes.
- Multi-item, zero-return, full-return, two-decimal, and values above one million calculate correctly.
- Repeated saves apply only the balance delta and replace the header summary, username, and date.
- Invalid items, excessive returns, missing allocations, and insufficient balances return `422` without partial changes.
- Saving does not approve the entry or remove it from the liquidation queue.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Existing `PATCH /api/abms/liquidation-submission/rs/{id}/returned-amounts` payload containing every live item ID and returned amount.
- Authenticated user's username and general permissions.

**Outputs:**

- Existing API response containing the saved per-item returned amounts.
- Updated item, allocation, proposal, and requisition-header liquidation values.

---

### Agent Assignment

- backend_agent: Implement model, authorization, transactional summary persistence, and feature tests.
- frontend_agent: No UI or request-contract changes required.
- qa_agent: Verify calculations, authorization, rollback, repeat saves, migration status, and regression suite.
- reviewer_agent: Review transaction atomicity, money precision, authorization, audit behavior, and balance integrity.
- project_manager: Maintain the confirmed latest-save and separate-approval rules.

---

### Dependencies

- Pending `2026_07_19_030331_alter_budget_request_entry` migration with `DECIMAL(15,2)` amount columns.
- Existing returned-amount balance transaction and `PermissionAccessService`.

---

### Edge Cases

- Multiple items sharing an allocation.
- A repeated save reduces a previously returned amount.
- Returned amount is zero or equals the full item total.
- One validation or account-resolution failure occurs after other items were inspected.
- Header totals exceed one million.
- Authenticated user has department access but no Administration or Budget general permission.

---

### Notes

- State: IN_REVIEW
- Only live, non-soft-deleted items contribute.
- `liquidated_by` stores username rather than full name.
