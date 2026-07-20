import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Board tenants
          </h2>
          <p className="text-muted-foreground text-sm">
            Super-admin: create and configure ticketing boards. Board admins
            also need{" "}
            <code className="text-xs">ticketing-system-board-admin-access</code>{" "}
            in AdU Live Users Center.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/boards/new">New board</Link>
        </Button>
      </div>

      {boardsQuery.isLoading && (
        <p className="text-muted-foreground">Loading boards…</p>
      )}
      {boardsQuery.isError && (
        <p className="text-destructive">Could not load boards.</p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {(boardsQuery.data ?? []).map((board) => (
          <li key={board.id}>
            <Card>
              <CardHeader>
                <CardTitle>{board.board_name}</CardTitle>
                <CardDescription>
                  {board.slug}.localhost.test
                  {board.deleted_at ? " (deleted)" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
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
                  <a href={board.url}>Open board</a>
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
