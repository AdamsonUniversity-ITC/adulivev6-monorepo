import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { PageShell } from "@/components/page-shell";
import {
  createSavedView,
  deleteSavedView,
  fetchSavedViews,
  updateSavedView,
  type SavedView,
} from "@/lib/aduts-api";
import { isPlatformHost } from "@/lib/adutsHost";
import { Button } from "@repo/ui/components/button";
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

import { TicketsDatatable, type TicketsMetrics } from "./-tickets-datatable";

export type TicketsSearch = {
  status?: string;
  keyword?: string;
  priority?: string;
  section_id?: number;
  assigned_to?: number;
  category_id?: number;
  page?: number;
  rows?: number;
};

function parsePositiveInt(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.floor(n);
}

function parseTicketsSearch(search: Record<string, unknown>): TicketsSearch {
  const status =
    typeof search.status === "string" && search.status.trim()
      ? search.status
      : "pending";
  const keyword =
    typeof search.keyword === "string" && search.keyword.trim()
      ? search.keyword
      : undefined;
  const priority =
    typeof search.priority === "string" && search.priority.trim()
      ? search.priority
      : undefined;

  return {
    status,
    keyword,
    priority,
    section_id: parsePositiveInt(search.section_id),
    assigned_to: parsePositiveInt(search.assigned_to),
    category_id: parsePositiveInt(search.category_id),
    page: parsePositiveInt(search.page) ?? 1,
    rows: parsePositiveInt(search.rows) ?? 15,
  };
}

export function ticketsSearchToFilters(
  search: TicketsSearch,
): Record<string, string | number | boolean> {
  const filters: Record<string, string | number | boolean> = {};
  if (search.status) filters.status = search.status;
  if (search.keyword) filters.keyword = search.keyword;
  if (search.priority) filters.priority = search.priority;
  if (search.section_id) filters.section_id = search.section_id;
  if (search.assigned_to) filters.assigned_to = search.assigned_to;
  if (search.category_id) filters.category_id = search.category_id;
  if (search.page && search.page > 1) filters.page = search.page;
  if (search.rows && search.rows !== 15) filters.rows = search.rows;
  return filters;
}

export function filtersToTicketsSearch(
  filters: Record<string, string | number | boolean>,
): TicketsSearch {
  return parseTicketsSearch(filters as Record<string, unknown>);
}

function hasExplicitFilters(search: TicketsSearch): boolean {
  return Boolean(
    (search.status && search.status !== "pending") ||
    search.keyword ||
    search.priority ||
    search.section_id ||
    search.assigned_to ||
    search.category_id ||
    (search.page && search.page > 1) ||
    (search.rows && search.rows !== 15),
  );
}

export const Route = createFileRoute("/tickets/")({
  validateSearch: (search: Record<string, unknown>): TicketsSearch =>
    parseTicketsSearch(search),
  component: TicketsPage,
});

const TABS = [
  { id: "pending", label: "Pending" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Cancelled" },
] as const;

function tabCount(tab: (typeof TABS)[number]["id"], metrics: TicketsMetrics) {
  if (tab === "pending") {
    return (metrics.open ?? 0) + (metrics.in_progress ?? 0);
  }
  return metrics[tab] ?? 0;
}

function TicketsPage() {
  const navigate = useNavigate({ from: "/tickets/" });
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const platform = isPlatformHost();
  const [metrics, setMetrics] = useState<TicketsMetrics | null>(null);
  const [saveName, setSaveName] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [defaultApplied, setDefaultApplied] = useState(false);

  const status = (search.status ?? "pending") as (typeof TABS)[number]["id"];

  const viewsQuery = useQuery({
    queryKey: ["aduts", "saved-views"],
    queryFn: fetchSavedViews,
    enabled: !platform,
  });

  useEffect(() => {
    if (platform || defaultApplied || viewsQuery.isLoading) return;
    if (hasExplicitFilters(search)) {
      setDefaultApplied(true);
      return;
    }
    const defaultView = (viewsQuery.data ?? []).find((v) => v.is_default);
    if (defaultView) {
      void navigate({
        search: filtersToTicketsSearch(defaultView.filters),
        replace: true,
      });
    }
    setDefaultApplied(true);
  }, [
    platform,
    defaultApplied,
    viewsQuery.isLoading,
    viewsQuery.data,
    search,
    navigate,
  ]);

  const createViewMutation = useMutation({
    mutationFn: () =>
      createSavedView({
        name: saveName.trim(),
        filters: ticketsSearchToFilters(search),
        is_default: saveAsDefault,
      }),
    onSuccess: () => {
      setSaveName("");
      setSaveAsDefault(false);
      void queryClient.invalidateQueries({
        queryKey: ["aduts", "saved-views"],
      });
      toast.success("View saved.");
    },
    onError: () => toast.error("Could not save view."),
  });

  const updateViewMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<SavedView>;
    }) => updateSavedView(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["aduts", "saved-views"],
      });
      toast.success("View updated.");
    },
    onError: () => toast.error("Could not update view."),
  });

  const deleteViewMutation = useMutation({
    mutationFn: (id: number) => deleteSavedView(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["aduts", "saved-views"],
      });
      toast.success("View deleted.");
    },
    onError: () => toast.error("Could not delete view."),
  });

  const views = useMemo(() => viewsQuery.data ?? [], [viewsQuery.data]);

  function setStatus(next: string) {
    void navigate({
      search: (prev) => ({
        ...prev,
        status: next,
        page: 1,
      }),
    });
  }

  function applyView(view: SavedView) {
    void navigate({
      search: filtersToTicketsSearch(view.filters),
    });
  }

  function onSearchChange(patch: Partial<TicketsSearch>) {
    void navigate({
      search: (prev) => {
        const next: TicketsSearch = { ...prev, ...patch };
        if ("keyword" in patch && !patch.keyword) delete next.keyword;
        if ("priority" in patch && !patch.priority) delete next.priority;
        if ("section_id" in patch && !patch.section_id) delete next.section_id;
        if ("assigned_to" in patch && !patch.assigned_to)
          delete next.assigned_to;
        if ("category_id" in patch && !patch.category_id)
          delete next.category_id;
        return next;
      },
    });
  }

  return (
    <PageShell title="Tickets" bordered={false}>
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            size="sm"
            variant={status === tab.id ? "default" : "outline"}
            onClick={() => setStatus(tab.id)}
          >
            {tab.label}
            {metrics ? ` (${tabCount(tab.id, metrics)})` : ""}
          </Button>
        ))}
      </div>

      {!platform ? (
        <div className="bg-muted/20 flex flex-wrap items-end gap-3 rounded-lg border p-3">
          <div className="min-w-[10rem] space-y-1">
            <Label className="text-xs">Saved views</Label>
            <Select
              onValueChange={(value) => {
                const view = views.find((v) => String(v.id) === value);
                if (view) applyView(view);
              }}
            >
              <SelectTrigger size="sm" className="min-w-[12rem]">
                <SelectValue placeholder="Apply a view…" />
              </SelectTrigger>
              <SelectContent>
                {views.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No saved views
                  </SelectItem>
                ) : (
                  views.map((view) => (
                    <SelectItem key={view.id} value={String(view.id)}>
                      {view.name}
                      {view.is_default ? " (default)" : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[10rem] flex-1 space-y-1">
            <Label htmlFor="save-view-name" className="text-xs">
              Save current filters
            </Label>
            <Input
              id="save-view-name"
              size={undefined}
              placeholder="View name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="h-8 shadow-xs"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={saveAsDefault}
              onChange={(e) => setSaveAsDefault(e.target.checked)}
            />
            Default
          </label>

          <Button
            type="button"
            size="sm"
            disabled={!saveName.trim() || createViewMutation.isPending}
            onClick={() => createViewMutation.mutate()}
          >
            Save view
          </Button>

          {views.map((view) => (
            <div key={`actions-${view.id}`} className="flex gap-1">
              {!view.is_default ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={updateViewMutation.isPending}
                  onClick={() =>
                    updateViewMutation.mutate({
                      id: view.id,
                      payload: { is_default: true },
                    })
                  }
                >
                  Set “{view.name}” default
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive"
                disabled={deleteViewMutation.isPending}
                onClick={() => {
                  if (window.confirm(`Delete view “${view.name}”?`)) {
                    deleteViewMutation.mutate(view.id);
                  }
                }}
              >
                Delete “{view.name}”
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <TicketsDatatable
        search={search}
        onSearchChange={onSearchChange}
        onMetricsChange={setMetrics}
      />
    </PageShell>
  );
}
