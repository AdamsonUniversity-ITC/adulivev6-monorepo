### Task ID

ABMS-LIQ-SCOPE-20260807-001

### Feature / Context

ABMS Liquidation Submission Department/Section filtering and confidential requisition access.

### Objective

Prevent users without Administration or Budget access from querying liquidation requisitions outside their assigned typed Department/Section scope.

---

### Requirements

- Resolve unrestricted access from the authenticated user's actual `admin-access` or `budget-access`; do not trust browser-supplied permission IDs.
- Resolve restricted access from typed `allow-budget-request-entry` assignments and preserve Department/Section identity when numeric IDs collide.
- Enforce the resolved scope on the backend liquidation RS query even when filter parameters are omitted or manipulated.
- Never expose an All Departments option to restricted users.
- When a restricted user has exactly one assigned typed unit, select it automatically and disable the Department/Section dropdown.
- Keep unrestricted Administration and Budget users able to select one unit or query all units.
- Make no migration, schema, financial-balance, liquidation workflow, upload, or approval changes.
- Update the ABMS continuity documentation.

---

### Acceptance Criteria

- A restricted user assigned to one Department sees that Department selected in a disabled dropdown and receives only its liquidation RS rows.
- A restricted user assigned to one Section sees that Section selected in a disabled dropdown and receives only its liquidation RS rows.
- A restricted user cannot retrieve another Department or Section by omitting, changing, or colliding the numeric unit ID in the request.
- A restricted user with multiple assignments can choose only one assigned typed unit and never sees All Departments.
- Administration and Budget users retain the existing all-unit query and unit-filter behavior.
- Missing or malformed restricted scope fails without returning liquidation rows.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Authenticated finance user.
- Optional typed Department/Section filter on the liquidation RS query.

**Outputs:**

- Scoped Department/Section options with unrestricted and selection-lock metadata.
- Liquidation RS rows limited to the authenticated user's authorized typed scope.

---

### Agent Assignment

- frontend_agent: Remove restricted all-unit behavior, auto-select one unit, and lock its dropdown.
- qa_agent: Verify typed scope, manipulated requests, single/multiple assignments, and unrestricted regressions.
- reviewer_agent: Review authorization, confidentiality, and Department/Section ID collision handling.
- project_manager: Preserve the confirmed Administration/Budget unrestricted rule and restricted-user confidentiality rule.

---

### Dependencies

- Existing `PermissionAccessService` and `allow-budget-request-entry` typed assignments.
- Existing authenticated Liquidation Submission routes and Department/Section dropdown.

---

### Edge Cases

- Department and Section share the same numeric ID.
- Restricted user has zero assignments.
- Restricted user has multiple assignments and omits the filter.
- Filter supplies an ID without a type, a type without an ID, or an unsupported type.
- Browser submits stale or spoofed permission IDs.

---

### Notes

- State: DONE
- Backend scope enforcement is authoritative; the disabled dropdown is not a security boundary.
