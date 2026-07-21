import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeTicketStatus,
  fetchTicket,
  sendTicketMessage,
  submitCsat,
} from "@/lib/aduts-api";
import { type FormEvent, useState } from "react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";

export const Route = createFileRoute("/tickets/$ticketNumber")({
  component: TicketDetailPage,
});

function TicketDetailPage() {
  const { ticketNumber } = Route.useParams();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [csatScore, setCsatScore] = useState("5");
  const [csatComment, setCsatComment] = useState("");

  const ticketQuery = useQuery({
    queryKey: ["aduts", "ticket", ticketNumber],
    queryFn: () => fetchTicket(ticketNumber),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ["aduts", "ticket", ticketNumber],
    });
  };

  const statusMutation = useMutation({
    mutationFn: (status: string) => changeTicketStatus(ticketNumber, status),
    onSuccess: invalidate,
  });

  const messageMutation = useMutation({
    mutationFn: () => sendTicketMessage(ticketNumber, message, "msg"),
    onSuccess: () => {
      setMessage("");
      invalidate();
    },
  });

  const csatMutation = useMutation({
    mutationFn: () =>
      submitCsat(ticketNumber, Number(csatScore), csatComment || undefined),
    onSuccess: invalidate,
  });

  const ticket = ticketQuery.data;

  if (ticketQuery.isLoading) {
    return <p className="text-muted-foreground">Loading ticket…</p>;
  }

  if (!ticket) {
    return (
      <p className="text-destructive">Ticket not found or access denied.</p>
    );
  }

  function onSend(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    messageMutation.mutate();
  }

  const statusActions: Array<{ status: string; label: string; show: boolean }> =
    [
      {
        status: "in_progress",
        label: "Start work",
        show: !!ticket.access?.is_staff && ticket.status === "open",
      },
      {
        status: "resolved",
        label: "Mark resolved",
        show:
          !!ticket.access?.can_resolve ||
          (!!ticket.access?.is_staff && ticket.status === "in_progress"),
      },
      {
        status: "closed",
        label: "Acknowledge & close",
        show: !!ticket.access?.can_close,
      },
      {
        status: "open",
        label: "Reopen",
        show:
          !!ticket.access?.can_change_status &&
          ["resolved", "closed"].includes(ticket.status),
      },
    ];

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {ticket.ticket_number}
          </p>
          <CardTitle>{ticket.title}</CardTitle>
          <CardDescription className="whitespace-pre-wrap text-foreground">
            {ticket.description}
          </CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary">{ticket.status}</Badge>
            <Badge variant="outline">{ticket.priority}</Badge>
            {ticket.category?.name ? (
              <Badge variant="outline">{ticket.category.name}</Badge>
            ) : null}
            {ticket.section_name ? (
              <Badge variant="outline">{ticket.section_name}</Badge>
            ) : null}
            {ticket.is_overdue ? (
              <Badge variant="destructive">Overdue</Badge>
            ) : null}
            {ticket.due_at ? (
              <Badge variant="outline">
                Due {new Date(ticket.due_at).toLocaleString()}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {statusActions
            .filter((a) => a.show)
            .map((action) => (
              <Button
                key={action.status}
                type="button"
                variant="outline"
                size="sm"
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate(action.status)}
              >
                {action.label}
              </Button>
            ))}
        </CardContent>
      </Card>

      {ticket.status === "closed" &&
        ticket.access?.is_requester &&
        !ticket.csat_score && (
          <Card>
            <CardHeader>
              <CardTitle>How was this resolved?</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  csatMutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label>Score</Label>
                  <Select value={csatScore} onValueChange={setCsatScore}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["5", "4", "3", "2", "1"].map((n) => (
                        <SelectItem key={n} value={n}>
                          {n} / 5
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="csat-comment">Comment</Label>
                  <Textarea
                    id="csat-comment"
                    rows={2}
                    value={csatComment}
                    onChange={(e) => setCsatComment(e.target.value)}
                    placeholder="Optional comment"
                  />
                </div>
                <Button type="submit" disabled={csatMutation.isPending}>
                  Submit feedback
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {(ticket.messages ?? []).map((msg) => (
              <li key={msg.id} className="text-sm">
                <span className="font-medium">User {msg.user_id}</span>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {msg.body}
                </p>
              </li>
            ))}
            {(ticket.messages?.length ?? 0) === 0 && (
              <li className="text-muted-foreground text-sm">
                No messages yet.
              </li>
            )}
          </ul>

          <form onSubmit={onSend} className="space-y-2">
            <Label htmlFor="reply">Reply</Label>
            <Textarea
              id="reply"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a reply…"
            />
            <Button type="submit" disabled={messageMutation.isPending}>
              Send reply
            </Button>
          </form>
        </CardContent>
      </Card>

      {(ticket.timeline?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-muted-foreground space-y-1 text-sm">
              {ticket.timeline?.map((item, idx) => (
                <li key={`${item.action}-${idx}`}>
                  {item.action}
                  {item.detail ? ` — ${item.detail}` : ""}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
