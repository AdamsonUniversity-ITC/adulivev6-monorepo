# E-Leave HR & Admin Guide

Last verified: 2026-07-23

Guide for HR staff and leave administrators. Requires the appropriate AdULive permissions (see [Permissions](./permissions.md)).

## HR Approval

**Who:** users with `eleave-admin-approval-access`, `eleave-rank-and-file-approval-access`, or `eleave-dev-access`.

### Queue

Open **HR Approval** to see applications already endorsed by supervisor and manager.

Search and filters help locate an employee or leave year. Large result sets may take longer; wait for the list to finish loading.

### Day sheet

Open a request to set **per-day** (and optional split-portion) outcomes:

- Leave type(s) for the day
- Day portion(s)
- HR status: Pending, Approved With Pay, Approved Without Pay, Disapproved, Cancelled
- Remarks as needed

**Approved With Pay** consumes leave credits. The system rejects saves that would exceed remaining credits for the selected types.

You can revert a day back to **Pending** when the sheet allows it, then save. Successful save may close the sheet (per current UI behavior).

### Employee balances in the sheet

Balances shown for the employee include credits and pending filed leave so you can judge with-pay approvals.

## Beginning Balances

**Who:** `eleave-hr-admin-access` (or dev).

Use **Beginning Balances** to create, update, or delete opening leave balances by employee, leave type, and year. These feed the leave balance formula used across My Leave and HR views.

## Employee Leave Credits

**Who:** HR admin (or dev).

**Employee Leave Credits** lists employees and their computed leave credit rows for operational review.

## FL Cutoff Settings

**Who:** HR admin (or dev).

**FL Cutoff Settings** stores the school year and date window used when computing Forced Leave credits. Incorrect dates can change FL balances system-wide—update carefully.

## Reports

**Who:** HR admin (or dev).

| Report | Use |
| --- | --- |
| **Filed Leave** | Search/filter filed applications for reporting |
| **Filed Leave After Cutoff** | After-cutoff filings; print status / print log support |

Use department filters where provided. Prefer Enter-to-search patterns when the UI requires it for large datasets.

## Gender and Leave Types (HR awareness)

- Paternity Leave appears for male employees on apply; Maternity for female.
- Balances may still show PL/ML rows for everyone; apply eligibility is separate.
- If an employee cannot see PL/ML, confirm HR Emp gender is populated and linked via `hris_id` / employee number.

## Duplicate Filings

Employees cannot file overlapping **portions** on the same calendar date (including against cancelled/disapproved history). AM and PM on the same day are allowed if the other portion is free; Whole Day conflicts with all portions.
