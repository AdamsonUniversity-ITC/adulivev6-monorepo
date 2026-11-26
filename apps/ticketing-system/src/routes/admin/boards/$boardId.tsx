import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { SearchableScrollList } from "@/components/searchable-scroll-list";
import { useListFilter } from "@/components/use-list-filter";
import { requireSuperAdmin } from "@/lib/admin-guards";
import {
  addAdminBoardAdmin,
  addAdminMaintenanceUser,
  deleteAdminBoard,
  fetchAdminBoardAdmins,
  fetchAdminBoards,
  fetchAdminMaintenanceUsers,
  type BoardVisibilityMode,
  removeAdminBoardAdmin,
  removeAdminMaintenanceUser,
  updateAdminBoard,
} from "@/lib/aduts-api";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";

export const Route = createFileRoute("/admin/boards/$boardId")({
  beforeLoad: async ({ context }) => {
    await requireSuperAdmin(context.queryClient);
  },
  component: AdminBoardDetailPage,
});

function AdminBoardDetailPage() {
  const { boardId } = Route.useParams();
  const id = Number(boardId);
  const queryClient = useQueryClient();

  const boardsQuery = useQuery({
    queryKey: ["aduts", "admin", "boards"],
    queryFn: () => fetchAdminBoards(true),
  });
  const board = (boardsQuery.data ?? []).find((b) => b.id === id);

  const adminsQuery = useQuery({
    queryKey: ["aduts", "admin", "boards", id, "admins"],
    queryFn: () => fetchAdminBoardAdmins(id),
    enabled: Number.isFinite(id),
  });

  const maintenanceUsersQuery = useQuery({
    queryKey: ["aduts", "admin", "boards", id, "maintenance-users"],
    queryFn: () => fetchAdminMaintenanceUsers(id),
    enabled: Number.isFinite(id),
  });

  const allAdmins = adminsQuery.data ?? [];
  const adminList = useListFilter(allAdmins, (a) => [
    a.name,
    a.email,
    a.user_id,
  ]);
  const allMaintenanceUsers = maintenanceUsersQuery.data ?? [];
  const maintenanceList = useListFilter(allMaintenanceUsers, (a) => [
    a.name,
    a.email,
    a.user_id,
  ]);

  const [name, setName] = useState("");
  const [visibilityMode, setVisibilityMode] =
    useState<BoardVisibilityMode>("production");
  const [maintenanceUserId, setMaintenanceUserId] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [frontendUrl, setFrontendUrl] = useState("");
  const [adminUserId, setAdminUserId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  if (board && !hydrated) {
    setName(board.board_name);
    setSlug(board.slug);
    setDescription(board.description ?? "");
    setFrontendUrl(board.frontend_url ?? board.url ?? "");
    setVisibilityMode(board.visibility_mode ?? "production");
    setHydrated(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      updateAdminBoard(id, {
        board_name: name,
        slug,
        description: description || null,
        frontend_url: frontendUrl.trim() || null,
        visibility_mode: visibilityMode,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["aduts", "admin", "boards"],
      });
      void queryClient.invalidateQueries({ queryKey: ["aduts", "boards"] });
    },
  });

  const addAdminMutation = useMutation({
    mutationFn: () => addAdminBoardAdmin(id, Number(adminUserId)),
    onSuccess: () => {
      setAdminUserId("");
      void queryClient.invalidateQueries({
        queryKey: ["aduts", "admin", "boards", id, "admins"],
      });
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: (userId: number) => removeAdminBoardAdmin(id, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["aduts", "admin", "boards", id, "admins"],
      });
    },
  });

  const addMaintenanceUserMutation = useMutation({
    mutationFn: () => addAdminMaintenanceUser(id, Number(maintenanceUserId)),
    onSuccess: () => {
      setMaintenanceUserId("");
      void queryClient.invalidateQueries({
        queryKey: ["aduts", "admin", "boards", id, "maintenance-users"],
      });
    },
  });

  const removeMaintenanceUserMutation = useMutation({
    mutationFn: (userId: number) => removeAdminMaintenanceUser(id, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["aduts", "admin", "boards", id, "maintenance-users"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminBoard(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["aduts", "admin", "boards"],
      });
    },
  });

  if (boardsQuery.isLoading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (!board) {
    return <p className="text-destructive">Board not found.</p>;
  }

  function onSave(event: FormEvent) {
    event.preventDefault();
    saveMutation.mutate();
  }

  function onAddAdmin(event: FormEvent) {
    event.preventDefault();
    if (!adminUserId) return;
    addAdminMutation.mutate();
  }

  function onAddMaintenanceUser(event: FormEvent) {
    event.preventDefault();
    if (!maintenanceUserId) return;
    addMaintenanceUserMutation.mutate();
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {board.board_name}
        </h2>
        <p className="text-muted-foreground text-sm">{board.url}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frontend-url">Frontend URL</Label>
              <Input
                id="frontend-url"
                type="url"
                placeholder="http://itc-ts.localhost.test:5174"
                value={frontendUrl}
                onChange={(e) => setFrontendUrl(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Used by Your Boards and notification links. Include the port in
                local (e.g. :5174). Leave blank to use the slug-based host.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="visibility-mode">Visibility</Label>
              <select
                id="visibility-mode"
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs"
                value={visibilityMode}
                onChange={(e) =>
                  setVisibilityMode(e.target.value as BoardVisibilityMode)
                }
              >
                <option value="production">Production</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <p className="text-muted-foreground text-xs">
                In maintenance, only global admins and the users listed below
                can see or open this board.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={saveMutation.isPending}>
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Board admins</CardTitle>
          <CardDescription>
            Sets the board flag only. Also grant{" "}
            <code className="text-xs">ticketing-system-board-admin-access</code>{" "}
            in Users Center.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchableScrollList
            query={adminList.query}
            onQueryChange={adminList.setQuery}
            total={allAdmins.length}
            shown={adminList.filtered.length}
            placeholder="Search admins"
            maxHeightClassName="max-h-72"
          >
            <ul className="space-y-2 text-sm">
              {adminList.filtered.map((admin) => (
                <li
                  key={admin.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span>{admin.name ?? `User ${admin.user_id}`}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAdminMutation.mutate(admin.user_id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
              {allAdmins.length === 0 && (
                <li className="text-muted-foreground">No board admins yet.</li>
              )}
            </ul>
          </SearchableScrollList>
          <form onSubmit={onAddAdmin} className="flex flex-wrap gap-2">
            <Input
              type="number"
              min={1}
              placeholder="User ID"
              className="w-40"
              value={adminUserId}
              onChange={(e) => setAdminUserId(e.target.value)}
            />
            <Button type="submit" disabled={addAdminMutation.isPending}>
              Add admin
            </Button>
          </form>
        </CardContent>
      </Card>

      {visibilityMode === "maintenance" && (
        <Card>
          <CardHeader>
            <CardTitle>Maintenance access</CardTitle>
            <CardDescription>
              Only these users (plus global admins) can access this board while
              it is in maintenance. Section members, customers and board admins
              are blocked unless listed here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SearchableScrollList
              query={maintenanceList.query}
              onQueryChange={maintenanceList.setQuery}
              total={allMaintenanceUsers.length}
              shown={maintenanceList.filtered.length}
              placeholder="Search allowlisted users"
              maxHeightClassName="max-h-72"
            >
              <ul className="space-y-2 text-sm">
                {maintenanceList.filtered.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span>{row.name ?? `User ${row.user_id}`}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        removeMaintenanceUserMutation.mutate(row.user_id)
                      }
                    >
                      Remove
                    </Button>
                  </li>
                ))}
                {allMaintenanceUsers.length === 0 && (
                  <li className="text-muted-foreground">
                    No allowlisted users yet.
                  </li>
                )}
              </ul>
            </SearchableScrollList>
            <form
              onSubmit={onAddMaintenanceUser}
              className="flex flex-wrap gap-2"
            >
              <Input
                type="number"
                min={1}
                placeholder="User ID"
                className="w-40"
                value={maintenanceUserId}
                onChange={(e) => setMaintenanceUserId(e.target.value)}
              />
              <Button
                type="submit"
                disabled={addMaintenanceUserMutation.isPending}
              >
                Add user
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Button
        type="button"
        variant="destructive"
        disabled={deleteMutation.isPending || !!board.deleted_at}
        onClick={() => {
          if (confirm("Soft-delete this board?")) deleteMutation.mutate();
        }}
      >
        Delete board
      </Button>
    </section>
  );
}
