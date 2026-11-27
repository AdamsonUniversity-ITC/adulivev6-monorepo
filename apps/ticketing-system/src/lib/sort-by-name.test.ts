import { describe, expect, it } from "vitest";

import {
  compareNames,
  sortBoardLists,
  sortCategoriesByName,
  sortSectionsByName,
} from "./sort-by-name";

describe("compareNames", () => {
  it("ignores case", () => {
    expect(compareNames("apple", "Banana")).toBeLessThan(0);
    expect(compareNames("Banana", "apple")).toBeGreaterThan(0);
  });

  it("orders embedded numbers naturally", () => {
    expect(compareNames("Floor 2", "Floor 10")).toBeLessThan(0);
  });

  it("treats missing names as empty", () => {
    expect(compareNames(null, "A")).toBeLessThan(0);
  });
});

describe("sort helpers", () => {
  it("sorts sections by name without mutating the input", () => {
    const input = [
      { id: 1, section_name: "registrar" },
      { id: 2, section_name: "Accounting" },
      { id: 3, section_name: "ITC" },
    ];
    expect(sortSectionsByName(input).map((s) => s.id)).toEqual([2, 3, 1]);
    expect(input.map((s) => s.id)).toEqual([1, 2, 3]);
  });

  it("sorts categories by name", () => {
    const input = [
      { id: 1, name: "Network" },
      { id: 2, name: "hardware" },
    ];
    expect(sortCategoriesByName(input).map((c) => c.id)).toEqual([2, 1]);
  });

  it("sorts both lists on a board and keeps other fields", () => {
    const board = sortBoardLists({
      board_name: "ITC",
      sections: [{ section_name: "B" }, { section_name: "A" }],
      categories: [{ name: "Z" }, { name: "Y" }],
    });
    expect(board.board_name).toBe("ITC");
    expect(board.sections.map((s) => s.section_name)).toEqual(["A", "B"]);
    expect(board.categories.map((c) => c.name)).toEqual(["Y", "Z"]);
  });

  it("leaves absent lists absent", () => {
    expect(sortBoardLists({ board_name: "X" })).toEqual({ board_name: "X" });
  });
});
