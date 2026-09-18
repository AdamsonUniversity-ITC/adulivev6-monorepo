import { describe, expect, it } from "vitest"

import {
  getAvailableBirthdayCredits,
  getAvailablePaternityCredits,
  getLeaveCreditValidationMessage,
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

  it("computes available BL as credits minus pending", () => {
    expect(
      getAvailableBirthdayCredits([
        {
          leave_code: "bl",
          credits: 1,
          pending_filed_leave: 0.5,
        },
      ]),
    ).toBe(0.5)
  })

  it("returns null when leave type does not require credit validation", () => {
    expect(
      getLeaveCreditValidationMessage({
        leaveType: {
          leave_code: "ml",
          requires_apply_credit_check: false,
        },
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
      getLeaveCreditValidationMessage({
        leaveType: {
          leave_code: "pl",
          requires_apply_credit_check: true,
          apply_credit_error_message:
            "Insufficient Paternity Leave credits for the selected dates.",
        },
        leaveDays: [{ day_portion: "wholeday" }, { day_portion: "am" }],
        balances: [{ leave_code: "pl", credits: 3, pending_filed_leave: 1 }],
      }),
    ).toBeNull()
  })

  it("fails when paternity credits minus pending are insufficient", () => {
    expect(
      getLeaveCreditValidationMessage({
        leaveType: {
          leave_code: "pl",
          requires_apply_credit_check: true,
          apply_credit_error_message:
            "Insufficient Paternity Leave credits for the selected dates.",
        },
        leaveDays: [{ day_portion: "wholeday" }],
        balances: [{ leave_code: "pl", credits: 2, pending_filed_leave: 1.5 }],
      }),
    ).toBe("Insufficient Paternity Leave credits for the selected dates.")
  })

  it("passes when birthday credits exactly match weighted days", () => {
    expect(
      getLeaveCreditValidationMessage({
        leaveType: {
          leave_code: "bl",
          requires_apply_credit_check: true,
        },
        leaveDays: [{ day_portion: "am" }],
        balances: [{ leave_code: "bl", credits: 1, pending_filed_leave: 0.5 }],
      }),
    ).toBeNull()
  })

  it("fails when birthday credits are insufficient", () => {
    expect(
      getLeaveCreditValidationMessage({
        leaveType: {
          leave_code: "bl",
          requires_apply_credit_check: true,
          apply_credit_error_message:
            "Insufficient Birthday Leave credits for the selected dates.",
        },
        leaveDays: [{ day_portion: "wholeday" }],
        balances: [{ leave_code: "bl", credits: 1, pending_filed_leave: 0.5 }],
      }),
    ).toBe("Insufficient Birthday Leave credits for the selected dates.")
  })

  it("fails when birthday balance row is missing", () => {
    expect(
      getLeaveCreditValidationMessage({
        leaveType: {
          leave_code: "bl",
          requires_apply_credit_check: true,
          apply_credit_error_message:
            "Insufficient Birthday Leave credits for the selected dates.",
        },
        leaveDays: [{ day_portion: "wholeday" }],
        balances: [],
      }),
    ).toBe("Insufficient Birthday Leave credits for the selected dates.")
  })

  it("enforces SIL when requires_apply_credit_check is enabled", () => {
    expect(
      getLeaveCreditValidationMessage({
        leaveType: {
          leave_code: "sil",
          requires_apply_credit_check: true,
          apply_credit_error_message:
            "Insufficient SIL credits for the selected dates.",
        },
        leaveDays: [{ day_portion: "wholeday" }],
        balances: [{ leave_code: "sil", credits: 0, pending_filed_leave: 0 }],
      }),
    ).toBe("Insufficient SIL credits for the selected dates.")
  })

  it("falls back to pl/bl codes when leaveType flag is omitted", () => {
    expect(
      getLeaveCreditValidationMessage({
        leaveCode: "pl",
        leaveDays: [{ day_portion: "wholeday" }],
        balances: [{ leave_code: "pl", credits: 0, pending_filed_leave: 0 }],
      }),
    ).toBe("Insufficient Paternity Leave credits for the selected dates.")
  })
})
