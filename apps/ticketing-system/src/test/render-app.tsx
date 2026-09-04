import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from "@tanstack/react-router";
import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { TicketingThemeProvider } from "@/components/ticketing-theme-provider";
import type {
  Board,
  TatReport,
  Ticket,
  TicketListResponse,
} from "@/lib/aduts-api";
import type { AuthUser } from "@/lib/fetch-auth-user";
import { routeTree } from "@/routeTree.gen";
import { BOARD_HOST } from "./fixtures";
import { resetApiMocks } from "./mock-apis";

type RenderAppOptions = {
  initialPath?: string;
  hostname?: string;
  authUser?: AuthUser;
  board?: Board;
  boards?: Board[];
  tickets?: TicketListResponse;
  ticket?: Ticket;
  tatReport?: TatReport;
};

function Providers({
  children,
  queryClient,
}: {
  children: ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <TicketingThemeProvider>{children}</TicketingThemeProvider>
    </QueryClientProvider>
  );
}

export async function renderApp(
  options: RenderAppOptions = {},
): Promise<RenderResult & { queryClient: QueryClient }> {
  const {
    initialPath = "/",
    hostname = BOARD_HOST,
    authUser,
    board,
    boards,
    tickets,
    ticket,
    tatReport,
  } = options;

  resetApiMocks({
    hostname,
    authUser,
    board,
    boards,
    tickets,
    ticket,
    tatReport,
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  const history = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({
    routeTree,
    history,
    context: { queryClient },
    defaultPreload: false,
  });

  await router.load();

  const view = render(
    (
      <Providers queryClient={queryClient}>
        <RouterProvider router={router} />
      </Providers>
    ) as ReactElement,
  );

  return { ...view, queryClient };
}
