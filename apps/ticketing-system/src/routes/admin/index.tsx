import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageShell } from "@/components/page-shell";
import { SearchableScrollList } from "@/components/searchable-scroll-list";
import { useListFilter } from "@/components/use-list-filter";
import { AccessDeniedState } from "@/components/access-denied-state";
import { requireSuperAdmin } from "@/lib/admin-guards";
import { fetchAdminBoards } from "@/lib/aduts-api";
import { getAxiosStatus } from "@/lib/axios-status";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";

export const Route = createFileRoute("/admin/")({
  beforeLoad: async ({ context }) => {
    await requireSuperAdmin(context.queryClient);
  },
  component: AdminBoardsPage,
});

function AdminBoardsPage() {
  const boardsQuery = useQuery({
    queryKey: ["aduts", "admin", "boards"],
    queryFn: () => fetchAdminBoards(),
  });
  const boardsForbidden =
    boardsQuery.isError && getAxiosStatus(boardsQuery.error) === 403;
  const allBoards = boardsQuery.data ?? [];
  const list = useListFilter(allBoards, (board) => [
    board.board_name,
    board.slug,
    board.visibility_mode,
  ]);

  return (
    <PageShell
      width="wide"
      title="Board Tenants"
      description={
        <>
          Super-admin: create and configure ticketing boards. Board admins also
          need{" "}
          <code className="bg-muted rounded-md px-1.5 py-0.5 font-mono text-xs">
            ticketing-system-board-admin-access
          </code>{" "}
          in AdU Live Users Center.
        </>
      }
      action={
        <Button asChild className="shadow-xs">
          <Link to="/admin/boards/new">New Board</Link>
        </Button>
      }
    >
      {boardsQuery.isLoading && (
        <p className="text-muted-foreground text-sm">Loading boards…</p>
      )}
      {boardsForbidden ? (
        <AccessDeniedState
          description="You need super-admin access to manage board tenants."
          backTo="/"
          backLabel="Back to home"
        />
      ) : null}
      {boardsQuery.isError && !boardsForbidden && (
        <p className="text-destructive text-sm">Could not load boards.</p>
      )}

      <SearchableScrollList
        query={list.query}
        onQueryChange={list.setQuery}
        total={allBoards.length}
        shown={list.filtered.length}
        placeholder="Search boards by name or slug"
        maxHeightClassName="max-h-[40rem]"
        scrollClassName="p-1"
      >
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.filtered.map((board) => (
            <li key={board.id}>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>{board.board_name}</CardTitle>
                  <CardDescription>
                    {board.slug}.localhost.test
                    {board.deleted_at ? " (deleted)" : ""}
                    {board.visibility_mode === "maintenance" && (
                      <span className="ml-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">
                        Maintenance
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="shadow-xs"
                  >
                    <Link
                      to="/admin/boards/$boardId"
                      params={{ boardId: String(board.id) }}
                    >
                      Manage
                    </Link>
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto px-0"
                    asChild
                  >
                    <a href={board.url}>Open Board</a>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </SearchableScrollList>
    </PageShell>
  );
}
