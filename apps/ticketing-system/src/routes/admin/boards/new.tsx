import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { requireSuperAdmin } from "@/lib/admin-guards";
import { createBoard } from "@/lib/aduts-api";
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

export const Route = createFileRoute("/admin/boards/new")({
  beforeLoad: async ({ context }) => {
    await requireSuperAdmin(context.queryClient);
  },
  component: NewBoardPage,
});

function NewBoardPage() {
  const navigate = useNavigate();
  const [boardName, setBoardName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sectionName, setSectionName] = useState("Helpdesk");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createBoard,
    onSuccess: (board) => {
      void navigate({
        to: "/admin/boards/$boardId",
        params: { boardId: String(board.id) },
      });
    },
    onError: () => setError("Could not create board."),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    mutation.mutate({
      board_name: boardName,
      slug: slug || undefined,
      description: description || undefined,
      sections: sectionName ? [{ section_name: sectionName }] : [],
    });
  }

  return (
    <section className="mx-auto max-w-xl space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">New board</h2>
      <Card>
        <CardHeader>
          <CardTitle>Tenant details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="board-name">Name</Label>
              <Input
                id="board-name"
                required
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-slug">Slug (host label)</Label>
              <Input
                id="board-slug"
                placeholder="itc-ts"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Becomes {slug || "slug"}.localhost.test
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-desc">Description</Label>
              <Textarea
                id="board-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Initial section</Label>
              <Input
                id="section"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
              />
            </div>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create board"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
