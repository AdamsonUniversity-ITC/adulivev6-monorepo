import {
  fireEvent,
  cleanup,
  render,
  renderHook,
  screen,
  act,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SearchableScrollList } from "@/components/searchable-scroll-list";
import { matchesQuery, useListFilter } from "@/components/use-list-filter";

describe("matchesQuery", () => {
  it("matches everything for an empty or blank query", () => {
    expect(matchesQuery(["Ana"], "")).toBe(true);
    expect(matchesQuery(["Ana"], "   ")).toBe(true);
  });

  it("is case-insensitive and trims the query", () => {
    expect(matchesQuery(["Ana Reyes"], "  REYES ")).toBe(true);
  });

  it("matches across fields and numbers, ignoring null and undefined", () => {
    expect(matchesQuery(["Ana", null, undefined, 4521], "4521")).toBe(true);
    expect(matchesQuery(["Ana", "ana@x.test"], "x.test")).toBe(true);
  });

  it("returns false when nothing matches", () => {
    expect(matchesQuery(["Ana", 12], "zzz")).toBe(false);
  });
});

describe("useListFilter", () => {
  const items = [
    { id: 1, name: "Alpha" },
    { id: 2, name: "Beta" },
    { id: 3, name: "alphabet" },
  ];

  it("filters the list as the query changes", () => {
    const { result } = renderHook(() =>
      useListFilter(items, (item) => [item.name]),
    );

    expect(result.current.filtered).toHaveLength(3);

    act(() => result.current.setQuery("alpha"));
    expect(result.current.filtered.map((i) => i.id)).toEqual([1, 3]);

    act(() => result.current.setQuery("nope"));
    expect(result.current.filtered).toEqual([]);
  });
});

describe("SearchableScrollList", () => {
  afterEach(() => cleanup());

  function Harness({ total }: { total: number }) {
    const rows = Array.from({ length: total }, (_, i) => `Row ${i + 1}`);
    const list = useListFilter(rows, (row) => [row]);
    return (
      <SearchableScrollList
        query={list.query}
        onQueryChange={list.setQuery}
        total={rows.length}
        shown={list.filtered.length}
        placeholder="Search rows"
        emptyLabel="Nothing here"
      >
        <ul>
          {list.filtered.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ul>
      </SearchableScrollList>
    );
  }

  it("hides the search box on short lists", () => {
    render(<Harness total={3} />);
    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("filters, reports counts and shows the empty label", () => {
    render(<Harness total={8} />);
    const box = screen.getByRole("searchbox", { name: "Search rows" });

    fireEvent.change(box, { target: { value: "row 3" } });
    expect(screen.getByText("Row 3")).toBeInTheDocument();
    expect(screen.queryByText("Row 4")).toBeNull();
    expect(screen.getByText("Showing 1 of 8")).toBeInTheDocument();

    fireEvent.change(box, { target: { value: "zzz" } });
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    // Box stays so the query can be cleared.
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });
});
