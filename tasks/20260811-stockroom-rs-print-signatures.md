# ABMS-RS-20260811-004 — Stockroom RS Print Signatures

### Task ID

ABMS-RS-20260811-004

### Feature / Context

Shared ABMS Requisition Slip print preview footer.

### Objective

Add Office Head approval and Office Representative receipt signature fields to printed Stockroom-type requisitions without changing other RS print layouts.

---

### Requirements

- Apply the additional signature fields only when the normalized RS type is exactly `stockroom`.
- Add `Approved By:` with the signature caption `Office Head`.
- Add `Received By:` with the signature caption `Office Representative`.
- Render both fields in the same footer row as the existing print information and `Budget Certified By: Controller` field.
- Match the existing Controller signature-line format.
- Preserve the current footer for every non-Stockroom RS type.
- Keep the layout usable across all existing RS paper presets and print media.
- Add no backend, database, workflow, or financial changes.

---

### Acceptance Criteria

- A Stockroom RS print preview displays Print information, Approved By, Received By, and Budget Certified By in one row.
- The approval signature caption is `Office Head`.
- The receipt signature caption is `Office Representative`.
- The budget certification caption remains `Controller`.
- A non-Stockroom RS retains the existing two-column footer.
- Mixed-case or whitespace-padded Stockroom type values receive the Stockroom footer.
- The ABMS production build passes.
- Focused lint passes or unrelated baseline failures are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Requisition type supplied to the shared RS print preview.

**Outputs:**

- Conditional Stockroom signature fields in the printed RS footer.

---

### Agent Assignment

- frontend_agent: Implement the conditional shared print-footer layout.
- qa_agent: Verify Stockroom/non-Stockroom rendering and supported paper layouts.
- reviewer_agent: Review layout isolation and print compatibility.
- project_manager: Maintain task and continuity documentation.

---

### Dependencies

- Shared `RSPrintPreview` used by Budget Request Entry and Requisition Process.
- Existing RS paper presets and print CSS.

---

### Edge Cases

- RS type uses mixed casing or surrounding whitespace.
- Half-sheet presets have less horizontal and vertical space.
- Office Representative caption must remain on one line.
- Non-Stockroom RS must not reserve empty columns for the new signatures.

---

### Notes

- State: IN_REVIEW
- This is a frontend print-template change only.
- No backend deployment or migration is required.
- Verification: `pnpm --filter abms build` passed on 2026-08-11 with only the existing large-chunk advisory.
- Verification: focused ESLint passed for `RSPrintPreview.tsx`.
- Verification: `git diff --check` passed.
- Authenticated visual print verification remains for deployment smoke testing across the institution half-sheet and Letter presets.
