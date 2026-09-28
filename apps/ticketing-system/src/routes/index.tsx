import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageShell } from "@/components/page-shell";
import { fetchBoards, fetchCurrentBoard } from "@/lib/aduts-api";
import { isPlatformHost } from "@/lib/adutsHost";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";

import { TicketsListView } from "./tickets/-tickets-list-view";
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
  const search = Route.useSearch();
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
        <Button asChild className="shadow-xs">
          <Link to="/tickets/new">New Ticket</Link>
        </Button>
      }
      width="full"
      bordered={false}
      dense
      className="-mx-1 -my-2 sm:-mx-2 sm:-my-3 md:-my-4"
    >
      <TicketsListView search={search} from="/" />
    </PageShell>
  );
}
