# E-Leave Permissions

Last verified: 2026-07-23

Permission names are defined in `hrmdo_service/config/eleave.php` and mirrored in `apps/eleave/src/lib/eleave-access.ts`.

## Permission Names

| Name | Purpose |
| --- | --- |
| `eleave-hr-admin-access` | Admin features: beginning balances, employee credits, FL cutoff, reports |
| `eleave-admin-approval-access` | HR approval queue (admin tier) |
| `eleave-rank-and-file-approval-access` | HR approval queue (rank-and-file tier) |
| `eleave-dev-access` | Grants admin + HR approval + reserved dev routes |

Config groups:

- `eleave.permissions.hr_approval` → admin approval **or** rank-and-file approval **or** dev
- `eleave.permissions.admin` → HR admin **or** dev
- `eleave.permissions.dev` → dev only

## Profile Flags (not Spatie permissions)

From `GET employees/me/hr-profile`:

| Flag | Used for |
| --- | --- |
| `is_supervisor` / `is_manager` | For Approval UI + `EnsureIsSupervisorOrManager` API |
| `can_select_evening_day_portion` | Evening day portion in apply form |

## Frontend Route Access Matrix

Registry: `apps/eleave/src/lib/eleave-route-access.ts`.

| Route prefix | Tier | Gate |
| --- | --- | --- |
| `/beginning-balances` | admin | `eleave-hr-admin-access` or `eleave-dev-access` |
| `/employee-leave-credits` | admin | same |
| `/settings/fl-cutoff` | admin | same |
| `/reports/filed-leave` | admin | same |
| `/reports/filed-leave-after-cutoff` | admin | same |
| `/hr-approval` | hrApproval | any HR approval permission (or dev) |
| `/for-approval` | forApproval | `is_supervisor` or `is_manager` |
| Other routes (My Leave, Guidelines, …) | open | Authenticated only |

Root `beforeLoad` denies restricted routes with redirect to `/forbidden`.

## Backend Middleware Matrix

| Area | Middleware / gate |
| --- | --- |
| Most eleave APIs | `auth:api` |
| Signed media view | `signed` (+ auth group) |
| For-approval list + decision | `EnsureIsSupervisorOrManager` |
| HR approval list + patch | `eleave.permission:` + `hr_approval` list |
| Beginning balances, FL cutoff, employee credits, reports, employee-search | `eleave.permission:` + `admin` list |
| Leave types employee index | authenticated (filtered by visibility) |
| Leave types admin index | admin permissions |
| Leave balances for another employee | HR approval permissions |
| Employee HR profile for another employee | HR approval permissions |

Implementation: `EnsureUserHasEleavePermission`, `EleavePermissionChecker`.

## Sidebar Visibility

`AppSidebar` filters nav items with `canAccessEleaveRoute`, so users only see links they can open.
