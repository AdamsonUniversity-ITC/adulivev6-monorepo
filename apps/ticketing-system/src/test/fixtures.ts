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
  visibility_mode: "production",
  url: "http://itc-ts.localhost.test/",
  accent_color: null,
  theme_preset: "default",
  sections: [
    {
      id: 11,
      section_name: "Helpdesk",
      is_approver: false,
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
    {
      id: 12,
      section_name: "Director's Office",
      is_approver: true,
      members: [
        {
          id: 2,
          user_id: 40,
          name: "Director Person",
          is_section_head: true,
          has_assign_access: true,
        },
      ],
    },
  ],
  categories: [{ id: 1, name: "General", slug: "general", is_active: true }],
  cancellation_reasons: [
    { id: 1, label: "Duplicate request", is_active: true },
    { id: 2, label: "No longer needed", is_active: true },
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
    visibility_mode: "production",
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
  sharing: null,
  shares: [],
  access: {
    can_assign: true,
    can_change_priority: true,
    can_change_category: true,
    can_change_section: true,
    can_change_status: true,
    is_staff: true,
    is_requester: false,
    can_close: false,
    can_cancel: true,
    can_start: true,
    can_resolve: false,
    can_internal: true,
    can_submit_for_approval: true,
    can_return_from_approval: false,
    can_return_to_head: false,
    can_share: true,
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
    pending_approval: 0,
    resolved: 0,
    closed: 0,
    unread_replies: 0,
    transferred: 0,
    unassigned: 0,
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
  assignment_time: { ...emptyTatSummary, pending_count: 0 },
  sharing: {
    shared_ticket_count: 0,
    sign_off_count: 0,
    pending_sign_off_count: 0,
    handling_time: emptyTatSummary,
  },
  per_staff: [],
  volume: {
    months: [
      { month: "2026-07", label: "Jul 2026", count: 2, partial: false },
      { month: "2026-08", label: "Aug 2026", count: 1, partial: false },
    ],
    total: 3,
    monthly_average: 1.5,
    average_basis: "completed_months",
    peak: { month: "2026-07", label: "Jul 2026", count: 2 },
    weekdays: [
      { day: "Monday", count: 2 },
      { day: "Tuesday", count: 1 },
    ],
    hours: [
      { hour: 9, label: "09:00", count: 2 },
      { hour: 10, label: "10:00", count: 1 },
    ],
    peak_weekday: "Monday",
    peak_hour: "09:00",
  },
  priority_mix: [
    { priority: "urgent", count: 0, share: 0 },
    { priority: "high", count: 1, share: 1 / 3 },
    { priority: "medium", count: 2, share: 2 / 3 },
    { priority: "low", count: 0, share: 0 },
  ],
  categories: [
    {
      kind: "category",
      category_id: 1,
      name: "Hardware",
      section_name: "Operations",
      count: 2,
      share: 2 / 3,
      avg_resolve_hours: 6,
    },
    {
      kind: "uncategorized",
      category_id: null,
      name: "Uncategorized",
      section_name: null,
      count: 1,
      share: 1 / 3,
      avg_resolve_hours: null,
    },
  ],
  requestors: [
    { user_id: 5, name: "Ana Cruz", count: 2, share: 2 / 3 },
    { user_id: 6, name: null, count: 1, share: 1 / 3 },
  ],
  sla: {
    target_hours: 24,
    resolved_count: 2,
    met_count: 1,
    compliance_rate: 0.5,
    overdue_open_count: 1,
  },
  backlog: {
    total: 1,
    buckets: [
      { key: "under_1d", label: "Under 1 day", count: 1 },
      { key: "1_3d", label: "1 to 3 days", count: 0 },
      { key: "3_7d", label: "3 to 7 days", count: 0 },
      { key: "over_7d", label: "Over 7 days", count: 0 },
    ],
  },
  csat: {
    average: 4,
    rated_count: 2,
    eligible_count: 3,
    response_rate: 2 / 3,
    distribution: [
      { score: 1, count: 0 },
      { score: 2, count: 0 },
      { score: 3, count: 0 },
      { score: 4, count: 1 },
      { score: 5, count: 1 },
    ],
  },
  cancellations: {
    cancelled_count: 1,
    rate: 1 / 3,
    avg_cancel_hours: 4,
    median_cancel_hours: 4,
    reasons: [{ reason_id: 1, label: "Duplicate", count: 1 }],
  },
  reopens: {
    reopened_count: 1,
    ever_completed_count: 2,
    rate: 0.5,
  },
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
