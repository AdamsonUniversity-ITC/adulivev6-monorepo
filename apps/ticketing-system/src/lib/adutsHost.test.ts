import { describe, expect, it } from "vitest";
import { boardUrl, getBoardSubdomain, isPlatformHost } from "./adutsHost.ts";

describe("getBoardSubdomain", () => {
  it("extracts board slug from exact host label", () => {
    expect(getBoardSubdomain("itc-ts.localhost.test")).toBe("itc-ts");
    expect(getBoardSubdomain("hr.localhost.test")).toBe("hr");
  });

  it("treats platform host as empty slug", () => {
    expect(getBoardSubdomain("ticketing.localhost.test")).toBe("");
    expect(isPlatformHost("ticketing.localhost.test")).toBe(true);
  });
});

describe("boardUrl", () => {
  it("builds absolute flat board URLs", () => {
    expect(boardUrl("itc-ts", "/tickets/250719-001")).toBe(
      "http://itc-ts.localhost.test/tickets/250719-001",
    );
  });
});
