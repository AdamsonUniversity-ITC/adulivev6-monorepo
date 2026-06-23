# In Progress Tasks

## SESJr Legacy Enhancement

### Task ID

SESJR-20260520-001

### Feature / Context

Legacy SES Job Request System Junior (SESJr) request filing, request review, request type maintenance, and attachment handling under `public/legacy/registrar/sesjr`.

### Objective

Enhance SESJr so users can paste image attachments, authorized users can correct a request's Type of Request, and the new request dropdown reflects the updated request type list.

---

### Requirements

- Preserve the existing legacy SESJr workflow and avoid rewriting the module into Laravel or replacing Dropzone.
- Implement pasted image support for new request attachments in `public/legacy/registrar/sesjr/js/users.request.js` on Dropzone `#rq-attachment`.
- Implement pasted image support for thread/reply attachments in `public/legacy/registrar/sesjr/js/requestpage.js` on Dropzone `#thread-attachment`.
- Pasted images must be added to the same Dropzone queue used by normal file selection where practical.
- Pasted images must support at least `image/png`, `image/jpeg`, and `image/jpg`.
- Keep the existing submission limits for pasted and selected files: maximum 5 files per submission and 5MB per file.
- Keep server-side validation in `public/legacy/registrar/sesjr/php/handlers/requestHandler.php` authoritative for file type and file size.
- Align the client-side Dropzone accepted file configuration with the server-side allowed image types without removing existing supported document behavior.
- Add server-side support for correcting a saved request Type of Request through `public/legacy/registrar/sesjr/php/handlers/requestHandler.php` and `public/legacy/registrar/sesjr/php/database/DBOperations.php`.
- Add a minimal UI control for Type of Request correction in `public/legacy/registrar/sesjr/modules/modal.php` and wire it in `public/legacy/registrar/sesjr/js/requestpage.js`.
- A requestor may correct Type of Request only when all of these are true:
  - the current session user owns the request;
  - the request status is Pending;
  - the new request type exists and is available for new requests.
- Registrar head/admin users may correct Type of Request only for active non-terminal requests.
- Terminal requests must not allow Type of Request correction. Treat Accomplished, Acknowledged, and Disapproved as terminal.
- Staff and registrar users must not be allowed to correct Type of Request unless they also satisfy an explicitly allowed head/admin role.
- The correction endpoint must validate request ownership, role, status, and new request type server-side. Do not rely only on hidden buttons or disabled controls.
- Add or retain these request types for new request selection through `adurojms.request_type`:
  - `Inclusion`
  - `Change/Transfer of Block Section`
  - `Deblocking`
- Remove or deactivate `Reprint of class record/classlist` for new request selection.
- Preserve historical request display for requests that already reference the removed request type.
- Do not hardcode the request type dropdown labels in PHP as the source of truth; request types must remain database-driven through `adurojms.request_type`.
- If the current `adurojms.request_type` schema has an active/inactive flag, use that flag for hiding removed types from new requests.
- If the current `adurojms.request_type` schema does not have an active/inactive flag, implement a DB-safe approach that hides the removed type from new request/correction dropdowns while keeping historical joins intact, and document the chosen approach in `docs/decisions.md`.
- Ensure all new legacy PHP inputs are sanitized consistently with the existing module and protected against unauthorized direct POST requests.

---

### Acceptance Criteria

- Happy path: a requestor can paste a PNG or JPEG image into the new request attachment area, submit the request, and see the attachment listed in the request detail view.
- Happy path: an authorized user can paste a PNG or JPEG image into the thread/reply attachment area, send the message, and see the attachment listed in the new thread message.
- Happy path: a requestor can correct their own Pending request from one Type of Request to another available Type of Request.
- Happy path: a registrar head/admin user can correct an active non-terminal request from one Type of Request to another available Type of Request.
- Happy path: the new request Type of Request dropdown includes `Inclusion`, `Change/Transfer of Block Section`, and `Deblocking`.
- Happy path: `Reprint of class record/classlist` is not selectable for new requests or request type corrections.
- Happy path: historical requests that already used `Reprint of class record/classlist` still show their saved request type description in the request list and detail modal.
- Failure case: pasted images larger than 5MB are rejected before or during submission with an existing-style error message.
- Failure case: unsupported pasted files are rejected and not submitted.
- Failure case: attempts to submit more than 5 total files are rejected or prevented.
- Failure case: a requestor cannot correct another user's request.
- Failure case: a requestor cannot correct their own request after it leaves Pending status.
- Failure case: staff and registrar users cannot correct Type of Request through the UI or by direct POST.
- Failure case: terminal requests cannot be corrected through the UI or by direct POST.
- Failure case: a direct POST with a nonexistent, removed, or unavailable request type is rejected.
- Regression check: existing PDF/DOCX attachment upload behavior still works where it worked before.
- Regression check: existing request submission, list loading, request detail display, forwarding, send back, accomplish, disapprove, acknowledge, and thread message workflows still work.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- User paste event containing image data in the new request modal or thread/reply area.
- Existing selected files added through Dropzone.
- Request type correction action containing a control number and a target request type ID.
- Database data in `adurojms.request_type`.

**Outputs:**

- Pasted images are submitted and stored as normal SESJr attachments.
- Request detail and thread views list pasted image attachments as downloadable links.
- Corrected requests show the updated Type of Request in request lists and detail views.
- Unauthorized or invalid correction attempts return a failure response and do not change `adurojms.requests_table.req_type`.
- New request/correction dropdowns expose only active or available request types.

---

### Agent Assignment

- backend_agent: Not assigned for primary implementation. Consult only if Laravel wrapper routes, controllers, or deployment migrations outside `public/legacy` are required.
- frontend_agent: Not assigned. React/Inertia frontend is out of scope for this legacy task.
- qa_agent: Validate the acceptance criteria across requestor, head/admin, staff, and registrar roles, including direct POST failure cases where practical.
- reviewer_agent: Review authorization, server-side validation, historical request type preservation, upload safety, and regression risk before marking complete.
- legacy_agent: Primary implementer for `public/legacy/registrar/sesjr` PHP, jQuery, Dropzone behavior, and database interaction changes.

---

### Dependencies

- Access to a SESJr test environment with valid requestor, head/admin, staff, and registrar sessions.
- Access to inspect and safely update `adurojms.request_type`.
- Existing SESJr file storage path must be writable: `D:/Sites/sesjr_documents/sesjr/files/{ctrl_no}/`.
- Existing legacy database connection includes access to `adurojms`, `aduollms`, `hr`, and `queues` schemas.
- Clarifications already confirmed:
  - pasted images are required in both new request and thread/reply attachment areas;
  - Type of Request correction is required for both requestor while Pending and head/admin while reviewing.

---

### Edge Cases

- Pasted image has no filename from the clipboard; implementation must generate a safe filename with the correct image extension.
- Pasted clipboard content includes both text and image data; image handling must not break normal text entry.
- User pastes multiple images or repeatedly pastes images until the Dropzone max file count is reached.
- User combines pasted images with selected files.
- User attempts to paste or upload files with misleading extensions or unsupported MIME types.
- User tries to correct Type of Request while the request detail modal is stale and the request status has changed on the server.
- User tries to correct Type of Request to the same current value.
- User tries to correct Type of Request to a removed or inactive request type.
- Historical request references a request type hidden from new selections.
- Request has no attachments before a pasted image is added.
- Thread message contains attachments but no text.

---

### Notes

- Current server upload validation already allows JPG, JPEG, and PNG in `requestHandler.php`; the client currently limits Dropzone to PDF and DOCX in the inspected scripts.
- Current request type dropdown generation is database-driven through `DBOperations::getRequestType()`, which queries `adurojms.request_type ORDER BY description ASC`.
- Existing status values observed in legacy code are Pending `0`, Assigned `1`, Forwarded `2`, Accomplished `3`, Acknowledged `4`, and Disapproved `5`.
- Keep changes small and localized to the legacy module.
- Update `docs/decisions.md` if implementation discovers a request type schema constraint that affects how removed request types are hidden.
