# ABMS-ENTRY-20260722-014 — Single Authorized Unit Default

### Task ID

ABMS-ENTRY-20260722-014

### Feature / Context

ABMS Budget Proposal Entry and Budget Request Entry Department/Section selectors.

### Objective

Automatically select the sole authorized Department or Section for users who have exactly one typed organizational assignment.

---

### Requirements

- Combine the authorized Department and Section options on each entry page.
- Default the selector only when the combined list contains exactly one option.
- Preserve whether the selected unit is a Department or Section.
- Normalize option IDs consistently for controlled selector comparisons and API requests.
- Leave the selector empty for users with zero or multiple options.
- Do not automatically submit, requery, refresh, or create records.
- Preserve manual selection for users with multiple assignments.

---

### Acceptance Criteria

- One authorized Department defaults to that Department on both entry pages.
- One authorized Section defaults to that Section on both entry pages.
- One Department plus one Section does not default either option.
- Multiple Departments or Sections do not default an option.
- No authorized units leaves the selector empty and existing action guards remain active.
- The selected default sends the correct typed Department/Section identity in subsequent requests.
- The Budget Proposal page still requires Main and Sub Account selection before Requery.
- The Budget Request page does not load records until Refresh is used.
- Targeted lint and the ABMS production build succeed.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Authorized Department and Section arrays from each page loader.

**Outputs:**

- Initial controlled selector value and typed unit kind when exactly one option exists.

---

### Agent Assignment

- frontend_agent: Initialize both selectors from the sole typed option.
- qa_agent: Verify Department, Section, multi-unit, no-unit, request payload, lint, and build cases.
- reviewer_agent: Review typed identity and ensure no automatic financial action occurs.
- project_manager: Maintain this task record and business-rule documentation.

---

### Dependencies

- Loader-scoped Department and Section permissions.
- Budget Proposal `DeptSelect` and Budget Request `DeptDropdown`.

---

### Edge Cases

- Department and Section sharing the same numeric ID.
- Numeric IDs returned by the API despite frontend string contracts.
- Zero authorized units.
- Exactly one Section and no Departments.
- Loader remount after navigation.

---

### Notes

- State: IN_REVIEW
- Defaulting changes selection state only; it does not invoke backend writes or balance calculations.
- Verification: targeted ESLint, the ABMS production build, and diff checks passed.
