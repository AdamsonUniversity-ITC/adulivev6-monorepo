# ABMS-CONT-20260719-001 — Durable System Continuity

### Task ID

ABMS-CONT-20260719-001

### Feature / Context

Cross-chat architecture and business-knowledge continuity for the ABMS frontend and `finance_service`.

### Objective

Store a validated ABMS knowledge skill, full finance-domain ERD, and workflow diagrams in the workspace so newly created agents can safely continue system work.

---

### Requirements

- Add a workspace skill that activates for ABMS and `finance_service` work.
- Route new agents to canonical system context, ERD, business-rule, and flowchart documents.
- Document all ABMS finance-domain tables and logical external organization, identity, permission, audit, and media relationships.
- Document account ID, typed-unit, money, audit replay, requisition refund, authorization, warning, and print invariants.
- Diagram system boundaries, proposal/allocation, requisition/refund, historical reporting, request snapshot, authorization, and change-impact flows.
- Update root agent instructions so new chats use the durable knowledge before ABMS work.
- Keep the documents trackable even though the repository otherwise ignores new files under `docs/` and `tasks/`.

---

### Acceptance Criteria

- A fresh agent can locate both repositories and the relevant report entry points using workspace instructions alone.
- The ERD includes accounts, proposals, allocations, proposal items, adjustments, requisitions/items, payee details, chats/reads, permissions, settings/status/supplies, audits/media, and logical external directory entities.
- The documents state that account codes may duplicate and typed department/section keys cannot collide.
- Budget Performance and requisition/refund calculations are recoverable without prior chat context.
- Mermaid diagrams are stored in the repository and Markdown fences are balanced.
- The skill passes the skill-creator structural validator.
- Missing or stale source evidence is not presented as authoritative; agents are instructed to verify and update documentation.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- Current ABMS frontend routes and pages.
- Current `finance_service` routes, models, migrations, schema, and implemented report rules.
- Confirmed requirements from completed ABMS tasks.

**Outputs:**

- `skills/abms-system-knowledge/`
- `docs/abms/system-context.md`
- `docs/abms/erd.md`
- `docs/abms/business-rules.md`
- `docs/abms/flowcharts.md`
- ABMS continuity instructions in `AGENTS.md`

---

### Agent Assignment

- frontend_agent: Validate frontend paths, report pages, shared UI, and route context.
- qa_agent: Validate file presence, skill structure, Markdown consistency, and fresh-context usability.
- reviewer_agent: Review domain coverage, invariants, and misleading or unsafe assumptions.
- project_manager: Own the canonical continuity documents and keep them synchronized with future tasks.

---

### Dependencies

- Existing ABMS implementation and completed task specifications.
- Read access to sibling `../finance_service`.
- Root `AGENTS.md` is loaded by new workspace chats.

---

### Edge Cases

- Documentation becomes stale after a schema or workflow change.
- A new chat recognizes project instructions but does not auto-register project-local skills.
- Cross-database relationships exist without physical foreign keys.
- Framework tables exist in the finance database but do not participate in ABMS financial relationships.
- Mermaid rendering is unavailable locally even when source syntax is valid.
- A preflight mapping can become stale before locked transactional revalidation.

---

### Notes

- State: DONE
- Agents remain chat-scoped. Durable continuity comes from repository files, not preserved agent processes.
- Source code and migrations remain authoritative when verified documentation differs.
