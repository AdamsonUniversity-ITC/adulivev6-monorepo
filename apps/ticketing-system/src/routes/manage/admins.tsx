import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { requireBoardAdminCapability } from "@/lib/admin-guards";
import {
  addBoardAdmin,
  fetchBoardAdmins,
  removeBoardAdmin,
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

export const Route = createFileRoute("/manage/admins")({
  beforeLoad: async ({ context }) => {
    await requireBoardAdminCapability(context.queryClient);
  },
  component: ManageAdminsPage,
});

function ManageAdminsPage() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");

  const adminsQuery = useQuery({
    queryKey: ["aduts", "board", "admins"],
    queryFn: fetchBoardAdmins,
  });

  const addMutation = useMutation({
    mutationFn: () => addBoardAdmin(Number(userId)),
    onSuccess: () => {
      setUserId("");
      void queryClient.invalidateQueries({
        queryKey: ["aduts", "board", "admins"],
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeBoardAdmin(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["aduts", "board", "admins"],
      });
    },
  });

  function onAdd(event: FormEvent) {
    event.preventDefault();
    if (!userId) return;
    addMutation.mutate();
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Board admins</h2>
      <Card>
        <CardHeader>
          <CardTitle>Co-admins</CardTitle>
          <CardDescription>
            Board flag only — users also need{" "}
            <code className="text-xs">ticketing-system-board-admin-access</code>{" "}
            in AdU Live.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            {(adminsQuery.data ?? []).map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2"
              >
                <span>User {a.user_id}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMutation.mutate(a.user_id)}
                >
                  Remove
                </Button>
              </li>
            ))}
            {(adminsQuery.data?.length ?? 0) === 0 && (
              <li className="text-muted-foreground">No board admins yet.</li>
            )}
          </ul>
          <form onSubmit={onAdd} className="flex flex-wrap gap-2">
            <Input
              type="number"
              min={1}
              placeholder="User ID"
              className="w-40"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <Button type="submit">Add admin</Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
