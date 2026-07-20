import { hrmdoSvc } from "@/axios";

export type BoardCategory = {
  id: number;
  name: string;
  slug: string;
};

export type BoardTemplate = {
  id: number;
  name: string;
  type: string;
  body: string;
};

export type Board = {
  id: number;
  board_name: string;
  slug: string;
  description: string | null;
  is_public: boolean;
  url: string;
  kb_url?: string | null;
  accent_color?: string | null;
  sla_resolve_hours?: number | null;
  deleted_at?: string | null;
  sections?: Array<{ id: number; section_name: string }>;
  categories?: BoardCategory[];
  templates?: BoardTemplate[];
};

export type Ticket = {
  id: number;
  ticket_number: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to: number;
  user_id: number;
  category_id?: number | null;
  category_name?: string | null;
  category?: BoardCategory | null;
  board_slug?: string;
  section_name?: string;
  due_at?: string | null;
  is_overdue?: boolean;
  first_response_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  csat_score?: number | null;
  unread_count?: number;
  created_at?: string;
  watchers?: Array<{ user_id: number }>;
  messages?: Array<{
    id: number;
    body: string;
    user_id: number;
    created_at?: string;
  }>;
  timeline?: Array<{ action: string; detail?: string; created_at?: string }>;
  access?: {
    can_assign: boolean;
    can_change_status: boolean;
    is_staff: boolean;
    is_requester?: boolean;
    can_close?: boolean;
    can_resolve?: boolean;
  };
};

export type TicketListResponse = {
  data: Ticket[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  metrics: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
    unread_replies: number;
    overdue?: number;
    awaiting_ack?: number;
  };
};

export async function fetchBoards() {
  const { data } = await hrmdoSvc.get<{ data: Board[] }>("v1/aduts/boards");
  return data.data;
}

export async function fetchCurrentBoard() {
  const { data } = await hrmdoSvc.get<{ data: Board }>("v1/aduts/board");
  return data.data;
}

export async function fetchTickets(
  params?: Record<string, string | number | boolean | undefined>,
) {
  const { data } = await hrmdoSvc.get<TicketListResponse>("v1/aduts/tickets", {
    params,
  });
  return data;
}

export async function createTicket(payload: {
  section: number;
  title: string;
  description: string;
  priority?: string;
  category_id?: number;
}) {
  const { data } = await hrmdoSvc.post<{ data: Ticket }>(
    "v1/aduts/tickets",
    payload,
  );
  return data.data;
}

export async function fetchTicket(ticketNumber: string) {
  const { data } = await hrmdoSvc.get<{ data: Ticket }>(
    `v1/aduts/tickets/${ticketNumber}`,
  );
  return data.data;
}

export async function changeTicketStatus(
  ticketNumber: string,
  status: string,
  comment?: string,
) {
  const { data } = await hrmdoSvc.post<{ data: Ticket }>(
    `v1/aduts/tickets/${ticketNumber}/status`,
    { status, comment },
  );
  return data.data;
}

export async function sendTicketMessage(
  ticketNumber: string,
  body: string,
  type: "msg" | "internal" = "msg",
) {
  const { data } = await hrmdoSvc.post(
    `v1/aduts/tickets/${ticketNumber}/messages`,
    {
      body,
      type,
    },
  );
  return data.data;
}

export async function submitCsat(
  ticketNumber: string,
  score: number,
  comment?: string,
) {
  const { data } = await hrmdoSvc.post<{ data: Ticket }>(
    `v1/aduts/tickets/${ticketNumber}/csat`,
    { score, comment },
  );
  return data.data;
}

export async function addWatcher(ticketNumber: string, userId: number) {
  const { data } = await hrmdoSvc.post(
    `v1/aduts/tickets/${ticketNumber}/watchers`,
    {
      user_id: userId,
    },
  );
  return data.data;
}

/** Super-admin: all boards */
export async function fetchAdminBoards(withTrashed = false) {
  const { data } = await hrmdoSvc.get<{ data: Board[] }>(
    "v1/aduts/admin/boards",
    { params: withTrashed ? { with_trashed: 1 } : undefined },
  );
  return data.data;
}

export async function createBoard(payload: {
  board_name: string;
  slug?: string;
  description?: string;
  is_public?: boolean;
  sections?: Array<{ section_name: string }>;
}) {
  const { data } = await hrmdoSvc.post<{ data: Board }>(
    "v1/aduts/boards",
    payload,
  );
  return data.data;
}

export async function updateAdminBoard(
  boardId: number,
  payload: Partial<{
    board_name: string;
    slug: string;
    description: string | null;
    is_public: boolean;
    sla_resolve_hours: number | null;
    kb_url: string | null;
  }>,
) {
  const { data } = await hrmdoSvc.patch<{ data: Board }>(
    `v1/aduts/admin/boards/${boardId}`,
    payload,
  );
  return data.data;
}

export async function deleteAdminBoard(boardId: number) {
  await hrmdoSvc.delete(`v1/aduts/admin/boards/${boardId}`);
}

export type BoardAdminRow = { id: number; board_id: number; user_id: number };

export async function fetchAdminBoardAdmins(boardId: number) {
  const { data } = await hrmdoSvc.get<{ data: BoardAdminRow[] }>(
    `v1/aduts/admin/boards/${boardId}/admins`,
  );
  return data.data;
}

export async function addAdminBoardAdmin(boardId: number, userId: number) {
  const { data } = await hrmdoSvc.post<{ data: BoardAdminRow }>(
    `v1/aduts/admin/boards/${boardId}/admins`,
    { user_id: userId },
  );
  return data.data;
}

export async function removeAdminBoardAdmin(boardId: number, userId: number) {
  await hrmdoSvc.delete(`v1/aduts/admin/boards/${boardId}/admins/${userId}`);
}

/** Tenant manage */
export async function updateCurrentBoard(
  payload: Partial<{
    board_name: string;
    description: string | null;
    is_public: boolean;
    sla_resolve_hours: number | null;
    kb_url: string | null;
  }>,
) {
  const { data } = await hrmdoSvc.patch<{ data: Board }>(
    "v1/aduts/board",
    payload,
  );
  return data.data;
}

export type SectionRow = {
  id: number;
  section_name: string;
  is_hidden: boolean;
  members?: Array<{
    id: number;
    user_id: number;
    is_section_head: boolean;
    has_assign_access: boolean;
  }>;
};

export async function fetchBoardSections() {
  const { data } = await hrmdoSvc.get<{ data: SectionRow[] }>(
    "v1/aduts/board/sections",
  );
  return data.data;
}

export async function createBoardSection(payload: {
  section_name: string;
  is_hidden?: boolean;
}) {
  const { data } = await hrmdoSvc.post<{ data: SectionRow }>(
    "v1/aduts/board/sections",
    payload,
  );
  return data.data;
}

export async function addBoardMember(payload: {
  section_id: number;
  user_id: number;
  is_section_head?: boolean;
  has_assign_access?: boolean;
}) {
  const { data } = await hrmdoSvc.post("v1/aduts/board/members", payload);
  return data.data;
}

export async function removeBoardMember(memberId: number) {
  await hrmdoSvc.delete(`v1/aduts/board/members/${memberId}`);
}

export async function fetchBoardCustomers() {
  const { data } = await hrmdoSvc.get<{
    data: Array<{ id: number; user_id: number; board_id: number }>;
  }>("v1/aduts/board/customers");
  return data.data;
}

export async function addBoardCustomer(userId: number) {
  const { data } = await hrmdoSvc.post("v1/aduts/board/customers", {
    user_id: userId,
  });
  return data.data;
}

export async function removeBoardCustomer(userId: number) {
  await hrmdoSvc.delete(`v1/aduts/board/customers/${userId}`);
}

export async function fetchBoardAdmins() {
  const { data } = await hrmdoSvc.get<{ data: BoardAdminRow[] }>(
    "v1/aduts/board/admins",
  );
  return data.data;
}

export async function addBoardAdmin(userId: number) {
  const { data } = await hrmdoSvc.post<{ data: BoardAdminRow }>(
    "v1/aduts/board/admins",
    { user_id: userId },
  );
  return data.data;
}

export async function removeBoardAdmin(userId: number) {
  await hrmdoSvc.delete(`v1/aduts/board/admins/${userId}`);
}
