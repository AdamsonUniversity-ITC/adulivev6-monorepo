# AdUTS Microfrontend

Board-per-subdomain ticketing UI for the AdUTS API in `hrmdo_service` (`modules/aduts`).

## Hosts

| Host                       | Role                                      |
| -------------------------- | ----------------------------------------- |
| `ticketing.localhost.test` | Platform — list boards, cross-board inbox |
| `{slug}.localhost.test`    | Board tenant (exact label = board slug)   |

## Admin UIs

| Host     | Path      | Who                                                                            |
| -------- | --------- | ------------------------------------------------------------------------------ |
| Platform | `/admin`  | Spatie `ticketing-system-admin-access`                                         |
| Board    | `/manage` | Spatie `ticketing-system-board-admin-access` **and** `aduts_board_admins` flag |

Grant Spatie permissions in AdU Live Users Center. Super-admin UI sets the board-admin flag only.

## Dev

```bash
pnpm --filter ticketing-system install
pnpm --filter ticketing-system dev
```

Vite proxies `/hrmdo-api` → `http://127.0.0.1:8003/api` (hrmdo Docker port).

## Tests

```bash
pnpm --filter ticketing-system test
```
