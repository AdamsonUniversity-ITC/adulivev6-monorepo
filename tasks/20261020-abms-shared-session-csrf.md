# ABMS-AUTH-20261020-003 — Shared Session CSRF Configuration

### Task ID

ABMS-AUTH-20261020-003

### Feature / Context

ABMS permission saving and Finance browser-session CSRF validation.

### Objective

Align Finance's local shared-session cookie domain with Auth so ABMS can save permissions with the matching session/CSRF token while preserving CSRF validation.

---

### Requirements

- Align local Finance `SESSION_DOMAIN` with Auth's existing `.localhost.test` domain, preserving the shared cookie name, database connection, encryption key, and other environment settings.
- Refresh the local Finance configuration cache after changing that one environment value.
- Document matching Auth/Finance cookie name, domain, path, encryption key, and session store requirements; update the local example configuration with the shared-session settings.
- Keep stateful CSRF middleware enabled and retain current authentication, permission-save contracts, and workflow behavior. Do not add CSRF exclusions or automatic mutation retries.
- Add real-CSRF regression coverage around permission saves: matching encrypted CSRF tokens permit a valid save, mismatched/missing tokens return 419 before writes, and emitted session/CSRF cookies use the shared domain.
- Explain one-time removal of old host-only Finance cookies followed by fresh sign-in. Do not inspect browser cookie values or change user assignments/business data during validation.

---

### Acceptance Criteria

- Running local Finance config uses `.localhost.test` as Auth does; no other environment value is changed.
- Authenticated valid-CSRF permission save succeeds in isolated tests; invalid/missing-CSRF requests return 419 without permission mutations.
- Stateful Finance responses emit shared-domain session and XSRF cookies.
- Focused and full finance regressions pass with CSRF enforcement explicitly enabled in the focused tests; baseline frontend/E2E limitations remain recorded.
- Operator receives specific legacy-cookie cleanup and sign-in instructions.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Existing shared Auth session, ABMS request origin, permission payload, and CSRF header.

**Outputs:**

- Matched shared-session cookie configuration and a successful authorized save, or a protected 419 without writes for a mismatched token.

---

### Agent Assignment

- frontend_agent: Preserve existing save payloads and XSRF header behavior.
- backend_agent: Align local session configuration and example settings without weakening middleware.
- qa_agent: Enforced-CSRF save and cookie-domain regressions using isolated storage.
- reviewer_agent: Verify cookie scope, shared-session prerequisites, and mutation preservation.
- project_manager: Record configuration findings, verification, and legacy-cookie cleanup procedure.

---

### Dependencies

- Auth and Finance already use matching encryption keys and the same `adulive` session store/cookie name.
- Finance's standard Sanctum stateful CSRF middleware and Axios XSRF support.

---

### Edge Cases

- Old host-only cookies shadow new parent-domain cookies until removed.
- Expired session, missing/mismatched CSRF token, non-stateful request origin, and production deployments using a different shared parent domain.

---

### Notes

- State: DONE
- Previous catalog transport fix resolved permission loading; the 419 on POST exposes the existing host-only/shared-domain session mismatch on writes. No production configuration or business data is changed by this local fix.
- Changed only local Finance `.env` `SESSION_DOMAIN` from `null` to `.localhost.test`, then ran `php artisan config:cache` inside the local Finance container. Matching cookie name, shared `adulive` store, encryption key and other environment values were preserved.
- Updated the example environment with explicit shared domain, session cookie name, and session-store connection. Production requires its own shared parent domain matching Auth; `.localhost.test` is only the local example.
- Runtime verification confirms `session.domain=.localhost.test` and that Finance's standard `/sanctum/csrf-cookie` response emits both `XSRF-TOKEN` and `adamson_university_session` on `.localhost.test`. Diagnostics printed cookie names/domains only, never values.
- Added two enforced-CSRF tests to UserDepartmentAccessTest. The normal Laravel testing bypass is overridden only in the test middleware subclass. A real encrypted XSRF-cookie/header exchange allows the permission-save endpoint to return 201, while missing/mismatched tokens return 419 and preserve both existing permission tables.
- Focused access suite: **6 tests, 38 assertions passed**. Full finance suite: **295 tests, 2,602 assertions passed** in isolated Docker PHP 8.4/SQLite memory. ABMS production build, targeted Pint, and diff checks passed. Existing monorepo lint/build failures and absent root Playwright remain the previously recorded baseline; no frontend implementation changed in this fix.
- One-time browser cleanup: remove old `adamson_university_session` and `XSRF-TOKEN` rows with Domain exactly `finance-api.localhost.test`, or clear cookies for localhost.test and its subdomains. Then sign in again and retry Save Access. This is required because old host-only cookies can shadow the new parent-domain cookies; server configuration cannot remove an existing cookie from the user's browser by itself.
- No real user permission assignment, RS, financial amount, or balance was changed. Authenticated browser save after legacy-cookie cleanup remains user verification.
- Follow-up ABMS-AUTH-20261020-004 found that matching cookie scope alone was insufficient: Finance JSON session serialization conflicted with Auth PHP serialization. The tests here enforced CSRF within Finance but did not exercise an Auth-to-Finance-to-Auth round trip; that regression and the format correction are recorded in task 004.
