# E-Leave API Overview

Last verified: 2026-07-23

Base path: **`/api/v1`** on the HRMDO service, behind `auth:api` unless noted.

This is a grouped overview, not a full OpenAPI spec. Controllers live under `Modules\Eleave\Http\Controllers\Api\V1\`.

## Leave Applications

Source: `routes/api/leave_applications.php`

| Method | Path | Gate | Notes |
| --- | --- | --- | --- |
| GET | `leave-applications/me` | auth | Current user’s applications |
| GET | `leave-applications/me/el-dependent-care-usage` | auth | EL dependent-care usage |
| POST | `leave-applications/apply` | auth | Multipart apply |
| PATCH | `leave-applications/{leaveApplication}/cancel` | auth (owner) | Immediate cancel while fully Pending; optional `cancellation_reason` |
| GET | `leave-applications/for-approval` | supervisor/manager | Endorsement queue |
| GET | `leave-applications/for-approval/pending-count` | supervisor/manager | Pending count for sidebar badge |
| PATCH | `leave-applications/{leaveApplication}/decision` | supervisor/manager | Approve/disapprove |
| GET | `leave-applications/for-hr-approval` | HR approval perms | HR queue |
| GET | `leave-applications/for-hr-approval/pending-count` | HR approval perms | Pending count for sidebar badge |
| PATCH | `leave-application-dates/hr-approval` | HR approval perms | Batch day HR updates |

## Leave Types

Source: `routes/api/leave_types.php`

| Method | Path | Gate |
| --- | --- | --- |
| GET | `leave-types` | auth (visibility-filtered for employee) |
| GET | `leave-types/admin` | admin perms |

## Leave Balances

Source: `routes/api/leave_balances.php`

| Method | Path | Gate |
| --- | --- | --- |
| GET | `leave-balances/me` | auth |
| GET | `leave-balances/employee/{employeeNo}` | HR approval perms |

## Beginning Balances

Source: `routes/api/leave_beginning_balances.php` — all **admin** perms

| Method | Path |
| --- | --- |
| GET/POST | `leave-beginning-balances` |
| GET/PATCH/DELETE | `leave-beginning-balances/{leaveBeginningBalance}` |

## Employee Leave Credits

Source: `routes/api/employee_leave_credits.php`

| Method | Path | Gate |
| --- | --- | --- |
| GET | `employee-leave-credits` | admin |

## FL Cutoff Preferences

Source: `routes/api/fl_cutoff_preferences.php`

| Method | Path | Gate |
| --- | --- | --- |
| GET | `fl-cutoff-preferences` | admin |
| PUT | `fl-cutoff-preferences` | admin |

## Reports

Source: `routes/api/reports.php` — all **admin**

| Method | Path |
| --- | --- |
| GET | `reports/filed-leave` |
| GET | `reports/filed-leave/departments` |
| GET | `reports/filed-leave-after-cutoff` |
| GET | `reports/filed-leave-after-cutoff/print-status` |
| POST | `reports/filed-leave-after-cutoff/print-log` |

## Employees / HR Profile

Sources: `employee_hr_profile.php`, `employees.php`

| Method | Path | Gate |
| --- | --- | --- |
| GET | `employees/me/hr-profile` | auth |
| GET | `employees/{employeeNo}/hr-profile` | HR approval perms |
| GET | `employee-search` | admin |
| GET | `employee-search/{employeeId}` | admin |

## Media

Source: `routes/api/leave_application_media.php`

| Method | Path | Gate |
| --- | --- | --- |
| GET | `leave-applications/media/{media}/view` | `signed` |

Named route: `eleave.media.view`. URL expiration from `eleave.file_url_expiration_minutes`.

## Dev Features

Source: `routes/api/dev_features.php` — placeholder; gated by `eleave.permissions.dev` when routes are added via `config('eleave.dev_api_routes')`.

## Apply Validation Errors (common fields)

| Field | Examples |
| --- | --- |
| `leave_type_id` | Gender ineligible; insufficient PL credits; visibility |
| `date_from` | Duplicate portion slots; filing timing may also surface on type/dates |
| `reason` | Dependent-care limit |
| `leave_days` | Evening not allowed |

FE maps these via `getValidationFieldErrors` and shows toasts on submit failure.
