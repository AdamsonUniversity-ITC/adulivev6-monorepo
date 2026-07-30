import { describe, expect, it } from "vitest"

import {
  getHrRemarkLabel,
  isHrRemarkOthers,
  resolveHrRemarkDisplayText,
} from "./hr-remark-options"

describe("hr-remark-options", () => {
  it("resolves catalog labels for non-others codes", () => {
    expect(getHrRemarkLabel("approved")).toBe("Approved")
    expect(resolveHrRemarkDisplayText("approved", "ignored")).toBe("Approved")
    expect(isHrRemarkOthers("approved")).toBe(false)
  })

  it("uses custom text for others", () => {
    expect(isHrRemarkOthers("others")).toBe(true)
    expect(resolveHrRemarkDisplayText("others", "  Follow up  ")).toBe("Follow up")
  })

  it("returns null when others has no custom text", () => {
    expect(resolveHrRemarkDisplayText("others", "   ")).toBeNull()
  })

  it("returns null for unknown codes", () => {
    expect(resolveHrRemarkDisplayText("unknown", "text")).toBeNull()
    expect(getHrRemarkLabel(null)).toBeNull()
  })
})
