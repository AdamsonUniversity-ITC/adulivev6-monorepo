# ABMS-AUTH-20261020-004 — Cross-Service Session Format Compatibility

### Task ID

ABMS-AUTH-20261020-004

### Feature / Context

Shared Auth/Finance sessions, recurrent `/api/user` 401, and stateful permission saves.

### Objective

Preserve Auth's existing PHP-serialized session data and CSRF token when Finance reads and writes the same session record.

---

### Requirements

- Configure Finance session serialization to match the deployed Auth service's PHP format; document it as part of the shared-session contract.
- Expose `SESSION_SERIALIZATION` with a PHP default and record PHP in the local/example environment. Refresh local Finance's cached configuration.
- Keep matching cookie scope, store, encryption and authentication/CSRF checks unchanged. Preserve existing custom CSRF middleware and unrelated workspace changes.
- Do not bulk convert or delete session records, generate user credentials, alter permissions, or write financial/workflow data.
- Add an Auth-to-Finance-to-Auth synthetic session regression using Finance's configured format; preserve CSRF, login attributes, and ordinary session state over repeated visits.
- Demonstrate the previous PHP/JSON mismatch fails the regression before fixing the configuration, then verify passing behavior and the live services' effective formats.
- Explain that a new sign-in is needed to replace session state already overwritten in the incompatible format; no further cookie-scope workaround is introduced.

---

### Acceptance Criteria

- Runtime Auth and Finance both use PHP serialization.
- A PHP Auth session retains the exact CSRF/login state after repeated Finance and Auth round trips; an explicit JSON reader reproduces token/state loss using only synthetic data.
- Existing valid-CSRF permission saves and missing/mismatched-token 419 rejection still pass.
- Full finance regression suite and relevant checks pass, or unrelated existing limitations are recorded.
- Documentation corrects the earlier assumption that matching cookie scope alone established cross-service compatibility.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Auth's PHP session payload and Finance's configured session reader/writer.

**Outputs:**

- Unchanged authentication/CSRF attributes and compatible PHP payload, without a session-format-induced 401/419 cycle.

---

### Agent Assignment

- frontend_agent: Preserve current route loaders and session-expiry behavior.
- backend_agent: Finance serialization configuration and local cache refresh.
- qa_agent: Synthetic cross-service session and enforced-CSRF regressions.
- reviewer_agent: Authentication compatibility, no-bulk-write checks, and preservation of existing workspace code.
- project_manager: Task/continuity documentation and sign-in recovery instructions.

---

### Dependencies

- Auth Laravel 12.48.1 uses default PHP session serialization; Finance Laravel 13.5.0 previously explicitly used JSON.
- Both services share the session cookie, domain, encryption key and `adulive` session storage.

---

### Edge Cases

- Session records already overwritten in JSON; repeated or concurrent requests between services; existing legacy host-only cookies from the prior domain configuration.
- Other services sharing this session store must use the same format; any future JSON migration must be coordinated across all readers/writers.

---

### Notes

- State: DONE
- Runtime diagnostics confirmed Auth `php` versus Finance `json` after both domains matched. Source shows an unreadable session payload becomes empty state and regenerates CSRF. The new round-trip regression failed before the config fix, reproducing that token loss without accessing actual user sessions.
- Finance `config/session.php` now defaults to `env('SESSION_SERIALIZATION', 'php')`; local `.env` and `.env.example` explicitly set PHP. Local Finance config cache was refreshed. Auth code/config, existing CSRF middleware, user assignments and business records were not changed.
- The formerly failing round-trip test now preserves the original CSRF token, login attributes and navigation state across three simulated visits. A separate explicit JSON-reader regression reproduces the old token loss using only an in-memory handler.
- Cross-runtime verification also passed against actual running Laravel 12 Auth and Laravel 13 Finance code: three Auth-to-Finance-to-Auth round trips preserved a synthetic login and CSRF token in in-memory session handlers. Only formats and preservation booleans were printed; no real session rows, cookies or credentials were read or modified.
- Focused compatibility/CSRF access tests: **8 passed, 58 assertions**. Full isolated finance suite: **297 passed, 2,622 assertions**. Targeted Pint and diff checks passed. No frontend implementation changed in this task; its production build passed in the preceding task, while monorepo lint/build and unavailable Playwright remain the recorded baseline limitations.
- A new sign-in replaces session state already overwritten by the incompatible JSON writer. The previous task's host-only-cookie cleanup remains necessary only if those legacy duplicates are still present. No bulk session conversion/deletion or financial mutation was run.
- Earlier cookie-only verification is explicitly qualified in the continuity documents; matching storage locations and keys is insufficient unless payload formats also match.
