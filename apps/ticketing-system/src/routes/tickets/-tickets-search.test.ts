import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_STATUS_FILTER,
  EMPTY_STATUS_FILTER,
  normalizeStatusFilter,
  parseStatusList,
  parseTicketsSearch,
  serializeStatusList,
  writeStoredStatusFilter,
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
