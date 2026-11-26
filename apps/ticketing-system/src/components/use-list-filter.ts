import { useMemo, useState } from "react";

/** Case-insensitive substring match of a trimmed query against a haystack. */
export function matchesQuery(
  haystack: ReadonlyArray<string | number | null | undefined> | string,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") return true;

  const text = (
    typeof haystack === "string"
      ? haystack
      : haystack.filter((part) => part !== null && part !== undefined).join(" ")
  ).toLowerCase();

  return text.includes(needle);
}

/**
 * Client-side search over an already loaded list. `getSearchText` should
 * return every field the user may search by.
 */
export function useListFilter<T>(
  items: readonly T[],
  getSearchText: (item: T) => ReadonlyArray<string | number | null | undefined>,
) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => items.filter((item) => matchesQuery(getSearchText(item), query)),
    // getSearchText is intentionally excluded: callers pass inline closures.
    [items, query],
  );

  return { query, setQuery, filtered };
}
