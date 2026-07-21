import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchBoards, fetchCurrentBoard, fetchTickets } from "@/lib/aduts-api";
import { isPlatformHost } from "@/lib/adutsHost";
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
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Your boards</h2>
        <p className="text-muted-foreground">
          Each board runs on its own subdomain. Open a board to file or work
          tickets.
        </p>
      </div>

      {boardsQuery.isLoading && (
        <p className="text-muted-foreground">Loading boards…</p>
      )}
      {boardsQuery.isError && (
        <p className="text-destructive">
          Could not load boards. Sign in and retry.
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {(boardsQuery.data ?? []).map((board) => (
          <li key={board.id}>
            <Card>
              <CardHeader>
                <CardTitle>{board.board_name}</CardTitle>
                {board.description ? (
                  <CardDescription>{board.description}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>
                <Button variant="link" className="h-auto px-0" asChild>
                  <a href={board.url}>Open {board.slug}</a>
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <Button variant="link" className="h-auto px-0" asChild>
        <Link to="/tickets">View my tickets across boards</Link>
      </Button>
    </section>
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
    <section className="space-y-6">
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {boardQuery.data?.board_name ?? "Board"}
          </h2>
          <p className="text-muted-foreground">
            {boardQuery.data?.description ??
              "File and track support tickets for this board."}
          </p>
        </div>
        <Button asChild>
          <Link to="/tickets/new">New ticket</Link>
        </Button>
      </div>

      <div>
        <h3 className="mb-2 font-medium">Open tickets</h3>
        {ticketsQuery.isLoading && (
          <p className="text-muted-foreground">Loading…</p>
        )}
        <Card>
          <CardContent className="divide-border divide-y p-0">
            {(ticketsQuery.data?.data ?? []).map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <Link
                    to="/tickets/$ticketNumber"
                    params={{ ticketNumber: ticket.ticket_number }}
                    className="font-medium hover:underline"
                  >
                    {ticket.ticket_number} — {ticket.title}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    {ticket.priority} · {ticket.section_name}
                  </p>
                </div>
                <Badge variant="secondary">{ticket.status}</Badge>
              </div>
            ))}
            {(ticketsQuery.data?.data?.length ?? 0) === 0 &&
              !ticketsQuery.isLoading && (
                <p className="text-muted-foreground px-4 py-6 text-sm">
                  No open tickets.
                </p>
              )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
