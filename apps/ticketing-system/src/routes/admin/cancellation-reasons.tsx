import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import { AccessDeniedState } from "@/components/access-denied-state";
import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";
import { requireSuperAdmin } from "@/lib/admin-guards";
import {
  createCancellationReason,
  deleteCancellationReason,
  fetchCancellationReasons,
  updateCancellationReason,
  type CancellationReason,
} from "@/lib/aduts-api";
import { getAxiosMessage, getAxiosStatus } from "@/lib/axios-status";
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
import { toast } from "@repo/ui/exports";

const QUERY_KEY = ["aduts", "admin", "cancellation-reasons"];

export const Route = createFileRoute("/admin/cancellation-reasons")({
  beforeLoad: async ({ context }) => {
    await requireSuperAdmin(context.queryClient);
  },
  component: AdminCancellationReasonsPage,
});

function AdminCancellationReasonsPage() {
  const queryClient = useQueryClient();
  const reasonsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchCancellationReasons,
  });
  const [label, setLabel] = useState("");
  const [editing, setEditing] = useState<CancellationReason | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    // The cancel dialog reads the active list off the board response.
    void queryClient.invalidateQueries({ queryKey: ["aduts", "board"] });
  };

  const createMutation = useMutation({
    mutationFn: () => createCancellationReason({ label: label.trim() }),
    onSuccess: () => {
      setLabel("");
      invalidate();
      toast.success("Reason added.");
    },
    onError: (error) =>
      toast.error(getAxiosMessage(error, "Could not add reason.")),
  });

  const updateMutation = useMutation({
    mutationFn: (reason: CancellationReason) =>
      updateCancellationReason(reason.id, { label: reason.label.trim() }),
    onSuccess: () => {
      setEditing(null);
      invalidate();
      toast.success("Reason updated.");
    },
    onError: (error) =>
      toast.error(getAxiosMessage(error, "Could not update reason.")),
  });

  const toggleMutation = useMutation({
    mutationFn: (reason: CancellationReason) =>
      updateCancellationReason(reason.id, {
        is_active: reason.is_active === false,
      }),
    onSuccess: invalidate,
    onError: (error) =>
      toast.error(getAxiosMessage(error, "Could not update reason status.")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCancellationReason,
    onSuccess: () => {
      invalidate();
      toast.success("Reason deleted.");
    },
    onError: (error) =>
      toast.error(getAxiosMessage(error, "Could not delete reason.")),
  });

  if (reasonsQuery.isLoading) {
    return <LoadingState label="Loading cancellation reasons…" />;
  }

  if (reasonsQuery.isError) {
    if (getAxiosStatus(reasonsQuery.error) === 403) {
      return (
        <AccessDeniedState description="You do not have access to manage cancellation reasons." />
      );
    }
    return (
      <AccessDeniedState description="Could not load cancellation reasons." />
    );
  }

  const reasons = reasonsQuery.data ?? [];

  function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!label.trim()) return;
    createMutation.mutate();
  }

  return (
    <PageShell
      title="Cancellation Reasons"
      bordered={false}
      description="Shared by every board. Staff pick one of these when they cancel a ticket."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>New reason</CardTitle>
            <CardDescription>
              Keep these short: they appear in a dropdown at the moment of
              cancelling.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="reason-label">Label</Label>
                <Input
                  id="reason-label"
                  required
                  maxLength={191}
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  className="shadow-xs"
                />
              </div>
              <Button
                type="submit"
                disabled={createMutation.isPending || !label.trim()}
              >
                {createMutation.isPending ? "Saving…" : "Add reason"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Reasons</CardTitle>
            <CardDescription>
              {reasons.length} reason{reasons.length === 1 ? "" : "s"}{" "}
              configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reasons.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No reasons yet. Staff cannot cancel a ticket until at least one
                is active.
              </p>
            ) : (
              reasons.map((reason) =>
                editing?.id === reason.id ? (
                  <div
                    key={reason.id}
                    className="bg-muted/20 space-y-3 rounded-lg border p-3"
                  >
                    <Input
                      value={editing.label}
                      maxLength={191}
                      onChange={(event) =>
                        setEditing({ ...editing, label: event.target.value })
                      }
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={
                          updateMutation.isPending || !editing.label.trim()
                        }
                        onClick={() => updateMutation.mutate(editing)}
                      >
                        Save
                      </Button>
                      <Button
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
                    key={reason.id}
                    className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="font-medium">{reason.label}</p>
                      <Badge
                        variant={
                          reason.is_active === false ? "outline" : "secondary"
                        }
                      >
                        {reason.is_active === false ? "Inactive" : "Active"}
                      </Badge>
                      {reason.in_use ? (
                        <span className="text-muted-foreground text-xs">
                          In use
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(reason)}
                      >
                        Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={toggleMutation.isPending}
                        onClick={() => toggleMutation.mutate(reason)}
                      >
                        {reason.is_active === false ? "Activate" : "Deactivate"}
                      </Button>
                      {/* Deleting a reason in use would erase why those tickets closed. */}
                      {reason.in_use ? null : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (
                              window.confirm(`Delete reason “${reason.label}”?`)
                            ) {
                              deleteMutation.mutate(reason.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      )}
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
