import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createTicket, fetchCurrentBoard } from "@/lib/aduts-api";
import { type FormEvent, useState } from "react";
import { isPlatformHost } from "@/lib/adutsHost";
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

export const Route = createFileRoute("/tickets/new")({
  component: NewTicketPage,
});

function NewTicketPage() {
  const navigate = useNavigate();
  const platform = isPlatformHost();
  const boardQuery = useQuery({
    queryKey: ["aduts", "board"],
    queryFn: fetchCurrentBoard,
    enabled: !platform,
  });

  const [section, setSection] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (ticket) => {
      void navigate({
        to: "/tickets/$ticketNumber",
        params: { ticketNumber: ticket.ticket_number },
      });
    },
    onError: () => setError("Could not create ticket."),
  });

  if (platform) {
    return (
      <p className="text-muted-foreground">
        Open a board subdomain to file a ticket (for example
        itc-ts.localhost.test).
      </p>
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    mutation.mutate({
      section: Number(section),
      title,
      description,
      priority,
      category_id: categoryId ? Number(categoryId) : undefined,
    });
  }

  return (
    <section className="mx-auto max-w-xl space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">New ticket</h2>
        {boardQuery.data?.kb_url ? (
          <Button variant="link" className="h-auto px-0" asChild>
            <a href={boardQuery.data.kb_url} target="_blank" rel="noreferrer">
              Check the knowledge base before filing
            </a>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request details</CardTitle>
          <CardDescription>
            Filed on {boardQuery.data?.board_name ?? "this board"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={section || undefined} onValueChange={setSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {(boardQuery.data?.sections ?? []).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.section_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(boardQuery.data?.categories?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={categoryId || "none"}
                  onValueChange={(value) =>
                    setCategoryId(value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Optional</SelectItem>
                    {(boardQuery.data?.categories ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "urgent"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-title">Title</Label>
              <Input
                id="ticket-title"
                required
                maxLength={50}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-description">Description</Label>
              <Textarea
                id="ticket-description"
                required
                maxLength={999}
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {error ? <p className="text-destructive text-sm">{error}</p> : null}

            <Button type="submit" disabled={mutation.isPending || !section}>
              {mutation.isPending ? "Submitting…" : "Submit ticket"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
