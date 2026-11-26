import { describe, expect, it } from "vitest";

import { compareByLastName, getPersonLastName } from "./person-display";

describe("getPersonLastName", () => {
  it("reads 'Last, First' names", () => {
    expect(getPersonLastName("Dela Cruz, Juan")).toBe("Dela Cruz");
  });

  it("falls back to the final word for 'First Last'", () => {
    expect(getPersonLastName("Juan Santos")).toBe("Santos");
  });

  it("returns null for blank names", () => {
    expect(getPersonLastName("  ")).toBeNull();
    expect(getPersonLastName(null)).toBeNull();
  });
});

describe("compareByLastName", () => {
  const sortNames = (
    people: Array<{ name?: string | null; user_id: number }>,
  ) =>
    [...people].sort(compareByLastName).map((p) => p.name || `#${p.user_id}`);

  it("orders by last name regardless of first name or case", () => {
    expect(
      sortNames([
        { name: "Reyes, Zed", user_id: 1 },
        { name: "abad, Mia", user_id: 2 },
        { name: "Cruz, Ann", user_id: 3 },
      ]),
    ).toEqual(["abad, Mia", "Cruz, Ann", "Reyes, Zed"]);
  });

  it("mixes 'Last, First' and 'First Last' names", () => {
    expect(
      sortNames([
        { name: "Mia Santos", user_id: 1 },
        { name: "Bautista, Leo", user_id: 2 },
      ]),
    ).toEqual(["Bautista, Leo", "Mia Santos"]);
  });

  it("breaks last-name ties on the full name", () => {
    expect(
      sortNames([
        { name: "Cruz, Ben", user_id: 1 },
        { name: "Cruz, Ann", user_id: 2 },
      ]),
    ).toEqual(["Cruz, Ann", "Cruz, Ben"]);
  });

  it("puts unnamed entries last, ordered by id", () => {
    expect(
      sortNames([
        { name: null, user_id: 9 },
        { name: "Zamora, Al", user_id: 1 },
        { name: "", user_id: 4 },
      ]),
    ).toEqual(["Zamora, Al", "#4", "#9"]);
  });
});
