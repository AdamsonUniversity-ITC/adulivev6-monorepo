import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageShell } from "@/components/page-shell";
import { fetchBoards, fetchCurrentBoard, fetchTickets } from "@/lib/aduts-api";
import { isPlatformHost } from "@/lib/adutsHost";
import { formatPriority, formatStatus } from "@/lib/format-labels";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";

export const Route = createFileRoute("/")({
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

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(boardsQuery.data ?? []).map((board) => (
          <li key={board.id}>
            <a href={board.url} className="group block h-full outline-none">
              <Card className="hover:border-primary/50 h-full shadow-sm transition-colors group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <CardHeader className="p-5">
                  <CardTitle className="text-lg">{board.board_name}</CardTitle>
                  {board.description ? (
                    <CardDescription className="mt-1.5 line-clamp-2 text-sm">
                      {board.description}
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <span className="text-primary text-sm font-medium">
                    Open board →
                  </span>
                </CardContent>
              </Card>
            </a>
          </li>
        ))}
      </ul>

      <div className="pt-2">
        <Button variant="outline" asChild className="shadow-xs">
          <Link to="/tickets">View my tickets across all boards</Link>
        </Button>
      </div>
    </PageShell>
  );
}

function BoardHome() {
  const boardQuery = useQuery({
    queryKey: ["aduts", "board"],
    queryFn: fetchCurrentBoard,
  });
  const ticketsQuery = useQuery({
    queryKey: ["aduts", "tickets", "open"],
    queryFn: () => fetchTickets({ status: "open" }),
  });

  return (
    <PageShell
      title={boardQuery.data?.board_name ?? "Board"}
      description={
        boardQuery.data?.description ??
        "File and track support tickets for this board."
      }
      action={
        <Button asChild className="shadow-xs">
          <Link to="/tickets/new">New Ticket</Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">Open Tickets</h3>
          <Button
            variant="link"
            size="sm"
            asChild
            className="text-muted-foreground hover:text-foreground"
          >
            <Link to="/tickets">View all</Link>
          </Button>
        </div>

        {ticketsQuery.isLoading && (
          <p className="text-muted-foreground text-sm">Loading tickets…</p>
        )}

        <Card className="overflow-hidden shadow-sm">
          <CardContent className="divide-border divide-y p-0">
            {(ticketsQuery.data?.data ?? []).map((ticket) => (
              <div
                key={ticket.id}
                className="group flex flex-col justify-between gap-3 px-4 py-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:px-5"
              >
                <div>
                  <Link
                    to="/tickets/$ticketNumber"
                    params={{ ticketNumber: ticket.ticket_number }}
                    className="text-foreground hover:text-primary font-medium transition-colors focus:outline-none focus-visible:underline"
                  >
                    <span className="text-muted-foreground mr-2 text-sm font-normal">
                      {ticket.ticket_number}
                    </span>
                    {ticket.title}
                  </Link>
                  <div className="text-muted-foreground mt-1.5 flex items-center gap-2 text-xs font-medium">
                    <span>{formatPriority(ticket.priority)}</span>
                    {ticket.section_name ? (
                      <>
                        <span className="bg-border h-1 w-1 rounded-full" />
                        <span>{ticket.section_name}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="self-start px-2 py-0.5 text-[10px] whitespace-nowrap sm:self-auto"
                >
                  {formatStatus(ticket.status)}
                </Badge>
              </div>
            ))}
            {(ticketsQuery.data?.data?.length ?? 0) === 0 &&
              !ticketsQuery.isLoading && (
                <div className="text-muted-foreground p-8 text-center text-sm">
                  No open tickets on this board.
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
