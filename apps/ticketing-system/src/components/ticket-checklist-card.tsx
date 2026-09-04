import {
  createChecklistItem,
  deleteChecklistItem,
  fetchTicketChecklist,
  updateChecklistItem,
  type ChecklistItem,
} from "@/lib/aduts-api";
import { useState } from "react";
import { X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { toast } from "@repo/ui/exports";

export function TicketChecklistCard({
  ticketNumber,
}: {
  ticketNumber: string;
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const checklistQuery = useQuery({
    queryKey: ["aduts", "ticket", ticketNumber, "checklist"],
    queryFn: () => fetchTicketChecklist(ticketNumber),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ["aduts", "ticket", ticketNumber, "checklist"],
    });
  };

  const createMutation = useMutation({
    mutationFn: () => createChecklistItem(ticketNumber, body.trim()),
    onSuccess: () => {
      setBody("");
      invalidate();
    },
    onError: () => toast.error("Could not add checklist item."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_done }: { id: number; is_done: boolean }) =>
      updateChecklistItem(ticketNumber, id, { is_done }),
    onSuccess: invalidate,
    onError: () => toast.error("Could not update checklist item."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteChecklistItem(ticketNumber, id),
    onSuccess: invalidate,
    onError: () => toast.error("Could not delete checklist item."),
  });

  const items = checklistQuery.data ?? [];
  const doneCount = items.filter((item) => item.is_done).length;

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-lg">Checklist</CardTitle>
        <CardDescription>
          Staff only
          {items.length > 0 ? ` · ${doneCount}/${items.length} done` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {checklistQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No checklist items yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item: ChecklistItem) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-lg border px-3 py-2"
              >
                <Checkbox
                  checked={item.is_done}
                  disabled={toggleMutation.isPending}
                  onCheckedChange={(checked) =>
                    toggleMutation.mutate({
                      id: item.id,
                      is_done: checked === true,
                    })
                  }
                  className="mt-0.5"
                  aria-label={item.is_done ? "Mark incomplete" : "Mark done"}
                />
                <p
                  className={[
                    "min-w-0 flex-1 text-sm",
                    item.is_done ? "text-muted-foreground line-through" : "",
                  ].join(" ")}
                >
                  {item.body}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(item.id)}
                  aria-label="Delete checklist item"
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!body.trim()) return;
            createMutation.mutate();
          }}
        >
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a checklist item…"
            className="shadow-xs min-w-[12rem] flex-1"
            maxLength={500}
          />
          <Button
            type="submit"
            size="sm"
            disabled={createMutation.isPending || !body.trim()}
          >
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
