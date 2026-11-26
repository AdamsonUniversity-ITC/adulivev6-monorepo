import type { ReactNode } from "react";

import { Input } from "@repo/ui/components/input";

type SearchableScrollListProps = {
  query: string;
  onQueryChange: (value: string) => void;
  /** Items before filtering. */
  total: number;
  /** Items after filtering. */
  shown: number;
  placeholder?: string;
  ariaLabel?: string;
  /** Tailwind max-height class for the scroll area. */
  maxHeightClassName?: string;
  /** Extra classes for the scroll container (e.g. border and rounding). */
  scrollClassName?: string;
  /** Shown when a non-empty query matches nothing. */
  emptyLabel?: string;
  /** The search box stays hidden for lists shorter than this. */
  minItemsForSearch?: number;
  children: ReactNode;
};

export function SearchableScrollList({
  query,
  onQueryChange,
  total,
  shown,
  placeholder = "Search…",
  ariaLabel,
  maxHeightClassName = "max-h-96",
  scrollClassName = "",
  emptyLabel = "No matches.",
  minItemsForSearch = 6,
  children,
}: SearchableScrollListProps) {
  // Keep the box visible while a query is active so it can be cleared.
  const showSearch = total >= minItemsForSearch || query.trim() !== "";
  const noMatches = query.trim() !== "" && shown === 0;

  return (
    <div className="space-y-2">
      {showSearch ? (
        <div className="flex items-center gap-3">
          <Input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            aria-label={ariaLabel ?? placeholder}
            className="h-9 max-w-sm shadow-xs"
          />
          {query.trim() !== "" ? (
            <span className="text-muted-foreground shrink-0 text-xs">
              Showing {shown} of {total}
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        className={`overflow-y-auto ${maxHeightClassName} ${scrollClassName}`.trim()}
      >
        {noMatches ? (
          <p className="text-muted-foreground p-4 text-center text-sm">
            {emptyLabel}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
