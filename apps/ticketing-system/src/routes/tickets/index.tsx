import { createFileRoute, redirect } from "@tanstack/react-router";

import { PageShell } from "@/components/page-shell";
import { isPlatformHost } from "@/lib/adutsHost";

import { TicketsListView } from "./-tickets-list-view";
import {
  parseTicketsSearch,
  type TicketsSearch,
} from "./-tickets-search";

export type { TicketsSearch } from "./-tickets-search";

export const Route = createFileRoute("/tickets/")({
  validateSearch: (search: Record<string, unknown>): TicketsSearch =>
    parseTicketsSearch(search),
  beforeLoad: ({ search }) => {
    // Board hosts use Home for the datatable; keep /tickets for platform.
    if (!isPlatformHost()) {
      throw redirect({
        to: "/",
        search,
      });
    }
  },
  component: TicketsPage,
});

function TicketsPage() {
  const search = Route.useSearch();

  return (
    <PageShell title="Tickets" bordered={false} width="wide">
      <TicketsListView search={search} from="/tickets/" />
    </PageShell>
  );
}
