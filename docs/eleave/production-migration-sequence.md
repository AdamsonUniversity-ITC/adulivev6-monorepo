# eLeave Manual Mail Recovery: Production Migration Sequence

Prepared: 2026-10-12, revised for the manual recovery scope. Status: **plan only. No migration has been run in any shared or production environment.** Execution needs gate G4; see [Phase 0 checklist](./production-readiness-phase-0.md#approval-gates).

Production's current migration state is **unknown** until the Phase 0 `migrate:status` evidence is collected. Nothing here is inferred from the local Docker database.

## Migrations in scope (four)

| # | File (`hrmdo_service/database/migrations/`) | Effect | Used by |
| --- | --- | --- | --- |
| 1 | `2026_10_09_000001_create_eleave_mail_queue_recovery_logs_table.php` | Creates `eleave_mail_queue_recovery_logs` | Per-job audit and decisions |
| 2 | `2026_10_09_000002_create_eleave_mail_queue_quarantine_table.php` | Creates `eleave_mail_queue_quarantine` | Verbatim copies of quarantined jobs |
| 3 | `2026_10_09_000003_create_eleave_email_service_heartbeats_table.php` | Creates `eleave_email_service_heartbeats` | Passive worker heartbeats; the worker-stopped check |
| 4 | `2026_10_09_000007_add_job_queue_to_eleave_mail_queue_recovery_logs_table.php` | Adds nullable `job_queue` to recovery logs (depends on 1) | Original queue of held and quarantined jobs |

**Removed from scope:**

| File | Status |
| --- | --- |
| `2026_10_09_000004_create_eleave_email_service_holds_table.php` | Deleted with the watchdog and hold feature |
| `2026_10_09_000005_create_eleave_email_service_restart_requests_table.php` | Deleted with the restart-request feature |
| `2026_10_09_000006_create_eleave_email_service_events_table.php` | Moved to `database/deferred-migrations/`; only the disabled send-time guard would write it |
| `2026_10_12_000001_create_eleave_mail_delivery_ledger_table.php` | Moved to `database/deferred-migrations/`; deferred until send-time eligibility is approved |

Laravel does not load `database/deferred-migrations/`, so `migrate` and `migrate:status` never see the two deferred files. A test asserts that only the four files above are loaded.

**Base prerequisites** (Laravel's base migrations):

- `migrations`, `jobs` and `failed_jobs` must exist, and `failed_jobs` must have a `uuid` column (the failed-job driver is `database-uuids`).
- With `CACHE_STORE=database`, `cache` and `cache_locks` must also exist (the recovery lock).

## Pre-flight (read-only; record in the evidence template)

Run from `<app_root>` with the worker's `<php>`, as an account with read-only database access where possible.

```powershell
& '<php>' artisan --version
& '<php>' artisan migrate:status
```

```sql
-- none of the three new tables may exist yet; any row here is a stop condition until explained
SELECT table_name, table_rows FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name LIKE 'eleave\_%';

-- base prerequisites
SELECT table_name FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name IN ('migrations', 'jobs', 'failed_jobs', 'cache', 'cache_locks');
SELECT column_name FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'failed_jobs' AND column_name = 'uuid';

-- current batch number, for the rollback record
SELECT MAX(batch) AS last_batch FROM migrations;
```

**Stop conditions:**

- **Unexpected pending migration:** `migrate:status` lists anything other than the four above as Pending. A plain `migrate` would apply it too.
- **eLeave migration already Ran or table already exists:** reconcile it first. Also stop if any of the removed or deferred files appears in `migrate:status`, or if `eleave_email_service_holds`, `_restart_requests`, `_events` or `eleave_mail_delivery_ledger` exists.
- **Heartbeats index shape:** migration 3 was changed locally from a single `component` index to a composite (`component`, `last_seen_at`) index after commit `0e72a97`. Confirm the deployed file is the composite version.
- **Missing prerequisite:** a base prerequisite is absent.

## Execution sequence (requires G2 backups and G4 approval)

Migrations are additive and the worker keeps running if the heartbeats table is missing, so they do not require a worker stop. Recovery and quarantine must not be running.

**Step 1: review the SQL** (prints SQL only, no changes):

```powershell
& '<php>' artisan migrate --pretend `
  --path=database/migrations/2026_10_09_000001_create_eleave_mail_queue_recovery_logs_table.php `
  --path=database/migrations/2026_10_09_000002_create_eleave_mail_queue_quarantine_table.php `
  --path=database/migrations/2026_10_09_000003_create_eleave_email_service_heartbeats_table.php `
  --path=database/migrations/2026_10_09_000007_add_job_queue_to_eleave_mail_queue_recovery_logs_table.php
```

Attach the printed SQL to the change ticket. The approver compares it with this plan.

**Step 2: apply** (G4). Use the same four `--path` arguments with `--force --step`. `--step` gives each migration its own batch, so the audit trail shows exactly what ran:

```powershell
& '<php>' artisan migrate --force --step `
  --path=database/migrations/2026_10_09_000001_create_eleave_mail_queue_recovery_logs_table.php `
  --path=database/migrations/2026_10_09_000002_create_eleave_mail_queue_quarantine_table.php `
  --path=database/migrations/2026_10_09_000003_create_eleave_email_service_heartbeats_table.php `
  --path=database/migrations/2026_10_09_000007_add_job_queue_to_eleave_mail_queue_recovery_logs_table.php
```

Laravel runs paths in filename order, so `000007` always follows `000001`.

**Step 3: verify** (read-only):

```powershell
& '<php>' artisan migrate:status
```

```sql
SELECT migration, batch FROM migrations WHERE migration LIKE '2026_10_09_00000%' ORDER BY id;
SHOW CREATE TABLE eleave_mail_queue_recovery_logs;   -- includes job_queue after job_id
SHOW CREATE TABLE eleave_mail_queue_quarantine;
SHOW CREATE TABLE eleave_email_service_heartbeats;   -- composite (component, last_seen_at) index
```

**Step 4: collect heartbeat evidence.** Recovery `--execute` refuses until a worker running this release has written a heartbeat and then stopped. While eLeave mail is queued, do not run the normal worker for this: it would send the queued mail. Use the [heartbeat probe worker](./mail-queue-recovery.md#recording-first-heartbeat-evidence-with-the-probe-worker), which cannot take a job. Then confirm:

```sql
SELECT instance_id, connection, queues, started_at, last_seen_at, stopped_at, stop_reason
FROM eleave_email_service_heartbeats WHERE component = 'worker' ORDER BY last_seen_at DESC LIMIT 5;
```

**If a migration fails part-way:**

- MySQL DDL is not transactional. Migrations before the failed one stay applied and recorded.
- The failed migration may have left an empty table with no `migrations` row.
- Stop and do not retry blindly. The DBA confirms the partial table has 0 rows.
- Only with approval: drop that empty table, then rerun the remaining paths.
- Never drop a table that holds rows.

## Compatibility

| Code | Schema | Behaviour |
| --- | --- | --- |
| Current production release | New tables present | Unaffected; the old code never reads them |
| New release | Tables missing | Worker heartbeat writes fail and are reported once per failure streak; the worker keeps running and sends mail normally (tested). `recover --execute` and `quarantine --confirm` fail closed before changing anything |
| New release | All four present | Intended state. Send-time eligibility stays disabled; no ledger or events table is needed |

## Data-preserving rollback

**Default: roll back code, keep schema.** Every migration here is additive. Redeploying the previous release leaves the tables and the nullable column in place, and the old code ignores them.

**Do not use `migrate:rollback`, `migrate:reset`, `migrate:refresh` or `migrate:fresh` in production.** Each runs `down()`, which drops tables (or the `job_queue` column), and they act on whole batches.

If removing a table is explicitly approved (separate approval, DBA plus application owner), preserve the data first:

1. Stop every writer: the worker (for heartbeats), recovery, and quarantine.
2. Export the table and record its row count and checksum: `mysqldump --single-transaction <hrmdo_db> <table> > <table>_<timestamp>.sql`.
3. Test-restore the export into a non-production database and compare row counts.
4. Rename the table instead of dropping it: `RENAME TABLE <table> TO <table>_retired_<yyyymmdd>;`
5. Remove its row from `migrations` only if the migration must run again later. This is a production data change and needs its own approval.

| Migration | Rollback rule |
| --- | --- |
| 1 (recovery logs) | Never remove after recovery has run: it is the audit trail of what was sent or skipped |
| 2 (quarantine) | **Never remove while it has rows**: it holds the only copy of quarantined payloads |
| 3 (heartbeats) | Keep. Without it, recovery cannot prove the worker is stopped and refuses |
| 7 (`job_queue`) | Never remove. Old code ignores it; dropping it loses the original queue of held and quarantined jobs |

## Deferred migrations

`database/deferred-migrations/2026_10_09_000006_create_eleave_email_service_events_table.php` and `2026_10_12_000001_create_eleave_mail_delivery_ledger_table.php` are used only by the disabled send-time guard (and its tests). Apply them only with the separate approval that enables send-time eligibility, and only before the guard is wired in. They would then have to be moved back into `database/migrations/` (or run with an explicit `--path`) in a reviewed change.
