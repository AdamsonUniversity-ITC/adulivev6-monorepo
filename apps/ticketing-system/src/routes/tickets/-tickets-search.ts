export type TicketsSearch = {
  status?: string;
  keyword?: string;
  priority?: string;
  section_id?: number;
  assigned_to?: number;
  category_id?: number;
  /** Forwarded from another section and not yet picked up. Not a status. */
  transferred?: boolean;
  /** Resolved tickets the current user requested and still needs to close. */
  awaiting_ack?: boolean;
  page?: number;
  rows?: number;
};

export const DEFAULT_STATUS_FILTER = "open,in_progress";
/** Every status tab deselected. Distinct from an absent param, which defaults. */
export const EMPTY_STATUS_FILTER = "none";
export const STATUS_STORAGE_KEY = "aduts-tickets-status-filter";

const ALLOWED_STATUSES = [
  "open",
  "in_progress",
  "pending_approval",
  "resolved",
  "closed",
] as const;

export type TicketStatusId = (typeof ALLOWED_STATUSES)[number];

function parsePositiveInt(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.floor(n);
}

function parseFlag(value: unknown): boolean | undefined {
  if (value === true || value === "1" || value === "true") return true;
  return undefined;
}

export function parseStatusList(raw: string | undefined | null): TicketStatusId[] {
  if (!raw?.trim()) return ["open", "in_progress"];

  const tokens = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // An explicit deselect-everything, which must not fall through to the default.
  if (tokens.length === 1 && tokens[0] === EMPTY_STATUS_FILTER) {
    return [];
  }

  if (tokens.includes("pending")) {
    return ["open", "in_progress"];
  }

  const allowed = new Set<string>(ALLOWED_STATUSES);
  const unique: TicketStatusId[] = [];
  for (const token of tokens) {
    if (allowed.has(token) && !unique.includes(token as TicketStatusId)) {
      unique.push(token as TicketStatusId);
    }
  }

  return unique.length > 0 ? unique : ["open", "in_progress"];
}

export function serializeStatusList(statuses: TicketStatusId[]): string {
  if (statuses.length === 0) return EMPTY_STATUS_FILTER;

  const order = ALLOWED_STATUSES;
  return [...statuses]
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .join(",");
}

export function normalizeStatusFilter(raw: string | undefined | null): string {
  return serializeStatusList(parseStatusList(raw));
}

export function readStoredStatusFilter(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STATUS_STORAGE_KEY);
    if (!raw?.trim()) return null;
    return normalizeStatusFilter(raw);
  } catch {
    return null;
  }
}

export function writeStoredStatusFilter(status: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STATUS_STORAGE_KEY,
      normalizeStatusFilter(status),
    );
  } catch {
    // ignore quota / private mode
  }
}

export function parseTicketsSearch(
  search: Record<string, unknown>,
): TicketsSearch {
  // An explicit param wins; otherwise fall back to the tab the user last chose.
  const status =
    typeof search.status === "string" && search.status.trim()
      ? normalizeStatusFilter(search.status)
      : (readStoredStatusFilter() ?? DEFAULT_STATUS_FILTER);
  const keyword =
    typeof search.keyword === "string" && search.keyword.trim()
      ? search.keyword
      : undefined;
  const priority =
    typeof search.priority === "string" && search.priority.trim()
      ? search.priority
      : undefined;

  return {
    status,
    keyword,
    priority,
    section_id: parsePositiveInt(search.section_id),
    assigned_to: parsePositiveInt(search.assigned_to),
    category_id: parsePositiveInt(search.category_id),
    transferred: parseFlag(search.transferred),
    awaiting_ack: parseFlag(search.awaiting_ack),
    page: parsePositiveInt(search.page) ?? 1,
    rows: parsePositiveInt(search.rows) ?? 15,
  };
}

