### Task ID

20260918-abms-admin-payroll-process-filter

### Feature / Context

ABMS Requisition Process, Administration payment-form filter.

### Objective

Let Administration filter its requisition queue by each of the three new payroll payment forms.

---

### Requirements

- Add Employee's Payroll, Employer Share, and Allowance of SA to the Administration payment-form options.
- Keep every other role's payment-form options unchanged.
- Send the selected stored payment-form value through the existing requisition query.

---

### Acceptance Criteria

- Administration can select and query each of the three payroll forms by its exact stored name.
- Other roles do not see these three options in their payment-form filter.
- Existing payment-form options and filter reset behavior still work.

---

### Inputs / Outputs (if applicable)

**Inputs:** Administration payment-form selection.

**Outputs:** Existing requisition list filtered by the selected payment-form value.

---

### Agent Assignment

- frontend_agent: Role-specific filter options.
- qa_agent: Verify Administration and other role options and queries.
- reviewer_agent: Check role scoping and unchanged query behavior.
- project_manager: Task record and ABMS continuity update.

---

### Dependencies

- Existing role filter config and Requisition Process query API.

---

### Edge Cases

- Empty selection, switching roles, and exact punctuation in Employee's Payroll.

---

### Notes

- State: IN_REVIEW
- Existing Gross Income Employees records keep their stored name and are outside this three-option addition.
