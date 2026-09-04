import { describe, expect, it } from "vitest";
import { extractMentionIdsFromBody } from "./aduts-api";

const candidates = [
  { user_id: 21, name: "Ada Staff" },
  { user_id: 31, name: "Other Head" },
];

describe("extractMentionIdsFromBody", () => {
  it("reads legacy @user:id tokens", () => {
    expect(extractMentionIdsFromBody("Hey @user:21 please review", candidates)).toEqual(
      [21],
    );
  });

  it("reads TipTap data-id mention spans", () => {
    const body =
      '<p>Hey <span data-type="mention" data-id="31" class="mention">@Other Head</span></p>';
    expect(extractMentionIdsFromBody(body, candidates)).toEqual([31]);
  });

  it("reads data-mention-id attributes", () => {
    const body = '<span data-mention-id="21">@Ada Staff</span>';
    expect(extractMentionIdsFromBody(body, candidates)).toEqual([21]);
  });

  it("matches @Name candidates", () => {
    expect(extractMentionIdsFromBody("Ping @Ada Staff thanks", candidates)).toEqual(
      [21],
    );
  });
});
