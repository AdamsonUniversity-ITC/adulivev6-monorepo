# eLeave Email Service: Phase 0 Inspection Evidence Template

Blank template. Status: **not yet filled in; no production inspection has taken place.**

Copy this template into the IT change ticket for the inspection. Do not fill it in inside a repository: the completed form contains host names, accounts, and staff email data.

The commands referenced here are in the [Phase 0 checklist](./production-readiness-phase-0.md) (section numbers in brackets). Every command is read-only. Commands that need extra care are marked.

## How to record findings

- **Every field starts as `UNKNOWN`.** Replace it only with what was observed on production, giving the source: the command or screen, the host, and the time.
- **Local configuration is not evidence.** Never fill a field from local Docker, `.env.example`, code defaults or memory. A framework default may be recorded only as "absent from the command line; Laravel default applies", with the `--help` output as evidence.
- **Unanswered items go in the [Unknowns register](#13-unknowns-register)** with the reason (for example: no access, history disabled, the owner did not reply).
- **Attachments** (`E-01`, `E-02`, …) are console transcripts or screenshots stored in the ticket. Mask passwords, API keys and full `.env` values before attaching.
- **Stop the inspection and record why** if a step would need a change (enabling task history, starting a service, installing a tool, editing a file).

## 0. Session record

| Field | Value |
| --- | --- |
| Change or ticket reference | UNKNOWN |
| G0 authorization: production server administrator (name, date, scope) | UNKNOWN |
| Inspecting administrator | UNKNOWN |
| Observer (developer or IT), if any | UNKNOWN |
| Date and time window (with time zone) | UNKNOWN |
| Hosts inspected | UNKNOWN |
| Accounts used (Windows, database) and confirmation that the database account is read-only | UNKNOWN |
| Read-only confirmation: no Task Scheduler change, no worker start/stop/restart, no `queue:*` write command, no migration, no recovery or quarantine, no email sent, no production data changed | UNKNOWN (signature) |

## 1. PRIORITY: mail-server log retention (do first)

**Why first:** the stranded eLeave backlog dates from about 2026-09-20. If the mail system keeps logs for 30 days, the earliest relevant evidence would expire around **2026-10-20**. This is a hypothetical; the real retention is unknown and must be confirmed. Evidence for possibly-delivered notifications is lost when the logs expire.

**Read-only scope:** identify the mail system and read its retention setting and earliest available log date. **Do not export, copy or download logs.** That needs separate authorization (gate L1 in the checklist).

| Field | Value | Evidence |
| --- | --- | --- |
| Mail system that relays eLeave mail (`mail.default`, SMTP host and port from [2]; product: on-premises relay, Exchange, Microsoft 365, Google Workspace, other) | UNKNOWN | |
| Mail system administrator (name or role) | UNKNOWN | |
| Where delivery logs or message traces are kept (server log path, admin console, SIEM) | UNKNOWN | |
| Configured retention period, from the product setting or vendor documentation for the licensed tier | UNKNOWN | |
| Earliest date currently searchable in the logs | UNKNOWN | |
| Oldest eLeave notification needing evidence (from backlog inventory [4], aggregate dates only) | UNKNOWN | |
| Date the oldest needed evidence expires (earliest searchable date + retention) | UNKNOWN | |
| Days remaining at the time of inspection | UNKNOWN | |
| Are SMTP relay logs kept separately from the mailbox provider (two evidence sources)? | UNKNOWN | |
| Is log export possible without changing configuration? | UNKNOWN | |
| **Decision needed:** request L1 authorization to export the relevant log window now? | UNKNOWN | |

## 2. Task Scheduler task "HRMDO Service Queue Worker" [1]

| Field | Value | Evidence |
| --- | --- | --- |
| Host | UNKNOWN | |
| Task path and name (all similarly named copies) | UNKNOWN | |
| State (Ready, Running, Disabled) | UNKNOWN | |

### 2.1 General tab

| Field | Value | Evidence |
| --- | --- | --- |
| Run-as account (`Principal.UserId`) | UNKNOWN | |
| Account type (local, domain, gMSA, built-in) | UNKNOWN | |
| Logon type: "Run only when user is logged on", "Run whether user is logged on or not", or "Do not store password" (S4U) | UNKNOWN | |
| "Run with highest privileges" (`RunLevel`) | UNKNOWN | |
| Account is a member of local Administrators, directly or through a group | UNKNOWN | |
| Domain group memberships of note | UNKNOWN | |
| User rights: Log on as a batch job, or denied it (`secedit` export to the operator's own %TEMP% only) | UNKNOWN | |
| ACLs: `<app_root>` (read), `storage` and `bootstrap\cache` (modify), `.env` (read) | UNKNOWN | |
| "Configure for" (OS version) | UNKNOWN | |
| Hidden | UNKNOWN | |
| Author, description, registration date | UNKNOWN | |

### 2.2 Triggers tab

| Field | Value | Evidence |
| --- | --- | --- |
| Each trigger: type (startup, logon, schedule, other) | UNKNOWN | |
| Delay | UNKNOWN | |
| Repetition interval and duration | UNKNOWN | |
| "Stop task if it runs longer than" (per trigger) | UNKNOWN | |
| Enabled, start and expiry dates | UNKNOWN | |
| Does the worker start after a reboot without anyone logging on? | UNKNOWN | |

### 2.3 Actions tab

| Field | Value | Evidence |
| --- | --- | --- |
| Program (`Execute`) | UNKNOWN | |
| Arguments (**the actual worker command line**) | UNKNOWN | |
| Start in (`WorkingDirectory`) | UNKNOWN | |
| Wrapper script path and full content (`.bat`, `.cmd` or `.ps1`, plus anything it calls) | UNKNOWN | |
| Wrapper contains loops, `queue:restart`, `--once`, `--stop-when-empty`, environment overrides or output redirection | UNKNOWN | |
| Number of actions | UNKNOWN | |

### 2.4 Conditions tab

| Field | Value | Evidence |
| --- | --- | --- |
| Start only if the computer is idle; stop if no longer idle; restart if idle resumes | UNKNOWN | |
| Start only on AC power; stop if switching to battery | UNKNOWN | |
| Wake the computer to run | UNKNOWN | |
| Start only if a network connection is available (which one) | UNKNOWN | |

### 2.5 Settings tab

| Field | Value | Evidence |
| --- | --- | --- |
| Allow task to be run on demand | UNKNOWN | |
| Run as soon as possible after a scheduled start is missed | UNKNOWN | |
| If the task fails, restart every … up to … times (`RestartInterval`, `RestartCount`) | UNKNOWN | |
| **Stop the task if it runs longer than** (`ExecutionTimeLimit`; the Windows default is 3 days) | UNKNOWN | |
| Force stop if the task does not end when requested (`AllowHardTerminate`) | UNKNOWN | |
| Delete the task if not scheduled to run again | UNKNOWN | |
| **If the task is already running** (`MultipleInstances`: IgnoreNew, Parallel, Queue, StopExisting) | UNKNOWN | |
| Priority | UNKNOWN | |

### 2.6 Task history

| Field | Value | Evidence |
| --- | --- | --- |
| Operational log enabled (`IsEnabled`), record count, oldest record | UNKNOWN | |
| Last run time, last result (`LastTaskResult`), next run, missed runs | UNKNOWN | |
| Start, stop, terminate and failure events from 2026-09-01 onward (IDs 100, 101, 102, 103, 111, 129, 200, 201, 203, 322) | UNKNOWN | |
| Explanation of the worker stop around 2026-09-20 from history | UNKNOWN | |
| Is history disabled? (Record it; do not enable it) | UNKNOWN | |

### 2.7 Restart behaviour (derived from 2.2 to 2.6; mark each "confirmed" or "UNKNOWN")

| Situation | Does a worker exist afterwards? | Evidence |
| --- | --- | --- |
| Worker crashes (non-zero exit) | UNKNOWN | |
| Worker exits cleanly (exit 0: `queue:restart`, `--max-time`, `--stop-when-empty`) | UNKNOWN | |
| Worker hangs (process alive, not polling) | UNKNOWN | |
| Server reboots | UNKNOWN | |
| Task reaches its execution time limit | UNKNOWN | |

## 3. Worker command and PHP runtime [1, 2]

| Field | Value | Evidence |
| --- | --- | --- |
| Full running worker command line(s) (`Win32_Process`, elevated) | UNKNOWN | |
| Process owner, parent process and start time | UNKNOWN | |
| Number of running worker processes on this host | UNKNOWN | |
| `<php>` path used by the task | UNKNOWN | |
| `php -v` | UNKNOWN | |
| `php --ini` (loaded ini file) | UNKNOWN | |
| Relevant extensions from `php -m` (`pdo_mysql`, `openssl`, `mbstring`, `fileinfo`; `pcntl` present yes/no) | UNKNOWN | |
| `memory_limit`, `date.timezone` | UNKNOWN | |
| `artisan --version` | UNKNOWN | |
| `queue:work --help` defaults (attach) | UNKNOWN | |

## 4. Queue settings [2]

| Setting | Effective value | From command line or config? | Evidence |
| --- | --- | --- | --- |
| Connection argument | UNKNOWN | | |
| `--queue` | UNKNOWN | | |
| `--tries` | UNKNOWN | | |
| `--timeout` | UNKNOWN | | |
| `--sleep` | UNKNOWN | | |
| `--max-time`, `--max-jobs`, `--memory`, `--stop-when-empty`, `--once`, `--backoff`, `--rest` | UNKNOWN | | |
| `queue.default` | UNKNOWN | | |
| `queue.connections.database` (connection, table, queue, `retry_after`, `after_commit`) | UNKNOWN | | |
| `queue.failed` (driver, database, table) | UNKNOWN | | |
| `ELEAVE_MAIL_QUEUE` set? (name only) | UNKNOWN | | |
| Config cache state (`about`: cached or not) | UNKNOWN | | |
| Is `retry_after` greater than the worst-case send time? | UNKNOWN | | |

## 5. Cache configuration and process fingerprint inputs [2, 6]

Fill in one column per process context. IIS values come from the shared deployment files plus the FastCGI environment; the CLI values come from `config:show` run as the worker account.

| Field | IIS (website) | CLI worker | Recovery operator account | Match? |
| --- | --- | --- | --- | --- |
| Host | UNKNOWN | UNKNOWN | UNKNOWN | |
| Deployment path (IIS physical path or task "Start in") | UNKNOWN | UNKNOWN | UNKNOWN | |
| `.env` SHA-256 | UNKNOWN | UNKNOWN | UNKNOWN | |
| `bootstrap\cache\config.php` SHA-256, or "not cached" | UNKNOWN | UNKNOWN | UNKNOWN | |
| PHP binary and version (`php-cgi.exe` for IIS) | UNKNOWN | UNKNOWN | UNKNOWN | |
| `APP_ENV` | UNKNOWN | UNKNOWN | UNKNOWN | |
| `cache.default` (store) and driver | UNKNOWN | UNKNOWN | UNKNOWN | |
| `cache.stores.<store>`: connection, table, lock connection, lock table, store-level prefix | UNKNOWN | UNKNOWN | UNKNOWN | |
| **`cache.prefix` (effective)** | UNKNOWN | UNKNOWN | UNKNOWN | |
| Redis client prefix (only if the cache driver is Redis) | UNKNOWN | UNKNOWN | UNKNOWN | |
| `database.default`, host, port, database | UNKNOWN | UNKNOWN | UNKNOWN | |
| `DB_QUEUE_CONNECTION`, `DB_CACHE_CONNECTION` (unset, or equal to `DB_CONNECTION`) | UNKNOWN | UNKNOWN | UNKNOWN | |
| FastCGI or machine environment variable names overriding `APP_`, `DB_`, `CACHE_`, `QUEUE_` (names only) | UNKNOWN | UNKNOWN | UNKNOWN | |
| IIS app pool identity type (record only; do not change permissions) | UNKNOWN | n/a | n/a | |

The runtime comparison (the worker heartbeat fingerprint against the recovery dry run's `Worker heartbeat evidence` line) is only possible after deployment (gate G5). Record "not deployed" here.

## 6. Active worker hosts [3]

One row per host that runs or could run `hrmdo_service`. Hosts with zero workers must be listed too.

| Host | Role (IIS, worker, Docker, DR, other) | `hrmdo_service` deployed? Path | Scheduled tasks running artisan or PHP | Services or wrappers | Running worker processes (count, command) | Linux cron, supervisor, systemd, Docker | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UNKNOWN | | | | | | | |

| Field | Value | Evidence |
| --- | --- | --- |
| Source of the host list (CMDB, DNS, IIS farm, load balancer, deployment targets) | UNKNOWN | |
| Is IIS a single server or a farm? | UNKNOWN | |
| Database connections to `<hrmdo_db>` grouped by client host [3.4] | UNKNOWN | |
| Every connected client host attributed to a known host? | UNKNOWN | |
| Queue movement snapshots, at least `retry_after` + 60 s apart [3.5] (times, pending, attempts) | UNKNOWN | |
| Hosts running `schedule:run`, and the account used | UNKNOWN | |

## 7. Shared jobs-table consumers [3.7]

| Field | Value | Evidence |
| --- | --- | --- |
| Other applications whose configuration points at `<hrmdo_db>` (`DB_DATABASE` and `DB_HOST` lines only) | UNKNOWN | |
| Other applications using a `jobs` table in `<hrmdo_db>` | UNKNOWN | |
| Workers belonging to those applications (host, command) | UNKNOWN | |
| Non-eLeave job classes present in `jobs` (from [4.2]) | UNKNOWN | |
| eLeave jobs found in another application's `failed_jobs` (aggregate) | UNKNOWN | |

## 8. Backlog inventory (aggregates only) [4]

| Field | Value | Evidence |
| --- | --- | --- |
| Database session and global time zone | UNKNOWN | |
| Tables present (4.1) | UNKNOWN | |
| `jobs` by queue and class: counts, reserved, attempts, oldest, newest (4.2) | UNKNOWN | |
| eLeave backlog by day (4.3) | UNKNOWN | |
| `failed_jobs` by queue and class (4.4) | UNKNOWN | |
| eLeave failed jobs by day and exception type (4.5; keep confidential) | UNKNOWN | |
| Recovery logs, quarantine and parked claims (4.6), or "tables absent" | UNKNOWN | |
| Worker heartbeats (4.7), or "table absent" | UNKNOWN | |

## 9. Migration status [5]

See [Production migration sequence](./production-migration-sequence.md).

| Field | Value | Evidence |
| --- | --- | --- |
| `migrate:status` output (attach) | UNKNOWN | |
| Pending migrations other than the four eLeave ones (`2026_10_09_000001`, `000002`, `000003`, `000007`) | UNKNOWN | |
| Any of the four already Ran, any removed or deferred eLeave migration listed, or any `eleave_*` table present | UNKNOWN | |
| `SHOW INDEX FROM eleave_email_service_heartbeats`, if the table exists | UNKNOWN | |
| Base prerequisites present (`migrations`, `jobs`, `failed_jobs.uuid`, `cache`, `cache_locks`) | UNKNOWN | |
| `MAX(batch)` in `migrations` | UNKNOWN | |

## 10. Frontend build and deployment procedure [9]

Optional for this scope: manual mail recovery deploys no frontend change. Record for future eLeave frontend releases.

| Field | Value | Evidence |
| --- | --- | --- |
| Who builds the production eLeave frontend, and where (developer machine, CI, server) | UNKNOWN | |
| Exact build command used today (`pnpm build`, `vite build`, other) | UNKNOWN | |
| Node and pnpm versions used | UNKNOWN | |
| How the bundle reaches production (copy, CI deploy, IIS site path) | UNKNOWN | |
| Production `VITE_*` or API base URL settings source (names only) | UNKNOWN | |
| Is the type check (`tsc -b`) part of the production build? (Locally it fails with 31 baseline errors) | UNKNOWN | |
| Rollback method for the frontend (previous bundle kept where?) | UNKNOWN | |

## 11. Approval owners (to be confirmed by IT management)

The proposed roles are in the [checklist](./production-readiness-phase-0.md#approval-gates). Record the named person who accepts each gate. The developer prepares evidence and plans; the developer alone cannot approve production infrastructure changes or HR business decisions.

| Gate | Named approver(s) | Confirmed by | Date |
| --- | --- | --- | --- |
| G0 | UNKNOWN | | |
| L1 (log export) | UNKNOWN | | |
| G1 | UNKNOWN | | |
| G2 | UNKNOWN | | |
| G3 | UNKNOWN | | |
| G4 | UNKNOWN | | |
| G5 | UNKNOWN | | |
| G6 | UNKNOWN | | |
| G7 | UNKNOWN | | |
| G9+ (per feature) | UNKNOWN | | |

## 12. Observations and stop conditions hit

| # | Observation | Severity (stop, risk, info) | Follow-up owner |
| --- | --- | --- | --- |
| | | | |

## 13. Unknowns register

Every field still `UNKNOWN` after the session is listed here.

| Section and field | Why unknown | Who can answer | Needed before gate |
| --- | --- | --- | --- |
| | | | |

## 14. Sign-off

| Role | Name | Signature and date |
| --- | --- | --- |
| Inspecting administrator (confirms read-only) | | |
| Production server administrator (G0 authority) | | |
| IT manager (accepts findings for G1) | | |
