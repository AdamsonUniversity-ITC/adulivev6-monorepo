# ABMS-RS-20260722-009 — RS Creation Action Visibility

### Task ID

ABMS-RS-20260722-009

### Feature / Context

ABMS Budget Request Entry initial RS creation modal.

### Objective

Remove Print RS and Chat/Message actions from the initial requisition creation interface.

---

### Requirements

- Remove the Print RS button from `RSFormModal`.
- Remove the Chat/Message button from `RSFormModal`.
- Remove creation-modal state and icon imports used only by those actions.
- Preserve the existing-RS viewing modal and its conversation behavior.
- Preserve all creation actions unrelated to printing and chat.

---

### Acceptance Criteria

- Print RS is not displayed while creating an RS.
- Chat/Message is not displayed while creating an RS.
- Create/Save RS, New Item, Add Files, and Discard/Close continue to work and display normally.
- Opening an existing RS still exposes its existing conversation controls.
- Targeted lint and the ABMS production build succeed.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Opening the initial RS creation form after selecting an RS type.

**Outputs:**

- Creation actions without Print RS or Chat/Message.

---

### Agent Assignment

- frontend_agent: Remove creation-only actions and unused state/imports.
- qa_agent: Verify creation and existing-RS view action sets, lint, and build.
- reviewer_agent: Review scope to ensure viewing behavior is unchanged.
- project_manager: Maintain this task record and business-rule documentation.

---

### Dependencies

- `RSFormModal` creation flow.
- `RSViewModal` existing-requisition flow.

---

### Edge Cases

- Newly saved RS remaining open in the creation modal.
- Creation modal reopened after discard.
- Existing RS opened in editable and read-only states.

---

### Notes

- State: IN_REVIEW
- No backend or persisted requisition behavior changes.
- Verification: targeted ESLint and the ABMS production build passed. The existing-RS view component was not modified.
