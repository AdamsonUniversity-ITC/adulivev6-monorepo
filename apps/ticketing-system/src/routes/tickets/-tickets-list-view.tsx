import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Button } from "@repo/ui/components/button";

import { TicketsDatatable, type TicketsMetrics } from "./-tickets-datatable";
import {
  parseStatusList,
  serializeStatusList,
  writeStoredStatusFilter,
  type TicketStatusId,
  type TicketsSearch,
} from "./-tickets-search";

/**
 * Every tab but Transferred toggles a value in the `status` filter. Transferred
 * is not a status, so it toggles its own param and is AND-ed with the status
 * filter: under the default Open + In Progress it reads as "what was handed to
 * me and not yet picked up".
 */
const TABS = [
  { id: "open", label: "Open", kind: "status" },
  { id: "in_progress", label: "In Progress", kind: "status" },
  { id: "pending_approval", label: "For Approval", kind: "status" },
  { id: "transferred", label: "Transferred", kind: "transferred" },
  { id: "resolved", label: "Resolved", kind: "status" },
  { id: "closed", label: "Closed", kind: "status" },
] as const;

type Tab = (typeof TABS)[number];

function tabCount(tab: Tab["id"], metrics: TicketsMetrics) {
  return metrics[tab] ?? 0;
}

type TicketsListViewProps = {
  search: TicketsSearch;
  /** Route id used for typed search navigation */
  from: "/" | "/tickets/";
};

export function TicketsListView({ search, from }: TicketsListViewProps) {
  const navigate = useNavigate({ from });
  const [metrics, setMetrics] = useState<TicketsMetrics | null>(null);

  // parseTicketsSearch already falls back to the stored filter, so by the time
  // this renders the selection is resolved.
  const selectedStatuses = useMemo(
    () => parseStatusList(search.status),
    [search.status],
  );

  function toggleStatus(id: TicketStatusId) {
    const next = selectedStatuses.includes(id)
      ? selectedStatuses.filter((s) => s !== id)
      : [...selectedStatuses, id];
    const status = serializeStatusList(next);
    writeStoredStatusFilter(status);
    void navigate({
      search: (prev) => ({
        ...prev,
        status,
        page: 1,
      }),
    });
  }

  function toggleTransferred() {
    const next = search.transferred === true ? undefined : true;
    void navigate({
      search: (prev) => {
        const nextSearch = { ...prev, transferred: next, page: 1 };
        if (!next) delete nextSearch.transferred;
        return nextSearch;
      },
    });
  }

  function isTabActive(tab: Tab) {
    return tab.kind === "transferred"
      ? search.transferred === true
      : selectedStatuses.includes(tab.id as TicketStatusId);
  }

  function onTabClick(tab: Tab) {
    if (tab.kind === "transferred") {
      toggleTransferred();
      return;
    }
    toggleStatus(tab.id as TicketStatusId);
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
    <>
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            size="sm"
            variant={isTabActive(tab) ? "default" : "outline"}
            aria-pressed={isTabActive(tab)}
            onClick={() => onTabClick(tab)}
          >
            {tab.label}
            {metrics ? ` (${tabCount(tab.id, metrics)})` : ""}
          </Button>
        ))}
      </div>

      <TicketsDatatable
        search={search}
        onSearchChange={onSearchChange}
        onMetricsChange={setMetrics}
      />
    </>
  );
}
