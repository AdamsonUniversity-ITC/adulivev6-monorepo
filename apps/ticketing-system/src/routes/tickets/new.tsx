import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type FormEvent, useMemo, useState } from "react";
import type { PreuploadedFile } from "@repo/ui/components/file-dropzone";

import { PageShell } from "@/components/page-shell";
import { TicketAttachmentDropzone } from "@/components/ticket-attachment-dropzone";
import { createTicket, fetchCurrentBoard } from "@/lib/aduts-api";
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
  const [uploads, setUploads] = useState<PreuploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = useMemo(() => {
    if (!section) return [];
    const sectionId = Number(section);
    return (boardQuery.data?.categories ?? [])
      .filter((category) => {
        if (category.is_active === false) return false;
        const categorySectionId = Number(category.section_id);
        return (
          Number.isFinite(categorySectionId) && categorySectionId === sectionId
        );
      })
      .sort((a, b) => {
        const order = (a.sort_order ?? 0) - (b.sort_order ?? 0);
        if (order !== 0) return order;
        return a.name.localeCompare(b.name);
      });
  }, [boardQuery.data?.categories, section]);

  const categoryRequired = categoryOptions.length > 0;

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
      <p className="text-muted-foreground text-sm">
        Open a board subdomain to file a ticket (for example
        itc-ts.localhost.test).
      </p>
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (uploading) return;
    if (categoryRequired && !categoryId) {
      setError("Select a category for this section.");
      return;
    }
    setError(null);
    mutation.mutate({
      section: Number(section),
      title,
      description,
      category_id: categoryId ? Number(categoryId) : undefined,
      temp_upload_ids: uploads.map((u) => u.id),
    });
  }

  return (
    <PageShell
      width="narrow"
      title="New Ticket"
      bordered={false}
      description={
        boardQuery.data?.kb_url ? (
          <Button variant="link" className="h-auto px-0" asChild>
            <a href={boardQuery.data.kb_url} target="_blank" rel="noreferrer">
              Check the knowledge base before filing
            </a>
          </Button>
        ) : undefined
      }
    >
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            Filed on {boardQuery.data?.board_name ?? "this board"}. Priority is
            set by support staff.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Section</Label>
              <Select
                value={section || undefined}
                onValueChange={(value) => {
                  setSection(value);
                  setCategoryId("");
                }}
              >
                <SelectTrigger className="shadow-xs">
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

            <div className="space-y-2">
              <Label htmlFor="ticket-category">
                Category
                {categoryRequired ? (
                  <span className="text-destructive"> *</span>
                ) : null}
              </Label>
              <Select
                value={categoryId || undefined}
                onValueChange={setCategoryId}
                disabled={!section || !categoryRequired}
                required={categoryRequired}
              >
                <SelectTrigger id="ticket-category" className="shadow-xs">
                  <SelectValue
                    placeholder={
                      !section
                        ? "Select a section first"
                        : categoryRequired
                          ? "Select category"
                          : "No categories for this section"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {section && !categoryRequired ? (
                <p className="text-muted-foreground text-xs">
                  No active categories are configured for this section.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-title">Title</Label>
              <Input
                id="ticket-title"
                required
                maxLength={50}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="shadow-xs"
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
                className="shadow-xs resize-y"
              />
            </div>

            <TicketAttachmentDropzone
              value={uploads}
              onChange={setUploads}
              onUploadingChange={setUploading}
              disabled={mutation.isPending}
            />

            {error ? <p className="text-destructive text-sm">{error}</p> : null}

            <Button
              type="submit"
              disabled={
                mutation.isPending ||
                !section ||
                uploading ||
                (categoryRequired && !categoryId)
              }
              className="shadow-xs"
            >
              {mutation.isPending
                ? "Submitting…"
                : uploading
                  ? "Uploading files…"
                  : "Submit ticket"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
