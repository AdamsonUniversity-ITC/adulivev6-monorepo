import { hrmdoSvc } from "@repo/axios-config/hrmdo-service";

export type BoardCategory = {
  id: number;
  name: string;
  slug: string;
  section_id?: number | null;
  is_active?: boolean;
  sort_order?: number;
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
  theme_preset?: string | null;
  sla_resolve_hours?: number | null;
  deleted_at?: string | null;
  sections?: Array<{
    id: number;
    section_name: string;
    is_hidden?: boolean;
    members?: Array<{
      id: number;
      user_id: number;
      is_section_head?: boolean;
      has_assign_access?: boolean;
      name?: string | null;
      emp_no?: string | null;
      email?: string | null;
    }>;
  }>;
  categories?: BoardCategory[];
  templates?: BoardTemplate[];
  access?: {
    can_view_reports?: boolean;
    is_staff?: boolean;
    is_board_admin?: boolean;
    is_section_head?: boolean;
    headed_section_ids?: number[];
  };
};

export type TicketAttachment = {
  id: number;
  ticket_id: number;
  message_id?: number | null;
  uploader_id: number;
  original_name: string;
  mime: string;
  size_bytes: number;
  kind: "image" | "document" | "video" | string;
  created_at?: string;
};

export type PersonProfile = {
  user_id: number;
  name?: string | null;
  emp_no?: string | null;
  student_no?: string | null;
  agency_no?: string | null;
  email?: string | null;
  person_type?: string | null;
  hr_section_id?: number | null;
  hr_section_name?: string | null;
};

export type TicketMessage = {
  id: number;
  body: string;
  user_id: number;
  type?: string;
  mention_ids?: number[];
  mentions?: Array<{ user_id: number; name: string | null }>;
  created_at?: string;
  read_at?: string | null;
  user?: PersonProfile | null;
};

/** Resolve staff mention IDs from composer body (@Name and legacy @user:id). */
export function extractMentionIdsFromBody(
  body: string,
  candidates: Array<{ user_id: number; name: string }>,
): number[] {
  const ids = new Set<number>();

  for (const match of body.matchAll(/@user:(\d+)/g)) {
    ids.add(Number(match[1]));
  }

  const sorted = [...candidates]
    .map((c) => ({ user_id: c.user_id, name: c.name.trim() }))
    .filter((c) => c.name)
    .sort((a, b) => b.name.length - a.name.length);

  for (const candidate of sorted) {
    const escaped = candidate.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?:^|\\s)@${escaped}(?=$|\\s|[.,!?;:])`);
    if (re.test(body)) {
      ids.add(candidate.user_id);
    }
  }

  return [...ids];
}

export type Ticket = {
  id: number;
  ticket_number: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to: number;
  user_id: number;
  requester?: PersonProfile | null;
  assignee?: PersonProfile | null;
  category_id?: number | null;
  category_name?: string | null;
  category?: BoardCategory | null;
  board_slug?: string;
  board_name?: string;
  section_name?: string;
  section_id?: number;
  due_at?: string | null;
  is_overdue?: boolean;
  first_response_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  csat_score?: number | null;
  unread_count?: number;
  unread_internal_count?: number;
  unread_mentions_count?: number;
  created_at?: string;
  watchers?: Array<{ user_id: number; user?: PersonProfile | null }>;
  attachments?: TicketAttachment[];
  internal_attachments?: TicketAttachment[];
  messages?: TicketMessage[];
  internal_remarks?: TicketMessage[];
  timeline?: Array<{ action: string; detail?: string; created_at?: string }>;
  access?: {
    can_assign: boolean;
    can_change_priority?: boolean;
    can_change_category?: boolean;
    can_change_status: boolean;
    is_staff: boolean;
    is_requester?: boolean;
    can_close?: boolean;
    can_cancel?: boolean;
    can_start?: boolean;
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
    unread_internal?: number;
    unread_mentions?: number;
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

export type SearchTicketHit = {
  type: "ticket";
  id: number;
  ticket_number: string;
  title: string;
  status: string;
  board_slug?: string;
  board_name?: string;
  section_name?: string;
};

export type SearchPersonHit = {
  type: "person";
  user_id: number;
  name?: string | null;
  emp_no?: string | null;
  email?: string | null;
};

export async function searchAduts(query: string) {
  const { data } = await hrmdoSvc.get<{
    data: { tickets: SearchTicketHit[]; people: SearchPersonHit[] };
  }>("v1/aduts/search", { params: { q: query } });
  return data.data;
}

export async function createTicket(payload: {
  section: number;
  title: string;
  description: string;
  category_id?: number;
  watcher_ids?: number[];
  temp_upload_ids?: Array<string | number>;
}) {
  const { data } = await hrmdoSvc.post<{ data: Ticket }>("v1/aduts/tickets", {
    section: payload.section,
    title: payload.title,
    description: payload.description,
    category_id: payload.category_id,
    watcher_ids: payload.watcher_ids,
    temp_upload_ids: (payload.temp_upload_ids ?? []).map(Number),
  });
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

export async function changeTicketPriority(
  ticketNumber: string,
  priority: string,
) {
  const { data } = await hrmdoSvc.post<{ data: Ticket }>(
    `v1/aduts/tickets/${ticketNumber}/priority`,
    { priority },
  );
  return data.data;
}

export async function changeTicketCategory(
  ticketNumber: string,
  categoryId: number | null,
) {
  const { data } = await hrmdoSvc.post<{ data: Ticket }>(
    `v1/aduts/tickets/${ticketNumber}/category`,
    { category_id: categoryId },
  );
  return data.data;
}

export async function bulkChangeTicketStatus(
  ticketNumbers: string[],
  status: string,
) {
  const { data } = await hrmdoSvc.post<{ data: Ticket[] }>(
    "v1/aduts/tickets/bulk-status",
    { ticket_numbers: ticketNumbers, status },
  );
  return data.data;
}

export async function bulkAssignTickets(
  ticketNumbers: string[],
  assignedTo: number,
) {
  const { data } = await hrmdoSvc.post<{ data: Ticket[] }>(
    "v1/aduts/tickets/bulk-assign",
    { ticket_numbers: ticketNumbers, assigned_to: assignedTo },
  );
  return data.data;
}

export async function assignTicket(ticketNumber: string, assignedTo: number) {
  const { data } = await hrmdoSvc.post<{ data: Ticket }>(
    `v1/aduts/tickets/${ticketNumber}/assign`,
    { assigned_to: assignedTo },
  );
  return data.data;
}

export async function transferTicketSection(
  ticketNumber: string,
  sectionId: number,
) {
  const { data } = await hrmdoSvc.post<{ data: Ticket }>(
    `v1/aduts/tickets/${ticketNumber}/section`,
    { section_id: sectionId },
  );
  return data.data;
}

export async function sendTicketMessage(
  ticketNumber: string,
  body: string,
  type: "msg" | "internal" = "msg",
  tempUploadIds: Array<string | number> = [],
  mentionIds: number[] = [],
) {
  const { data } = await hrmdoSvc.post(
    `v1/aduts/tickets/${ticketNumber}/messages`,
    {
      body,
      type,
      temp_upload_ids: tempUploadIds.map(Number),
      ...(type === "internal" ? { mention_ids: mentionIds } : {}),
    },
  );
  return data.data;
}

export function ticketAttachmentUrl(
  ticketNumber: string,
  attachmentId: number,
) {
  return `v1/aduts/tickets/${ticketNumber}/attachments/${attachmentId}`;
}

export async function downloadTicketAttachment(
  ticketNumber: string,
  attachmentId: number,
  filename: string,
) {
  const url = await fetchTicketAttachmentObjectUrl(ticketNumber, attachmentId);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Authenticated blob URL for in-app previews. Caller must revoke when done. */
export async function fetchTicketAttachmentObjectUrl(
  ticketNumber: string,
  attachmentId: number,
) {
  const { data } = await hrmdoSvc.get(
    ticketAttachmentUrl(ticketNumber, attachmentId),
    { responseType: "blob" },
  );
  return URL.createObjectURL(data);
}

export type PersonSearchType = "employee" | "student" | "bed" | "agency";

export type PersonSearchResult = {
  user_id: number | null;
  emp_no: string | null;
  student_no: string | null;
  agency_no?: string | null;
  name: string | null;
  email: string | null;
  type: PersonSearchType | string;
};

export async function searchPeople(
  query: string,
  type: PersonSearchType = "employee",
) {
  const { data } = await hrmdoSvc.get<{ data: PersonSearchResult[] }>(
    "v1/aduts/people-search",
    { params: { q: query, type } },
  );
  return data.data;
}

export type TatSummary = {
  avg: number | null;
  median: number | null;
  count: number;
};

export type TatStaffReport = {
  user_id: number;
  name: string | null;
  ticket_count: number;
  overall: {
    create_to_resolved: TatSummary;
    create_to_closed: TatSummary;
    first_response: TatSummary;
    ticket_count: number;
  };
  assignment_time: TatSummary;
  per_status: Record<string, TatSummary>;
};

export type TatReport = {
  scope?: {
    is_admin: boolean;
    section_ids: number[];
    allowed_section_ids: number[];
  };
  per_status: Record<string, TatSummary>;
  overall: {
    create_to_resolved: TatSummary;
    create_to_closed: TatSummary;
    first_response: TatSummary;
    ticket_count: number;
  };
  assignment_time: TatSummary;
  per_staff?: TatStaffReport[];
  per_application: {
    data: Array<{
      id: number;
      ticket_number: string;
      title: string;
      status: string;
      priority: string;
      created_at?: string;
      status_hours: Record<string, number | null>;
      resolve_hours: number | null;
      close_hours: number | null;
      first_response_hours: number | null;
      assignment_hours: number | null;
    }>;
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
};

export async function fetchTatReport(
  params?: Record<string, string | number | undefined>,
) {
  const { data } = await hrmdoSvc.get<{ data: TatReport }>(
    "v1/aduts/reports/tat",
    { params },
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

export async function removeWatcher(ticketNumber: string, userId: number) {
  await hrmdoSvc.delete(`v1/aduts/tickets/${ticketNumber}/watchers/${userId}`);
}

export type SavedView = {
  id: number;
  name: string;
  filters: Record<string, string | number | boolean>;
  sort?: string | null;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

export async function fetchSavedViews() {
  const { data } = await hrmdoSvc.get<{ data: SavedView[] }>(
    "v1/aduts/board/saved-views",
  );
  return data.data;
}

export async function createSavedView(payload: {
  name: string;
  filters: Record<string, string | number | boolean>;
  sort?: string | null;
  is_default?: boolean;
}) {
  const { data } = await hrmdoSvc.post<{ data: SavedView }>(
    "v1/aduts/board/saved-views",
    payload,
  );
  return data.data;
}

export async function updateSavedView(
  viewId: number,
  payload: Partial<{
    name: string;
    filters: Record<string, string | number | boolean>;
    sort: string | null;
    is_default: boolean;
  }>,
) {
  const { data } = await hrmdoSvc.patch<{ data: SavedView }>(
    `v1/aduts/board/saved-views/${viewId}`,
    payload,
  );
  return data.data;
}

export async function deleteSavedView(viewId: number) {
  await hrmdoSvc.delete(`v1/aduts/board/saved-views/${viewId}`);
}

export type ChecklistItem = {
  id: number;
  ticket_id: number;
  body: string;
  is_done: boolean;
  sort_order: number;
  created_by_id: number;
  created_at?: string;
  updated_at?: string;
};

export async function fetchTicketChecklist(ticketNumber: string) {
  const { data } = await hrmdoSvc.get<{ data: ChecklistItem[] }>(
    `v1/aduts/tickets/${ticketNumber}/checklist`,
  );
  return data.data;
}

export async function createChecklistItem(ticketNumber: string, body: string) {
  const { data } = await hrmdoSvc.post<{ data: ChecklistItem }>(
    `v1/aduts/tickets/${ticketNumber}/checklist`,
    { body },
  );
  return data.data;
}

export async function updateChecklistItem(
  ticketNumber: string,
  itemId: number,
  payload: Partial<{ body: string; is_done: boolean; sort_order: number }>,
) {
  const { data } = await hrmdoSvc.patch<{ data: ChecklistItem }>(
    `v1/aduts/tickets/${ticketNumber}/checklist/${itemId}`,
    payload,
  );
  return data.data;
}

export async function deleteChecklistItem(
  ticketNumber: string,
  itemId: number,
) {
  await hrmdoSvc.delete(`v1/aduts/tickets/${ticketNumber}/checklist/${itemId}`);
}

export type TicketLink = {
  id: number;
  link_type: "related" | "duplicate" | "parent" | string;
  role: string;
  ticket: {
    id: number;
    ticket_number: string;
    title: string;
    status: string;
  };
  created_by_id: number;
  created_at?: string;
};

export async function fetchTicketLinks(ticketNumber: string) {
  const { data } = await hrmdoSvc.get<{ data: TicketLink[] }>(
    `v1/aduts/tickets/${ticketNumber}/links`,
  );
  return data.data;
}

export async function createTicketLink(
  ticketNumber: string,
  payload: {
    target_ticket_number: string;
    link_type: "related" | "duplicate" | "parent";
  },
) {
  const { data } = await hrmdoSvc.post<{ data: TicketLink }>(
    `v1/aduts/tickets/${ticketNumber}/links`,
    payload,
  );
  return data.data;
}

export async function deleteTicketLink(ticketNumber: string, linkId: number) {
  await hrmdoSvc.delete(`v1/aduts/tickets/${ticketNumber}/links/${linkId}`);
}

export type PresencePeer = {
  user_id: number;
  name?: string | null;
  at?: string | null;
};

export async function heartbeatTicketPresence(ticketNumber: string) {
  const { data } = await hrmdoSvc.put<{ data: PresencePeer[] }>(
    `v1/aduts/tickets/${ticketNumber}/presence`,
  );
  return data.data;
}

export async function createBoardCategory(payload: {
  name: string;
  section_id: number;
  slug?: string;
  sort_order?: number;
  is_active?: boolean;
}) {
  const { data } = await hrmdoSvc.post<{ data: BoardCategory }>(
    "v1/aduts/board/categories",
    payload,
  );
  return data.data;
}

export async function updateBoardCategory(
  categoryId: number,
  payload: Partial<{
    name: string;
    slug: string | null;
    section_id: number;
    sort_order: number;
    is_active: boolean;
  }>,
) {
  const { data } = await hrmdoSvc.patch<{ data: BoardCategory }>(
    `v1/aduts/board/categories/${categoryId}`,
    payload,
  );
  return data.data;
}

export async function deleteBoardCategory(categoryId: number) {
  await hrmdoSvc.delete(`v1/aduts/board/categories/${categoryId}`);
}

export async function createBoardTemplate(payload: {
  name: string;
  body: string;
  type?: "msg" | "internal";
}) {
  const { data } = await hrmdoSvc.post<{ data: BoardTemplate }>(
    "v1/aduts/board/templates",
    payload,
  );
  return data.data;
}

export async function updateBoardTemplate(
  templateId: number,
  payload: Partial<{
    name: string;
    body: string;
    type: "msg" | "internal";
  }>,
) {
  const { data } = await hrmdoSvc.patch<{ data: BoardTemplate }>(
    `v1/aduts/board/templates/${templateId}`,
    payload,
  );
  return data.data;
}

export async function deleteBoardTemplate(templateId: number) {
  await hrmdoSvc.delete(`v1/aduts/board/templates/${templateId}`);
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

export type BoardAdminRow = BoardPersonRow & {
  board_id: number;
};

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
    accent_color: string | null;
    theme_preset: string | null;
  }>,
) {
  const { data } = await hrmdoSvc.patch<{ data: Board }>(
    "v1/aduts/board",
    payload,
  );
  return data.data;
}

export type BoardPersonRow = {
  id: number;
  user_id: number;
  board_id?: number;
  name?: string | null;
  emp_no?: string | null;
  student_no?: string | null;
  agency_no?: string | null;
  email?: string | null;
  person_type?: string | null;
};

export type SectionRow = {
  id: number;
  section_name: string;
  hr_section_id?: number | null;
  hr_section_name?: string | null;
  is_hidden: boolean;
  members?: Array<
    BoardPersonRow & {
      is_section_head: boolean;
      has_assign_access: boolean;
    }
  >;
};

export async function fetchBoardSections() {
  const { data } = await hrmdoSvc.get<{ data: SectionRow[] }>(
    "v1/aduts/board/sections",
  );
  return data.data;
}

export async function createBoardSection(payload: {
  section_name: string;
  hr_section_id?: number | null;
  is_hidden?: boolean;
}) {
  const { data } = await hrmdoSvc.post<{ data: SectionRow }>(
    "v1/aduts/board/sections",
    payload,
  );
  return data.data;
}

export async function updateBoardSection(
  sectionId: number,
  payload: {
    section_name?: string;
    hr_section_id?: number | null;
    is_hidden?: boolean;
  },
) {
  const { data } = await hrmdoSvc.patch<{ data: SectionRow }>(
    `v1/aduts/board/sections/${sectionId}`,
    payload,
  );
  return data.data;
}

export type SectionMemberSyncSummary = {
  added: number;
  skipped_no_user: number;
  skipped_existing: number;
  total_hr_employees: number;
};

export async function syncBoardSectionMembers(sectionId: number) {
  const { data } = await hrmdoSvc.post<{ data: SectionMemberSyncSummary }>(
    `v1/aduts/board/sections/${sectionId}/sync-members`,
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

export async function updateBoardMember(
  memberId: number,
  payload: {
    is_section_head?: boolean;
    has_assign_access?: boolean;
  },
) {
  const { data } = await hrmdoSvc.patch(
    `v1/aduts/board/members/${memberId}`,
    payload,
  );
  return data.data;
}

export async function removeBoardMember(memberId: number) {
  await hrmdoSvc.delete(`v1/aduts/board/members/${memberId}`);
}

export async function fetchBoardCustomers() {
  const { data } = await hrmdoSvc.get<{ data: BoardPersonRow[] }>(
    "v1/aduts/board/customers",
  );
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
