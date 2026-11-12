# eLeave Manual Mail Recovery: Phase 0 Production-Readiness Checklist

Prepared: 2026-10-12, revised for the manual recovery scope. Status: **for review; no production access has taken place.**

**Scope (revised 2026-10-12).** Recovery is a manual, operator-run Artisan workflow (`eleave:recover-mail-queue`, `eleave:quarantine-mail-queue`, `eleave:verify-mail-queue`) with locks, quarantine, audit logs, and passive worker heartbeats. The HR monitoring UI, the status and restart API, the watchdog, automatic restart, holds, automated pauses and the worker controller were removed from the code. The Windows Scheduled Task and the normal queue worker are unchanged.

This document prepares the production-readiness work: a read-only inspection of production (Phase 0), the gates that must be approved before any change, and the deployment, rollback, and IT review procedures that follow. It adds no production functionality and activates nothing.

**G0 status (2026-10-12):** approved in principle for controlled, read-only inspection. It is subject to authorization from the responsible production server administrator. The inspection is performed only by that authorized administrator, using this procedure, and recorded in the [inspection evidence template](./phase-0-inspection-evidence-template.md). **Mail-server log retention is inspected first** (section 8).

Related documents:

- [Mail queue recovery](./mail-queue-recovery.md) (runbook);
- [Phase 0 inspection evidence template](./phase-0-inspection-evidence-template.md);
- [Production migration sequence](./production-migration-sequence.md);
- [G0 findings report](./g0-findings-report.md) (blank until the authorized inspection).

## Ground rules for Phase 0

- **Read-only.** Phase 0 only reads Task Scheduler definitions, process lists, configuration values, file hashes, ACLs, and database rows. It does not modify Task Scheduler, start/stop/restart workers, pause queues, run migrations, run recovery or quarantine, retry jobs, send email, change IIS, or grant the IIS app pool any additional Windows permission.
- **Approval first.** Production access for Phase 0 itself needs approval (gate G0). Every step after Phase 0 has its own gate (see [Approval gates](#approval-gates)).
- **Not allowed during Phase 0**, even though some look harmless:
  - `queue:restart` (writes a cache key that stops every worker).
  - `queue:pause` and `queue:resume`.
  - `queue:retry`, `queue:forget`, `queue:flush`, `queue:clear` and `queue:prune-failed`.
  - `config:cache`, `config:clear`, `optimize` and `optimize:clear`.
  - `migrate` in any form except `migrate:status`.
  - `eleave:recover-mail-queue` and `eleave:quarantine-mail-queue`. A dry run of either still takes a short-lived cache lock, which is a write.
  - In Task Scheduler: `schtasks /Run|/End|/Change|/Create|/Delete`, `Enable-`, `Disable-`, `Set-`, `Start-`, `Stop-` or `Register-ScheduledTask`.
- **Artisan writes logs.** Any `php artisan` call may append to `storage/logs`. Run artisan commands as the worker's own account where possible, so new log files keep the expected owner and ACLs. Otherwise, confirm that `storage\logs` ACL inheritance gives IIS and the worker write access to files created by another account.
- **Handle output as confidential.** Queue payloads and failed-job exceptions contain staff names and email addresses. Phase 0 queries return **aggregates only**. Store outputs outside every repository, in the IT ticket for this work.
- **Placeholders** (fill in during Phase 0):
  - `<app_root>`: the `hrmdo_service` deployment directory.
  - `<php>`: the full path to the `php.exe` used by the worker task.
  - `<hrmdo_db>`: the production database name.
  - `<task>`: `HRMDO Service Queue Worker`.

## Current local baseline (what would be deployed)

| Item | State |
| --- | --- |
| Last local commit | `3beeeb3` on branch `eleave` (with `0e72a97`, not on any remote branch). Everything after it is uncommitted working-tree changes. Nothing is pushed |
| `app/Providers/AppServiceProvider.php` | Unrelated local change; must not be committed (file sha256 `4a0e62d0…8f3b`, diff sha256 `852ce554…77a4`) |
| Recovery, quarantine, verify, review commands | Implemented locally. `--execute` refuses unless worker heartbeats prove every worker is stopped and no job is reserved |
| Passive worker heartbeats | Implemented locally; written by the normal worker, read only by recovery and quarantine |
| HR monitoring UI, status/restart API, watchdog, automatic restart, holds, automated pauses, worker controller | **Removed** from code |
| Migrations | Four in scope (`2026_10_09_000001`, `000002`, `000003`, `000007`); events and ledger migrations deferred; holds and restart-request migrations deleted. See [production-migration-sequence.md](./production-migration-sequence.md) |
| Dedicated mail queue (`ELEAVE_MAIL_QUEUE`) | Off (unset) |
| Notification identity (`eleave.notification_identity.enabled`) | `false`, no env switch |
| Send-time eligibility (`eleave.send_time_eligibility.enabled`) | `false`, no env switch; `GuardsSendTime` not on any production mailable; `SendTimeTracking` not registered |
| Production recovery | Never executed |

---

## 1. Task Scheduler task "HRMDO Service Queue Worker"

**Goal:** know exactly how the production worker is started, as whom, with what command, and what Windows does when it stops, hangs, or the server reboots. The administrator needs this to stop the worker reliably before recovery and to restart it afterwards; the code never touches the task.

Run in an elevated PowerShell **read-only** session on the host that owns the task. If the task is not in the root folder, add `-TaskPath`.

```powershell
$name = 'HRMDO Service Queue Worker'

# Locate it (and any similarly named copy) in every folder
Get-ScheduledTask | Where-Object TaskName -like '*HRMDO*' | Select-Object TaskPath, TaskName, State

$t = Get-ScheduledTask -TaskName $name
# General tab
$t | Format-List TaskPath, TaskName, State, Author, Description, Date, URI
$t.Principal | Format-List UserId, GroupId, LogonType, RunLevel, ProcessTokenSidType, RequiredPrivilege
# Triggers tab
$t.Triggers | Format-List *
# Actions tab
$t.Actions | Format-List Execute, Arguments, WorkingDirectory
# Conditions and Settings tabs
$t.Settings | Format-List *
$t.Settings.IdleSettings | Format-List *
$t.Settings.NetworkSettings | Format-List *
# Run state and last result
Get-ScheduledTaskInfo -TaskName $name | Format-List LastRunTime, LastTaskResult, NextRunTime, NumberOfMissedRuns
# Complete definition (printed to the console only; never re-imported)
Export-ScheduledTask -TaskName $name
schtasks /Query /TN "$name" /V /FO LIST
```

If the action runs a wrapper (`.bat`, `.cmd`, `.ps1`), read it and every script it calls: `Get-Content '<wrapper path>'`. Look for loops (`goto`), `queue:restart`, `--once`, `--stop-when-empty`, output redirection, and hard-coded environment variables.

**Task history** (read only; do not enable history if it is off):

```powershell
Get-WinEvent -ListLog 'Microsoft-Windows-TaskScheduler/Operational' | Format-List IsEnabled, RecordCount
Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-TaskScheduler/Operational'; StartTime = (Get-Date).AddDays(-45) } |
  Where-Object { $_.Message -match [regex]::Escape($name) } |
  Select-Object TimeCreated, Id, LevelDisplayName, Message -First 300
```

Useful event IDs to confirm against the messages:

| Event ID | Meaning |
| --- | --- |
| 100 | Task started |
| 101 | Start failed |
| 102 | Task completed |
| 103 | Action failed to start |
| 111 | Task terminated |
| 129 | Task process created |
| 200 | Action started |
| 201 | Action completed |
| 203 | Action failed to start |
| 322 | Instance already running; request ignored |

The window should cover the stop around 2026-09-20.

**Execution account and privileges** (read only):

```powershell
$acct = $t.Principal.UserId
Get-LocalGroupMember -Group Administrators          # is the task account (or a group it is in) a local admin?
net user $acct                                      # local account; use "net user <name> /domain" for a domain account
icacls "<app_root>"
icacls "<app_root>\storage"
icacls "<app_root>\bootstrap\cache"
icacls "<app_root>\.env"
# "Log on as a batch job" right; writes one file to the operator's own %TEMP% only
secedit /export /areas USER_RIGHTS /cfg "$env:TEMP\hrmdo-phase0-rights.inf"
Select-String -Path "$env:TEMP\hrmdo-phase0-rights.inf" -Pattern 'SeBatchLogonRight|SeServiceLogonRight|SeDenyBatchLogonRight'
```

**Record for every tab:**

| Tab | Record | Why it matters |
| --- | --- | --- |
| General | User account, "Run only when user is logged on" vs "Run whether user is logged on or not", "Do not store password" (S4U), "Run with highest privileges", "Configure for", hidden | A logged-on-only task stops at logoff. S4U has no network credentials, so network shares (for example `FILE_STORAGE_PATH`) are unreachable. Highest privileges or an admin account is more than a worker needs |
| Triggers | Type (at startup, at logon, schedule, repetition), delay, repeat interval and duration, "Stop task if it runs longer than", enabled, expiry | No startup trigger means no worker after a reboot. A repeating trigger together with "run a new instance" or "stop existing" can start duplicate workers or kill one mid-send |
| Actions | Program, arguments, "Start in". The **actual worker command line** | Source of truth for `--queue`, `--tries`, `--timeout`, `--sleep` and the PHP binary (section 2) |
| Conditions | Start only if idle, stop if no longer idle, AC power only, stop on battery, wake to run, network availability | Defaults on servers can silently prevent starts |
| Settings | Allow on demand, run ASAP after a missed start, "If the task fails, restart every … attempt up to …", **"Stop the task if it runs longer than"** (Windows default 3 days), force stop, delete if not scheduled, **"If the task is already running"** (IgnoreNew, Parallel, Queue, StopExisting) | The 3-day limit would kill a long-running worker, possibly mid-send. A job killed mid-send is re-reserved after `retry_after` and can be sent twice. Restart-on-failure does not fire on a clean exit (exit code 0), for example after `queue:restart` or `--max-time` |

**Pass criteria (must all be known, not assumed):**

- Exactly one task definition starts `hrmdo_service` workers on this host, or every one of them is listed.
- The account is known, is not a local or domain admin unless IT justifies it, and has the minimum ACLs:
  - read on `<app_root>`;
  - modify on `storage` and `bootstrap\cache`;
  - read on `.env`.
- The timeout is known: no execution time limit, or one longer than the intended worker lifetime, with the kill-mid-send risk accepted.
- Restart behaviour after a crash, a clean exit and a reboot is known.
- The task's state at the time of the outage is explained from history, if history is available.

---

## 2. Production queue worker settings

Read the values from the task action (section 1) and from the effective configuration. Run from `<app_root>` as the worker account where possible, using the **same `<php>`** as the task.

```powershell
& '<php>' -v
& '<php>' --ini
& '<php>' -m
& '<php>' -r "echo 'memory_limit=', ini_get('memory_limit'), PHP_EOL, 'timezone=', date_default_timezone_get(), PHP_EOL, 'pcntl=', (extension_loaded('pcntl') ? 'yes' : 'no'), PHP_EOL;"
& '<php>' artisan --version
& '<php>' artisan queue:work --help                      # installed defaults for every flag
& '<php>' artisan about --only=environment,cache,drivers
& '<php>' artisan config:show queue.default
& '<php>' artisan config:show queue.connections.database # driver, connection, table, queue, retry_after, after_commit (no secrets)
& '<php>' artisan config:show queue.failed
& '<php>' artisan config:show cache.default
& '<php>' artisan config:show cache.stores.database
& '<php>' artisan config:show cache.prefix
& '<php>' artisan config:show database.default
& '<php>' artisan config:show database.connections.mysql.host
& '<php>' artisan config:show database.connections.mysql.port
& '<php>' artisan config:show database.connections.mysql.database
& '<php>' artisan config:show mail.default
& '<php>' artisan config:show eleave                     # only if the eLeave config block exists in the deployed release
```

Never run `config:show database.connections.mysql`, `config:show mail.mailers.smtp` or `config:show database` without a key suffix: they print passwords.

| Setting | Source | Laravel 12 default if absent | Record and check |
| --- | --- | --- | --- |
| Connection argument | task arguments | `QUEUE_CONNECTION` (`database`) | must be `database` |
| `--queue` | task arguments | the connection's queue (`DB_QUEUE`, default `default`) | must include every queue eLeave mail is on. Today that is `default`; `eleave-mail` only after isolation is approved |
| `--tries` | task arguments | `1` | eLeave mailables declare none, so this flag governs. With `1`, any exception sends the job to `failed_jobs` immediately |
| `--timeout` | task arguments | `60` | **Not enforced on Windows (no `pcntl`)**. A hung send is only recovered by re-reservation after `retry_after` |
| `--sleep` | task arguments | `3` | polling interval |
| `--max-time`, `--max-jobs`, `--memory`, `--stop-when-empty`, `--once` | task arguments | `0`, `0`, `128`, off, off | any of these makes the worker exit cleanly; combined with the Task Scheduler restart behaviour this decides whether a worker exists afterwards |
| `retry_after` | `DB_QUEUE_RETRY_AFTER` | `90` | must be longer than the longest expected send. Too short means a slow SMTP send is picked up again by another worker and sent twice |
| Failed-job driver | `QUEUE_FAILED_DRIVER` | `database-uuids` | `failed_jobs.uuid` must exist |
| `after_commit` | config | `false` | record |
| Cache store | `CACHE_STORE` | `database` | must be `database` or `redis` so the recovery lock is shared. `file` only works on a single host; `array` and `null` are refused by the recovery tooling |
| Cache prefix | `CACHE_PREFIX` / `APP_NAME` | slug of `APP_NAME` + `-cache-` | must be **identical** in IIS and every CLI process (see section 6) |
| Database connection | `DB_CONNECTION`, `DB_QUEUE_CONNECTION`, `DB_CACHE_CONNECTION` | `DB_CONNECTION` | queue and cache connections should be unset or equal to `DB_CONNECTION`. Recovery refuses a split |
| PHP runtime | `<php> -v`, `--ini`, `-m` | — | version, ini file, `pdo_mysql`, `openssl`, `mbstring`, `fileinfo`, timezone, memory limit. Compare with the IIS PHP (section 6) |

**Pass criteria:** every value is recorded from the effective runtime, not from `.env` alone. Config cache state is known (`about` shows "Config: CACHED" or "NOT CACHED"). `retry_after` is greater than the realistic worst-case send time. The `--queue` list matches where eLeave mail is queued.

---

## 3. Every host and scheduled task that could consume the same queues

**Do not assume one worker.** A worker on any host whose `hrmdo_service` configuration points at the same database and `jobs` table consumes the same queues. This includes a second IIS server, a Docker host, a developer machine with production credentials, or another application sharing the database.

**3.1 Build the host list** from IT records (CMDB, DNS, IIS web farm, load balancer pool, deployment targets, backup and DR servers). For each host, record whether `hrmdo_service` is deployed, where, and which `.env` it uses.

**3.2 On every Windows host** (read only):

```powershell
# Scheduled tasks that run artisan, PHP, or hrmdo paths, in every folder
Get-ScheduledTask | ForEach-Object {
  $task = $_
  $task.Actions | Where-Object { "$($_.Execute) $($_.Arguments) $($_.WorkingDirectory)" -match 'artisan|queue:work|queue:listen|schedule:run|php|hrmdo' } |
    ForEach-Object { [pscustomobject]@{ Path = $task.TaskPath; Name = $task.TaskName; State = $task.State; Execute = $_.Execute; Arguments = $_.Arguments; StartIn = $_.WorkingDirectory; RunAs = $task.Principal.UserId } }
} | Format-Table -AutoSize -Wrap

# Services and service wrappers (NSSM, WinSW, and so on)
Get-CimInstance Win32_Service | Where-Object { $_.PathName -match 'php|artisan|nssm|winsw|queue' -or $_.DisplayName -match 'queue|worker|laravel|hrmdo' } |
  Select-Object Name, DisplayName, State, StartMode, StartName, PathName

# Running worker processes, with owner and parent
Get-CimInstance Win32_Process -Filter "Name = 'php.exe' OR Name = 'php-cgi.exe' OR Name = 'cmd.exe' OR Name = 'powershell.exe' OR Name = 'pwsh.exe'" |
  Where-Object { $_.CommandLine -match 'artisan|queue:' } |
  Select-Object ProcessId, ParentProcessId, CreationDate, CommandLine,
    @{ n = 'Owner'; e = { (Invoke-CimMethod -InputObject $_ -MethodName GetOwner).User } }

# Which configuration each deployment uses (hashes and selected keys only; never print the whole .env)
Get-FileHash '<app_root>\.env', '<app_root>\bootstrap\cache\config.php' -Algorithm SHA256 -ErrorAction SilentlyContinue
Select-String -Path '<app_root>\.env' -Pattern '^(APP_ENV|APP_NAME|DB_CONNECTION|DB_HOST|DB_PORT|DB_DATABASE|DB_QUEUE_CONNECTION|DB_QUEUE|DB_QUEUE_TABLE|DB_QUEUE_RETRY_AFTER|QUEUE_CONNECTION|CACHE_STORE|CACHE_PREFIX|DB_CACHE_CONNECTION|ELEAVE_[A-Z_]+)='

# Machine-level environment variable NAMES that could override .env (values not printed)
[Environment]::GetEnvironmentVariables('Machine').Keys | Where-Object { $_ -match '^(APP|DB|CACHE|QUEUE|MAIL|ELEAVE|REDIS)_' }
```

`Win32_Process.CommandLine` is only visible for other accounts' processes in an elevated session.

**3.3 On every Linux or Docker host** (read only):

```bash
crontab -l; sudo ls /etc/cron.d; sudo grep -R -n -E 'artisan|queue:work|schedule:run' /etc/cron* /var/spool/cron 2>/dev/null
sudo supervisorctl status 2>/dev/null
systemctl list-units --all | grep -i -E 'queue|worker|horizon|hrmdo'
ps -eo pid,user,lstart,cmd | grep -E 'artisan (queue:work|queue:listen|horizon|schedule)' | grep -v grep
docker ps --format '{{.Names}}\t{{.Image}}\t{{.Command}}' | grep -i -E 'hrmdo|queue|worker'
```

**3.4 From the database side** (read only; needs a DBA account with `PROCESS`). Laravel workers keep a persistent connection, so every running worker appears as a connection from its host:

```sql
SELECT SUBSTRING_INDEX(host, ':', 1) AS client_host, user, db, command, COUNT(*) AS connections, MAX(time) AS longest_s
FROM information_schema.PROCESSLIST
WHERE db = '<hrmdo_db>'
GROUP BY client_host, user, db, command
ORDER BY client_host;
```

Map every `client_host` to a known IIS, worker, or admin host. An unknown host is a stop condition.

**3.5 Queue movement evidence** (read only): take the snapshot below twice, at least `retry_after` + 60 s apart, and compare. If `pending` falls or `attempts` changes, a worker is consuming jobs, wherever it runs.

```sql
SELECT queue, COUNT(*) AS pending, MIN(id) AS min_id, MAX(id) AS max_id,
       SUM(attempts) AS total_attempts, SUM(reserved_at IS NOT NULL) AS reserved
FROM jobs GROUP BY queue;
```

**3.6 Laravel scheduler.** `routes/console.php` in the current code schedules only the two temp-upload prune commands (hourly). Record whether any host runs `schedule:run` and under which account. The scheduler itself does not consume the queue.

**3.7 Other applications.** Confirm whether any other application (for example `auth_service`, `registrar_service`, or the legacy monorepo) uses `<hrmdo_db>`, or a `jobs` table in it, with its own workers. A foreign worker would try to process eLeave jobs, fail to deserialize them, and write them to its own `failed_jobs`.

**Pass criteria:** every host is listed with its worker count (including zero), every database connection is attributed, and no unexplained queue movement is seen.

---

## 4. Read-only production backlog inventory

Run as a read-only database account. Note the session time zone first (`SELECT @@session.time_zone, @@global.time_zone;`); `FROM_UNIXTIME` uses it.

```sql
-- 4.1 Which tables exist
SELECT table_name, table_rows, create_time
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND (table_name IN ('jobs', 'failed_jobs', 'job_batches', 'cache', 'cache_locks', 'migrations') OR table_name LIKE 'eleave\_%')
ORDER BY table_name;

-- 4.2 All queued jobs by queue and class
SELECT queue, JSON_UNQUOTE(JSON_EXTRACT(payload, '$.displayName')) AS job_class,
       COUNT(*) AS jobs, SUM(reserved_at IS NOT NULL) AS reserved, SUM(attempts > 0) AS attempted, MAX(attempts) AS max_attempts,
       FROM_UNIXTIME(MIN(created_at)) AS oldest, FROM_UNIXTIME(MAX(created_at)) AS newest, MIN(id) AS min_id, MAX(id) AS max_id
FROM jobs GROUP BY queue, job_class ORDER BY queue, job_class;

-- 4.3 eLeave mail backlog by day
SELECT DATE(FROM_UNIXTIME(created_at)) AS queued_day, JSON_UNQUOTE(JSON_EXTRACT(payload, '$.displayName')) AS job_class, queue, COUNT(*) AS jobs
FROM jobs
WHERE JSON_UNQUOTE(JSON_EXTRACT(payload, '$.displayName')) IN ('Modules\\Eleave\\Mail\\LeaveApplicationApprovalRequestMail', 'Modules\\Eleave\\Mail\\LeaveApplicationStatusMail')
GROUP BY queued_day, job_class, queue ORDER BY queued_day;

-- 4.4 Failed jobs by queue and class
SELECT queue, JSON_UNQUOTE(JSON_EXTRACT(payload, '$.displayName')) AS job_class, COUNT(*) AS failed, MIN(failed_at) AS first_failed, MAX(failed_at) AS last_failed
FROM failed_jobs GROUP BY queue, job_class ORDER BY queue, job_class;

-- 4.5 eLeave failed jobs by day and exception type (first line only; may contain addresses, keep confidential)
SELECT DATE(failed_at) AS failed_day, SUBSTRING_INDEX(exception, '\n', 1) AS exception_first_line, COUNT(*) AS failed
FROM failed_jobs
WHERE JSON_UNQUOTE(JSON_EXTRACT(payload, '$.displayName')) IN ('Modules\\Eleave\\Mail\\LeaveApplicationApprovalRequestMail', 'Modules\\Eleave\\Mail\\LeaveApplicationStatusMail')
GROUP BY failed_day, exception_first_line ORDER BY failed_day;

-- 4.6 Only if the recovery tables exist (4.1)
SELECT decision, reason, notification_type, COUNT(*) AS logs, MIN(created_at) AS first_at, MAX(updated_at) AS last_at
FROM eleave_mail_queue_recovery_logs GROUP BY decision, reason, notification_type ORDER BY decision, reason;
SELECT COUNT(*) AS attempting_rows FROM eleave_mail_queue_recovery_logs WHERE decision = 'attempting';
SELECT decision, reason, queue, COUNT(*) AS quarantined, MIN(quarantined_at) AS first_at, MAX(quarantined_at) AS last_at
FROM eleave_mail_queue_quarantine GROUP BY decision, reason, queue ORDER BY decision, reason;
SELECT queue, COUNT(*) FROM jobs WHERE queue IN ('eleave-mail-recovery-claimed', 'eleave-mail-recovery-held') GROUP BY queue;  -- parked claims, held jobs

-- 4.7 Only if the heartbeats table exists
SELECT component, host, connection, queues, MAX(last_seen_at) AS last_seen, MAX(stopped_at) AS last_stopped
FROM eleave_email_service_heartbeats GROUP BY component, host, connection, queues;
```

If the deployed release already contains the eLeave tooling, these are also read-only:

- `php artisan eleave:verify-mail-queue`;
- `php artisan eleave:mail-delivery-review` (recipients stay hidden unless `--show-recipients` is passed);
- `php artisan queue:failed`.

Do **not** run the recovery or quarantine dry runs in Phase 0; they take a cache lock.

**Required before any change** (gate G2):

1. A full logical backup of `<hrmdo_db>`, plus a separate export of `jobs`, `failed_jobs`, `migrations`, `cache_locks` and every `eleave_*` table:

   ```bash
   mysqldump --single-transaction --routines --triggers <hrmdo_db> > hrmdo_full_<timestamp>.sql
   mysqldump --single-transaction <hrmdo_db> jobs failed_jobs migrations cache_locks <eleave tables from 4.1> > hrmdo_queue_<timestamp>.sql
   ```

2. Record each file's SHA-256 and the row counts from 4.1 to 4.6 at backup time.
3. Test-restore the export into a non-production database and compare the row counts.
4. Store backups access-controlled, outside every repository, with a retention period agreed with IT. They contain staff email addresses.
5. Get explicit written approval naming the change, the window, and the rollback owner.

---

## 5. Database migrations

The exact sequence, pre-flight, verification and data-preserving rollback are in [Production migration sequence](./production-migration-sequence.md). This section summarizes them.

Production has never run the recovery tooling. Phase 0 must establish which migrations have run:

```powershell
& '<php>' artisan migrate:status     # read-only; never "migrate" without --path in production
```

```sql
-- only if the heartbeats table already exists somewhere
SHOW INDEX FROM eleave_email_service_heartbeats;
```

| Order | Migration | Creates or changes | Depends on | Rollback (`down()`) risk |
| --- | --- | --- | --- | --- |
| 1 | `2026_10_09_000001_create_eleave_mail_queue_recovery_logs_table` | `eleave_mail_queue_recovery_logs` (unique `job_uuid`, decision/reason audit) | — | Drops the recovery audit trail. **Never roll back once recovery has run** |
| 2 | `2026_10_09_000002_create_eleave_mail_queue_quarantine_table` | `eleave_mail_queue_quarantine` (verbatim payloads) | — | Drops the **only copy** of quarantined payloads. **Never roll back once anything is quarantined** |
| 3 | `2026_10_09_000003_create_eleave_email_service_heartbeats_table` | `eleave_email_service_heartbeats` (passive worker heartbeats, fingerprint) | — | Recovery can no longer prove the worker is stopped and refuses |
| 4 | `2026_10_09_000007_add_job_queue_to_eleave_mail_queue_recovery_logs_table` | adds nullable `job_queue` (after `job_id`) | 1 | Drops the original queue of held and quarantined jobs. Documented as local/test only |

Removed from scope: `000004` (holds) and `000005` (restart requests) were deleted. `000006` (events) and `2026_10_12_000001` (delivery ledger) were moved to `database/deferred-migrations/`, which Laravel does not load.

**Prerequisites:** `migrations`, `jobs`, `failed_jobs` (with a `uuid` column), and, with `CACHE_STORE=database`, `cache` and `cache_locks` must exist (Laravel's base migrations).

**Ordering and compatibility:**

- **All four are additive.** The currently deployed code ignores the new tables, so migrations can run before or with the code release.
- **New code without the tables:**
  - Worker heartbeat writes fail and are reported to the log once per failure streak; the worker keeps running and sends mail (tested).
  - `recover --execute` and `quarantine --confirm` fail closed before changing anything.
  - Recovery reads the ledger only if the table exists; it does not exist in production.
- **Apply only by path**, one reviewed list, after `--pretend`. A plain `migrate` would also apply any unrelated pending migration:

  ```powershell
  & '<php>' artisan migrate --pretend --path=database/migrations/2026_10_09_000001_create_eleave_mail_queue_recovery_logs_table.php  # repeat --path per file
  ```

- **Recommendation:** apply the four in the first deployment. The deferred ledger and events migrations wait for the separate approval that enables send-time eligibility.
- **Uncommitted schema edit:** migration 3 was edited after commit `0e72a97`. Its single `component` index became a composite (`component`, `last_seen_at`) index. `0e72a97` is not on any remote branch, so no shared environment should have the old shape. Confirm with `migrate:status` and `SHOW INDEX` that no environment ran it. If one did, reconcile it before production instead of editing the migration again.
- **MySQL specifics:** the indexed string columns are 16 to 64 characters, well inside InnoDB key limits. Migration 7's `ALTER TABLE` runs on a small table. Run `--pretend` to review the exact SQL.

**Rollback policy:** in production, roll back **code**, not schema. The new tables are harmless to the old code. `migrate:rollback` or `migrate:reset` for these migrations needs its own approval and a prior export of the affected tables.

---

## 6. Shared cache and database across IIS, the worker and the recovery operator

The recovery lock and the worker heartbeats only work if the worker and the operator's recovery process read the same cache and database. Each worker heartbeat stores a `ContextFingerprint`. Recovery refuses (`heartbeat_inconsistent`) when the latest worker reports a different `db_target`, `queue_connection` or `queue_target` than the recovery process. The fingerprint contains these keys (connection targets are HMAC hashes keyed with the app key, never host names or credentials):

- `app_env`, `cache_store`, `cache_driver`, `cache_target`, `lock_target`, `db_target`, `queue_connection`, `queue_target`.
- It also reports `config_cached`, `host` and `sapi`. Only the `database` and `redis` cache drivers count as shared.

**Phase 0 (code not yet deployed): compare the inputs.**

- **Deployment directory:** confirm the IIS site physical path and the worker task's "Start in" folder point to the same `<app_root>`, or to copies whose `.env` and `bootstrap\cache\config.php` hashes match (section 3.2 command).
- **IIS PHP and FastCGI environment** (read only):

  ```powershell
  & "$env:windir\system32\inetsrv\appcmd.exe" list site
  & "$env:windir\system32\inetsrv\appcmd.exe" list app
  & "$env:windir\system32\inetsrv\appcmd.exe" list apppool /text:name
  & "$env:windir\system32\inetsrv\appcmd.exe" list apppool "<pool>" /text:processModel.identityType
  & "$env:windir\system32\inetsrv\appcmd.exe" list config -section:system.webServer/fastCgi
  ```

  Record the `php-cgi.exe` path and any `environmentVariables`. Note only names that override `APP_*`, `DB_*`, `CACHE_*` or `QUEUE_*`; mask any values. Then run `<that folder>\php.exe -v` and `--ini` to compare the version and ini file with the worker's `<php>`.
- **Settings that must match** between IIS and the CLI (section 2 values):
  - `CACHE_STORE`, `DB_CACHE_CONNECTION` and the lock table;
  - `DB_CONNECTION`, `DB_HOST`, `DB_DATABASE`;
  - `QUEUE_CONNECTION` and `DB_QUEUE_CONNECTION`;
  - `APP_ENV`, `APP_KEY` (it keys the fingerprint hashes; compare hashes only);
  - **`CACHE_PREFIX` / `APP_NAME`**.
- **Cache prefix.** The fingerprint includes `cache_prefix`, a keyed hash of the effective prefix, for diagnosis. The recovery check compares only the database and queue keys; the lock must still be shared, so Phase 0 compares the cache store and prefix by hand. Covered by `tests/Feature/EleaveContextFingerprintCachePrefixTest.php`.

**After deployment (gate G5): compare the running processes.** There is no diagnose command or API any more. Run the recovery dry run as the operator account (`php artisan eleave:recover-mail-queue --limit=1`) after the heartbeat probe worker (section 7 step 6) has run and stopped: its `Worker heartbeat evidence` line must not report `heartbeat_inconsistent`. The stored fingerprint can also be compared by hand:

```sql
SELECT instance_id, queues, fingerprint FROM eleave_email_service_heartbeats
WHERE component = 'worker' ORDER BY last_seen_at DESC LIMIT 1;
```

**Pass criteria:**

- The worker's `db_target`, `queue_connection` and `queue_target` match the operator process (no `heartbeat_inconsistent`).
- The cache driver is `database` or `redis`, and the cache prefix matches by hand.
- `config_cached` matches the release practice.
- The PHP major and minor version are confirmed equal by hand.

---

## 7. Safe deployment and rollback sequence (proposed)

Each step names its gate. Flags that **stay off** for the whole initial deployment:

- `ELEAVE_MAIL_QUEUE`: unset.
- `eleave.notification_identity.enabled` and `eleave.send_time_eligibility.enabled`: `false` (no env switch exists).
- `ELEAVE_EMAIL_SERVICE_MONITOR_ENABLED`: unset or `true`, so the worker writes heartbeats. With heartbeats off, recovery refuses.

**Deployment**

1. **G0, G1:** Phase 0 inspection approved, executed and reviewed (sections 1 to 6). Open questions resolved. The pre-push blocker (local commit `0e72a97` containing `recovery_dry_run.txt`) is resolved with approval before anything is pushed.
2. **Change window** agreed with HR. Approvers and applicants are told notifications may be delayed; pending items stay visible in For Approval, HR Approval and My Leave.
3. **G2:** backups and restore test (section 4).
4. **Deploy the backend code** with the flags above. Follow the normal release process for config caching, then run `php artisan list eleave`. Do not commit or deploy `AppServiceProvider.php`. The worker keeps running normally; it now also writes heartbeats.
5. **G4:** `migrate:status`, then `--pretend`, then the four migrations by `--path`, then `migrate:status` again ([production-migration-sequence.md](./production-migration-sequence.md)).
6. **Heartbeat evidence:** while eLeave mail is queued, do **not** let the normal worker run to create evidence: it would send the queued mail. Record evidence with the [heartbeat probe worker](./mail-queue-recovery.md#recording-first-heartbeat-evidence-with-the-probe-worker) (`eleave:heartbeat-probe-check`, then the printed `queue:work --name=eleave-heartbeat-probe` command). It cannot take a job and records a stopped heartbeat.
7. **G3:** the administrator stops the worker on **every** host and confirms it stopped ([Confirming workers are stopped](./mail-queue-recovery.md#confirming-workers-are-stopped)). If the task must be disabled so it cannot re-trigger, that is a Task Scheduler change and needs this approval.
8. **G5:** the fingerprint comparison (section 6) and the [production safety preflight](./mail-queue-recovery.md#production-safety-preflight), including the mail redirection probe.
9. **G6:** production recovery dry run, reviewed independently. Then execute (this **sends email immediately**), quarantine and verify, per the [recovery procedure](./mail-queue-recovery.md#recovery-procedure).
10. **G7:** only after `eleave:verify-mail-queue` reports READY, the administrator restarts the worker by the approved method (and re-enables the task if it was disabled). Confirm that:
    - a new heartbeat appears with the expected `--queue` and a matching fingerprint;
    - one controlled fresh notification to an approved test recipient is delivered;
    - `eleave:verify-mail-queue` is still READY after it is delivered.
11. **Later, each separately approved:** queue isolation (`ELEAVE_MAIL_QUEUE`), the deferred ledger and events migrations, notification identity, the send-time guard.

No frontend deployment is part of this scope.

**Rollback**

| Point reached | Rollback |
| --- | --- |
| Before migrations | Redeploy the previous release and its config cache |
| After migrations | Redeploy the previous release; **leave the tables** (additive, ignored by old code). No `migrate:rollback` |
| During recovery | Stop the command. Undecided jobs stay on their worker queue. Keep workers stopped until verify is READY; otherwise outdated mail is sent |
| After recovery sent mail | Sent mail cannot be recalled. Keep audit logs, held jobs and quarantine rows. **Never move held or quarantined payloads back onto a worker queue** |
| Misbehaving worker | The administrator ends that worker (emergency stop, recorded in the ticket); investigate before restarting |

---

## 8. Manual IT review workflow for uncertain delivery

Applies to every eLeave job classified as possibly delivered:

- recovery `delivery_uncertain` (including `stale_attempting_after_crash`, `worker_delivery_uncertain` and `duplicate_delivery_uncertain`);
- recovery `attempting` after a crash;
- ledger `sending` or `uncertain`, once the ledger exists;
- any eLeave `failed_jobs` row whose exception came after the mail transport was contacted.

Accepted by the mail server is **not** proof of inbox delivery.

**Find the cases** (read only):

```powershell
& '<php>' artisan eleave:mail-delivery-review --bucket=possibly_delivered
& '<php>' artisan eleave:mail-delivery-review --bucket=quarantined
& '<php>' artisan eleave:mail-delivery-review --bucket=failed_jobs
& '<php>' artisan eleave:mail-delivery-review --bucket=possibly_delivered --show-recipients   # only by the assigned reviewer, output kept in the ticket
```

**Evidence to collect per case:**

1. The job uuid, application id, recipient role, recipient address, and quarantine reference (`#id`) or failed-job id.
2. The time window: from the recovery log `updated_at` (or ledger `transport_started_at`) minus 10 minutes, to plus 24 hours.
3. The expected subject:
   - "Leave application pending your approval (Supervisor)";
   - "Leave application pending your approval (Manager)";
   - "Leave application pending HR approval";
   - "Your leave application status: Processed".
4. **Mail server log evidence** for that recipient, window and subject: the relay or mailbox-provider message trace, showing accepted, delivered, deferred, bounced, or not found. Record the log source, the exact query, and who ran it. The ledger `message_id` is available only once the ledger is in use; recovery logs do not store one.
5. Where logs are inconclusive, the recipient's confirmation (asked through IT or HR, not by resending).

**Review decision** (one per case, recorded in the IT ticket; there is no database table for decisions and none is added in this phase):

| Field | Value |
| --- | --- |
| Case | job uuid, quarantine or failed-job reference |
| Evidence | log source, query, time window, result |
| Decision | `delivered`: no action. `not_delivered`: notify the person directly, or trigger a fresh notification from the application. `inconclusive`: contact the person directly. `escalate` |
| Reviewer and second reviewer | names and date |
| Follow-up done | what was sent or told, by whom, when |

**Prohibited:**

- `queue:retry all`.
- `queue:retry --queue=…`.
- Any `queue:retry <id>` of an eLeave job classified as possibly delivered or must-never-retry.
- Moving quarantine rows back into `jobs`.
- Editing ledger, recovery or quarantine rows.

A single eLeave failed job may be retried only if all of these hold:

- the review command classifies it as failed before transport;
- the cause is fixed;
- two reviewers approve it in the ticket.

`queue:forget`, `queue:flush` and `queue:prune-failed` destroy evidence. They need IT sign-off after every case is closed.

**Retention: priority 1 of the Phase 0 inspection.** Mail server logs and message traces have limited retention, and the real retention for the eLeave mail system is **unknown**. If it were 30 days, the earliest evidence from the backlog that started around 2026-09-20 would expire around 2026-10-20. The first inspection step therefore establishes, read-only:

- which mail system relays eLeave mail;
- its configured retention period;
- the earliest date still searchable;
- the date the oldest needed evidence expires.

These are fields in template section 1. Use the mail system's own admin console or documentation, with the mail administrator's consent.

**Exporting, copying or downloading any log is not part of Phase 0.** It needs separate authorization (gate **L1**, below) stating:

- the time window and fields;
- where the export is stored and who can access it;
- the retention period for the export.

The logs contain personal data, so the institution's data protection officer should be consulted.

---

## 9. Test baselines and required end-to-end testing

**Local baselines (2026-10-12; must not regress):**

| Suite | Command | Baseline |
| --- | --- | --- |
| Backend (`hrmdo_service`, SQLite in memory) | `php artisan test --compact` | 351 passed after the scope reduction (monitoring, watchdog, restart and hold tests deleted; manual-recovery safety tests added), **9 known failures**, all `QueryException`: `LeaveAfterCutoffPrintStatusTest` (1), `LeaveApplicationHrApprovalScopesTest` (5), `LeaveApplicationReportScopesTest` (3) |
| Manual recovery safeguards | `EleaveMailQueueRecoveryTest`, `EleaveWorkerStoppedCheckTest`, `EleaveEmailServiceCoordinatorTest`, `EleaveEmailServiceHeartbeatTest`, `EleaveContextFingerprintCachePrefixTest`, `EleaveManualMailRecoveryScopeTest` | 100 passed |
| Frontend unit (`apps/eleave`) | `pnpm test` | 72 passed, **2 known failures** in `src/routes/my-leave/leave-form/validation.test.ts` (email-service UI tests removed with the UI) |
| Frontend types | `pnpm exec tsc -b` | **31 known errors** |
| Frontend lint | `pnpm lint` | 0 errors (existing semicolon warnings) |

**Frontend build note:** this scope deploys no frontend change. For any future eLeave frontend release, `apps/eleave` `pnpm build` runs `tsc -b && vite build` and **fails at baseline** because of the 31 type errors; confirm how the production bundle is built before that release.

**Pending local test:** [Local worker restart and fresh-mail test](./mail-queue-recovery.md#local-worker-restart-and-fresh-mail-test-pending).

**Production smoke test after G7** (approved test accounts only):

| Scenario | Expected |
| --- | --- |
| File a leave application (test employee) | Exactly one approval notification is queued and delivered to the test recipient once |
| `eleave:verify-mail-queue` afterwards | READY |
| `GET /api/v1/email-service/status` | 404 (the API no longer exists) |

---

## 10. Outstanding documentation

- **The DB-schema Obsidian vault is missing.** `/mnt/c/obsidian_knowledgebase/db_knowledgebase` (`C:\obsidian_knowledgebase\db_knowledgebase`) does not exist, including its generator `_meta/generate_vault.py`. Pending vault entries once it is restored:
  - **`hrmdo_service` tables:**
    - `eleave_mail_queue_recovery_logs` (including `job_queue`);
    - `eleave_mail_queue_quarantine`;
    - `eleave_email_service_heartbeats`;
    - deferred (not created by `migrate`): `eleave_email_service_events`, `eleave_mail_delivery_ledger`;
    - never created (migrations deleted): `eleave_email_service_holds`, `eleave_email_service_restart_requests`.
  - **Service notes:** the recovery decision and reason vocabulary, the held queue `eleave-mail-recovery-held`, the worker-stopped refusal codes, and the delivery classification.

  No alternative vault was created.
- **The Obsidian MCP server is unavailable** in this environment (no Obsidian namespace is registered). Vault updates cannot be made through it.
- **Proposed follow-ups** (documentation or code, each needing approval):
  - decide where review decisions are recorded long-term;
  - a Playwright suite for eLeave.

---

## Approval gates

The owners below are **proposals by role**; IT management confirms the named people (template section 11). The developer prepares evidence, plans and code, and may be consulted at every gate. The developer cannot alone approve:

- production infrastructure: servers, Task Scheduler, IIS, the database, the mail system;
- HR business decisions: whether historical notifications are sent, skipped or followed up manually, and what HR staff see.

| Gate | Approves | Before | Proposed owner(s) |
| --- | --- | --- | --- |
| G0 | Read-only production access for Phase 0 (hosts, accounts, read-only DB user) | Any production access | **Production server administrator** (authorizes and performs), IT manager |
| L1 | Export or copy of mail-server logs for the review window | Any log export | **Mail system administrator**, IT manager; data protection officer consulted |
| G1 | Phase 0 findings reviewed; open questions answered | Planning any change | **IT manager**, application owner; HR process owner for business questions |
| G2 | Backups taken, checksummed, restore-tested | Any production change | **Database administrator**, production server administrator |
| G3 | Stopping the worker for recovery, including any Task Scheduler change (for example disabling the task so it cannot re-trigger) | Recovery | **Production server administrator**, IT manager; HR process owner informed of the delay |
| G4 | Exact migration list (four files, by path) after `--pretend` review | Running migrations | **Database administrator**, application owner |
| G5 | Fingerprint and safety preflight results | Recovery or worker start | **Production server administrator**, mail system administrator (mailer and redirection checks) |
| G6 | Production recovery dry-run review; execute (sends email), quarantine and verify | Sending recovered mail | **HR process owner** (which historical notifications may still be sent), IT manager, application owner |
| G7 | Worker restart after verify is READY, and one controlled fresh notification | Normal mail flow | **Production server administrator** (restart), HR process owner (test account and recipient) |
| G9+ | Each deferred feature individually: queue isolation, ledger and events migrations, notification identity, send-time guard | Enabling it | **IT manager** plus, by feature: production server administrator (isolation needs a worker `--queue` change), database administrator (migrations), HR process owner (send-time policies, notification behaviour), security reviewer |

G8 (frontend deployment) no longer exists: this scope has no frontend change.

## Unknown findings (as of 2026-10-12)

Nothing about production is known from evidence yet. The following are explicitly **unknown** and must not be filled from local Docker configuration, code defaults or `.env.example`:

- **Worker task:** the Task Scheduler task's account, logon type, privileges, triggers, actions (the real worker command), conditions, settings (execution time limit, restart on failure, multiple-instance policy) and history.
- **Worker settings:** production `--queue`, `--tries`, `--timeout`, `--sleep` and other worker flags; `retry_after`; the failed-job driver; config cache state.
- **Cache and database:** the production cache store, driver, prefix and lock table; the database connection and whether queue and cache use the same one.
- **PHP runtimes:** the PHP versions and ini files for IIS and the CLI. That `pcntl` is unavailable on Windows is a platform fact, still to be confirmed with `php -m`.
- **Hosts and consumers:** the number of hosts and workers; whether IIS is a farm; other applications sharing `<hrmdo_db>` or its `jobs` table.
- **Data and schema:** the backlog, failed-job, recovery and quarantine contents; which migrations have run.
- **Mail system:** which system it is, its retention period, and the earliest searchable log date.
- **Frontend:** how the production frontend is built and deployed.
- **People:** the named owner of every gate.

Local values such as `retry_after` 90, the `database` cache store, PHP 8.4 in Docker and the local queue names describe the development environment only.

## Risks

| Risk | Effect | Mitigation |
| --- | --- | --- |
| Unknown second worker or foreign consumer | Jobs sent or failed outside the procedure | Section 3 host, DB-connection and queue-movement checks |
| Task Scheduler 3-day execution limit, or repeat triggers with Parallel/StopExisting | Worker killed mid-send; duplicate after `retry_after` | Section 1 review |
| Clean worker exit not restarted by Task Scheduler | Silent outage (the original incident pattern). No automated monitoring or restart exists in this scope | Section 1 restart analysis; IT checks the heartbeat table or the queue backlog by hand |
| No `pcntl` on Windows | `--timeout` not enforced; hung sends rely on `retry_after` | Set `retry_after` above the worst-case send; recovery refuses while any job is reserved |
| No heartbeat evidence at first recovery | `--execute` refuses (`no_heartbeat_evidence`) | Heartbeat probe worker (section 7 step 6). Never run the normal worker while eLeave mail is queued |
| Mistyped probe `--name` | A normal worker starts and sends queued mail | Copy the command printed by `eleave:heartbeat-probe-check`; never type it by hand |
| HRMDO worker run with `queue:listen` | Never writes heartbeats, so heartbeat evidence cannot see it | Operating-system process check is mandatory ([Confirming workers are stopped](./mail-queue-recovery.md#confirming-workers-are-stopped)) |
| Different cache prefix between the worker and the operator | The recovery lock is not shared | Manual comparison (section 6) |
| Production config cached from an older `.env` | Commands run against unexpected settings | `about` cache state; release-process config caching only |
| Mail redirection or wrong mailer in production | Real notifications skipped or misdirected | Safety preflight probe (G5) |
| Mail log retention expiring (retention unknown) | Possibly-delivered cases become unverifiable | Retention inspected first (section 8, template section 1); export only under L1 |
| Operator runs `queue:retry all` | Possibly delivered mail sent twice | Prohibition, review command's "must never be retried" count; the send-time guard (when approved) would block it technically |
| Schema rollback after recovery | Loss of audit trail and the only copy of quarantined payloads | Roll back code, not schema |
| Uncommitted local work | Deployed code may not match the reviewed tree | Commit and review only with approval; exclude `AppServiceProvider.php` |

## Open questions for IT (to answer during Phase 0)

1. Which hosts run, or could run, `hrmdo_service`? Is IIS a single server or a farm?
2. Which mail system relays eLeave mail, where are its logs, and how long are they retained?
3. How is the production frontend bundle built and deployed today?
4. Does any other application share `<hrmdo_db>` or its `jobs` table?
5. Who holds each approval gate (IT manager, DBA, HR owner, application owner)?
