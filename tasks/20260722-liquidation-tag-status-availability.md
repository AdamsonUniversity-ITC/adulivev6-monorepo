# ABMS-REQ-20260722-004 — Liquidation Tag Status Availability

### Task ID

ABMS-REQ-20260722-004

### Feature / Context

ABMS requisition-process `For Liquidation` tagging for Administration and Budget roles.

### Objective

Allow Administration and Budget users to toggle the `For Liquidation` tag on every eligible requisition status except cancelled and disapproved.

---

### Requirements

- Show the liquidation toggle to `admin-access` and `budget-access` roles.
- Keep the toggle limited to Cashier requisitions.
- Show it at every workflow location and status except `cancelled` and `disapproved`.
- Hide it for every other role.
- Preserve the existing reversible toggle and confirmation behavior.
- Enforce the same role, requisition-type, and terminal-status rules on the backend action.
- Do not change requisition status, Controller decision, balances, or approval state.

---

### Acceptance Criteria

- Administration and Budget users see the toggle for a Cashier RS in `for review`, `for budget director`, `on process`, pricing, approval, certified, purchase, and served stages.
- The toggle remains available when `is_controlled = 2` unless the requisition status itself is cancelled or disapproved.
- The toggle is hidden for cancelled and disapproved requisitions.
- The toggle is hidden for non-Cashier requisitions and non-Administration/Budget roles.
- Clicking the toggle continues to invert `for_liquidation` and refresh the displayed entry without changing other workflow fields.
- Direct API requests return 403 without Administration/Budget access and 422 for non-Cashier, cancelled, or disapproved requisitions.
- The ABMS production build succeeds.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Authenticated requisition-process role.
- Requisition type, status, and current `for_liquidation` value.

**Outputs:**

- Correct toggle visibility and the updated requisition response after authorized use.
- Structured 403/422 failures for unauthorized or ineligible requests.

---

### Agent Assignment

- frontend_agent: Update shared modal visibility logic.
- qa_agent: Verify role, type, status, location, and toggle regression cases.
- reviewer_agent: Review terminal-state and permission behavior.
- project_manager: Maintain this task record and durable business rules.

---

### Dependencies

- Shared `RSProcessModal` used by Administration and Budget views.
- Existing `For Liquidation` action in `RequisitionProcessController::update`.

---

### Edge Cases

- Controller-disapproved decision state while main status remains `on process`.
- Requisition has moved away from Budget Office.
- Already-tagged requisition is toggled off.
- Status casing differs in the API response.
- Requisition type is null or not Cashier.

---

### Notes

- State: IN_REVIEW
- The backend action now mirrors the frontend eligibility rule so direct requests cannot bypass it.
- Verification: ABMS production build passed and the modified backend controller passed PHP syntax validation. Targeted frontend lint remains blocked by 28 pre-existing errors and one warning in `RSProcessModal.tsx`; targeted Pint remains blocked by pre-existing formatting drift in `RequisitionProcessController.php`.
