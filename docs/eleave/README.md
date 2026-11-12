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
- [Mail queue recovery](./mail-queue-recovery.md) — manual Artisan runbook for stranded notification emails (`--execute` sends mail immediately)
- [Phase 0 production-readiness checklist](./production-readiness-phase-0.md) — read-only production inspection, approval gates, deployment and rollback sequence
- [Phase 0 inspection evidence template](./phase-0-inspection-evidence-template.md) — blank form for the authorized administrator's read-only inspection
- [G0 findings report](./g0-findings-report.md) — findings for G1 review (blank until the authorized inspection)
- [Production migration sequence](./production-migration-sequence.md) — the four recovery migrations, data-preserving rollback, deferred migrations

## Related code

| Concern | Location |
| --- | --- |
| Frontend app | `apps/eleave` |
| Backend module | `../hrmdo_service/app-modules/eleave` (sibling repo) |
| Module config | `../hrmdo_service/config/eleave.php` |
