# ABMS-DASH-20260722-003 — Controller Dashboard and Route Access

### Task ID

ABMS-DASH-20260722-003

### Feature / Context

ABMS Controller dashboard, navigation authorization, requisition processing, Administration pages, and reports.

### Objective

Provide Controller-only users with a dedicated dashboard and make every Controller-visible sidebar destination accessible under matching frontend and backend permission checks.

---

### Requirements

- Add `controller-access` as an authorized dashboard scope.
- Show pending Controller review, Controller-approved, Controller-disapproved, and total requisition counts for the selected school year.
- Limit the Controller dashboard work queue to `status = on process` and `is_controlled = 0`.
- Provide a quick action to the Controller requisition queue.
- Align `router.tsx` guards with every sidebar item that declares `controller-access`.
- Preserve access through the global `abms_user_department_access` permission while also allowing Controller access to User Department Access.
- Allow Controller-only users through all report controllers whose sidebar entries declare Controller access.
- Preserve existing access for all other roles.

---

### Acceptance Criteria

- A user with only `controller-access` receives a `Controller Dashboard` scope instead of a dashboard 403.
- Controller dashboard counts are school-year scoped and use `is_controlled` values `0`, `1`, and `2` correctly.
- The dashboard queue contains only pending Controller decisions and displays at most the existing eight recent rows.
- Controller-only users can open Requisition Process, Controller-visible Administration pages, Chart of Accounts child pages, and all eight Controller-visible reports without a frontend unauthorized redirect.
- Report APIs accept `controller-access`; unauthenticated users and users without Administration, Budget, or Controller access remain rejected.
- Existing sidebar visibility and non-Controller route permissions do not regress.
- Frontend build and relevant static checks pass, or pre-existing failures are recorded separately.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Authenticated user's general and ABMS permissions.
- Optional dashboard school year and authorized scope.
- Requisition `status` and `is_controlled` state.

**Outputs:**

- Controller dashboard scope, counts, queue, status distribution, and quick action.
- Consistent sidebar, router, and report API authorization behavior.

---

### Agent Assignment

- frontend_agent: Dashboard cards/quick action and route-guard alignment.
- qa_agent: Validate Controller-only navigation, API access, build, lint, and regression behavior.
- reviewer_agent: Review permission parity, data scoping, and unauthorized failure cases.
- project_manager: Maintain the task record and durable ABMS documentation.

---

### Dependencies

- `budget_request_entry.is_controlled` Controller workflow.
- Existing dashboard endpoint and shared `Home.tsx` dashboard layout.
- Sidebar permission declarations and protected router context.
- Report `AbmsPermissionService` authorization checks.

---

### Edge Cases

- User has only `controller-access` and no typed department/section assignment.
- Stored dashboard scope belongs to a role the current user no longer has.
- No requisitions exist for the selected school year.
- Approved or disapproved Controller decisions later move to another workflow status/location.
- A user has global `abms_user_department_access` but no ABMS general role.
- A user manually opens a Controller-visible URL without any allowed permission.

---

### Notes

- State: IN_REVIEW
- Controller decision counts are based on persisted `is_controlled` state, while the work queue additionally requires `status = on process`.
- Verification: ABMS production build passed. All nine modified backend controllers passed PHP syntax checks and targeted Pint validation. Focused frontend lint passed for `Home.tsx`; `router.tsx` remains blocked by its nine pre-existing errors (`no-explicit-any` and one unused import). Host Laravel tests remain unavailable because PHP 8.3.6 is below the installed dependencies' PHP 8.4 requirement.
