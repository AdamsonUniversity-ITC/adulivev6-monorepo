# Decisions

## SESJr Legacy Enhancement Decisions

### 2026-05-20: Pasted Image Attachment Scope

Pasted image attachment support must be implemented in both SESJr attachment contexts:

- New request filing through `#rq-attachment` in `public/legacy/registrar/sesjr/js/users.request.js`.
- Request detail thread/reply messages through `#thread-attachment` in `public/legacy/registrar/sesjr/js/requestpage.js`.

Pasted images must be treated like regular attachments and must use the existing Dropzone queue behavior where practical. Existing limits remain in force: maximum 5 files per submission and 5MB per file. Server-side validation in `public/legacy/registrar/sesjr/php/handlers/requestHandler.php` remains authoritative.

### 2026-05-20: Type Of Request Correction Permissions

SESJr must allow controlled correction of a request's selected Type of Request after creation.

Allowed corrections:

- A requestor may correct the Type of Request only for their own request while it is Pending.
- Registrar head/admin users may correct the Type of Request while reviewing active requests.

Disallowed corrections:

- Users must not correct another requestor's request unless they are an allowed head/admin reviewer.
- Staff and registrar users must not correct Type of Request unless a future requirement explicitly grants that permission.
- Requests in terminal statuses must not allow Type of Request correction. Terminal statuses include Accomplished, Acknowledged, and Disapproved.
- UI-only restrictions are not sufficient; the server-side update action must enforce role, ownership, status, and request type validity.

### 2026-05-20: Request Type Data Ownership

SESJr request type options are owned by the database table `adurojms.request_type` and rendered by `DBOperations::getRequestType()`.

Implementation guidance:

- Add or retain these active request types for new requests:
  - `Inclusion`
  - `Change/Transfer of Block Section`
  - `Deblocking`
- Remove or deactivate `Reprint of class record/classlist` for new request selection.
- Do not delete historical type data in a way that breaks existing request list or detail display.
- Prefer a DB-safe seed, migration, one-time script, or documented DBA change over hardcoded PHP dropdown options.
- If `adurojms.request_type` lacks an active/inactive flag, implementation must choose a safe approach that prevents the removed type from appearing for new requests while preserving historical joins.

Implementation:

- `DBOperations::getRequestType()` keeps the dropdown database-driven and ensures `Inclusion`, `Change/Transfer of Block Section`, and `Deblocking` exist before rendering.
- If `adurojms.request_type` has an availability column named `is_active`, `isActive`, or `active`, the removed reprint type is deactivated and selectable dropdowns are filtered to active rows.
- If no supported availability column exists, selectable dropdowns filter out `Reprint of class record/classlist` by description while historical request list/detail joins continue to read the saved request type.

### 2026-05-20: Legacy Stability

This enhancement must be implemented as a small legacy maintenance change. The implementation must not rewrite SESJr into Laravel, replace Dropzone, or refactor the full request workflow unless separately approved.
