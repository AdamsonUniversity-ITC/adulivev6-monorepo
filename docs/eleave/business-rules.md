# E-Leave Business Rules

Last verified: 2026-07-23

Rules below are enforced primarily in `hrmdo_service/app-modules/eleave`. Frontend may pre-check for UX; backend remains authoritative.

## Leave Type Visibility

Implemented in `LeaveTypeVisibilityService`.

### Employment profile

- **Academic contractual (SIL-only):** only Service Incentive Leave (`sil`) is offered and allowed.
- **Non–SIL-only:** SIL is hidden/rejected; other active types remain (subject to other rules).
- **Forced Leave (`fl`):** only if the teacher is forced-leave eligible; employee leave-types list also omits FL for non-admin listing.

### Gender (apply dropdown + submit only)

Resolved from HR Emp via `Teacher::hrEmpRecord()` (`sex` then `gender`; values `male`/`m`, `female`/`f`).

| Leave code | Rule |
| --- | --- |
| `pl` (Paternity) | Male only |
| `ml` (Maternity) | Female only |

- Unknown / unresolved gender: both PL and ML are omitted from the apply leave-type list and rejected on submit.
- **Leave balances table does not hide PL/ML by gender** (`filterBalanceRows` stays gender-agnostic).

Leave-types API must select `hris_id` on the teacher so Emp lookup succeeds.

## Filing Timing

`LeaveFilingTimingService` uses each leave type’s `filing_timing` and `required_lead_days`:

- `ANYTIME`
- `BEFORE` / `BEFORE_OR_ON`
- `AFTER` / `AFTER_OR_ON`
- `WITHIN_MONTH` (e.g. birthday leave)

## Apply-Time Credit Checks

### Paternity (`pl`)

`LeaveApplyCreditValidationService`:

- Requested days = sum of day-portion weights (or date range × portion).
- Available = balance `credits - pending_filed_leave` for `pl`.
- Insufficient → validation error on `leave_type_id`.

### Maternity (`ml`)

No apply-time credit insufficiency check (ML remains free of credit validation on apply).

### Other leave types

No general apply-time credit gate. Sufficiency for Approved With Pay is enforced at **HR approval** via `LeaveCreditDeductionService::validateHrApprovalItems`.

## Duplicate Dates (portion slots)

`LeaveApplyDuplicateValidationService` — conflict by **date + portion slot**, not whole calendar day alone.

Slots: `am`, `pm`, `evening`.

| Portion | Occupies |
| --- | --- |
| Whole Day | am + pm + evening |
| AM | am |
| PM | pm |
| Evening | evening |

- Block when requested slots intersect any existing application date rows for that employee on that date.
- **All statuses count**, including Cancelled and Disapproved (any existing row still occupies its slots).
- Example: existing AM only → new AM or Whole Day blocked; new PM or Evening allowed.

Error field: `date_from` (message names date and overlapping slots).

## Dependent Care (Emergency Leave)

`LeaveDependentCareLimitService`:

- Applies when leave type is Emergency Leave (`el`) and reason contains “dependent”.
- Maximum **2** uses per year (new applications + legacy HR leave details).
- Error on `reason` when exceeded.

## Evening Portions

`EveningDayPortionEligibilityService` — only eligible positions may file Evening day portions. FE also gates the option via HR profile `can_select_evening_day_portion`.

## Leave Balances Formula

`LeaveBalanceService` (high level):

```
credits ≈ max(0, HR emp leave credits + beginning balances − consumed − legacy deductions)
```

- **Consumed:** day portions with HR status **Approved With Pay** (with VL/FL cutoff special cases).
- **Pending filed leave:** separate field; pending days reserve display availability for PL apply checks as `credits - pending_filed_leave`.
- FL credits use school-year FL cutoff preferences (`FlCutoffPreference`).

## HR Approval Credits

When HR marks portions Approved With Pay (or changes types/portions), `validateHrApprovalItems` ensures the credit delta does not exceed remaining raw credits after existing consumption.

## Application Status Overview

| Level | Meaning |
| --- | --- |
| Overall (`overall_status`) | Pending, Approved, Partially Approved, Disapproved, Cancelled |
| Approver1 / Approver2 | Supervisor then manager endorsement |
| Per-day `hr_status_*` | HR disposition of each portion |

Both supervisor and manager approval are required before the application is endorsed into the HR queue.
