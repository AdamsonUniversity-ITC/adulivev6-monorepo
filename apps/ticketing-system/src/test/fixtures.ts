import { ADUTS_PERMISSIONS } from "@/lib/aduts-access";
import type { AuthUser } from "@/lib/fetch-auth-user";
import type {
  Board,
  TatReport,
  Ticket,
  TicketListResponse,
} from "@/lib/aduts-api";

export const BOARD_HOST = "itc-ts.localhost.test";
export const PLATFORM_HOST = "ticketing.localhost.test";

export const emptyTatSummary = {
  avg: null,
  median: null,
  count: 0,
};

export const authStaff: AuthUser = {
  id: 10,
  username: "staff.user",
  email: "staff@example.com",
  permissions: [ADUTS_PERMISSIONS.access],
  user_info: { id: 1001, fname: "Staff", lname: "User" },
};

export const authBoardAdmin: AuthUser = {
  id: 20,
  username: "board.admin",
  email: "board.admin@example.com",
  permissions: [ADUTS_PERMISSIONS.access, ADUTS_PERMISSIONS.boardAdmin],
  user_info: { id: 2001, fname: "Board", lname: "Admin" },
};

export const authSuperAdmin: AuthUser = {
  id: 1,
  username: "super.admin",
  email: "super@example.com",
  permissions: [
    ADUTS_PERMISSIONS.access,
    ADUTS_PERMISSIONS.admin,
    ADUTS_PERMISSIONS.boardAdmin,
  ],
  user_info: { id: 1, fname: "Super", lname: "Admin" },
};

export const fixtureBoard: Board = {
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
  templates: [
    {
      id: 1,
      name: "Ack",
      type: "reply",
      body: "<p>We received your request.</p>",
    },
  ],
  access: {
    can_view_reports: true,
    is_staff: true,
    is_board_admin: true,
    is_section_head: true,
  } as Board["access"],
};

export const fixtureBoardsList: Board[] = [
  fixtureBoard,
  {
    id: 8,
    board_name: "HR Helpdesk",
    slug: "hr",
    description: null,
    is_public: true,
    url: "http://hr.localhost.test/",
    access: { can_view_reports: false, is_staff: false },
  },
];

export const fixtureTicket: Ticket = {
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

export const fixtureTicketList: TicketListResponse = {
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
};

export const fixtureTatReport: TatReport = {
  scope: {
    is_admin: true,
    section_ids: [11],
    allowed_section_ids: [11],
  },
  per_status: {},
  overall: {
    create_to_resolved: emptyTatSummary,
    create_to_closed: emptyTatSummary,
    first_response: emptyTatSummary,
    ticket_count: 0,
  },
  assignment_time: emptyTatSummary,
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
};
