import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_STATUS_FILTER,
  EMPTY_STATUS_FILTER,
  LAST_SEARCH_STORAGE_KEY,
  normalizeStatusFilter,
  parseStatusList,
  parseTicketsSearch,
  readRememberedTicketsSearch,
  rememberTicketsSearch,
  serializeStatusList,
  writeStoredStatusFilter,
  writeStoredUnassigned,
} from "./-tickets-search";

// parseTicketsSearch reads localStorage, and jsdom keeps it for the whole file.
beforeEach(() => {
  window.localStorage.clear();
});

describe("status filter", () => {
  it("defaults to open and in progress when nothing is specified", () => {
    expect(parseStatusList(undefined)).toEqual(["open", "in_progress"]);
    expect(parseStatusList("")).toEqual(["open", "in_progress"]);
    expect(parseStatusList("   ")).toEqual(["open", "in_progress"]);
  });

  it("represents a fully deselected set with the sentinel", () => {
    expect(serializeStatusList([])).toBe(EMPTY_STATUS_FILTER);
    expect(parseStatusList(EMPTY_STATUS_FILTER)).toEqual([]);
  });

  // Persistence and the URL both round-trip through normalize, so the empty
  // selection has to survive it rather than snapping back to the default.
  it("round-trips the sentinel through normalize", () => {
    expect(normalizeStatusFilter(EMPTY_STATUS_FILTER)).toBe(
      EMPTY_STATUS_FILTER,
    );
    expect(normalizeStatusFilter(undefined)).toBe(DEFAULT_STATUS_FILTER);
  });

  it("keeps the sentinel when parsing route search params", () => {
    expect(parseTicketsSearch({ status: EMPTY_STATUS_FILTER }).status).toBe(
      EMPTY_STATUS_FILTER,
    );
    expect(parseTicketsSearch({}).status).toBe(DEFAULT_STATUS_FILTER);
  });

  it("still parses and orders real selections", () => {
    expect(parseStatusList("resolved,open")).toEqual(["resolved", "open"]);
    expect(serializeStatusList(["resolved", "open"])).toBe("open,resolved");
  });

  it("keeps treating legacy and unknown values as the default", () => {
    expect(parseStatusList("pending")).toEqual(["open", "in_progress"]);
    expect(parseStatusList("bogus")).toEqual(["open", "in_progress"]);
    // Only a lone sentinel means empty; mixed with a real status it is ignored.
    expect(parseStatusList("none,open")).toEqual(["open"]);
  });
});

describe("remembering the selected tab", () => {
  it("falls back to the default when nothing has been stored", () => {
    expect(parseTicketsSearch({}).status).toBe(DEFAULT_STATUS_FILTER);
  });

  it("restores the stored tab when the param is absent", () => {
    writeStoredStatusFilter("resolved");

    expect(parseTicketsSearch({}).status).toBe("resolved");
  });

  it("lets an explicit param win over the stored tab", () => {
    writeStoredStatusFilter("resolved");

    expect(parseTicketsSearch({ status: "closed" }).status).toBe("closed");
  });

  it("restores a fully deselected set", () => {
    writeStoredStatusFilter(EMPTY_STATUS_FILTER);

    expect(parseTicketsSearch({}).status).toBe(EMPTY_STATUS_FILTER);
    expect(parseStatusList(parseTicketsSearch({}).status)).toEqual([]);
  });
});

describe("awaiting_ack filter", () => {
  it("parses truthy awaiting_ack flags", () => {
    expect(parseTicketsSearch({ awaiting_ack: "1" }).awaiting_ack).toBe(true);
    expect(parseTicketsSearch({ awaiting_ack: true }).awaiting_ack).toBe(true);
    expect(parseTicketsSearch({ awaiting_ack: "true" }).awaiting_ack).toBe(
      true,
    );
  });

  it("leaves awaiting_ack unset when absent or falsy", () => {
    expect(parseTicketsSearch({}).awaiting_ack).toBeUndefined();
    expect(parseTicketsSearch({ awaiting_ack: "0" }).awaiting_ack).toBeUndefined();
    expect(parseTicketsSearch({ awaiting_ack: false }).awaiting_ack).toBeUndefined();
  });
});

describe("remembered list search", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("returns null when nothing was remembered", () => {
    expect(readRememberedTicketsSearch()).toBeNull();
  });

  it("round-trips filters, keyword and page", () => {
    rememberTicketsSearch({
      status: "resolved",
      keyword: "printer",
      priority: "high",
      section_id: 3,
      page: 4,
      rows: 30,
    });

    expect(readRememberedTicketsSearch()).toMatchObject({
      status: "resolved",
      keyword: "printer",
      priority: "high",
      section_id: 3,
      page: 4,
      rows: 30,
    });
  });

  it("returns null for malformed or non-object values", () => {
    window.sessionStorage.setItem(LAST_SEARCH_STORAGE_KEY, "{not json");
    expect(readRememberedTicketsSearch()).toBeNull();

    window.sessionStorage.setItem(LAST_SEARCH_STORAGE_KEY, '"just a string"');
    expect(readRememberedTicketsSearch()).toBeNull();

    window.sessionStorage.setItem(LAST_SEARCH_STORAGE_KEY, "[1,2]");
    expect(readRememberedTicketsSearch()).toBeNull();
  });

  it("normalises tampered values instead of trusting them", () => {
    window.sessionStorage.setItem(
      LAST_SEARCH_STORAGE_KEY,
      JSON.stringify({ status: "bogus", page: -5, section_id: "abc" }),
    );

    expect(readRememberedTicketsSearch()).toMatchObject({
      status: DEFAULT_STATUS_FILTER,
      page: 1,
      section_id: undefined,
    });
  });
});

describe("unassigned filter", () => {
  it("parses truthy unassigned flags", () => {
    expect(parseTicketsSearch({ unassigned: "1" }).unassigned).toBe(true);
    expect(parseTicketsSearch({ unassigned: true }).unassigned).toBe(true);
    expect(parseTicketsSearch({ unassigned: "true" }).unassigned).toBe(true);
  });

  it("leaves unassigned unset when absent or falsy", () => {
    expect(parseTicketsSearch({}).unassigned).toBeUndefined();
    expect(parseTicketsSearch({ unassigned: "0" }).unassigned).toBeUndefined();
    expect(parseTicketsSearch({ unassigned: false }).unassigned).toBeUndefined();
  });

  it("restores unassigned from localStorage when the param is absent", () => {
    writeStoredUnassigned(true);

    expect(parseTicketsSearch({}).unassigned).toBe(true);
  });

  it("lets an explicit off param win over stored unassigned", () => {
    writeStoredUnassigned(true);

    expect(parseTicketsSearch({ unassigned: "0" }).unassigned).toBeUndefined();
    expect(parseTicketsSearch({ unassigned: false }).unassigned).toBeUndefined();
  });
});
