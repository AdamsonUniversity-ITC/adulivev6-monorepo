import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { searchAduts } from "@/lib/aduts-api";
import { isPlatformHost } from "@/lib/adutsHost";
import { formatStatus } from "@/lib/format-labels";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const platform = isPlatformHost();
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 200);

  const searchQuery = useQuery({
    queryKey: ["aduts", "search", debounced],
    queryFn: () => searchAduts(debounced),
    enabled: open && debounced.trim().length >= 2,
  });

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const tickets = searchQuery.data?.tickets ?? [];
  const people = searchQuery.data?.people ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickets…"
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-[22rem] overflow-y-auto p-2">
          {debounced.trim().length < 2 ? (
            <p className="text-muted-foreground px-2 py-6 text-center text-sm">
              Type at least 2 characters.
            </p>
          ) : searchQuery.isLoading ? (
            <p className="text-muted-foreground px-2 py-6 text-center text-sm">
              Searching…
            </p>
          ) : tickets.length === 0 && people.length === 0 ? (
            <p className="text-muted-foreground px-2 py-6 text-center text-sm">
              No results.
            </p>
          ) : (
            <div className="space-y-3">
              {tickets.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground px-2 text-[10px] font-semibold tracking-wide uppercase">
                    Tickets
                  </p>
                  {tickets.map((hit) => (
                    <button
                      key={hit.ticket_number}
                      type="button"
                      className="hover:bg-muted/60 flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-2 text-left text-sm"
                      onClick={() => {
                        onOpenChange(false);
                        void navigate({
                          to: "/tickets/$ticketNumber",
                          params: { ticketNumber: hit.ticket_number },
                        });
                      }}
                    >
                      <span className="font-medium">{hit.title}</span>
                      <span className="text-muted-foreground text-xs">
                        {hit.ticket_number}
                        {hit.board_name ? ` · ${hit.board_name}` : ""}
                        {" · "}
                        {formatStatus(hit.status)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              {people.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground px-2 text-[10px] font-semibold tracking-wide uppercase">
                    People
                  </p>
                  {people.map((hit) => (
                    <button
                      key={hit.user_id}
                      type="button"
                      className="hover:bg-muted/60 flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-2 text-left text-sm"
                      onClick={() => {
                        onOpenChange(false);
                        if (platform) {
                          void navigate({ to: "/tickets" });
                          return;
                        }
                        void navigate({
                          to: "/tickets",
                          search: {
                            status: "pending",
                            assigned_to: hit.user_id,
                            page: 1,
                          },
                        });
                      }}
                    >
                      <span className="font-medium">
                        {hit.name ?? `User #${hit.user_id}`}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Filter tickets assigned to this person
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
        <div className="text-muted-foreground border-t px-3 py-2 text-[10px]">
          Cmd/Ctrl+K to open · Esc to close
        </div>
      </DialogContent>
    </Dialog>
  );
}
