import { vi } from "vitest";

import type { AuthUser } from "@/lib/fetch-auth-user";
import type {
  Board,
  TatReport,
  Ticket,
  TicketListResponse,
} from "@/lib/aduts-api";
import {
  BOARD_HOST,
  PLATFORM_HOST,
  authBoardAdmin,
  fixtureBoard,
  fixtureBoardsList,
  fixtureTatReport,
  fixtureTicket,
  fixtureTicketList,
} from "./fixtures";

type ApiMocks = {
  authUser?: AuthUser;
  board?: Board;
  boards?: Board[];
  tickets?: TicketListResponse;
  ticket?: Ticket;
  tatReport?: TatReport;
  hostname?: string;
};

const defaultMocks: Required<ApiMocks> = {
  authUser: authBoardAdmin,
  board: fixtureBoard,
  boards: fixtureBoardsList,
  tickets: fixtureTicketList,
  ticket: fixtureTicket,
  tatReport: fixtureTatReport,
  hostname: BOARD_HOST,
};

let current: Required<ApiMocks> = { ...defaultMocks };

export function resetApiMocks(overrides: ApiMocks = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== undefined),
  ) as ApiMocks;

  current = {
    ...defaultMocks,
    ...cleaned,
  };
}

export function getApiMocks() {
  return current;
}

function boardSubdomainFromHost(hostname: string): string {
  const normalized = hostname.toLowerCase().trim();
  if (
    normalized === PLATFORM_HOST ||
    normalized === "localhost.test" ||
    normalized === "localhost" ||
    normalized === "127.0.0.1"
  ) {
    return "";
  }
  const first = normalized.split(".")[0] ?? "";
  if (first === "ticketing" || first === "www" || first === "aduts") {
    return "";
  }
  return first;
}

vi.mock("@/lib/adutsHost", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/adutsHost")>();
  return {
    ...actual,
    getBoardSubdomain: vi.fn((hostname?: string) =>
      boardSubdomainFromHost(hostname ?? getApiMocks().hostname),
    ),
    isPlatformHost: vi.fn(
      (hostname?: string) =>
        boardSubdomainFromHost(hostname ?? getApiMocks().hostname) === "",
    ),
  };
});

vi.mock("@/lib/fetch-auth-user", () => ({
  fetchAuthUser: vi.fn(async () => ({ data: getApiMocks().authUser })),
}));

vi.mock("@repo/axios-config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@repo/axios-config")>();
  return {
    ...actual,
    authSvc: {
      get: vi.fn(async () => ({ data: getApiMocks().authUser })),
      post: vi.fn(async () => ({ data: {} })),
      defaults: {},
    },
    buildLoginUrl: vi.fn(() => "http://login.localhost.test/"),
    buildLogoutRedirectUrl: vi.fn(() => "http://login.localhost.test/"),
  };
});

vi.mock("@/lib/aduts-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/aduts-api")>();

  return {
    ...actual,
    fetchBoards: vi.fn(async () => getApiMocks().boards),
    fetchCurrentBoard: vi.fn(async () => getApiMocks().board),
    fetchTickets: vi.fn(async () => getApiMocks().tickets),
    fetchTicket: vi.fn(async () => getApiMocks().ticket),
    fetchTatReport: vi.fn(async () => getApiMocks().tatReport),
    searchAduts: vi.fn(async () => ({ tickets: [], people: [] })),
    fetchSavedViews: vi.fn(async () => []),
    fetchAdminBoards: vi.fn(async () => getApiMocks().boards),
    fetchAdminBoardAdmins: vi.fn(async () => []),
    fetchBoardAdmins: vi.fn(async () => []),
    fetchBoardCustomers: vi.fn(async () => []),
    fetchBoardSections: vi.fn(async () => getApiMocks().board.sections ?? []),
    fetchTicketChecklist: vi.fn(async () => []),
    fetchTicketLinks: vi.fn(async () => []),
    heartbeatTicketPresence: vi.fn(async () => []),
    searchPeople: vi.fn(async () => []),
  };
});
