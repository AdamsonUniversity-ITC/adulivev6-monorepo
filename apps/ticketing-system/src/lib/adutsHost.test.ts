import { describe, expect, it } from "vitest";
import {
  boardUrl,
  getBoardSubdomain,
  isPlatformHost,
  platformUrl,
} from "./adutsHost.ts";

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

describe("platformUrl", () => {
  it("swaps the board label for ticketing and keeps protocol and port", () => {
    expect(
      platformUrl("/", {
        protocol: "http:",
        hostname: "itc-ts.localhost.test",
        port: "5174",
      }),
    ).toBe("http://ticketing.localhost.test:5174/");
    expect(
      platformUrl("/", {
        protocol: "https:",
        hostname: "hr.adamson.edu.ph",
        port: "",
      }),
    ).toBe("https://ticketing.adamson.edu.ph/");
  });

  it("leaves platform hosts unchanged", () => {
    expect(
      platformUrl("/", {
        protocol: "http:",
        hostname: "ticketing.localhost.test",
        port: "5174",
      }),
    ).toBe("http://ticketing.localhost.test:5174/");
  });
});
