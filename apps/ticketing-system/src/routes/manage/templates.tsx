import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import { AccessDeniedState } from "@/components/access-denied-state";
import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";
import { requireSectionHeadOrBoardAdmin } from "@/lib/admin-guards";
import {
  createBoardTemplate,
  deleteBoardTemplate,
  fetchCurrentBoard,
  updateBoardTemplate,
  type BoardTemplate,
} from "@/lib/aduts-api";
import { getAxiosStatus } from "@/lib/axios-status";
import { Badge } from "@repo/ui/components/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/exports";

export const Route = createFileRoute("/manage/templates")({
  beforeLoad: async ({ context }) => {
    await requireSectionHeadOrBoardAdmin(context.queryClient);
  },
  component: ManageTemplatesPage,
});

function ManageTemplatesPage() {
  const queryClient = useQueryClient();
  const boardQuery = useQuery({
    queryKey: ["aduts", "board"],
    queryFn: fetchCurrentBoard,
  });

  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<"msg" | "internal">("msg");
  const [editing, setEditing] = useState<BoardTemplate | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["aduts", "board"] });
  };

  const createMutation = useMutation({
    mutationFn: () => createBoardTemplate({ name, body, type }),
    onSuccess: () => {
      setName("");
      setBody("");
      setType("msg");
      invalidate();
      toast.success("Template created.");
    },
    onError: () => toast.error("Could not create template."),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("No template selected");
      return updateBoardTemplate(editing.id, {
        name: editing.name,
        body: editing.body,
        type: editing.type === "internal" ? "internal" : "msg",
      });
    },
    onSuccess: () => {
      setEditing(null);
      invalidate();
      toast.success("Template updated.");
    },
    onError: () => toast.error("Could not update template."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBoardTemplate(id),
    onSuccess: () => {
      invalidate();
      toast.success("Template deleted.");
    },
    onError: () => toast.error("Could not delete template."),
  });

  if (boardQuery.isLoading) {
    return <LoadingState label="Loading templates…" />;
  }

  if (boardQuery.isError) {
    if (getAxiosStatus(boardQuery.error) === 403) {
      return (
        <AccessDeniedState description="You need board-admin access for this tenant." />
      );
    }
    return <AccessDeniedState description="Could not load board templates." />;
  }

  const templates = boardQuery.data?.templates ?? [];

  function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !body.trim()) return;
    createMutation.mutate();
  }

  return (
    <PageShell
      title="Templates"
      bordered={false}
      description="Canned replies for public and internal chat."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>New template</CardTitle>
            <CardDescription>
              Staff insert these into the ticket composers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="tpl-name">Name</Label>
                <Input
                  id="tpl-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="shadow-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select
                  value={type}
                  onValueChange={(value) =>
                    setType(value === "internal" ? "internal" : "msg")
                  }
                >
                  <SelectTrigger className="shadow-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="msg">Public reply</SelectItem>
                    <SelectItem value="internal">Internal note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tpl-body">Body</Label>
                <Textarea
                  id="tpl-body"
                  required
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="shadow-xs resize-y"
                />
              </div>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="shadow-xs"
              >
                {createMutation.isPending ? "Saving…" : "Add template"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Saved templates</CardTitle>
            <CardDescription>
              {templates.length} template{templates.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No templates yet. Create one to speed up common replies.
              </p>
            ) : (
              templates.map((tpl) =>
                editing?.id === tpl.id ? (
                  <div
                    key={tpl.id}
                    className="bg-muted/20 space-y-3 rounded-lg border p-3"
                  >
                    <Input
                      value={editing.name}
                      onChange={(e) =>
                        setEditing({ ...editing, name: e.target.value })
                      }
                      className="shadow-xs"
                    />
                    <Select
                      value={editing.type === "internal" ? "internal" : "msg"}
                      onValueChange={(value) =>
                        setEditing({
                          ...editing,
                          type: value === "internal" ? "internal" : "msg",
                        })
                      }
                    >
                      <SelectTrigger className="shadow-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="msg">Public reply</SelectItem>
                        <SelectItem value="internal">Internal note</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      rows={4}
                      value={editing.body}
                      onChange={(e) =>
                        setEditing({ ...editing, body: e.target.value })
                      }
                      className="shadow-xs resize-y"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate()}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={tpl.id}
                    className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{tpl.name}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {tpl.type === "internal" ? "Internal" : "Public"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                        {tpl.body}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(tpl)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (
                            window.confirm(`Delete template “${tpl.name}”?`)
                          ) {
                            deleteMutation.mutate(tpl.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ),
              )
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
