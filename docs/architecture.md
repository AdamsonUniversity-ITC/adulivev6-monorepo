# Architecture Notes

## SESJr Legacy Request Flow

### System Area

SESJr is a legacy PHP, jQuery, Bootstrap, and Dropzone module under `public/legacy/registrar/sesjr`. It is embedded from Laravel through the registrar route, but the request workflow itself is handled by legacy PHP scripts, session state, direct SQL queries, and jQuery AJAX calls.

### Entry Points

- Laravel route: `routes/web.php`
- Laravel wrapper/controller: `app/Http/Controllers/Registrar/RegistrarController.php`
- Legacy entry file: `public/legacy/registrar/sesjr/index.php`
- Legacy page switcher: `public/legacy/registrar/sesjr/modules/content.php`
- Main request page: `public/legacy/registrar/sesjr/modules/request.php`
- Request and detail modals: `public/legacy/registrar/sesjr/modules/modal.php`

### New Request Flow

1. `modules/request.php` shows the File Request button for `user` and `admin` roles.
2. `modules/modal.php` renders the Request Entry modal, including:
   - `#req-type-select` for Type of Request.
   - `#remarks-input` for request description.
   - `#reason-input` for reason.
   - `#rq-attachment` for Dropzone attachments.
3. `js/users.request.js` initializes Dropzone for `#rq-attachment`, collects form values and files, then posts to `php/handlers/requestHandler.php`.
4. `php/handlers/requestHandler.php` validates files and calls `DBOperations::setRequest()`.
5. `php/database/DBOperations.php` inserts into `adurojms.requests_table`, `adurojms.request_history`, `adurojms.seen_table`, optionally `adurojms.attachments`, and queues an email notification.

### Request List And Detail Flow

1. `js/requestpage.js` calls `loadRequests()` on page load.
2. `loadRequests()` posts filters to `php/handlers/requestHandler.php`.
3. `requestHandler.php` calls `DBOperations::getRequestList()`.
4. `DBOperations::getRequestList()` joins `adurojms.requests_table`, `adurojms.request_history`, `adurojms.request_type`, `aduollms.teachers`, and `hr.section`.
5. Selecting a request calls `openRequest(ctrlNo)` in `js/requestpage.js`.
6. `openRequest()` calls:
   - `DBOperations::getRequest()` for request details and initial attachments.
   - `DBOperations::getThread()` for message history and thread attachments.

### Thread Message Flow

1. `modules/modal.php` renders the request detail message textarea and `#thread-attachment` Dropzone.
2. `js/requestpage.js` initializes Dropzone for `#thread-attachment`.
3. Sending a message posts `threadMessage`, `threadCtrlNo`, and `threadFiles[]` to `php/handlers/requestHandler.php`.
4. `requestHandler.php` validates files and calls `DBOperations::setThreadMessage()`.
5. `DBOperations::setThreadMessage()` inserts into `adurojms.thread_table`, updates `adurojms.seen_table` and `adurojms.requests_table.isSeen`, and optionally inserts `adurojms.attachments` for the new thread.

### Request Type Source

Request types are loaded from `adurojms.request_type` by `DBOperations::getRequestType()`:

```php
SELECT * FROM adurojms.request_type ORDER BY description ASC
```

The current dropdown is database-driven. New request type additions, removals, or deactivation must be handled as data changes or schema-backed filtering rather than by hardcoding labels in the modal.

### Affected Files For SESJr Enhancement

- `public/legacy/registrar/sesjr/modules/modal.php`
- `public/legacy/registrar/sesjr/js/users.request.js`
- `public/legacy/registrar/sesjr/js/requestpage.js`
- `public/legacy/registrar/sesjr/php/handlers/requestHandler.php`
- `public/legacy/registrar/sesjr/php/database/DBOperations.php`

### External Dependencies

- Database schemas/tables:
  - `adurojms.request_type`
  - `adurojms.requests_table`
  - `adurojms.request_history`
  - `adurojms.thread_table`
  - `adurojms.attachments`
  - `adurojms.seen_table`
  - `adurojms.users`
  - `aduollms.teachers`
  - `hr.section`
  - `queues.email_notif`
- File storage path: `D:/Sites/sesjr_documents/sesjr/files/{ctrl_no}/`
- Avatar service: `http://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg.php`

### Implementation Risk Notes

- `public/legacy` is ignored by normal repository search tooling, so direct file paths should be used when working on this module.
- File type validation already allows JPG/JPEG/PNG on the server, but the current Dropzone client configuration only accepts PDF and DOCX. Client and server behavior must be aligned without weakening server validation.
- Existing code has role and status rules distributed across UI conditions and `DBOperations` methods. Request type correction must be authorized server-side, not only hidden or shown in the UI.
- Historical requests must keep displaying their joined `request_type.description`, even if a request type is removed or deactivated for new requests.
