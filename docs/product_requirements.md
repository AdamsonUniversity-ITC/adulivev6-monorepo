# Product Requirements

## SESJr Legacy Enhancement

### Feature / Context

SES Job Request System Junior (SESJr), located in `public/legacy/registrar/sesjr`, is a legacy PHP and jQuery workflow used by requestors, registrar head/admin users, staff, and registrar users to file, review, forward, accomplish, disapprove, and acknowledge job requests.

### Objective

Improve SESJr request filing and review by supporting pasted image attachments, allowing controlled request type correction, and updating the request type choices available for new requests.

### Business Requirements

- Users must be able to paste image files into both the new request attachment area and the message thread/reply attachment area.
- Pasted image attachments must follow the existing attachment limits: maximum 5 files per submission and 5MB per file.
- Server-side upload validation remains authoritative and must continue to allow only approved file types.
- A requestor must be able to correct the selected Type of Request only for their own Pending request.
- Registrar head/admin users must be able to correct the selected Type of Request while reviewing active requests.
- Terminal requests must not allow Type of Request correction. Terminal statuses include Accomplished, Acknowledged, and Disapproved.
- The request type dropdown for new requests must include:
  - `Inclusion`
  - `Change/Transfer of Block Section`
  - `Deblocking`
- The request type `Reprint of class record/classlist` must no longer be available for new requests.
- Historical requests that already use the removed request type must still display their saved request type description in request lists and request detail views.
- Existing SESJr workflow behavior must be preserved, including request submission, request list filtering, thread messages, attachments, forwarding, send back, accomplish, disapprove, acknowledge, and email notification side effects.

### Clarifications

- Pasted image support is required in both attachment contexts: new request filing and thread/reply messages.
- Type of Request correction is required for both allowed actor groups: requestor while Pending and head/admin while reviewing.
- Request type values are database-driven through `adurojms.request_type`; implementation must not hardcode the dropdown labels in PHP as the primary source of truth.
