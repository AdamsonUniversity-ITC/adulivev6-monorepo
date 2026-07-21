import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { requireBoardAdminCapability } from "@/lib/admin-guards";
import { fetchCurrentBoard, updateCurrentBoard } from "@/lib/aduts-api";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";

export const Route = createFileRoute("/manage/")({
  beforeLoad: async ({ context }) => {
    await requireBoardAdminCapability(context.queryClient);
  },
  component: ManageBoardPage,
});

function ManageBoardPage() {
  const queryClient = useQueryClient();
  const boardQuery = useQuery({
    queryKey: ["aduts", "board"],
    queryFn: fetchCurrentBoard,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kbUrl, setKbUrl] = useState("");

  useEffect(() => {
    if (!boardQuery.data) return;
    setName(boardQuery.data.board_name);
    setDescription(boardQuery.data.description ?? "");
    setKbUrl(boardQuery.data.kb_url ?? "");
  }, [boardQuery.data]);

  const mutation = useMutation({
    mutationFn: () =>
      updateCurrentBoard({
        board_name: name,
        description: description || null,
        kb_url: kbUrl || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["aduts", "board"] });
    },
  });

  if (boardQuery.isLoading) {
    return <p className="text-muted-foreground">Loading board…</p>;
  }

  if (boardQuery.isError) {
    return (
      <p className="text-destructive">
        Could not load board. You need board-admin Spatie plus a board-admin
        flag for this tenant.
      </p>
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Board settings</h2>
      <Card>
        <CardHeader>
          <CardTitle>{boardQuery.data?.board_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Knowledge base URL</Label>
              <Input
                value={kbUrl}
                onChange={(e) => setKbUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
