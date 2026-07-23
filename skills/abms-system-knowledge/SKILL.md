---
name: abms-system-knowledge
description: Canonical operating guide for the AdULive ABMS frontend and finance_service. Use for any ABMS account, budget proposal, allocation, requisition, adjustment, permission, report, audit-history, database-schema, migration, or cross-service change; also use when onboarding a fresh agent or assessing regression risk across these workflows.
---

# ABMS System Knowledge

## Overview

Use the workspace documentation as durable memory for ABMS. It records repository boundaries, the finance-domain ERD, financial invariants, report calculations, and end-to-end workflows so work can continue safely in a new chat.

## Start Here

1. Read `../../docs/abms/continuity-status.md` and `../../docs/abms/system-context.md` for every ABMS task.
2. Read only the task-specific references below.
3. Inspect the actual source, migrations, and tests before making a change. Documentation is a maintained map, not a substitute for verification.
4. If implementation changes a relationship, invariant, endpoint family, or workflow, update the relevant reference in the same task.

## Reference Routing

- Database tables, models, relationships, account hierarchy, or migrations: read `../../docs/abms/erd.md`.
- Budget calculations, audit replay, reports, requisition balance effects, or permission rules: read `../../docs/abms/business-rules.md`.
- Architecture, lifecycle, integration, or impact analysis: read `../../docs/abms/flowcharts.md`.
- A cross-cutting change: read all four documents.

## Non-Negotiable Invariants

- Identify accounts by `accounts.id`; account codes, SAP numbers, and labels may be duplicated.
- Identify organizational ownership with both type and ID. A department and section may share the same numeric ID.
- A proposal or requisition belongs to exactly one department or section in valid business state.
- Use application-timezone inclusive boundaries for date-ranged finance reports.
- Return backend-calculated money as fixed two-decimal strings in report APIs; do not make the frontend the financial calculator.
- Date-ranged reports select live entries by inclusive application-timezone `created_at` boundaries and display their latest stored values; later edits intentionally change earlier date-range results. Audit history is not a report-calculation source.
- Treat root account code `355` as CAPEX for reports and all other root accounts as NON-CAPEX.
- Keep report projection code read-only unless a task explicitly changes a transaction workflow.

## Repository Boundaries

- Frontend: `apps/abms` in this monorepo.
- Shared frontend packages: `packages/`.
- Backend: sibling `../finance_service`; ABMS module code is under `app-modules/abms`.
- Durable requirements: `tasks/`; architecture and domain continuity: `docs/abms/`.
- Do not assume a write request for one repository authorizes unrelated changes elsewhere.

## Change Workflow

1. Locate the applicable task specification and verify its acceptance criteria.
2. Trace the request from frontend route/page through the finance API route, request validation, controller/service, models, and affected tables.
3. Search for ID-versus-code lookups, typed-unit collisions, soft-deleted rows, authorization scope, audit completeness, and money precision risks.
4. Implement the smallest coherent change, preserving existing response contracts unless the task changes them.
5. Add focused backend/frontend tests proportional to risk and run the relevant validation commands.
6. Review the diff for unintended write-path, balance, schema rollback, and historical-report changes.
7. Update `docs/abms/` when durable knowledge changed.

## Verification

- Frontend baseline: `pnpm lint && pnpm build`; prefer a targeted ABMS command first when diagnosing failures.
- E2E baseline: `pnpm playwright test` when an authenticated environment is available.
- Backend: run Laravel tests and formatting in `../finance_service`; use its Docker service when the host PHP version does not meet Composer requirements.
- Record unrelated pre-existing failures separately rather than modifying unrelated code.

## Continuity Handoff

In the final handoff, state what changed, what was verified, remaining risks, and which durable references were updated. Agents are temporary; the workspace files are the handoff.
