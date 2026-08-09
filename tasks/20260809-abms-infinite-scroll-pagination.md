# ABMS-UX-20260809-006 — Infinite Scroll Pagination

### Task ID

ABMS-UX-20260809-006

### Feature / Context

ABMS cursor-paginated worklists that currently expose an explicit Load More control.

### Objective

Replace every explicit ABMS Load More action with automatic infinite scrolling while retaining cursor pagination and bounded API page sizes.

---

### Requirements

- Create one reusable observer-based infinite-scroll component.
- Load the next cursor automatically as the sentinel approaches the viewport.
- Permit only one automatic request per rendered cursor and prevent concurrent requests.
- Display an accessible loading state while the next page is requested.
- Stop observing when no next cursor remains.
- Display a manual Retry action only after an automatic next-page request fails.
- Replace Load More in the Administration, Budget, Controller, Logistics, and Stockroom requisition-process worklists.
- Replace Load More in Budget Request Entry, User Access, and expanded Main Account sub-account lists.
- Preserve existing filters, search, sorting, cursor values, page sizes, row actions, and modal behavior.
- Keep existing Previous/Next pagination in selection modals and explicitly paged administration screens unchanged.
- Make no backend, schema, balance, or workflow mutation changes.

---

### Acceptance Criteria

- Approaching the end of each listed worklist automatically appends its next cursor page.
- Users do not see or need to click a Load More action during normal operation.
- A cursor page is not requested twice while its request is pending or after it succeeds.
- A failed automatic request does not loop and presents a Retry action.
- Requery, filter, search, and sorting changes continue to replace the list with the first matching page.
- Lists stop making requests when the backend returns no next cursor.
- Nested sub-account lists load independently for the expanded parent account.
- Existing modal and Previous/Next pagination remains unchanged.
- Targeted lint and the ABMS production build pass, or unrelated baseline failures are recorded.

---

### Inputs / Outputs (if applicable)

**Inputs:**

- A cursor-paginated ABMS list with a next cursor and a sentinel approaching the viewport.

**Outputs:**

- The next bounded page appended automatically, an end state, or a retryable inline error state.

---

### Agent Assignment

- frontend_agent: Implement the shared sentinel and integrate all eight Load More surfaces.
- qa_agent: Validate cursor progression, duplicate-request guards, filter resets, failure retry, and builds.
- reviewer_agent: Review observer lifecycle, nested-list isolation, accessibility, and performance.
- project_manager: Maintain the task record and ABMS continuity documentation.

---

### Dependencies

- Existing cursor metadata and next-page request handlers.
- Browser `IntersectionObserver` support.
- Existing ABMS role worklists and administration list APIs.

---

### Edge Cases

- The sentinel is already visible when the first page renders.
- The next-page request fails while the sentinel remains visible.
- Filters change while a prior page was visible.
- A list has no records or only one page.
- Multiple Main Account parents are expanded concurrently.
- React rerenders while a cursor request is in flight.
- A cursor response contains no additional records.

---

### Notes

- State: IN_REVIEW
- Cursor pagination remains authoritative; infinite scrolling changes only the frontend trigger.
- Selection modals and explicitly paged administration tables are outside this task because they do not expose Load More.
- The shared sentinel, Budget Request Entry, User Access, and Main Account integrations pass targeted ESLint with no findings.
- The five Requisition Process role files retain their existing targeted baseline of 26 `any`/unused errors and five hook warnings; the new sentinel integrations add no new rule category.
- ABMS `pnpm build` passes. Full `pnpm lint` remains blocked by the existing repository baseline, now reported as 108 errors and 11 warnings.
- Authenticated browser smoke testing and Playwright were not run because a deployed-like authenticated environment was not available.
