# eLeave Manual Mail Recovery: G0 Findings Report (for G1 review)

Status: **blank skeleton. Evidence collection has not started.** As of 2026-10-12 the responsible production server administrator has not yet authorized read-only production inspection. No production command has been run.

This report is written only from the completed [Phase 0 inspection evidence template](./phase-0-inspection-evidence-template.md), which is the authoritative evidence record. Every statement cites an evidence reference (`E-nn`) giving the host, source, collection time and administrator. Anything without evidence is listed under [Unknown or inaccessible evidence](#3-unknown-or-inaccessible-evidence), never as a fact. Local Docker values are never used as production evidence.

## 1. Inspection record

| Field | Value |
| --- | --- |
| G0 authorization (production server administrator, date, scope) | Not yet given |
| Inspecting administrator | — |
| Inspection window (with time zone) | — |
| Hosts inspected | — |
| Evidence template location (IT ticket) | — |
| Read-only confirmation signed | — |
| Mail administrator consulted on log retention (name, date) | — |

## 2. Confirmed facts

Fill in only from evidence, citing a reference for each.

| Area | Finding | Evidence |
| --- | --- | --- |
| Mail-server log retention (priority 1) | — | — |
| Task Scheduler: General (account, logon type, privileges) | — | — |
| Task Scheduler: Triggers | — | — |
| Task Scheduler: Actions (actual worker command) | — | — |
| Task Scheduler: Conditions | — | — |
| Task Scheduler: Settings (time limit, restart on failure, multiple instances) | — | — |
| Task history (including the stop around 2026-09-20) | — | — |
| Worker process behaviour (count, owner, restart after crash, clean exit, hang, reboot) | — | — |
| Queue configuration (`--queue`, `--tries`, `--timeout`, `--sleep`, other flags) | — | — |
| `retry_after` and failed-job driver | — | — |
| Cache store, driver, lock table and effective prefix (IIS vs CLI) | — | — |
| Database connection (queue and cache on the same connection?) | — | — |
| PHP runtime (IIS and CLI) | — | — |
| Worker hosts (all, including those with zero workers) | — | — |
| Other applications or workers sharing the `jobs` table | — | — |
| Migration status | — | — |
| Backlog inventory (aggregates only) | — | — |

## 3. Unknown or inaccessible evidence

Copy every item from the template's unknowns register, with the reason and who can answer it.

| Item | Why unknown or inaccessible | Who can answer | Blocks gate |
| --- | --- | --- | --- |
| All items | Inspection not authorized yet | Production server administrator | G0 |

## 4. Gate readiness

A gate is marked ready only with cited evidence. "Not assessed" is the default.

| Gate | Readiness | Evidence | Notes |
| --- | --- | --- | --- |
| G0 (read-only inspection) | **Not authorized** | — | Awaiting the production server administrator |
| L1 (log export or preservation) | Not requested | — | Request depends on the retention findings |
| G1 (findings review) | Not assessed | — | Needs this report completed |
| G2 (backups) | Not assessed | — | |
| G3 (stop the worker for recovery; any Task Scheduler change) | Not assessed | — | |
| G4 (migrations) | Not assessed | — | See [Production migration sequence](./production-migration-sequence.md) |
| G5 (fingerprint and safety preflight) | Not assessed | — | Heartbeat fingerprint comparison only possible after deployment and one worker run |
| G6 (production recovery) | Not assessed | — | HR business decision required; `--execute` sends email immediately |
| G7 (worker restart after verify is READY, and test notification) | Not assessed | — | |
| G9+ (deferred features) | Not assessed | — | Send-time eligibility, notification identity, queue isolation, and the deferred ledger and events migrations stay disabled. The watchdog, automatic restart and HR monitoring UI were removed from scope |

## 5. Unresolved risks

Carried over from the [Phase 0 checklist](./production-readiness-phase-0.md#risks). Each remains unconfirmed until evidence confirms or rules it out.

| Risk | Status | Evidence |
| --- | --- | --- |
| Mail-server log evidence expiring before review | Unconfirmed | — |
| An unknown second worker, or another application, consuming the same queue | Unconfirmed | — |
| Task Scheduler execution time limit or instance policy killing a worker mid-send | Unconfirmed | — |
| A clean worker exit not restarted by Task Scheduler (silent outage) | Unconfirmed | — |
| `retry_after` shorter than the worst-case send (duplicate sends) | Unconfirmed | — |
| IIS and CLI using a different cache store, database or prefix | Unconfirmed | — |
| Unexpected pending migrations, or eLeave tables already present | Unconfirmed | — |
| No worker heartbeat evidence at the first recovery (`--execute` refuses) | Expected until evidence is recorded with the heartbeat probe worker (never the normal worker while mail is queued) | — |

## 6. Recommended next actions

Fill in after the evidence review. Each action names the gate and the owner who must approve it.

| # | Action | Gate | Proposed owner |
| --- | --- | --- | --- |
| 1 | Obtain explicit read-only inspection authorization | G0 | Production server administrator |
| 2 | Confirm mail-server log retention with the mail administrator, before anything else | G0 (read-only); L1 for any export or preservation | Mail system administrator |

## 7. Required approvals

| Approval | Purpose | Proposed owner | Status |
| --- | --- | --- | --- |
| G0 | Read-only production inspection | Production server administrator | Not given |
| L1 | Export or preservation of mail-server logs | Mail system administrator (data protection officer consulted) | Not requested |
| G1 | Acceptance of these findings | IT manager, application owner, HR process owner | Pending report |
