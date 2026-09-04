import {
  createTicketLink,
  deleteTicketLink,
  fetchTicketLinks,
  type TicketLink,
} from "@/lib/aduts-api";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "@repo/ui/exports";

export function TicketLinksCard({
  ticketNumber,
  canManage,
}: {
  ticketNumber: string;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState("");
  const [linkType, setLinkType] = useState<"related" | "duplicate" | "parent">(
    "related",
  );

  const linksQuery = useQuery({
    queryKey: ["aduts", "ticket", ticketNumber, "links"],
    queryFn: () => fetchTicketLinks(ticketNumber),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ["aduts", "ticket", ticketNumber, "links"],
    });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createTicketLink(ticketNumber, {
        target_ticket_number: target.trim(),
        link_type: linkType,
      }),
    onSuccess: () => {
      setTarget("");
      invalidate();
      toast.success("Ticket linked.");
    },
    onError: () => toast.error("Could not link ticket."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTicketLink(ticketNumber, id),
    onSuccess: () => {
      invalidate();
      toast.success("Link removed.");
    },
    onError: () => toast.error("Could not remove link."),
  });

  const links = linksQuery.data ?? [];

  function roleLabel(link: TicketLink) {
    if (link.role === "parent_of") return "Parent of";
    if (link.role === "child_of") return "Child of";
    if (link.link_type === "duplicate") return "Duplicate";
    return "Related";
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-lg">Linked tickets</CardTitle>
        <CardDescription>
          Related, duplicate, or parent/child on this board.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {linksQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : links.length === 0 ? (
          <p className="text-muted-foreground text-sm">No linked tickets.</p>
        ) : (
          <ul className="space-y-2">
            {links.map((link) => (
              <li
                key={link.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {roleLabel(link)}
                    </Badge>
                    <Link
                      to="/tickets/$ticketNumber"
                      params={{ ticketNumber: link.ticket.ticket_number }}
                      className="text-sm font-medium hover:underline"
                    >
                      {link.ticket.ticket_number}
                    </Link>
                  </div>
                  <p className="text-muted-foreground truncate text-xs">
                    {link.ticket.title}
                  </p>
                </div>
                {canManage ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(link.id)}
                  >
                    <X className="size-4" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canManage ? (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!target.trim()) return;
              createMutation.mutate();
            }}
          >
            <div className="min-w-[10rem] flex-1 space-y-1">
              <Label className="text-xs">Ticket number</Label>
              <Input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. ITC-123"
                className="shadow-xs h-8"
              />
            </div>
            <div className="w-[9rem] space-y-1">
              <Label className="text-xs">Type</Label>
              <Select
                value={linkType}
                onValueChange={(value) =>
                  setLinkType(value as "related" | "duplicate" | "parent")
                }
              >
                <SelectTrigger size="sm" className="shadow-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="related">Related</SelectItem>
                  <SelectItem value="duplicate">Duplicate</SelectItem>
                  <SelectItem value="parent">Parent of</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending || !target.trim()}
            >
              Link
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
