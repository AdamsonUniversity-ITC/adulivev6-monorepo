import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageShell } from "@/components/page-shell";
import { requireSuperAdmin } from "@/lib/admin-guards";
import { fetchAdminBoards } from "@/lib/aduts-api";
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
      {boardsQuery.isError && (
        <p className="text-destructive text-sm">Could not load boards.</p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {(boardsQuery.data ?? []).map((board) => (
          <li key={board.id}>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>{board.board_name}</CardTitle>
                <CardDescription>
                  {board.slug}.localhost.test
                  {board.deleted_at ? " (deleted)" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild className="shadow-xs">
                  <Link
                    to="/admin/boards/$boardId"
                    params={{ boardId: String(board.id) }}
                  >
                    Manage
                  </Link>
                </Button>
                <Button variant="link" size="sm" className="h-auto px-0" asChild>
                  <a href={board.url}>Open Board</a>
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
