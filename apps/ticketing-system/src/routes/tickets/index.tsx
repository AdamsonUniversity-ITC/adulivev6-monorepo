import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchTickets } from "@/lib/aduts-api";
import { useState } from "react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";

export const Route = createFileRoute("/tickets/")({
  component: TicketsPage,
});

const TABS = ["open", "in_progress", "resolved", "closed"] as const;

function TicketsPage() {
  const [status, setStatus] = useState<(typeof TABS)[number] | "">("open");
  const [priority, setPriority] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [awaitingAck, setAwaitingAck] = useState(false);
  const [keyword, setKeyword] = useState("");

  const ticketsQuery = useQuery({
    queryKey: [
      "aduts",
      "tickets",
      status,
      priority,
      overdueOnly,
      awaitingAck,
      keyword,
    ],
    queryFn: () =>
      fetchTickets({
        status: status || undefined,
        priority: priority || undefined,
        overdue: overdueOnly || undefined,
        awaiting_ack: awaitingAck || undefined,
        keyword: keyword || undefined,
      }),
  });

  const metrics = ticketsQuery.data?.metrics;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Tickets</h2>
        <p className="text-muted-foreground text-sm">
          Unread: {metrics?.unread_replies ?? 0}
          {" · "}
          Overdue: {metrics?.overdue ?? 0}
          {" · "}
          Awaiting your ack: {metrics?.awaiting_ack ?? 0}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab}
            type="button"
            size="sm"
            variant={status === tab ? "default" : "outline"}
            onClick={() => setStatus(tab)}
          >
            {tab.replace("_", " ")}
            {metrics ? ` (${metrics[tab]})` : ""}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1 space-y-1">
          <Label htmlFor="ticket-search">Search</Label>
          <Input
            id="ticket-search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search ticket # or title"
          />
        </div>
        <div className="w-40 space-y-1">
          <Label>Priority</Label>
          <Select
            value={priority || "all"}
            onValueChange={(value) => setPriority(value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {["low", "medium", "high", "urgent"].map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Checkbox
            id="overdue-only"
            checked={overdueOnly}
            onCheckedChange={(checked) => setOverdueOnly(checked === true)}
          />
          <Label htmlFor="overdue-only">Overdue only</Label>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Checkbox
            id="awaiting-ack"
            checked={awaitingAck}
            onCheckedChange={(checked) => setAwaitingAck(checked === true)}
          />
          <Label htmlFor="awaiting-ack">Awaiting my ack</Label>
        </div>
      </div>

      {ticketsQuery.isLoading && (
        <p className="text-muted-foreground">Loading tickets…</p>
      )}
      {ticketsQuery.isError && (
        <p className="text-destructive">Failed to load tickets.</p>
      )}

      <Card>
        <CardContent className="divide-border divide-y p-0">
          {(ticketsQuery.data?.data ?? []).map((ticket) => (
            <div key={ticket.id} className="px-4 py-3">
              <Link
                to="/tickets/$ticketNumber"
                params={{ ticketNumber: ticket.ticket_number }}
                className="font-medium hover:underline"
              >
                {ticket.ticket_number} — {ticket.title}
              </Link>
              <div className="text-muted-foreground mt-1 flex flex-wrap gap-2 text-xs">
                <span>{ticket.board_slug}</span>
                <Badge variant="secondary">{ticket.status}</Badge>
                <Badge variant="outline">{ticket.priority}</Badge>
                {ticket.is_overdue ? (
                  <Badge variant="destructive">OVERDUE</Badge>
                ) : null}
                {ticket.category_name ? (
                  <span>{ticket.category_name}</span>
                ) : null}
                <span>unread {ticket.unread_count ?? 0}</span>
              </div>
            </div>
          ))}
          {(ticketsQuery.data?.data?.length ?? 0) === 0 &&
            !ticketsQuery.isLoading && (
              <p className="text-muted-foreground px-4 py-6 text-sm">
                No tickets match these filters.
              </p>
            )}
        </CardContent>
      </Card>
    </section>
  );
}
