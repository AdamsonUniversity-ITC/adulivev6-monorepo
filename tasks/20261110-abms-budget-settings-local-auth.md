# Task Specification

### Task ID
ABMS-20261110-BUDGET-SETTINGS-LOCAL-AUTH

### Feature / Context
Budget Settings PATCH save in finance_service; the screenshot reports Could not authenticate with auth service.

### Objective
Restore Budget Settings saves in the existing opt-in local portal-session authentication mode while retaining service authentication elsewhere.

### Requirements
- Local with services.auth.local_compatibility enabled uses the existing AbmsAuthGateway and the authenticated request credentials to load the ABMS permission catalog.
- Production, staging, and local without opt-in keep client-credentials authentication and the service catalog endpoint.
- Preserve request payloads, successful responses, validation rules and proposal-assignment window synchronization.
- Validate input before contacting auth, reject invalid/missing catalog IDs without writes, and save settings plus assignment windows atomically.
- Retain portal CSRF checks; never change cookie/encryption configuration or service credentials to bypass the failure.

### Acceptance Criteria
- A valid local session saves even when configured service OAuth credentials return invalid_client.
- Cookie and bearer credentials reach only the established auth gateway; local failures do not retry service credentials.
- Production/staging/local without opt-in continue using the OAuth service endpoint.
- Failed auth, malformed catalogs and invalid form values leave settings and proposal windows unchanged.
- Proposal-window synchronization affects only allow-budget-proposal-entry assignments; department and section assignments both update.
- Database failure rolls back the settings change as well as assignment-window writes.

### Inputs / Outputs
**Inputs:** Authenticated PATCH /api/abms/budget-settings and the existing school-year/date fields.
**Outputs:** Existing success JSON on save; validation/auth/upstream errors without partial writes.

### Agent Assignment
- backend_agent: Primary agent fixes settings controller and adds regression coverage.
- qa_agent: Primary agent executes focused and full finance test suites.
- reviewer_agent: Primary agent reviews authentication-mode isolation, cookie handling and atomicity.
- project_manager: Primary agent maintains task and continuity records.
- frontend_agent: No frontend behavior changes required.

### Dependencies
- Existing AbmsAuthGateway, Passport authentication, local compatibility flag and auth catalog endpoint.
- Finance Docker PHP runtime for tests.

### Edge Cases
- Invalid service client, missing/expired session, auth connection failure, redirect, malformed response or missing proposal permission.
- Nonconsecutive/malformed school years, equal current/proposal years, invalid/reversed dates and optional/null windows.
- First settings record, pre-existing settings, and failure while synchronizing proposal assignments.

### Notes
State: DONE.
Read-only runtime diagnostic confirmed APP_ENV=local, local compatibility enabled and OAuth 401 invalid_client.
The controller previously used service OAuth unconditionally, unlike existing local ABMS permission loading.
The fix uses the existing opt-in path and keeps production/staging service auth.
No live settings, credentials or user assignments were changed during diagnosis or implementation.

### Verification
- The focused reproduction failed with the reported 500 before the controller fix.
- All 13 focused BudgetSettingsSaveTest cases passed (67 assertions).
- Full finance suite passed: 315 tests / 2,729 assertions, including existing real portal-session CSRF checks.
- PHP formatter passed for the controller and new regression test.
- No frontend runtime files changed; no frontend build required.
