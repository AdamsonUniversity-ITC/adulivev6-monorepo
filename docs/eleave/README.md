# E-Leave Documentation

Last verified: 2026-07-23

Durable documentation for the AdULive E-Leave system (frontend + HRMDO API module). Prefer these docs and source code over chat history when onboarding or changing leave behavior.

## Audience

| Audience | Start here |
| --- | --- |
| Developers | [System context](./system-context.md), [Architecture](./architecture.md), [Business rules](./business-rules.md) |
| Employees (rank and file) | [User guide](./user-guide.md) |
| Supervisors / managers | [Approver guide](./approver-guide.md) |
| HR / leave admins | [HR & admin guide](./hr-admin-guide.md) |

## Developer docs

- [System context](./system-context.md) — repos, stack, auth, data boundaries
- [Architecture](./architecture.md) — routes, domain model, apply/approval flows
- [Business rules](./business-rules.md) — visibility, credits, duplicates, filing timing
- [Permissions](./permissions.md) — permission names and FE/BE access matrix
- [API overview](./api-overview.md) — `api/v1` endpoint groups and gates

## End-user / operations docs

- [User guide](./user-guide.md)
- [Approver guide](./approver-guide.md)
- [HR & admin guide](./hr-admin-guide.md)

## Related code

| Concern | Location |
| --- | --- |
| Frontend app | `apps/eleave` |
| Backend module | `../hrmdo_service/app-modules/eleave` (sibling repo) |
| Module config | `../hrmdo_service/config/eleave.php` |
