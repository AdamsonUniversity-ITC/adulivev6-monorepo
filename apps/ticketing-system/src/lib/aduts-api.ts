import { hrmdoSvc } from "@repo/axios-config/hrmdo-service";

export type BoardCategory = {
  id: number;
  name: string;
  slug: string;
  section_id?: number | null;
  is_active?: boolean;
  sort_order?: number;
};

/**
 * Platform-wide, not board scoped: one list is shared by every board and is
 * maintained by super admins under /admin.
 */
export type CancellationReason = {
  id: number;
  label: string;
  slug?: string;
  sort_order?: number;
  is_active?: boolean;
  /** Referenced by at least one cancelled ticket, so it cannot be deleted. */
  in_use?: boolean;
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
  logo_url?: string | null;
  deleted_at?: string | null;
  sections?: Array<{
    id: number;
    section_name: string;
    is_hidden?: boolean;
    is_approver?: boolean;
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
  cancellation_reasons?: CancellationReason[];
  access?: {
    can_view_reports?: boolean;
    is_staff?: boolean;
    is_board_admin?: boolean;
    is_section_head?: boolean;
    headed_section_ids?: number[];
    /** null or absent means unrestricted (board or global admin). */
    scoped_section_ids?: number[] | null;
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

  for (const match of body.matchAll(/data-(?:mention-)?id=["']?(\d+)["']?/gi)) {
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
  involved?: PersonProfile[];
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
  cancel_reason?: { id: number; label: string } | null;
  cancel_remarks?: string | null;
  csat_score?: number | null;
  unread_count?: number;
  unread_internal_count?: number;
  unread_mentions_count?: number;
  created_at?: string;
  attachments?: TicketAttachment[];
  internal_attachments?: TicketAttachment[];
  messages?: TicketMessage[];
  internal_remarks?: TicketMessage[];
  timeline?: Array<{ action: string; detail?: string; created_at?: string }>;
  approval?: {
    origin_section_id?: number | null;
    origin_section_name?: string | null;
  } | null;
  transfer?: {
    from_section_id?: number | null;
    from_section_name?: string | null;
    transferred_at?: string | null;
  } | null;
  sharing?: {
    total: number;
    resolved: number;
    pending: number;
  } | null;
  shares?: TicketShare[];
  access?: {
    is_locked?: boolean;
    can_reply?: boolean;
    can_assign: boolean;
    can_change_priority?: boolean;
    can_change_category?: boolean;
    can_change_section?: boolean;
    can_change_status: boolean;
    is_staff: boolean;
    is_requester?: boolean;
    can_close?: boolean;
    can_cancel?: boolean;
    can_start?: boolean;
    can_resolve?: boolean;
    can_reopen?: boolean;
    can_internal?: boolean;
    can_submit_for_approval?: boolean;
    can_return_from_approval?: boolean;
    can_share?: boolean;
  };
  mentionable_staff?: Array<{ user_id: number; name: string | null }>;
};

/** One participant's sign-off row on a shared ticket. */
export type TicketShare = {
  id: number;
  section_id: number;
  section_name?: string | null;
  user_id?: number | null;
  user_name?: string | null;
  is_owner: boolean;
  shared_at?: string | null;
  resolved_at?: string | null;
  resolved_by_name?: string | null;
  resolution_note?: string | null;
  can_sign_off: boolean;
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
    pending_approval: number;
    resolved: number;
    closed: number;
    unread_replies: number;
    transferred: number;
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
  temp_upload_ids?: Array<string | number>;
}) {
  const { data } = await hrmdoSvc.post<{ data: Ticket }>("v1/aduts/tickets", {
    section: payload.section,
    title: payload.title,
    description: payload.description,
    category_id: payload.category_id,
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

/**
 * `cancellation` is required by the server when moving an open or in-progress
 * ticket to closed. The requestor acknowledging a resolved ticket also lands on
 * closed but is not a cancellation and needs no reason.
 */
export async function changeTicketStatus(
  ticketNumber: string,
  status: string,
  comment?: string,
  cancellation?: { reasonId: number; remarks?: string | null },
) {
  const { data } = await hrmdoSvc.post<{ data: Ticket }>(
    `v1/aduts/tickets/${ticketNumber}/status`,
    {
      status,
      comment,
      cancel_reason_id: cancellation?.reasonId,
      cancel_remarks: cancellation?.remarks || undefined,
    },
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
  cancellation?: { reasonId: number; remarks?: string | null },
) {
  const { data } = await hrmdoSvc.post<{ data: Ticket[] }>(
    "v1/aduts/tickets/bulk-status",
    {
      ticket_numbers: ticketNumbers,
      status,
      cancel_reason_id: cancellation?.reasonId,
      cancel_remarks: cancellation?.remarks || undefined,
    },
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

export async function submitTicketForApproval(
  ticketNumber: string,
  sectionId: number,
) {
  const { data } = await hrmdoSvc.post<{ data: Ticket }>(
    `v1/aduts/tickets/${ticketNumber}/approval`,
    { section_id: sectionId },
  );
  return data.data;
}

export async function returnTicketFromApproval(
  ticketNumber: string,
  comment?: string,
) {
  const { data } = await hrmdoSvc.post<{ data: Ticket }>(
    `v1/aduts/tickets/${ticketNumber}/approval/return`,
    comment ? { comment } : {},
  );
  return data.data;
}

export async function shareTicket(
  ticketNumber: string,
  sectionId: number,
  userId?: number | null,
) {
  const { data } = await hrmdoSvc.post<{ data: Ticket }>(
    `v1/aduts/tickets/${ticketNumber}/shares`,
    { section_id: sectionId, ...(userId ? { user_id: userId } : {}) },
  );
  return data.data;
}

export async function revokeTicketShare(ticketNumber: string, shareId: number) {
  const { data } = await hrmdoSvc.delete<{ data: Ticket }>(
    `v1/aduts/tickets/${ticketNumber}/shares/${shareId}`,
  );
  return data.data;
}

export async function signOffTicketShare(
  ticketNumber: string,
  shareId: number,
  note?: string,
) {
  const { data } = await hrmdoSvc.post<{ data: Ticket }>(
    `v1/aduts/tickets/${ticketNumber}/shares/sign-off`,
    { share_id: shareId, ...(note ? { note } : {}) },
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
  const normalizedBody = normalizeTicketMessageBody(body);
  const { data } = await hrmdoSvc.post(
    `v1/aduts/tickets/${ticketNumber}/messages`,
    {
      body: normalizedBody,
      type,
      temp_upload_ids: tempUploadIds.map(Number),
      ...(type === "internal" ? { mention_ids: mentionIds } : {}),
    },
  );
  return data.data;
}

/** Strip empty TipTap HTML so attachment-only sends use an empty body. */
export function normalizeTicketMessageBody(html: string): string {
  const stripped = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  if (stripped.length > 0 || /<img\b/i.test(html)) {
    return html;
  }
  return "";
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
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Authenticated blob URL for in-app previews. Caller must revoke when done. */
export async function fetchTicketAttachmentObjectUrl(
  ticketNumber: string,
  attachmentId: number,
) {
  const { data } = await hrmdoSvc.get(
    ticketAttachmentUrl(ticketNumber, attachmentId),
    { params: { inline: 1 }, responseType: "blob" },
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
  /** Work this person did on tickets shared across sections. */
  shared?: {
    shared_count: number;
    pending_count: number;
    handling_time: TatSummary;
  };
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
  sharing?: {
    shared_ticket_count: number;
    sign_off_count: number;
    pending_sign_off_count: number;
    handling_time: TatSummary;
  };
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
      shares?: Array<{
        section_id: number;
        section_name?: string | null;
        user_id?: number | null;
        name?: string | null;
        is_owner: boolean;
        shared_at?: string | null;
        resolved_at?: string | null;
        handling_hours: number | null;
      }>;
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

/** Super-admin: all boards */
export async function fetchCancellationReasons() {
  const { data } = await hrmdoSvc.get<{ data: CancellationReason[] }>(
    "v1/aduts/admin/cancellation-reasons",
  );
  return data.data;
}

export async function createCancellationReason(payload: {
  label: string;
  sort_order?: number;
  is_active?: boolean;
}) {
  const { data } = await hrmdoSvc.post<{ data: CancellationReason }>(
    "v1/aduts/admin/cancellation-reasons",
    payload,
  );
  return data.data;
}

export async function updateCancellationReason(
  reasonId: number,
  payload: Partial<{ label: string; sort_order: number; is_active: boolean }>,
) {
  const { data } = await hrmdoSvc.patch<{ data: CancellationReason }>(
    `v1/aduts/admin/cancellation-reasons/${reasonId}`,
    payload,
  );
  return data.data;
}

export async function deleteCancellationReason(reasonId: number) {
  await hrmdoSvc.delete(`v1/aduts/admin/cancellation-reasons/${reasonId}`);
}

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

export async function uploadBoardLogo(file: File) {
  const formData = new FormData();
  formData.append("logo", file);

  const { data } = await hrmdoSvc.post<{ data: Board }>(
    "v1/aduts/board/logo",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return data.data;
}

export async function removeBoardLogo() {
  const { data } = await hrmdoSvc.delete<{ data: Board }>("v1/aduts/board/logo");
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
  is_approver?: boolean;
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
  is_approver?: boolean;
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
    is_approver?: boolean;
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
