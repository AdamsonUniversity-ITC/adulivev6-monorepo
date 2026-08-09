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
- Support Half Legal Crosswise (`8.5in × 7in`), Half Institution Legal Crosswise (`8.5in × 6.5in`), Letter, standard Legal (`8.5in × 14in`), Institution Legal / Long Bond (`8.5in × 13in`), A4 portrait and landscape, and Printer Default / Any Paper.
- Group dedicated Epson LX-300-II presets for Letter (`8.5in × 11in`), Legal (`8.5in × 14in`), Institution Legal (`8.5in × 13in`), and Half Institution Legal (`8.5in × 6.5in`) ahead of the general/PDF choices.
- Make fixed-format previews reflect their paper dimensions and use compact, readable half-legal spacing without overlapping content.
- Keep fixed-format print canvases at explicit physical dimensions so a driver fallback does not stretch the RS to fill a different sheet.
- Offer Half Legal on Full Legal Sheet as a reliable fallback for printer drivers that do not support custom `8.5in × 7in` media.
- Offer a recommended Half Legal on Letter compatibility mode for older printer drivers that replace unsupported custom media and scale the page down.
- Use a zero-margin browser page and place the printer-safe inset inside the RS sheet so browser-generated URL/date headers do not consume or shift the selected layout.

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
- Epson Letter and Legal use their standard driver page sizes. Epson whole Institution Legal uses the exact configured `8.5in × 13in` form; Epson Half Institution Legal retains an unscaled Letter-driver compatibility canvas. These choices do not change RS data, permissions, or print-history behavior.
- Selecting Institution Legal / Long Bond applies an exact `8.5in × 13in` portrait or `13in × 8.5in` landscape page without replacing standard Legal.
- Half Institution Legal supports an exact `8.5in × 6.5in` page, a recommended Letter-media legacy mode, and placement on the upper half of a full `8.5in × 13in` sheet.
- Half Institution Legal retains the normal RS typography instead of inheriting Half Legal font reductions. Date Reviewed/Certified shares the title's vertical band at the upper left, while the centered title remains fixed. Its signing spacer absorbs remaining height and may shrink to zero as item rows increase; the user selects a larger preset when content cannot fit naturally.
- The Half Institution Legal full-sheet legacy-driver fallback uses the same upper-half typography, `0.15in 0.30in 0.30in` inset, content height, and spacing as its recommended legacy-on-Letter layout. It declares a Letter print canvas so older drivers do not replace and scale an unsupported CSS `8.5in × 13in` page; the institution's full physical sheet is loaded at the printer and its trailing two inches remain blank.
- All Half Institution Legal modes use the same header arrangement and flexible signing-space behavior.
- Selecting Printer Default / Any Paper uses `@page size: auto` so the browser and printer driver control the paper.
- Paper controls are excluded from print, and long requisitions flow to another page rather than overlap or disappear.
- Half Legal on Full Legal Sheet prints the compact RS on the top half of standard Legal portrait paper and shows a crosswise cut guide.
- Half Legal Legacy Printer declares standard Letter portrait media, keeps the RS in the upper `8.5in × 7in`, leaves the remainder blank, and shows a cut guide without relying on custom driver media.
- Half Institution Legal Legacy Printer on Letter uses a `0.15in` internal top inset for physical-printer clearance without changing the full-sheet `8.5in × 13in` layout.
- Fixed paper previews and printed sheets use the same per-format printer-safe margin.
- Browser-generated header/footer space is not part of the printable RS canvas, and the internal safety inset remains present for normal printer hardware.
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
- Follow-up (2026-08-04): physical-printer hardening uses explicit fixed-format print dimensions, matching preview/print margins, and a full-Legal-sheet fallback for drivers without custom half-legal media.
- Verification (2026-08-04): targeted `RSPrintPreview.tsx` ESLint, ABMS production build, and diff checks pass. Physical tray/media behavior remains dependent on the installed printer driver.
- Follow-up (2026-08-04): moved the safety inset inside the printed sheet and set the browser page margin to zero to prevent URL/date headers from displacing non-default formats.
- Follow-up (2026-08-04): added the Letter-media legacy-printer half-legal mode after an HP physical destination replaced the custom page and scaled down output that remained correct under Save as PDF.
- Follow-up (2026-08-04): reduced legacy-mode top spacing, retained only the dashed cutting line, and added the institution's `8.5in × 13in` Legal/Long Bond presets.
- Follow-up (2026-08-04): added exact, legacy-Letter, and full-sheet options for the institution's `8.5in × 6.5in` half Legal/Long Bond format, using tighter whitespace without reducing its compact text sizes.
- Follow-up (2026-08-04): increased only the recommended Half Institution Legal legacy-on-Letter top inset from `0.08in` to `0.15in` after physical-printer review; full-sheet output remains unchanged.
- Follow-up (2026-08-04): separated Half Institution Legal from compact Half Legal typography. All institution-half variants now retain normal RS text sizes and use a reduced `3mm` blank signing area and signature-line height to fit ordinary slips without scaling text.
- Follow-up (2026-08-04): aligned the full `8.5in × 13in` institution-half fallback with the recommended legacy layout's `0.15in` top inset so its upper-half RS uses identical physical metrics rather than appearing reduced.
- Follow-up (2026-08-04): physical HP output showed the driver replacing the custom `8.5in × 13in` CSS page with Letter and scaling the complete 13-inch canvas to 11 inches. The full-sheet legacy-driver option now sends the same unscaled Letter canvas as the working legacy mode while retaining its full-sheet screen preview and `6.5in` cut position.
- Follow-up (2026-08-04): moved only the full-sheet legacy-driver content after the RS title upward by `3mm`; the Adamson University/Requisition Slip title position, typography, and other paper presets remain unchanged.
- Follow-up (2026-08-04): aligned every Half Institution Legal variant by moving Date Reviewed/Certified `8mm` upward into the left side of the title band without moving the centered title. The signing spacer now flexes from the remaining height down to zero as item rows increase.
- Follow-up (2026-08-07): grouped explicit Epson LX-300-II Letter, Legal, Institution Legal, and Half Institution Legal driver presets in the shared RS preview. The browser requests these physical dimensions; the matching paper/form must also be selected or configured in the installed Epson driver.
- Follow-up (2026-08-07): physical LX-300-II preview evidence showed the driver replacing both institutional custom heights with Letter and proportionally shrinking their width. The two Epson institutional presets now send an unscaled Letter-compatible print canvas with `0.15in` side clearance; the half format keeps its content in the upper `6.5in`, while the whole format fits its printable content into the driver's 11-inch logical page to avoid horizontal scaling on an `8.5in × 13in` physical sheet.
- Follow-up (2026-08-07): Epson institutional `margin` values now feed the printed `.rs-sheet` padding directly instead of being shadowed by a hardcoded compatibility inset. Adjusting either Epson option's `margin` therefore changes both preview content padding and physical print padding while retaining the Letter-driver anti-scaling canvas.
- Follow-up (2026-08-07): the Epson whole Institution Legal preset applies a centered `0.97` content scale and increases its internal padding to `0.30in 0.20in 0.30in` (top, horizontal, bottom). Other Epson and general paper presets remain unscaled and unchanged.
- Follow-up (2026-08-07): after printer tuning, Epson whole Institution Legal uses the exact `8.5in × 13in` canvas rather than the Letter-driver fallback, retains the client-approved `1.0` scale and `0.6in 0.5in` top/horizontal inset, and explicitly sets bottom padding to zero. Epson half-institutional retains its Letter-driver compatibility canvas.
