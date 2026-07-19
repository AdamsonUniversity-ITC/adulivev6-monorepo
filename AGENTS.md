# Project Architecture

## Stack

- Frontend: React
- Styling: Tailwind CSS
- UI framework - shadcn/ui

---

# Shared Definitions

## Reusable Component

- Used in 2+ places
- Generic UI behavior
- Accepts props, not hardcoded logic

---

# Folder Ownership

## Frontend (React + Inertia)

- apps/
- packages/

## QA

- tests/
- playwright/
- e2e/

---

## Project Manager

- docs/
- tasks/

# Agent Responsibilities

- frontend_agent: UI, pages, components
- qa_agent: testing, validation, bug reporting
- reviewer_agent: architecture + security review
- project_manager: parse and convert business terms and logic into instructions

---

# Cross-Agent Communication

Agents communicate via:

- docs/architecture.md
- docs/decisions.md
- docs/product_requirements.md
- tasks/\*.md

---

# Testing Requirements

- Frontend: `pnpm lint && pnpm build`
- E2E: `pnpm playwright test`

---

# Shared Requirement Format (CRITICAL)

All agents MUST read and write tasks using this exact structure.

No deviations allowed for implementation tasks.

---

## Task Specification Format

### Task ID

Unique identifier (auto-generated or timestamp-based)

### Feature / Context

What feature or system area this belongs to

### Objective

Clear, single-sentence goal of the task

---

### Requirements

- Bullet list of explicit requirements
- Must be implementation-ready
- No ambiguity allowed
- Must include constraints if any

---

### Acceptance Criteria

- Testable conditions that define completion
- Must be verifiable by QA agent
- Must include both:
  - happy path
  - failure cases (if applicable)

---

### Inputs / Outputs (if applicable)

**Inputs:**

- What data or user actions are expected

**Outputs:**

- What system should return or display

---

### Agent Assignment

- frontend_agent:
- qa_agent:
- reviewer_agent:
- project_manager:

Each agent MUST only act within its assigned scope.

---

### Dependencies

- List dependent tasks or features
- Include blocking relationships if any

---

### Edge Cases

- Explicit list of edge cases
- Must include invalid inputs and permission failures where relevant

---

### Notes

- Any additional context
- Business rules
- Constraints
- Clarifications from project manager

---

## Task State Rules

Valid states:

- TODO
- IN_PROGRESS
- IN_REVIEW
- TESTING
- DONE

Rules:

- Only one active state per task
- QA agent can move task to TESTING
- Reviewer agent can move task to IN_REVIEW or DONE
- Frontend agent can only set IN_PROGRESS or IN_REVIEW (if no tests required)

---

## Enforcement Rules

- Agents MUST NOT invent missing requirements
- Agents MUST request clarification if any section is unclear
- Agents MUST reject tasks missing acceptance criteria
- Agents MUST ensure tasks are implementable without assumptions

---

# ABMS Continuity Protocol

The ABMS frontend is a React/Vite application in `apps/abms`. Its Laravel API is the sibling repository at `../finance_service`, primarily under `app-modules/abms`.

For any work involving ABMS accounts, proposals, requisitions, adjustments, permissions, reports, database schema, or `finance_service`:

1. Read `skills/abms-system-knowledge/SKILL.md` before inspecting or changing code.
2. Load the task-specific documents that skill routes to under `docs/abms/`.
3. Treat source code and migrations as authoritative when they conflict with documentation, then update the documentation in the same task.
4. Preserve ID-based account identity and typed organizational identity (`department:{id}` or `section:{id}`). Names and account codes are display values and are not unique identifiers.
5. Keep financial history reconstruction read-only and surface incomplete evidence through structured data-quality warnings.

ABMS work may use these roles when a task explicitly delegates work:

- `backend_agent`: `finance_service` controllers, services, models, requests, routes, and migrations
- `frontend_agent`: `apps/abms` pages, routes, shared components, and API contracts
- `qa_agent`: automated tests, validation, builds, and regression evidence
- `reviewer_agent`: architecture, authorization, precision, query performance, and balance-integrity review
- `project_manager`: requirements, business rules, task records, and continuity documentation

Subagents are recreated per chat and must not be treated as the source of system knowledge. The canonical continuity sources are this file, `skills/abms-system-knowledge/`, `docs/abms/`, and the applicable task specification.
