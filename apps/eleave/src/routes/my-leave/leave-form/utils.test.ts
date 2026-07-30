import { describe, expect, it } from "vitest"

import { formatLeaveDayCount } from "./utils"

describe("formatLeaveDayCount", () => {
  it("uses the singular form for half days", () => {
    expect(formatLeaveDayCount(0.5)).toBe("0.5 day")
  })

  it("uses the singular form for one day", () => {
    expect(formatLeaveDayCount(1)).toBe("1 day")
  })

  it("uses the plural form above one day", () => {
    expect(formatLeaveDayCount(1.5)).toBe("1.5 days")
    expect(formatLeaveDayCount(2)).toBe("2 days")
  })

  it("uses the plural form for no days", () => {
    expect(formatLeaveDayCount(0)).toBe("0 days")
  })
})
