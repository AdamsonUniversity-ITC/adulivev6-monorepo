import { describe, expect, it } from "vitest"

import {
  getAvailablePaternityCredits,
  getPaternityCreditValidationMessage,
  getRequestedLeaveDaysWeight,
} from "./paternity-leave-credits"

describe("paternity-leave-credits", () => {
  it("sums requested day weights including half days", () => {
    expect(
      getRequestedLeaveDaysWeight([
        { day_portion: "wholeday" },
        { day_portion: "am" },
        { day_portion: "pm" },
      ]),
    ).toBe(2)
  })

  it("computes available PL as credits minus pending", () => {
    expect(
      getAvailablePaternityCredits([
        {
          leave_code: "pl",
          credits: 3,
          pending_filed_leave: 1.5,
        },
      ]),
    ).toBe(1.5)
  })

  it("returns null when leave type is not paternity", () => {
    expect(
      getPaternityCreditValidationMessage({
        leaveCode: "ml",
        leaveDays: [{ day_portion: "wholeday" }],
        balances: [{ leave_code: "ml", credits: 0, pending_filed_leave: 0 }],
      }),
    ).toBeNull()

    expect(
      getPaternityCreditValidationMessage({
        leaveCode: "vl",
        leaveDays: [{ day_portion: "wholeday" }],
        balances: [{ leave_code: "vl", credits: 0, pending_filed_leave: 0 }],
      }),
    ).toBeNull()
  })

  it("passes when paternity credits are sufficient", () => {
    expect(
      getPaternityCreditValidationMessage({
        leaveCode: "pl",
        leaveDays: [{ day_portion: "wholeday" }, { day_portion: "am" }],
        balances: [{ leave_code: "pl", credits: 3, pending_filed_leave: 1 }],
      }),
    ).toBeNull()
  })

  it("fails when paternity credits minus pending are insufficient", () => {
    expect(
      getPaternityCreditValidationMessage({
        leaveCode: "pl",
        leaveDays: [{ day_portion: "wholeday" }],
        balances: [{ leave_code: "pl", credits: 2, pending_filed_leave: 1.5 }],
      }),
    ).toBe("Insufficient Paternity Leave credits for the selected dates.")
  })
})
