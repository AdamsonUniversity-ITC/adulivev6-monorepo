import { describe, expect, it } from "vitest"

import { buildLeaveApplyFormData } from "./map-leave-form-to-apply-payload"
import type { LeaveFormValues } from "@/routes/my-leave/leave-form/schema"

function createLeaveValues(
  overrides: Partial<LeaveFormValues> = {},
): LeaveFormValues {
  return {
    date_from: "2026-07-22",
    date_to: "2026-07-22",
    exclude_sundays: true,
    exclude_saturdays: false,
    leave_type_id: "3",
    leave_days: [{ date: "2026-07-22", day_portion: "wholeday" }],
    reason: "Emergency leave",
    supporting_documents: [],
    address: "Home address",
    ...overrides,
  }
}

describe("buildLeaveApplyFormData", () => {
  it("includes core leave fields and indexed leave days", () => {
    const formData = buildLeaveApplyFormData(
      createLeaveValues(),
      "EMP-001",
    )

    expect(formData.get("employee_no")).toBe("EMP-001")
    expect(formData.get("leave_type_id")).toBe("3")
    expect(formData.get("date_from")).toBe("2026-07-22")
    expect(formData.get("date_to")).toBe("2026-07-22")
    expect(formData.get("reason")).toBe("Emergency leave")
    expect(formData.get("address")).toBe("Home address")
    expect(formData.get("leave_days[0][date]")).toBe("2026-07-22")
    expect(formData.get("leave_days[0][day_portion]")).toBe("Whole Day")
    expect(formData.get("supporting_documents[0]")).toBeNull()
  })

  it("appends supporting documents with indexed keys and filenames", () => {
    const file = new File(["attachment-bytes"], "medical.pdf", {
      type: "application/pdf",
    })

    const formData = buildLeaveApplyFormData(
      createLeaveValues({ supporting_documents: [file] }),
      "EMP-001",
    )

    const uploaded = formData.get("supporting_documents[0]")
    expect(uploaded).toBeInstanceOf(File)
    expect((uploaded as File).name).toBe("medical.pdf")
    expect(formData.get("supporting_documents[]")).toBeNull()
  })

  it("omits supporting documents when none are attached", () => {
    const formData = buildLeaveApplyFormData(
      createLeaveValues({ supporting_documents: [] }),
      "EMP-001",
    )

    expect(formData.get("supporting_documents[0]")).toBeNull()
    expect([...formData.keys()].some((key) => key.startsWith("supporting_documents"))).toBe(
      false,
    )
  })
})
