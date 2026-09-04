import type { Page, Route } from "@playwright/test";

export const boardOrigin =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://itc-ts.localhost.test:5173";

export const platformOrigin =
  process.env.PLAYWRIGHT_PLATFORM_URL ?? "http://ticketing.localhost.test:5173";

export const authApi = "http://auth-api.localhost.test:8002/api/user";
export const hrmdoApi = "http://hrmdo-api.localhost.test:8003/api";

const ACCESS = "ticketing-system-access";
const ADMIN = "ticketing-system-admin-access";
const BOARD_ADMIN = "ticketing-system-board-admin-access";

export const corsHeadersFor = (origin: string) => ({
  "access-control-allow-credentials": "true",
  "access-control-allow-headers":
    "accept, content-type, x-requested-with, x-xsrf-token",
  "access-control-allow-methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "access-control-allow-origin": origin,
});

export async function fulfillOptions(route: Route, origin: string) {
  await route.fulfill({
    headers: corsHeadersFor(origin),
    status: 204,
  });
}

const emptyTat = { avg: null, median: null, count: 0 };

export const fixtureBoard = {
  id: 7,
  board_name: "ITC Support",
  slug: "itc-ts",
  description: "IT support board",
  is_public: false,
  url: "http://itc-ts.localhost.test/",
  accent_color: null,
  theme_preset: "default",
  sections: [
    {
      id: 11,
      section_name: "Helpdesk",
      members: [
        {
          id: 1,
          user_id: 10,
          name: "Staff User",
          is_section_head: true,
          has_assign_access: true,
        },
      ],
    },
  ],
  categories: [{ id: 1, name: "General", slug: "general", is_active: true }],
  templates: [],
  access: {
    can_view_reports: true,
    is_staff: true,
    is_board_admin: true,
    is_section_head: true,
  },
};

export const fixtureTicket = {
  id: 101,
  ticket_number: "250719-001",
  title: "Cannot print",
  description: "<p>Printer offline</p>",
  status: "open",
  priority: "medium",
  assigned_to: 10,
  user_id: 99,
  board_slug: "itc-ts",
  board_name: "ITC Support",
  section_id: 11,
  section_name: "Helpdesk",
  category_id: 1,
  category_name: "General",
  created_at: "2026-07-19T08:00:00Z",
  requester: {
    user_id: 99,
    name: "Requester Person",
    email: "req@example.com",
  },
  assignee: {
    user_id: 10,
    name: "Staff User",
    email: "staff@example.com",
  },
  messages: [],
  internal_remarks: [],
  attachments: [],
  internal_attachments: [],
  timeline: [],
  watchers: [],
  access: {
    can_assign: true,
    can_change_priority: true,
    can_change_category: true,
    can_change_status: true,
    is_staff: true,
    is_requester: false,
    can_close: false,
    can_cancel: true,
    can_start: true,
    can_resolve: false,
    can_internal: true,
  },
};

export const authBoardAdmin = {
  id: 20,
  username: "board.admin",
  email: "board.admin@example.com",
  permissions: [ACCESS, BOARD_ADMIN],
  user_info: { id: 2001, fname: "Board", lname: "Admin" },
};

export const authSuperAdmin = {
  id: 1,
  username: "super.admin",
  email: "super@example.com",
  permissions: [ACCESS, ADMIN, BOARD_ADMIN],
  user_info: { id: 1, fname: "Super", lname: "Admin" },
};

type MockOptions = {
  origin?: string;
  user?: Record<string, unknown>;
  boards?: unknown[];
};

export async function mockAuthUser(
  page: Page,
  user: Record<string, unknown>,
  origin = boardOrigin,
) {
  await page.route(authApi, async (route) => {
    if (route.request().method() === "OPTIONS") {
      return fulfillOptions(route, origin);
    }

    await route.fulfill({
      contentType: "application/json",
      headers: corsHeadersFor(origin),
      json: user,
    });
  });
}

export async function mockAdutsApis(page: Page, options: MockOptions = {}) {
  const origin = options.origin ?? boardOrigin;
  const boards = options.boards ?? [fixtureBoard];

  await page.route(`${hrmdoApi}/**`, async (route) => {
    if (route.request().method() === "OPTIONS") {
      return fulfillOptions(route, origin);
    }

    const url = route.request().url();
    const headers = corsHeadersFor(origin);

    const json = (body: unknown) =>
      route.fulfill({
        contentType: "application/json",
        headers,
        json: body,
      });

    if (url.includes("/v1/aduts/boards") && !url.includes("/admin")) {
      return json({ data: boards });
    }

    if (url.includes("/v1/aduts/admin/boards")) {
      if (url.match(/\/admins(?:\?|$)/)) {
        return json({ data: [] });
      }
      return json({ data: boards });
    }

    if (url.includes("/v1/aduts/board") && !url.includes("boards")) {
      return json({ data: fixtureBoard });
    }

    if (url.includes("/v1/aduts/tickets/") && url.includes("/presence")) {
      return json({ data: [] });
    }

    if (url.includes("/v1/aduts/tickets/") && url.includes("/checklist")) {
      return json({ data: [] });
    }

    if (url.includes("/v1/aduts/tickets/") && url.includes("/links")) {
      return json({ data: [] });
    }

    if (url.includes("/v1/aduts/tickets/") && !url.includes("?")) {
      const match = url.match(/\/tickets\/([^/?]+)/);
      const number = match?.[1];
      if (number && number !== fixtureTicket.ticket_number) {
        return route.fulfill({
          status: 404,
          headers,
          contentType: "application/json",
          json: { message: "Not found" },
        });
      }
      return json({ data: fixtureTicket });
    }

    if (url.includes("/v1/aduts/tickets")) {
      return json({
        data: [fixtureTicket],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 20,
          total: 1,
        },
        metrics: {
          open: 1,
          in_progress: 0,
          resolved: 0,
          closed: 0,
          unread_replies: 0,
        },
      });
    }

    if (url.includes("/v1/aduts/reports/tat")) {
      return json({
        data: {
          scope: {
            is_admin: true,
            section_ids: [11],
            allowed_section_ids: [11],
          },
          per_status: {},
          overall: {
            create_to_resolved: emptyTat,
            create_to_closed: emptyTat,
            first_response: emptyTat,
            ticket_count: 0,
          },
          assignment_time: emptyTat,
          per_staff: [],
          per_application: {
            data: [],
            meta: {
              current_page: 1,
              last_page: 1,
              per_page: 20,
              total: 0,
            },
          },
        },
      });
    }

    if (url.includes("/v1/aduts/saved-views")) {
      return json({ data: [] });
    }

    if (url.includes("/v1/aduts/search")) {
      return json({ data: { tickets: [], people: [] } });
    }

    if (url.includes("/v1/aduts/sections")) {
      return json({ data: fixtureBoard.sections });
    }

    if (url.includes("/v1/aduts/customers")) {
      return json({ data: [] });
    }

    if (url.includes("/v1/aduts/admins")) {
      return json({ data: [] });
    }

    return json({ data: [] });
  });
}

export async function mockTicketingSession(
  page: Page,
  options: MockOptions = {},
) {
  const origin = options.origin ?? boardOrigin;
  const user = options.user ?? authBoardAdmin;
  await mockAuthUser(page, user, origin);
  await mockAdutsApis(page, { ...options, origin });
}
