import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { requireSuperAdmin } from "@/lib/admin-guards";
import {
  addAdminBoardAdmin,
  deleteAdminBoard,
  fetchAdminBoardAdmins,
  fetchAdminBoards,
  removeAdminBoardAdmin,
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

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [adminUserId, setAdminUserId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  if (board && !hydrated) {
    setName(board.board_name);
    setSlug(board.slug);
    setDescription(board.description ?? "");
    setHydrated(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      updateAdminBoard(id, {
        board_name: name,
        slug,
        description: description || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["aduts", "admin", "boards"],
      });
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
          <ul className="space-y-2 text-sm">
            {(adminsQuery.data ?? []).map((admin) => (
              <li
                key={admin.id}
                className="flex items-center justify-between gap-2"
              >
                <span>User {admin.user_id}</span>
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
            {(adminsQuery.data?.length ?? 0) === 0 && (
              <li className="text-muted-foreground">No board admins yet.</li>
            )}
          </ul>
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
