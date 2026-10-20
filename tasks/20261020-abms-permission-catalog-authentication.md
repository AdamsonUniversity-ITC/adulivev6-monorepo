# ABMS-AUTH-20261020-002 — Permission Catalog Authentication

### Task ID

ABMS-AUTH-20261020-002

### Feature / Context

ABMS User Department Access and requisition/proposal entry permission-catalog loading.

### Objective

Load the ABMS permission catalog through the authenticated Finance API without treating upstream service-authentication failures as expiration of the browser user's session.

---

### Requirements

- Preserve user authentication, permission checks, existing permission IDs, catalog response shape, and financial/workflow data.
- Add an authenticated read-only Finance endpoint for the ABMS catalog before the dynamic user-profile route.
- Fetch the catalog from Auth's existing service-only endpoint using the existing server-side OAuth client; never forward browser cookies or expose service credentials to the browser.
- Return only the catalog group and permissions, retaining dynamically registered VPF permission metadata.
- Return 401 for an unauthenticated Finance caller; report upstream service-authentication, network, or malformed-response failures as 503 without a login redirect or empty successful catalog.
- Replace every ABMS route-loader browser Auth catalog call with the Finance endpoint. Preserve the existing browser Auth `/user` session check and genuine session-expiry redirects.
- Do not change global shared Axios authentication behavior or disable CSRF validation. No migration, role reassignment, environment edit, or financial-data write is needed.

---

### Acceptance Criteria

- An authenticated caller loads the catalog with unchanged dynamic group/permission IDs; a guest receives 401.
- Browser credentials are not forwarded to the upstream catalog request, which uses the service bearer token.
- Upstream 401/403/500, connection failure, or malformed catalog returns a controlled 503 without redirecting the authenticated user to login.
- User Access, Budget Proposal Entry, Budget Request Entry, and Requisition Process loaders use the Finance catalog route and retain their existing result shapes.
- Focused backend regressions, relevant PHP formatting, and ABMS production build pass; baseline lint/build/E2E limitations are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Authenticated Finance user and existing Auth service OAuth configuration.

**Outputs:**

- Read-only group/permission catalog or an authentication/service-unavailable error without changing business data.

---

### Agent Assignment

- frontend_agent: Replace ABMS catalog transport in route loaders while preserving page contracts.
- backend_agent: Read-only Finance endpoint and authenticated Auth catalog client.
- qa_agent: Catalog authentication, credential isolation, upstream-failure, contract, and build validation.
- reviewer_agent: Authentication boundaries, secret handling, no-write review, and regression verification.
- project_manager: Task record and ABMS continuity documentation.

---

### Dependencies

- Existing Finance Passport authentication and AuthPermissionClient service-token configuration.
- Existing Auth `/api/abms-permissions/service` endpoint.

---

### Edge Cases

- Expired/missing browser login; revoked service credentials; upstream outage; invalid JSON or missing catalog fields.
- A VPF permission ID differs across environments; service failure must not silently omit permissions.
- The catalog route must not be captured by `/api/user/{username}`.

---

### Notes

- State: DONE
- User confirmed direct browser fetch returns 200 for Auth `/api/user` and `/api/abms-permissions`, but application navigation repeatedly returns 401 for the catalog and redirects to login. Exact browser cookie/request timing remains unconfirmed; this change removes that failing browser hop without weakening authentication.
- Added authenticated Finance `GET /api/user/abmspermission-catalog`; all four ABMS catalog loaders now use it. The route precedes the dynamic profile route, and the running Finance container confirms the registered Passport middleware.
- Live service integration verified: Finance's configured OAuth client reads the ABMS group and all ten permissions, including VPF, from Auth. Output was limited to availability/counts; no credentials or browser cookies were exposed.
- Six new regression tests pass (27 assertions): dynamic catalog IDs, no forwarded browser credentials, guest 401 with no upstream request, upstream 401/403/500 and connection failure returning 503 without redirect, malformed payload rejection, and OAuth client failure isolation.
- Full isolated finance suite passes: **293 tests, 2,587 assertions** using Docker PHP 8.4 and SQLite in memory with config-cache bypass. ABMS production build and targeted PHP formatting/diff checks pass.
- Root `pnpm lint` still fails on pre-existing `@repo/ui` warnings under max-warnings 0; root `pnpm build` still fails on the unrelated online evaluation application's TS5110 configuration error. `pnpm playwright test` remains unavailable because Playwright is not installed at root. Authenticated browser navigation requires user verification after refresh; no user-browser cookies were accessed by tools.
- No migration, environment edit, assignment change, or financial/workflow write was performed for this fix. Deploy the Finance endpoint before the frontend; then sign in/refresh ABMS and verify the catalog request goes to Finance instead of the browser Auth endpoint.
