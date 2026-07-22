# ABMS-RS-20260722-006 — Stockroom Catalog-Only Requisition Items

### Task ID

ABMS-RS-20260722-006

### Feature / Context

ABMS Budget Request Entry RS form and item creation API.

### Objective

Require Stockroom requisition item details to come from the Office Supplies catalog.

---

### Requirements

- Make Stockroom item description, unit cost, and unit of measurement read-only.
- Require the user to choose a live item through Get Items before saving.
- Keep quantity editable as the requested quantity.
- Send the selected Office Supply ID to the item API.
- Resolve catalog-controlled values from the backend record instead of trusting submitted text or prices.
- Preserve manual item entry for non-Stockroom requisition types.

---

### Acceptance Criteria

- A Stockroom user cannot type description, unit cost, or unit of measurement.
- Selecting Get Items fills the catalog-controlled fields and permits a valid save after quantity and account are supplied.
- Saving without a selected catalog item is rejected in the UI and API.
- A forged Stockroom payload cannot override the catalog description, cost, or unit.
- A deleted or unknown catalog ID is rejected without creating an item or changing balances.
- Logistics and Cashier item entry remains manually editable.
- The ABMS production build succeeds and the backend controller passes syntax checks.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Stockroom RS header, selected Office Supply ID, account, and requested quantity.

**Outputs:**

- Requisition item using authoritative catalog description, unit cost, and unit of measurement.

---

### Agent Assignment

- frontend_agent: Enforce catalog selection and read-only catalog fields in the RS item modal.
- qa_agent: Verify Stockroom and non-Stockroom paths, validation failures, and build output.
- reviewer_agent: Review server-side catalog enforcement and balance mutation safety.
- project_manager: Maintain this task record and continuity documentation.

---

### Dependencies

- Office Supplies catalog API and live `office_supplies` records.
- Budget Request Entry item creation endpoint.
- Existing account-allocation and balance checks.

---

### Edge Cases

- No catalog item selected.
- Unknown or soft-deleted Office Supply ID.
- Forged item description, unit price, unit, or total.
- Catalog selection followed by picker cancellation.
- Stockroom item with missing account or invalid quantity.
- Non-Stockroom manual item entry.

---

### Notes

- State: IN_REVIEW
- Catalog fields are authoritative; quantity remains a requisition-specific input.
- Verification: targeted frontend ESLint passed with the file's existing Fast Refresh export rule disabled, the ABMS production build passed, and the backend controller passed PHP syntax validation. Targeted Pint reports pre-existing whole-file formatting differences.
