import { useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";

import { TicketsDatatable, type TicketsMetrics } from "./-tickets-datatable";
import {
  parseStatusList,
  serializeStatusList,
  writeStoredStatusFilter,
  type TicketStatusId,
  type TicketsSearch,
} from "./-tickets-search";

/**
 * Primary chips stay visible. Everything else lives under More so the row
 * stays short as filter kinds grow. Acknowledge remains exclusive with the
 * special-flag tabs; status items still multi-toggle the status CSV.
 */
const PRIMARY_TABS = [
  { id: "open", label: "Open", kind: "status" },
  { id: "unassigned", label: "Unassigned", kind: "unassigned" },
  { id: "in_progress", label: "In Progress", kind: "status" },
  { id: "pending_approval", label: "For Approval", kind: "status" },
] as const;

const MORE_TABS = [
  { id: "transferred", label: "Transferred", kind: "transferred" },
  { id: "resolved", label: "Resolved", kind: "status" },
  { id: "closed", label: "Closed", kind: "status" },
  { id: "awaiting_ack", label: "Acknowledge", kind: "awaiting_ack" },
] as const;

type Tab = (typeof PRIMARY_TABS)[number] | (typeof MORE_TABS)[number];

function tabCount(tab: Tab["id"], metrics: TicketsMetrics) {
  return metrics[tab] ?? 0;
}

type TicketsListViewProps = {
  search: TicketsSearch;
  /** Route id used for typed search navigation */
  from: "/" | "/tickets/";
  onMetricsChange?: (metrics: TicketsMetrics | null) => void;
};

export function TicketsListView({
  search,
  from,
  onMetricsChange,
}: TicketsListViewProps) {
  const navigate = useNavigate({ from });
  const [metrics, setMetrics] = useState<TicketsMetrics | null>(null);

  useEffect(() => {
    onMetricsChange?.(metrics);
  }, [metrics, onMetricsChange]);

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
      search: (prev) => {
        const nextSearch = {
          ...prev,
          status,
          page: 1,
        };
        delete nextSearch.awaiting_ack;
        return nextSearch;
      },
    });
  }

  function toggleTransferred() {
    const next = search.transferred === true ? undefined : true;
    void navigate({
      search: (prev) => {
        const nextSearch = { ...prev, transferred: next, page: 1 };
        if (!next) delete nextSearch.transferred;
        delete nextSearch.awaiting_ack;
        return nextSearch;
      },
    });
  }

  function toggleUnassigned() {
    const next = search.unassigned === true ? undefined : true;
    void navigate({
      search: (prev) => {
        const nextSearch = { ...prev, unassigned: next, page: 1 };
        if (!next) delete nextSearch.unassigned;
        delete nextSearch.awaiting_ack;
        return nextSearch;
      },
    });
  }

  function toggleAwaitingAck() {
    const next = search.awaiting_ack === true ? undefined : true;
    void navigate({
      search: (prev) => {
        const nextSearch = { ...prev, awaiting_ack: next, page: 1 };
        if (!next) {
          delete nextSearch.awaiting_ack;
        } else {
          delete nextSearch.transferred;
          delete nextSearch.unassigned;
        }
        return nextSearch;
      },
    });
  }

  function isTabActive(tab: Tab) {
    if (tab.kind === "awaiting_ack") {
      return search.awaiting_ack === true;
    }
    if (search.awaiting_ack === true) {
      return false;
    }
    if (tab.kind === "transferred") {
      return search.transferred === true;
    }
    if (tab.kind === "unassigned") {
      return search.unassigned === true;
    }
    return selectedStatuses.includes(tab.id as TicketStatusId);
  }

  function onTabClick(tab: Tab) {
    if (tab.kind === "awaiting_ack") {
      toggleAwaitingAck();
      return;
    }
    if (tab.kind === "transferred") {
      toggleTransferred();
      return;
    }
    if (tab.kind === "unassigned") {
      toggleUnassigned();
      return;
    }
    toggleStatus(tab.id as TicketStatusId);
  }

  const moreActiveCount = MORE_TABS.filter((tab) => isTabActive(tab)).length;

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

  function tabLabel(tab: Tab) {
    return `${tab.label}${metrics ? ` (${tabCount(tab.id, metrics)})` : ""}`;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2" data-tour="status-tabs">
        {PRIMARY_TABS.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            size="sm"
            variant={isTabActive(tab) ? "default" : "outline"}
            aria-pressed={isTabActive(tab)}
            onClick={() => onTabClick(tab)}
          >
            {tabLabel(tab)}
          </Button>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant={moreActiveCount > 0 ? "default" : "outline"}
              aria-label="More filters"
            >
              More
              {moreActiveCount > 0 ? ` · ${moreActiveCount}` : ""}
              <ChevronDown className="size-3.5 opacity-70" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>More filters</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {MORE_TABS.map((tab) => (
              <DropdownMenuCheckboxItem
                key={tab.id}
                checked={isTabActive(tab)}
                onCheckedChange={() => onTabClick(tab)}
                onSelect={(event) => event.preventDefault()}
              >
                {tabLabel(tab)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TicketsDatatable
        search={search}
        onSearchChange={onSearchChange}
        onMetricsChange={setMetrics}
      />
    </>
  );
}
