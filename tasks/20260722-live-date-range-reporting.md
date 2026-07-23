# ABMS-REPORT-20260722-013 — Live Date-Range Reporting

### Task ID

ABMS-REPORT-20260722-013

### Feature / Context

All ABMS reports that accept From and To dates.

### Objective

Replace audit-reconstructed historical report values with current stored values for entries whose creation dates fall inside the selected range.

---

### Requirements

- Apply the rule to every report that accepts a date range.
- Select proposal, adjustment, requisition, and liquidation entries through inclusive application-timezone `created_at` boundaries.
- Calculate report rows and balances from the latest values stored in the applicable entry, item, allocation, and proposal fields.
- Allow later edits to an included entry or its items to change results for an earlier date range.
- Do not query OwenIt audits or reconstruct historical snapshots for date-ranged report calculations.
- Preserve school-year, typed-unit, account, status, authorization, grouping, fixed-decimal money, preview, and print contracts unless directly affected by the source-of-truth change.
- Keep soft-deleted rows excluded unless an existing live-report contract explicitly requires otherwise.
- Update ABMS documentation to replace the historical-audit reporting invariant.

---

### Acceptance Criteria

- An entry is included when its current `created_at` is inside the inclusive From/To dates and excluded otherwise.
- An included entry updated after To remains included and reports its latest stored values.
- An entry created outside the range is not included merely because it was updated inside the range.
- Date-ranged report services do not query the audits table for amounts, snapshots, dates, or lifecycle reconstruction.
- Requested-item reports use the current requisition number, payee, item description, unit cost, quantity, and total cost.
- Adjustment reports show each current live adjustment once using its current additional and deduction values.
- Budget-performance reports use current stored approved, released, unused, balance, adjustment, and requisition values for entries created in the selected range.
- Cancelled, disapproved, draft, soft-deleted, unauthorized, invalid-scope, and unmapped records retain their documented exclusion or warning behavior.
- Focused backend tests and applicable frontend validation succeed.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- School year, inclusive From/To dates, typed-unit scope, account scope, and preview type.

**Outputs:**

- Current live report values for qualifying entries created within the selected date range.

---

### Agent Assignment

- frontend_agent: Preserve report request and rendering contracts; adjust warning handling only if the backend contract changes.
- qa_agent: Test date inclusion, post-period edits, exclusions, totals, and regression contracts.
- reviewer_agent: Review financial semantics, query scope, identity, precision, and authorization.
- project_manager: Maintain requirements and continuity documentation.

---

### Dependencies

- Existing report controllers, validation requests, services, and frontend previews.
- Current stored proposal, allocation, adjustment, requisition, item, and liquidation columns.

---

### Edge Cases

- Entry created exactly at the start or end of an inclusive date.
- Entry updated after the selected To date.
- Entry created outside the range but updated within it.
- Soft-deleted entry or item.
- Cancelled, disapproved, or unnumbered requisition.
- Current account or organizational relationship missing or ambiguous.
- Duplicate proposal allocation for the same typed unit and child account.
- Zero and null monetary values.
- Application timezone differs from the database/session timezone.

---

### Notes

- State: IN_REVIEW
- The requester explicitly confirmed that this live-value rule applies to every date-ranged report.
- Verification: all 45 focused report tests passed with 505 assertions; Laravel Pint passed after formatting; the ABMS production build passed; backend and frontend `git diff --check` passed.
- Full backend regression result: 76 tests passed and one unrelated `UserDepartmentAccessTest` ordering assertion failed because the endpoint now defaults to displayed-name ordering while that older test still expects employee-number order.
- Full frontend lint remains blocked by 146 existing errors and 11 warnings across unrelated ABMS files; no frontend source file changed in this task.
