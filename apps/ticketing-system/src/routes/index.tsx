import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/page-shell";
import { fetchBoards, fetchCurrentBoard } from "@/lib/aduts-api";
import { isPlatformHost } from "@/lib/adutsHost";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";

import { TicketsListView } from "./tickets/-tickets-list-view";
import type { TicketsMetrics } from "./tickets/-tickets-datatable";
import {
  parseTicketsSearch,
  type TicketsSearch,
} from "./tickets/-tickets-search";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): TicketsSearch =>
    parseTicketsSearch(search),
  component: HomePage,
});

function HomePage() {
  const platform = isPlatformHost();

  if (platform) {
    return <PlatformHome />;
  }

  return <BoardHome />;
}

function PlatformHome() {
  const boardsQuery = useQuery({
    queryKey: ["aduts", "boards"],
    queryFn: fetchBoards,
  });

  return (
    <PageShell
      width="wide"
      title="Your Boards"
      description="Each board runs on its own subdomain. Open a board to file or work tickets."
    >
      {boardsQuery.isLoading && (
        <p className="text-muted-foreground text-sm">Loading boards…</p>
      )}
      {boardsQuery.isError && (
        <p className="text-destructive text-sm">
          Could not load boards. Sign in and retry.
        </p>
      )}

      <ul
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        data-tour="boards-list"
      >
        {(boardsQuery.data ?? []).map((board) => (
          <li key={board.id}>
            <a
              href={board.url}
              aria-label={`Open ${board.board_name}`}
              className="group block h-full outline-none"
            >
              <Card className="hover:border-primary/50 group-focus-visible:ring-ring h-full shadow-sm transition-colors group-focus-visible:ring-2">
                <CardHeader className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted size-9 shrink-0 overflow-hidden rounded-md border">
                      <img
                        src={board.logo_url ?? "/assets/images/adulogo.png"}
                        alt=""
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base">
                        {board.board_name}
                      </CardTitle>
                      {board.description ? (
                        <CardDescription className="line-clamp-1 text-xs">
                          {board.description}
                        </CardDescription>
                      ) : null}
                    </div>
                    <ArrowRight
                      className="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-colors"
                      aria-hidden="true"
                    />
                  </div>
                </CardHeader>
              </Card>
            </a>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}

function BoardHome() {
  const search = Route.useSearch();
  const [metrics, setMetrics] = useState<TicketsMetrics | null>(null);
  const filingBlocked = (metrics?.awaiting_ack ?? 0) > 0;
  const boardQuery = useQuery({
    queryKey: ["aduts", "board"],
    queryFn: fetchCurrentBoard,
  });

  return (
    <PageShell
      title={boardQuery.data?.board_name ?? "Home"}
      description={
        boardQuery.data?.description ??
        "File and track support tickets for this board."
      }
      action={
        filingBlocked ? (
          <div
            className="flex max-w-sm flex-col gap-1.5 sm:items-end"
            data-tour="new-ticket"
          >
            <Button type="button" disabled className="shadow-xs">
              New Ticket
            </Button>
            <p className="text-muted-foreground text-xs leading-relaxed sm:text-right">
              An unacknowledged resolved ticket blocks new tickets.{" "}
              <Button variant="link" className="h-auto px-0 text-xs" asChild>
                <Link
                  to="/"
                  search={(prev) => {
                    const next: TicketsSearch = {
                      ...prev,
                      awaiting_ack: true,
                      page: 1,
                    };
                    delete next.transferred;
                    return next;
                  }}
                >
                  Open the Acknowledge filter
                </Link>
              </Button>
              .
            </p>
          </div>
        ) : (
          <Button asChild className="shadow-xs" data-tour="new-ticket">
            <Link to="/tickets/new">New Ticket</Link>
          </Button>
        )
      }
      width="full"
      bordered={false}
      dense
      className="-mx-1 -my-2 sm:-mx-2 sm:-my-3 md:-my-4"
    >
      <TicketsListView search={search} from="/" onMetricsChange={setMetrics} />
    </PageShell>
  );
}
