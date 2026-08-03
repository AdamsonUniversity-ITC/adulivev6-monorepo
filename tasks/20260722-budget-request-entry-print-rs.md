# ABMS-RS-20260722-010 — Budget Request Entry Print RS

### Task ID

ABMS-RS-20260722-010

### Feature / Context

ABMS Budget Request Entry existing-RS viewing modal and shared RS print preview.

### Objective

Allow the requester to print a created requisition from the Budget Request Entry viewing modal using the established RS print format.

---

### Requirements

- Add Print RS to editable and read-only existing-RS view actions.
- Reuse the shared Requisition Process `RSPrintPreview` component.
- Map Budget Request Entry header, items, payee details, requester, and account IDs to the shared print contract.
- Do not show Print RS for an unsaved requisition whose requisition number is `0`.
- Keep Print RS absent from the initial creation modal.
- Preserve existing view, editing, chat, file, and save behavior.
- Keep US Letter portrait as the default and add a paper selector beside Print in the shared preview.
- Support Half Legal Crosswise (`8.5in × 7in`), Letter/Legal/A4 portrait and landscape, and Printer Default / Any Paper.
- Make fixed-format previews reflect their paper dimensions and use compact, readable half-legal spacing without overlapping content.

---

### Acceptance Criteria

- Viewing a created RS from Budget Request Entry displays Print RS.
- Print RS opens the same Letter portrait preview used by Requisition Process.
- The preview displays the correct RS number, unit, date, status, requester, items, totals, RS type, note, and payee information.
- The preview Print action opens the browser print dialog and print CSS excludes modal controls.
- The print preview and toolbar render above the Budget Request Entry view modal and its nested overlays.
- Closing the preview returns to the same RS view.
- An unsaved RS with requisition number `0` has no Print RS action.
- Initial RS creation has no Print RS action.
- Selecting Half Legal Crosswise applies an `8.5in × 7in` preview and print page while retaining all RS sections.
- Selecting a fixed Letter, Legal, or A4 preset applies its matching dimensions and orientation.
- Selecting Printer Default / Any Paper uses `@page size: auto` so the browser and printer driver control the paper.
- Paper controls are excluded from print, and long requisitions flow to another page rather than overlap or disappear.
- Targeted lint and the ABMS production build succeed.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- A created Budget Request Entry requisition header, items, optional payee details, and selected paper format.

**Outputs:**

- Shared printable Requisition Slip preview.

---

### Agent Assignment

- frontend_agent: Wire the shared print preview into the existing-RS view.
- qa_agent: Verify editable/read-only views, printed values, unsaved guard, lint, and build.
- reviewer_agent: Review shared print-contract mapping and ensure no financial mutation occurs.
- project_manager: Maintain this task record and business-rule documentation.

---

### Dependencies

- Budget Request Entry detail endpoint.
- Shared `RSPrintPreview` component.
- Audit-history and account-resolution endpoints used by the preview.

---

### Edge Cases

- Unsaved requisition number `0`.
- No payee detail record.
- Missing account ID or account resolution failure.
- Empty or legacy note, payment form, or requester name.
- Preview closed without printing.
- A printer driver that does not expose a selected physical paper size.
- Long descriptions or item lists that require another printed page.

---

### Notes

- State: IN_REVIEW
- Printing is read-only and does not change requisition or balance state.
- Verification: targeted ESLint, the ABMS production build, and diff checks passed. The shared Requisition Process preview is reused without backend changes.
- Follow-up: raised the shared print overlay above the Budget Request Entry modal stacking layers after verifying the view modal uses z-index `99999`.
- Follow-up (2026-08-03): added shared paper presets and compact Half Legal Crosswise output. Full-project lint still has unrelated existing debt; targeted `RSPrintPreview.tsx` lint, build, and diff checks pass.
