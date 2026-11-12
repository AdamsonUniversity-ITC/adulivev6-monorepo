# eLeave Mail Queue Recovery (manual runbook)

Last verified: 2026-10-12 (local Docker test suite; local recovery results from 2026-10-09, see [Local test results](#local-test-results-2026-10-09))

Manual, operator-run procedure for eLeave notification emails stranded in the `hrmdo_service` database queue after the queue worker stopped (backlog from about 2026-09-20). Code: `../hrmdo_service/app-modules/eleave/src/Services/MailQueueRecovery/`, `src/Services/EmailService/` (lock, worker heartbeats, worker-stopped check) and `src/Console/Commands/`.

**Scope.** Recovery is a set of Artisan commands run by hand on the server. There is no HR monitoring page, no status or restart API, no watchdog, no automatic restart, and no code that starts, stops, or signals a worker or changes the Windows Scheduled Task. The normal queue worker and its Scheduled Task are unchanged. The only passive addition to the worker is a heartbeat row it writes while it runs.

## Status

| Track | State |
| --- | --- |
| Local recovery | Completed and verified (2026-10-09), local Docker only |
| Local worker restart / fresh-mail test | Pending, see [Local worker restart and fresh-mail test](#local-worker-restart-and-fresh-mail-test-pending) |
| Production recovery | **Not executed.** Needs every item in [Production prerequisites](#production-prerequisites) |
| Dedicated mail queue | Implemented, not enabled anywhere (`ELEAVE_MAIL_QUEUE` unset) |
| Send-time eligibility, notification identity | Disabled and not wired; delivery-ledger migration deferred |
| Phase 0 production readiness | Checklist prepared; no production access yet, see [production-readiness-phase-0.md](./production-readiness-phase-0.md) |

## What `--execute` really does

`eleave:recover-mail-queue --execute --workers-stopped` is **not a queue repair command. It sends email.** In one run it:

1. **Sends eligible mail immediately** with `sendNow()` from the operator's process, to live recipients, using the default mailer of that process. It does not hand jobs back to a worker. A sent job is deleted from `jobs` and logged as `sent`.
2. **Re-queues every job it decides not to send** onto the held queue `eleave-mail-recovery-held`. No worker reads that queue, so a restarted worker cannot send these jobs. This covers `skipped` (outdated, duplicate, outside the status cutoff), `manual_review`, a job that became ineligible during the final check just before sending, and `failed_before_send` (an error before the mail server was contacted). It never puts a job back on `default` or `eleave-mail`.
3. **Quarantines jobs whose delivery is uncertain.** When the mail server may already have received the message, the job moves to `eleave_mail_queue_quarantine` with its payload intact and is logged as `delivery_uncertain`. This happens when the transport was reached and then an error occurred, when an earlier run crashed mid-send (stale `attempting`), or when another copy of the same notification may have been delivered. It is never resent automatically. Someone must check the mail server logs.
4. **Parks previously decided jobs first.** Before evaluating anything, it moves every job already decided by an earlier run (for example, a `skipped` job from an older version of the tool) from a worker queue onto the held queue.
5. **Writes audit records**: one `eleave_mail_queue_recovery_logs` row per job, and command-level entries in `storage/logs` (`eleave.mail_recovery.finished`, `.refused`, `.interrupted`).

It does **not** pause or resume queues, restart workers, retry `failed_jobs`, run `queue:clear`/`queue:flush`/`queue:retry`/`queue:work`, or touch non-eLeave jobs.

Dry-run (no `--execute`) reads only: it sends no mail and writes nothing.

## Commands

| Command | Effect |
| --- | --- |
| `eleave:recover-mail-queue` | Dry-run preview of every decision, plus the worker heartbeat evidence |
| `eleave:recover-mail-queue --execute --workers-stopped` | Sends, holds, and quarantines as described above |
| `eleave:quarantine-mail-queue` | Lists held jobs that can be quarantined (read-only) |
| `eleave:quarantine-mail-queue --confirm --workers-stopped` | Moves held `skipped` jobs into `eleave_mail_queue_quarantine`. Add `--include-manual-review` for reviewed `manual_review` jobs and `--include-failed-before-send` for `failed_before_send` jobs you decide not to retry |
| `eleave:verify-mail-queue` | **Mandatory pre-restart gate.** Exits `0` (READY) only when no eLeave mail job remains on any worker queue or on the held queue, no claim is parked, and no stale `attempting` row exists |
| `eleave:mail-delivery-review` | Read-only IT review listing (recipients hidden unless `--show-recipients`) |
| `eleave:review-mail-candidates` | Read-only [duplicate candidate review](#duplicate-candidate-review-read-only) of pending eLeave mail jobs. Never sends, runs, or changes a job |
| `eleave:heartbeat-probe-check` | Read-only preflight for the [heartbeat probe worker](#recording-first-heartbeat-evidence-with-the-probe-worker). Exits `0` (READY TO PROBE) and prints the exact probe command only when a worker named `eleave-heartbeat-probe` provably cannot take a job and would record a heartbeat |

Only jobs whose `payload.displayName` is `LeaveApplicationApprovalRequestMail` or `LeaveApplicationStatusMail` are touched, and only on the scanned queues: the connection's default queue (`DB_QUEUE`, default `default`), `ELEAVE_MAIL_QUEUE` if set, and `eleave-mail`, plus the recovery-only queues `eleave-mail-recovery-claimed` and `eleave-mail-recovery-held`.

## Safety gates (all fail closed)

`--execute` and `quarantine --confirm` check the following, in this order, and change nothing if any check fails:

1. `--workers-stopped` is passed. The flag is only the operator's statement that the workers are stopped; it detects nothing.
2. The shared lock `eleave:mail-queue-recovery` is taken without waiting. A second recovery or quarantine run exits. A process-local cache store (`array`, `null`) or a lock error (for example a missing `cache_locks` table) refuses.
3. The `jobs` table and the audit tables are on the same database connection.
4. **Worker heartbeat evidence proves every worker is stopped** (below).
5. **No job on a scanned or held queue is reserved**, eLeave or not. A worker stuck inside one long job stops sending heartbeats and can look stopped, but its job stays reserved, so this check catches it.

The lock is re-checked before every job. If the lease expires or another process takes it, the run stops before the next job.

### Worker heartbeat evidence

While it runs, the normal queue worker writes a passive heartbeat row (`eleave_email_service_heartbeats`, every `ELEAVE_EMAIL_HEARTBEAT_INTERVAL` seconds, default 30). On a graceful stop it also records `stopped_at`. `WorkerStoppedCheck` reads these rows and refuses unless they prove that every worker reading an eLeave queue is stopped. Missing or doubtful evidence never counts as stopped:

| Refusal code | Meaning | What to do |
| --- | --- | --- |
| `heartbeats_disabled` | `ELEAVE_EMAIL_SERVICE_MONITOR_ENABLED=false` | Re-enable heartbeats (a configuration change with its own approval), then record evidence with the [probe worker](#recording-first-heartbeat-evidence-with-the-probe-worker) |
| `heartbeat_config_inconsistent` | `ELEAVE_EMAIL_WORKER_STALE_SECONDS` is less than twice the heartbeat interval | Fix the configuration |
| `heartbeats_unreadable` | The heartbeats table is missing or unreadable | Apply migration `2026_10_09_000003` |
| `no_heartbeat_evidence` | No worker on the eLeave connection and queues has ever recorded a heartbeat | Record evidence with the [probe worker](#recording-first-heartbeat-evidence-with-the-probe-worker). **Never run the normal worker while eLeave mail is queued: it sends that mail** |
| `heartbeat_inconsistent` | Timestamps in the future or seen after stopping, a row with no queue list, or the latest worker reports a different database or queue backend | Check the server clock and which database the worker uses; escalate |
| `worker_on_recovery_queue` | A worker lists a recovery-only queue | Fix the worker command; no worker may read these queues |
| `worker_running` | A worker reported within `ELEAVE_EMAIL_WORKER_STALE_SECONDS` (default 120) and has not stopped | Stop the worker and wait until its heartbeat is stale |

A worker that is killed without a graceful stop never writes `stopped_at`. It counts as stopped only after its last heartbeat is older than the stale window, so wait at least `ELEAVE_EMAIL_WORKER_STALE_SECONDS` after stopping it. Heartbeats cannot prove the absence of a worker that never reported, for example one started with heartbeats disabled or an older release. That is why the operating-system checks below are still required.

Dry-run prints the same evidence and warns, without refusing, when `--execute` would refuse.

`queue:listen` workers never write heartbeats. `queue:listen` runs `queue:work --once` child processes, and `--once` skips the `Looping` event. A listen-mode worker is visible only to the operating-system checks.

### Recording first heartbeat evidence with the probe worker

Use this when `--execute` refuses with `no_heartbeat_evidence` while eLeave mail is still queued, for example right after deployment with a stale backlog. **Never run the normal worker to create evidence: it would send every queued notification.**

**How it works.** Every process of this release registers a Laravel queue pop callback (`Worker::popUsing`) for the exact worker name `eleave-heartbeat-probe`, and that callback always returns no job.

A worker started with `--name=eleave-heartbeat-probe` runs Laravel's real worker loop:

- It fires `Looping`, which writes the heartbeat, before it tries to take a job.
- It calls the callback instead of `pop()`, so it never reads, reserves, runs or deletes a job, whether or not the queue is paused.
- With `--stop-when-empty` it exits gracefully after one loop. That fires `WorkerStopping`, which records `stopped_at` and `stop_reason = empty`.

`WorkerStoppedCheck` is unchanged and accepts this row like any other stopped worker on `database` / `default`. Any other worker name, including the default name `default`, behaves exactly as before.

The callback is matched by exact name. A worker with a mistyped `--name` is a **normal worker** and will send mail. Always copy the command printed by `eleave:heartbeat-probe-check`.

Run every step in Git Bash on the HRMDO server, in the HRMDO deployment directory, as the same Windows account and PHP binary that will run recovery. That keeps the configuration fingerprints identical. Each step that changes anything needs approval at execution time. The steps that change state are the optional pause (S1) and the probe itself (S3), which writes one heartbeat row.

**Prechecks (read-only)**

```bash
cd "/c/<path-to>/hrmdo_service"         # HRMDO deployment directory
PHP="/c/<path-to>/php.exe"              # the php.exe used by the HRMDO Scheduled Task
EVID="/c/<access-controlled-dir>/eleave-heartbeat-probe-$(date +%Y%m%d-%H%M%S)"; mkdir -p "$EVID"

# P1. The HRMDO Scheduled Task is disabled
schtasks //Query //TN "<HRMDO task name>" //V //FO LIST | tee "$EVID/task.txt" | grep -i "Status\|Scheduled Task State"
# Expected: Disabled

# P2. No HRMDO queue:work or queue:listen process. Other applications' workers
#     (for example Campus Track) are listed here too: identify them by path and never touch them.
powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='php.exe' OR Name='php-cgi.exe'\" | Where-Object { \$_.CommandLine -match 'queue:(work|listen)' } | Select-Object ProcessId,CommandLine | Format-List" | tee "$EVID/processes_before.txt"
# Expected: no CommandLine that runs the HRMDO artisan file

# P3. The release contains the probe, and the probe is provably safe in this process and configuration
"$PHP" artisan eleave:heartbeat-probe-check | tee "$EVID/probe_check.txt"; echo "exit=${PIPESTATUS[0]}" | tee -a "$EVID/probe_check.txt"
# Expected, ending with exit=0:
#   Probe worker [eleave-heartbeat-probe]: pop callback registered; it returns no job and never touches the queue.
#   Probe target: connection [database], queue [default].
#   Queue [database:default] paused: no (the probe does not depend on it).
#   Run the probe exactly as (in the same directory, as the same account):
#     php artisan queue:work database --queue=default --name=eleave-heartbeat-probe --stop-when-empty --sleep=3 --tries=1 --max-time=60
#   READY TO PROBE
# "There are no commands defined in the eleave namespace" or "Command not found": the release
# is not deployed here. NOT READY TO PROBE: STOP and do not start any worker.

# P4. Snapshot the queue (read-only). Define once; it is used again after the probe.
snapshot() {
  MAXID="${1:-0}" "$PHP" artisan tinker --execute '
    $t = config("queue.connections.database.table");
    $max = (int) getenv("MAXID") ?: (int) DB::table($t)->max("id");
    $q = DB::table($t)->where("id", "<=", $max);
    echo "max_id=", $max, PHP_EOL;
    echo "rows=", (clone $q)->count(), " attempts=", (int) (clone $q)->sum("attempts"), " reserved=", (clone $q)->whereNotNull("reserved_at")->count(), PHP_EOL;
    $h = hash_init("sha256");
    (clone $q)->select(["id","queue","attempts","reserved_at","available_at","payload"])->lazyById(500)->each(function ($r) use ($h) { hash_update($h, $r->id."|".$r->queue."|".$r->attempts."|".$r->reserved_at."|".$r->available_at."|".hash("sha256", $r->payload)."\n"); });
    echo "rows_sha256=", hash_final($h), PHP_EOL;
    foreach (DB::table($t)->selectRaw("queue, count(*) as c")->groupBy("queue")->orderBy("queue")->get() as $r) { echo "queue ", $r->queue, " = ", $r->c, PHP_EOL; }
    echo "failed_jobs=", DB::table(config("queue.failed.table", "failed_jobs"))->count(), PHP_EOL;
    echo "heartbeats=", Modules\Eleave\Models\EmailServiceHeartbeat::count(), PHP_EOL;'
}
snapshot | tee "$EVID/jobs_before.txt"
MAXID=$(sed -n 's/^max_id=//p' "$EVID/jobs_before.txt")
# Expected: "queue default = <backlog>" and "heartbeats=0" on first use.
```

**Steps**

```bash
# S1 (optional second safeguard; the probe's safety does not depend on it). Pause the scanned
#     queues only after confirming no other application shares HRMDO's cache store AND cache
#     prefix, otherwise that application's database:default queue would be paused too. Recovery
#     also warns about unpaused queues. Leave the pause in place until the approved worker restart.
"$PHP" artisan queue:pause database:default
"$PHP" artisan queue:pause database:eleave-mail
# Expected: INFO  Job processing on queue [database:default] has been paused.  (same for eleave-mail)

# S2. Re-run the probe check immediately before the probe
"$PHP" artisan eleave:heartbeat-probe-check | tail -n 1
# Expected: READY TO PROBE (and "paused: yes" earlier in the output if S1 was done)

# S3. The probe: copy the command printed by the check, unchanged. Never add --force or --once.
"$PHP" artisan queue:work database --queue=default --name=eleave-heartbeat-probe --stop-when-empty --sleep=3 --tries=1 --max-time=60 2>&1 | tee "$EVID/probe.txt"; echo "exit=${PIPESTATUS[0]}" | tee -a "$EVID/probe.txt"
# Expected: returns in about 3 to 6 seconds; output empty or only
# "INFO  Processing jobs from the [default] queue."; exit=0.
# STOP condition: any line naming a job (SendQueuedMailable, RUNNING, DONE, FAIL). Press Ctrl+C
# at once and follow "Failure handling".
```

**Postchecks (read-only)**

```bash
snapshot "$MAXID" | tee "$EVID/jobs_after.txt"
diff <(grep -E '^(max_id|rows|rows_sha256)' "$EVID/jobs_before.txt") <(grep -E '^(max_id|rows|rows_sha256)' "$EVID/jobs_after.txt") && echo "PRE-EXISTING JOBS UNCHANGED"
# Expected: PRE-EXISTING JOBS UNCHANGED, failed_jobs unchanged, heartbeats one higher.
# "queue default" may only grow, from new leave mail with id > MAXID.

"$PHP" artisan tinker --execute 'echo Modules\Eleave\Models\EmailServiceHeartbeat::query()->orderByDesc("id")->limit(1)->get(["id","component","host","pid","connection","queues","started_at","last_seen_at","stopped_at","stop_reason"])->toJson(JSON_PRETTY_PRINT), PHP_EOL;' | tee "$EVID/heartbeat.txt"
# Expected: component "worker", connection "database", queues "default",
# stopped_at a few seconds after last_seen_at, stop_reason "empty"

"$PHP" artisan tinker --execute 'echo app(Modules\Eleave\Services\EmailService\WorkerStoppedCheck::class)->verify()->summary(), PHP_EOL;' | tee "$EVID/evidence.txt"
# Expected: workers stopped: 1 worker heartbeat row(s), latest heartbeat 2026-..+08:00, none within 120s

powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='php.exe' OR Name='php-cgi.exe'\" | Where-Object { \$_.CommandLine -match 'queue:(work|listen)' } | Select-Object ProcessId,CommandLine | Format-List" | tee "$EVID/processes_after.txt"
# Expected: identical to processes_before.txt

"$PHP" artisan eleave:recover-mail-queue --limit=1 | tee "$EVID/dry_run.txt"
# Read-only dry run. Expected: "Worker heartbeat evidence: workers stopped: ..." and no
# "--execute would refuse" warning.
```

Also check the newest `storage/logs/laravel*.log` for heartbeat write errors logged during the probe.

**Failure handling**

| Symptom | Meaning | Action |
| --- | --- | --- |
| `NOT READY TO PROBE` | The release is missing, the callback is absent or fetches jobs, heartbeats are off, or maintenance mode is on | Start no worker. Fix the cause through the normal release or configuration process, then repeat from P3 |
| Probe exits `0` but no new heartbeat row | Heartbeat write failed (see `laravel*.log`) or heartbeats are disabled | Nothing was changed. Fix the cause, repeat S2 and S3 |
| Evidence reports `heartbeat_inconsistent` | The probe ran with different configuration than the check (another directory, account, PHP binary or config cache) | Never delete the row. Re-run S3 from the correct context: the check compares the newest row, so a correct new stopped row supersedes it |
| Evidence reports `worker_running` | A heartbeat without `stopped_at` is younger than the stale window: the probe was killed, or a real worker is running | Re-run P2. If no HRMDO worker exists, wait `ELEAVE_EMAIL_WORKER_STALE_SECONDS` or re-run S3 |
| The probe printed a job line, or the snapshot differs | The safeguard failed. This must not happen when P3 and S2 passed | Ctrl+C. Run nothing else. Compare the snapshots to identify the affected job (missing, or changed `attempts` or `reserved_at`), check `failed_jobs`, and escalate. Confirming delivery needs a mail log review (L1 approval) |

**Rollback.** The probe changes one thing: a new heartbeat row. That row is legitimate evidence, so never delete it by hand; running workers prune it after `ELEAVE_EMAIL_HEARTBEAT_RETENTION_DAYS` (default 14).

To undo S1, run `"$PHP" artisan queue:resume database:default` (and the same for `eleave-mail`). The expected output is `INFO  Job processing on queue [database:default] has been resumed.` Resume only when the approved worker restart happens, after `eleave:verify-mail-queue` reports READY. While no worker runs, the pause has no effect, and it is the safe state.

## Job lifecycle

| Decision | Meaning | Job location after the run | Next step |
| --- | --- | --- | --- |
| *(undecided)* | Not evaluated yet | Worker queue: **a restarted worker would send it** | Run recover |
| `attempting` | Claimed; send in progress | `eleave-mail-recovery-claimed` (not read by workers) | Automatic: the next `--execute` turns a stale claim into `delivery_uncertain` and quarantines it |
| `sent` | The mailer returned a sent message | Deleted from `jobs` | None |
| `skipped` | Outdated, invalid, duplicate, outside the cutoff, or ineligible on the final check | Held queue | Quarantine |
| `manual_review` | Ambiguous match, unreadable payload, or changed applicant email | Held queue | Review, then quarantine with `--include-manual-review` |
| `failed_before_send` | Error before the mail server was contacted (for example a template error) | Held queue, unreserved | Fix the cause, then run recover again (it retries these), or quarantine with `--include-failed-before-send` |
| `delivery_uncertain` | The mail server may have the message | Quarantine table | Check mail server logs; never resend automatically |
| `quarantined` | Moved to `eleave_mail_queue_quarantine` | Quarantine table | None |

Each send runs in three steps: a short transaction claims the job onto the claimed queue and writes `attempting`; `sendNow()` runs with no transaction open; a short transaction records the outcome. Just before sending, the job is checked again against live data, so a leave decided between the dry-run and the send is not sent. Laravel's `MessageSending` event marks the point where the transport is contacted: errors before it are `failed_before_send`, errors after it are `delivery_uncertain`.

**Exactly-once delivery cannot be guaranteed.** If the mail server accepts a message and the connection drops before the acknowledgement, or the process dies between `sendNow()` and the outcome record, the system cannot know whether the email arrived. Those jobs become `delivery_uncertain` and are removed from the active queue, so neither recovery nor a restarted worker sends them again. The tool prefers a possibly missed email over a duplicate.

## Decision rules

Queued payloads are used only to correlate a job to an application. Recipients are always re-resolved from live `aduollms.teachers` and adulive permission data. Mail goes out only if the queued `to` address still equals the current intended recipient (after `mail.dev_recipient` redirection in `APP_ENV=local`).

**Approval request mail** (all queue dates, `--from` ignored):

- Correlated by an exact match on `employee_no`, `date_from`, `date_to`, `reason`, and leave type name. Zero matches gives `skipped / application_not_found`. Two or more give `manual_review / ambiguous_application_match`; no winner is guessed.
- Skipped when the application is Cancelled or Disapproved, the stage already has a decision (`stage_completed`), the stage is not reached yet, or the approver or HR recipient changed (`approver_changed`).
- At most one send per application, role, and recipient. A copy confirmed accepted by the mail server (a recovery `sent` log, or an `accepted` worker ledger row) makes later copies `skipped / duplicate_already_sent`. A copy that may have reached the transport without confirmation (recovery `attempting` or `delivery_uncertain`, worker ledger `sending` or `uncertain`) makes them `delivery_uncertain / duplicate_delivery_uncertain`. Ledger rules apply only where the ledger table exists, which is not the case in production because its migration is deferred.

**Status mail** (only `jobs.created_at >= --from`, default `2026-10-05 00:00:00 Asia/Manila`):

- Correlated only by the id in the action URL `/my-leave/view-leave/{id}`. A missing or malformed id gives `manual_review / status_action_url_missing_id`.
- Skipped when the applicant cancelled the application (`cancelled_at` set), HR has not processed it, or the queued type, dates, day summaries, or HR remarks differ from current data (`status_outdated`).
- `manual_review / recipient_changed` when the applicant's current email differs from the queued recipient. The email is never sent to either address automatically.
- Per application only the latest matching job is sent; older identical ones are `duplicate_status_superseded`. Jobs before the cutoff are `outside_status_cutoff`.

**Unreadable payloads** become `manual_review` with a `payload_*` reason.

## Payload safety

Laravel 12 stores a queued mailable as JSON whose `data.command` is a PHP-serialized `SendQueuedMailable`. The inspector:

1. Requires `job = Illuminate\Queue\CallQueuedHandler@call`, `commandName = SendQueuedMailable`, no batch id, and a plain (non-encrypted) command.
2. Rejects any serialized class outside `SendQueuedMailable`, the two eLeave mailables, and `Address`.
3. Calls `unserialize()` with the same `allowed_classes` list, converting notices to failures.
4. Rejects `__PHP_Incomplete_Class`, closures, non-empty `chained`/`middleware`, or a delay.
5. Requires `serialize($job)` to equal the original string byte for byte.
6. Requires every constructor property to be initialized, and exactly one `to` with no cc/bcc/replyTo/from.

## Production prerequisites

None of these is done. Each needs its own approval.

1. **Read-only Phase 0 inspection** authorized by the production server administrator ([production-readiness-phase-0.md](./production-readiness-phase-0.md)): the worker's Scheduled Task action, trigger, user and `--queue`/`--tries`, the cache and queue configuration, and the backlog size.
2. **Pre-push blocker resolved:** local commit `0e72a97` added `recovery_dry_run.txt` (internal identifiers) and `3beeeb3` only untracks it. Neither is on a remote. The branch history must be cleaned, with approval, before anything is pushed.
3. **Reviewed deployment** of the release, including the four migrations in [production-migration-sequence.md](./production-migration-sequence.md) (`2026_10_09_000001`, `000002`, `000003`, `000007`), applied with `--pretend` first and only by the approved operator.
4. **Heartbeat evidence exists.** A worker of this release must have recorded a heartbeat and then stopped; otherwise `--execute` refuses with `no_heartbeat_evidence`. While eLeave mail is queued, record it only with the [probe worker](#recording-first-heartbeat-evidence-with-the-probe-worker), never by running the normal worker.
5. **Production safety preflight** below passes on the host and account that will run the commands.
6. **Backup** of `jobs` and `failed_jobs`, taken by the administrator.
7. **Mail log access (L1 approval)** to review `delivery_uncertain` jobs and spot-check sends.
8. **Change approval** for the worker stop and restart. The administrator performs both by the method confirmed in Phase 0. Preventing the Scheduled Task from re-triggering during recovery may require temporarily disabling it, which is a Task Scheduler change and needs its own approval. The code never touches the task.

## Production safety preflight

Run every check with the **same host, OS user, and PHP binary** that will run the recovery commands. These check the effective configuration, including any cached config, not `.env`.

```bash
php artisan about --only=environment,cache,drivers
php artisan config:show app.env
php artisan config:show mail.default
php artisan config:show mail.dev_recipient
php artisan config:show mail.mailers.smtp.host
php artisan config:show mail.mailers.smtp.port
php artisan config:show mail.from.address
php artisan config:show database.default
php artisan config:show queue.connections.database.queue
php artisan config:show eleave.email_service
php artisan list eleave
```

Avoid `config:show mail.mailers.smtp` without a key suffix; it prints the SMTP password.

**Recipient redirection must be off.** `MailDevRecipient` rewrites every recipient to `mail.dev_recipient` when `app.env` is `local`. Probe it (read-only):

```bash
php artisan tinker --execute 'echo \Modules\Eleave\Support\MailDevRecipient::resolve("probe@example.invalid"), PHP_EOL;'
```

Expected: `probe@example.invalid`.

**STOP, do not run production recovery, if any of these is true:**

- `app.env` is `local` or cannot be confirmed, or the redirect probe returns anything other than the probe address.
- `mail.default` is `array`, `log`, or not the intended production transport, or the SMTP host, port, or from address are not the production relay values.
- The config cache state is unknown, or `database.default` or the queue name is not the production database and queue.
- `CACHE_STORE` is `array` or `null` (the lock refuses), or `DB_QUEUE_CONNECTION` differs from `DB_CONNECTION`.
- Any check cannot be run or gives an unexpected result.

Under an active redirect, recovery would mark real-recipient jobs `approver_changed` or `recipient_changed`, and quarantine would then remove them.

## Confirming workers are stopped

The **production administrator** stops the worker, using the method approved in Phase 0. The recovery tools never stop or start it. Confirm with every method below on every host that could run `hrmdo_service` workers.

**1. Scheduled Task state (read-only)**

```powershell
schtasks /Query /TN "<task name>" /V /FO LIST
Get-ScheduledTask | Where-Object { $_.Actions.Arguments -match 'queue:work|queue:listen' } | Select-Object TaskName, State
```

The worker task must not be `Running`, and must not re-trigger during recovery (see prerequisite 8).

**2. No worker process remains**

```powershell
Get-CimInstance Win32_Process -Filter "Name = 'php.exe' OR Name = 'php-cgi.exe'" |
  Where-Object { $_.CommandLine -match 'queue:work|queue:listen' } |
  Select-Object ProcessId, CommandLine
```

Expected: no process that runs the HRMDO `artisan` file. Workers of other applications on the same server (for example Campus Track) also match this filter: identify them by path and never stop or change them. Linux or Docker hosts, if any: `ps -eo pid,cmd | grep -E 'artisan queue:(work|listen)' | grep -v grep`.

**3. Heartbeat evidence**

```bash
php artisan eleave:recover-mail-queue --limit=1
```

The line `Worker heartbeat evidence:` must read `workers stopped: ...`. Wait at least `ELEAVE_EMAIL_WORKER_STALE_SECONDS` (default 120) after the stop. If it reports `no_heartbeat_evidence`, use the [probe worker](#recording-first-heartbeat-evidence-with-the-probe-worker).

**4. Database level**

```sql
SELECT id, queue, attempts, reserved_at FROM jobs WHERE reserved_at IS NOT NULL;

-- Snapshot, wait at least DB_QUEUE_RETRY_AFTER (90 s) plus 60 s, run again:
-- attempts must not change and pending must not fall while workers are stopped
SELECT queue, COUNT(*) AS pending, MAX(id) AS max_id, SUM(attempts) AS total_attempts
FROM jobs GROUP BY queue;
```

New eLeave jobs keep arriving while workers are stopped (the API still queues mail), so a rising `max_id` is expected. A falling `pending` or a changing `attempts` means a worker is still running.

## Recovery procedure

```bash
# 0. Administrator: back up the queue tables
mysqldump --single-transaction <hrmdo_db> jobs failed_jobs > jobs_backup_<timestamp>.sql

# 1. Administrator stops the worker; confirm with every method in "Confirming workers are stopped"

# 2. Dry-run (no mail, no writes). Write the full preview OUTSIDE the repository;
#    it lists job uuids and leave application ids. Never commit it.
php artisan eleave:recover-mail-queue --type=all --limit=50
php artisan eleave:recover-mail-queue --type=all --limit=100000 > ../recovery_dry_run_<timestamp>.txt

# 3. Review the dry-run with the approver (counts per decision and reason, recipients changed,
#    manual_review, delivery_uncertain). Get explicit approval to send.

# 4. Execute a small first batch (this SENDS email), check the result and the mail server log
php artisan eleave:recover-mail-queue --execute --workers-stopped --type=approval --limit=5

# 5. Continue in batches until "No undecided eLeave mail jobs matched this run."
php artisan eleave:recover-mail-queue --execute --workers-stopped --type=approval --limit=50
php artisan eleave:recover-mail-queue --execute --workers-stopped --type=status --from="2026-10-05 00:00:00" --limit=50

# 6. Review manual_review, failed_before_send and delivery_uncertain rows (queries below).
#    After fixing the cause of failed_before_send, run step 5 again; it retries them.

# 7. Quarantine: preview, then confirm (skipped; then reviewed manual_review;
#    then failed_before_send only if you decided not to retry them)
php artisan eleave:quarantine-mail-queue
php artisan eleave:quarantine-mail-queue --confirm --workers-stopped
php artisan eleave:quarantine-mail-queue --include-manual-review --confirm --workers-stopped
php artisan eleave:quarantine-mail-queue --include-failed-before-send --confirm --workers-stopped

# 8. Catch mail queued during recovery, then run the gate
php artisan eleave:recover-mail-queue --execute --workers-stopped --type=all --limit=50
php artisan eleave:quarantine-mail-queue --confirm --workers-stopped
php artisan eleave:verify-mail-queue
```

### Mandatory restart gate

**Do not restart the worker until `eleave:verify-mail-queue` prints `READY` and exits `0`.** It reports NOT READY while any of these remain:

| Verify row | Why it blocks a restart | Resolution |
| --- | --- | --- |
| `on worker queues (a restarted worker would send them)` | Undecided mail; for example rows left by `--limit` or `--type` | Run recover again |
| `held, not runnable (quarantine or retry)` | Decided but unresolved | Quarantine, or retry `failed_before_send` |
| `manual_review, not yet quarantined` | Needs a human decision | Review, then `--include-manual-review` |
| `failed_before_send (retry recover or quarantine)` | Fix the cause and retry, or quarantine | Recover or `--include-failed-before-send` |
| `Claimed jobs parked by an interrupted run` / `Stale attempting audit rows` | A run crashed mid-send | Run `--execute` once; it quarantines them as `delivery_uncertain` |
| `other (escalate)` | A state the tools do not expect | Escalate; do not restart |
| `New eLeave mail is queued on connection [...] but recovery scans connection [...]` | eLeave mail on the other connection is invisible to recover and verify | Recovery always scans `database` (`eleave.mail_queue_recovery.queue_connection`); escalate if `QUEUE_CONNECTION` is anything else |
| `N eLeave mail job(s) on queue [...], which recovery does not scan` | eLeave mail on a queue outside the scanned set, such as an earlier `ELEAVE_MAIL_QUEUE` value; a worker on that queue would send it unchecked | Escalate; do not restart |
| `A worker heartbeat lists a recovery-only queue` | A worker on the held or claimed queue would send mail the tools set aside | Remove that queue from the worker's `--queue` before any restart |

Verify ignores jobs from other applications (any class other than the two eLeave mailables) on every queue. It does not inspect `failed_jobs`; eLeave rows there are sent again only by a manual `queue:retry`, so review them with `eleave:review-mail-delivery` instead of retrying them.

If verify keeps failing only because new eLeave mail keeps arriving, repeat step 8. Once verify is READY, the administrator restarts the worker by the approved method. Jobs queued after the final verify are normal traffic.

`verify` also lists paused queues. The tools never pause or resume a queue. If someone paused one by hand (`queue:pause`), that person resumes it after verify is READY.

### Review queries

```sql
SELECT decision, reason, notification_type, COUNT(*)
FROM eleave_mail_queue_recovery_logs
GROUP BY decision, reason, notification_type
ORDER BY decision, reason;

SELECT l.job_id, l.job_uuid, l.notification_type, l.recipient_role, l.reason, j.payload
FROM eleave_mail_queue_recovery_logs l
JOIN jobs j ON j.id = l.job_id
WHERE l.decision IN ('manual_review', 'failed_before_send');

SELECT job_uuid, leave_application_id, recipient_role, recipient, reason, processing_result, updated_at
FROM eleave_mail_queue_recovery_logs
WHERE decision = 'delivery_uncertain';
```

- **`manual_review`:** decide from the payload and live data whether the notification still matters. Approvers always see pending items in **For Approval** / **HR Approval**, and applicants in **My Leave**, so contacting the person directly is a valid resolution. Then quarantine with `--include-manual-review`.
- **`failed_before_send`:** the mail server was never contacted. Read `processing_result`, fix the cause, and run recover again, or quarantine with `--include-failed-before-send`.
- **`delivery_uncertain`:** search the mail server logs (needs L1 approval) for the recipient around `updated_at`. If it was not delivered, notify the person directly. There is no automatic resend. `eleave:mail-delivery-review --bucket=quarantined` lists these with the quarantine reference.

### Escalation

Stop and escalate, without retrying or forcing anything, when:

- recover or quarantine reports reserved jobs. A reservation left by a killed worker expires only when a worker re-reserves it, and the tools will not clear it;
- the heartbeat evidence reports `heartbeat_inconsistent` or `worker_on_recovery_queue`;
- verify shows `other (escalate)`, or `Other reserved jobs on these queues`;
- a run is interrupted (`eleave.mail_recovery.interrupted` in `storage/logs`) more than once.

## Duplicate candidate review (read-only)

`eleave:review-mail-candidates` shows which pending eLeave mail jobs are duplicates before anyone decides to run `--execute`. It reads the queue and evaluates each job with the same eligibility rules as recovery. It has no code path that sends mail, runs, reserves, releases, deletes, or moves a job, or writes to any table. A test checks the source for those calls.

| Mode | Use |
| --- | --- |
| `--application=ID` | Every pending job linked to one leave application, evaluated against the whole queue. Classifications are final |
| `--limit=N` (1 to 500) | One keyset page of the whole queue, for production batching. Repeat with `--after-job-id` and `--snapshot` from the footer of the previous page |
| `--classify-export=FILE` | Classifies saved pages offline, with no database access |

Classifications: `unique`; `distinct_recipient` (for example HR fan-out, one job per HR approver); `repeat_primary` and `repeat_redundant` (the same recipient again, flagged `case_variant` or `content_differs`); `not_eligible`; `identity_unverified`; `duplicate_uuid`; and `deferred` (page mode only). `repeat_redundant` jobs are never candidates for an allowlist.

The command exits `1` when:

- any reviewed job is `identity_unverified` or `duplicate_uuid`, even when `--duplicates-only` or the default filter hides it (a notice gives the hidden count);
- `--application` finds queued eLeave jobs it cannot read, because they may belong to that application;
- a read-only session cannot be restored after the review. The results are withheld, the other connections are still restored, and the affected connection is disconnected.

**`advisory_execute_would_send` is an advisory simulation, not a delivery guarantee or an authorization to send.** Application state, recipient eligibility, and queue contents can change before execution, and `--execute` re-evaluates every job and may send fewer or different emails. Every output format prints this notice.

### Recipients and personal details

- The output shows only a masked address (`h***@adamson.test`) and keyed references (`recipient_ref`, which ignores letter case; `recipient_case_ref`; `content_ref`). They are HMACs under `APP_KEY`, so references can be compared only within one environment. Names, employee numbers, reasons, and mail content are never printed.
- The recipient comes from the queued payload only. It is never inferred from application data. A missing, malformed, multiple, cc/bcc, ambiguous, or mismatched recipient is `identity_unverified`.
- `--show-recipients` is refused unless the environment sets `ELEAVE_REVIEW_FULL_RECIPIENTS_ENABLED=true` (default `false`) and `--authorization-ref=<ticket or approval id>` is given. **`--authorization-ref` is an audit reference, not an authorization.** It is printed in the CONFIDENTIAL notice and recorded as `audit_ref` in JSON output for traceability; the command does not check it against any approval system. Full recipient access must depend on approved operator permissions and this documented procedure.
- Do not commit full-recipient output or paste it into chat or tickets. If you redirect it to a file, keep it outside the repository with mode `600` and delete it after the review.
- `--classify-export` verifies that each exported full recipient matches its `recipient_ref` and mask, and drops it from the output unless `--show-recipients` is allowed; it then prints a CONFIDENTIAL notice that the file itself contains addresses.
- Queued values are printed without control characters (terminal escapes are removed). A job uuid outside `[A-Za-z0-9:_-]` is replaced by `unsafe-<hash>` and the job is `identity_unverified` (`payload_unsafe_uuid`). CSV cells that start with `=`, `+`, `-`, `@`, tab, or carriage return are prefixed with `'` so spreadsheets do not evaluate them.

### Batching in production

```bash
php artisan eleave:review-mail-candidates --limit=200 --format=json > /secure/review/page-1.jsonl
# The footer (stderr) prints: snapshot=<token> resume_after_job_id=<id> has_more=true
php artisan eleave:review-mail-candidates --limit=200 --format=json --after-job-id=<id> --snapshot=<token> >> /secure/review/page-1.jsonl
# Repeat until has_more=false, then classify the complete export offline:
php artisan eleave:review-mail-candidates --classify-export=/secure/review/page-1.jsonl
```

`--limit` and `--classify-export` need `ELEAVE_REVIEW_EXPORT_HMAC_KEY`: a dedicated key of at least 32 bytes (raw, or `base64:`-prefixed like `APP_KEY`) that must not equal `APP_KEY`. Generate one with `php -r 'echo "base64:".base64_encode(random_bytes(32)), PHP_EOL;'` and store it like other secrets. If it is missing, short, malformed, or equal to `APP_KEY`, both modes refuse before touching the database. Each JSON page (export version 2) carries an HMAC-SHA256 `signature` over its canonical content; the key is never printed or exported. Pages must be classified in the environment that produced them.

Each page records a snapshot of the scanned queues (row count, lowest and highest id, and a checksum over every row's id, queue, attempts, reservation, availability, creation time, and payload hash). A page refuses to run if the queue differs from the first page's snapshot or changes while the page is read. `--classify-export` first refuses any page whose signature is missing or invalid (an edited page, or one signed with another key). It then checks that every page's filter hash matches this environment's queue connection, jobs table, queues, and status cutoff; that the snapshot is well formed and matches its token and the first page; that each page continues from the previous page's last scanned id; that page size, scanned count, `has_more`, and row count are consistent; that every row field holds a value the review itself produces; that job ids increase and never overlap; that the last page is final; and that the pages cover the snapshot exactly. Error messages name the page and field, never the rejected value. Gaps in job ids are allowed. If any check fails, discard the pages and start a fresh export. Because the snapshot covers every job on the scanned queues, new mail or other jobs arriving during the export force a fresh export. Run it while the workers are stopped.

### Database read-only guarantee

Before reading any job, the command makes every connection it reads (default, `aduollms`, `adulive`, and the `User` model's connection) read-only at the database. If any connection cannot prove it, the command stops and reviews nothing.

- MySQL 5.7.20 or later and MariaDB: `SET SESSION transaction_read_only = 1` (older MariaDB versions use `tx_read_only`), read back to confirm, then restored. MySQL rejects writes with error 1792 (SQLSTATE 25006).
- SQLite (tests): `PRAGMA query_only = ON`.
- Any other driver, an older server, a persistent PDO, a separate read connection, or an open transaction is refused.
- Each session's previous value is recorded before it is changed. If setup fails part way, every connection already changed is restored and the review does not run. A session that was already read-only stays read-only.
- During the review, the guard also refuses statements that could reopen writes (`transaction_read_only`, `autocommit`, `COMMIT`, `SET TRANSACTION`, and similar), any connection opened or reconnected mid-review, and any connection that was open but not engaged. A defensive `MessageSending` listener cancels any mail and fails the command.
- Afterwards each session is restored on the same database session that was made read-only (even if the connection was replaced or dropped) and read back. A failed restore disconnects that connection, still restores the others, and makes the command exit `1`.
- Only one guard can be active per process; a nested review is refused and the outer one is unaffected.

Limitations:

- MySQL still allows writes to `TEMPORARY` tables in a read-only session. The review creates none.
- On MySQL, the engine would let the session switch `transaction_read_only` back to `0`. Only the guard's statement filter prevents that. The filter refuses any statement that names the variable.
- No SELECT-only database account exists for `hrmdo_service`. A dedicated read-only account would add a second, permission-based safeguard. Creating one needs DBA approval.
- The MySQL path was verified locally on MySQL 8.0.30. The MariaDB path has not run against a real MariaDB server.
- Laravel has no API to remove query hooks or event listeners, or to read a connection's reconnector. The guard installs one permanent hook per connection and one listener per event dispatcher, both inactive outside a review, and reads the reconnector by reflection. If Laravel's internals change shape, the guard refuses to run.
- Anyone holding `ELEAVE_REVIEW_EXPORT_HMAC_KEY` can forge a signed page.

## Audit records

- Per job: `eleave_mail_queue_recovery_logs` (decision, reason, recipient, original queue `job_queue`, processing result, timestamps).
- Quarantined payloads: `eleave_mail_queue_quarantine`, verbatim, with the decision and the original queue.
- Per command: `storage/logs` entries `eleave.mail_recovery.finished`, `.refused`, `.interrupted`, and `eleave.mail_quarantine.finished`, `.interrupted`, with the command name, the outcome counts, the refusal codes, or the error. They do not record who ran the command, so the operator records the change ticket and their name separately.

## Rollback

- The tools delete a `jobs` row only after a recorded `sent`, or after copying the verbatim payload into `eleave_mail_queue_quarantine`. Held and quarantined jobs can be restored by hand, but restoring one to a worker queue makes the worker send it, including outdated mail.
- To abort mid-recovery, stop running the command. Undecided jobs stay on their worker queue, so do not restart the worker until verify is READY.
- Sent email cannot be recalled.
- The migrations' `down()` drops the audit and quarantine tables. Export them first. In production, do not roll back `2026_10_09_000007` (`job_queue`).

## Dedicated eLeave mail queue

| Setting | Effect |
| --- | --- |
| `ELEAVE_MAIL_QUEUE` unset (default) | No change: mail goes to the connection's default queue with byte-identical payloads |
| `ELEAVE_MAIL_QUEUE=eleave-mail` | New approval and status mail goes to `eleave-mail` |
| Invalid value (not `[A-Za-z0-9_.:-]{1,64}`, contains a comma, or names a recovery-only queue) | Ignored with a log warning; mail stays on the default queue |

Recovery, quarantine, and verify always scan the default queue, the configured queue, and `eleave-mail`. Enabling isolation is a separate decision: first change the worker to `--queue=eleave-mail,default` (a Scheduled Task change that needs approval), then set the variable. Setting it first would leave new mail on a queue no worker reads.

## Send-time eligibility, notification identity, and the delivery ledger

All three are **disabled, not wired, and out of scope for manual recovery**. `eleave.send_time_eligibility.enabled` and `eleave.notification_identity.enabled` are `false` with no env switch. `GuardsSendTime` is on no production mailable, and `SendTimeTracking::register()` is called by no provider. The migrations for the delivery ledger and the send-time events table were moved to `hrmdo_service/database/deferred-migrations/`, which Laravel does not load, so `php artisan migrate` never applies them. Recovery reads the ledger only if the table exists.

Enabling any of these needs separate approval. The design, tests and open risks are recorded in the code under `Services/SendTimeEligibility/` and in `tests/Feature/EleaveSendTimeEligibilityTest.php`, `EleaveSendTimeDeliveryTest.php` and `EleaveMailDeliveryReviewTest.php`.

## Configuration

`config/eleave.php`:

| Key | Default | Env |
| --- | --- | --- |
| `mail_queue_recovery.lock_seconds` | `3600` | `ELEAVE_MAIL_RECOVERY_LOCK_SECONDS` |
| `mail_queue_recovery.delay_ms` (pause after each send) | `200` | `ELEAVE_MAIL_RECOVERY_DELAY_MS` |
| `mail_queue_recovery.status_cutoff` | `2026-10-05 00:00:00` | `ELEAVE_MAIL_RECOVERY_STATUS_CUTOFF` |
| `mail_queue_recovery.default_limit` | `50` | `ELEAVE_MAIL_RECOVERY_LIMIT` |
| `email_service.enabled` (worker heartbeats) | `true` | `ELEAVE_EMAIL_SERVICE_MONITOR_ENABLED` |
| `email_service.heartbeat_interval_seconds` | `30` | `ELEAVE_EMAIL_HEARTBEAT_INTERVAL` |
| `email_service.heartbeat_retention_days` | `14` | `ELEAVE_EMAIL_HEARTBEAT_RETENTION_DAYS` |
| `email_service.worker_stale_seconds` (at least twice the interval) | `120` | `ELEAVE_EMAIL_WORKER_STALE_SECONDS` |
| `mail_queue` (top level) | unset | `ELEAVE_MAIL_QUEUE` |
| `mail_queue_recovery.review_full_recipients_enabled` | `false` | `ELEAVE_REVIEW_FULL_RECIPIENTS_ENABLED` |
| `mail_queue_recovery.review_export_hmac_key` (candidate review page signing; required for `--limit` and `--classify-export`) | unset | `ELEAVE_REVIEW_EXPORT_HMAC_KEY` |

A heartbeat write failure is reported once to the application log and never interrupts the worker.

## Local test results (2026-10-09)

> **Local results, not production.** Local Docker, local database, `APP_ENV=local` with `MAIL_DEV_RECIPIENT` redirection active, so every email went to the developer address. These ran on an earlier version of the tool, before the held queue and the heartbeat check existed.

| Notification | Evaluated | Sent | Skipped |
| --- | ---: | ---: | ---: |
| Approval request | 1,401 | 89 | 1,312 |
| Status | 391 | 3 | 388 |
| **Total** | **1,792** | **92** | **1,700** |

No `manual_review`, `failed_before_send`, or `delivery_uncertain` outcomes occurred. The 1,700 skipped jobs were quarantined and verify reported READY. Locally the queue was resumed before verify ran; production must run verify first. The 276 recipient-mismatch skips (`approver_changed`, `recipient_changed`) are likely caused by the local redirect, so production counts will differ.

## Local worker restart and fresh-mail test (pending)

Confirms that a restarted worker sends new eLeave mail normally and nothing from the recovered backlog. In the local Docker container only:

1. Confirm no worker runs: `docker exec hrmdo_service-app-1 sh -c "ps -eo pid,cmd | grep -E 'queue:(work|listen)' | grep -v grep"` (expect no output).
2. Confirm the runtime is local (`php artisan about`, the database host, and the redirect probe returning the developer address).
3. Run `php artisan eleave:verify-mail-queue` and expect READY.
4. File a new leave application as a test employee; confirm exactly one new `LeaveApplicationApprovalRequestMail` row in `jobs`.
5. `php artisan queue:work database --queue=default --once`; confirm the row is gone, `failed_jobs` is unchanged, the email reached the developer address, and a heartbeat row was written.
6. Run verify again and expect READY.

## Automated test coverage (local)

`tests/Feature/EleaveMailQueueRecoveryTest.php`, `EleaveWorkerStoppedCheckTest.php`, `EleaveEmailServiceCoordinatorTest.php`, `EleaveEmailServiceHeartbeatTest.php` and `EleaveManualMailRecoveryScopeTest.php` cover:

- refusal when heartbeats are absent, disabled, unreadable, inconsistent, or fresh;
- refusal when any job (eLeave or not) is reserved;
- a job that becomes ineligible during the final check (held, never sent);
- `manual_review` held through a worker restart;
- an interrupted send after the transport was reached (quarantined, never resent);
- duplicate copies (one send);
- legacy decided jobs moved off the worker queue;
- a real `queue:work` run after `--execute` sending nothing that recovery decided not to send;
- the verify gate blocking a restart while undecided or held mail remains;
- no email-service routes, watchdog commands, schedules, or extra worker listeners, and only the four recovery migrations loaded.

`tests/Feature/EleaveMailCandidateReviewTest.php` covers the candidate review: every classification, identity failures, masking, the full-recipient gate and audit reference, exit codes with hidden blocking rows and unreadable jobs, page snapshots, signed export validation (tampered, re-signed, and malformed pages, key handling, recipient verification), terminal and CSV injection, the read-only guard rejecting writes on the default, `adulive`, and `aduollms` connections, refusal of unverifiable drivers and unengaged connections, a failed restore exiting `1`, that no mode writes, sends, or dispatches, and the call graph. The call-graph checks are a source allowlist of the recovery and eligibility methods the review calls, a scan of those reader methods for writes, locks, sends, and transactions, a runtime check that no recovery mutator is called, and an event listener that sees no model write, queue, mail, notification, transaction, or cache-write event. A source check also confirms that only `MailQueueRecoveryService::deliver()` calls `sendNow()`. An opt-in test proves MySQL rejects writes under the guard and restores the session across repeated runs, partial setup failure, a pre-set read-only session, and a reconnect; it runs only when `ELEAVE_READONLY_GUARD_MYSQL_DATABASE` names a test database (with `_HOST`, `_PORT`, `_USERNAME`, `_PASSWORD`).

`tests/Feature/EleaveReadOnlySessionGuardTest.php` covers the guard's lifecycle on SQLite: repeated runs on one and several instances without adding hooks or listeners, a violation not leaking into the next run, partial setup failure, a session that does not read back, a restore failure (other connections restored, the stuck one discarded), a pre-set read-only session, reconnects and disconnects mid-review, nesting, persistent PDOs, and an unreadable reconnector.

Baseline debt, not caused by this work: `hrmdo_service` has 9 failing unit tests (`LeaveAfterCutoffPrintStatusTest`, `LeaveApplicationHrApprovalScopesTest`, `LeaveApplicationReportScopesTest`, all `QueryException`). `apps/eleave` has 31 TypeScript errors and 2 failures in `src/routes/my-leave/leave-form/validation.test.ts`.
