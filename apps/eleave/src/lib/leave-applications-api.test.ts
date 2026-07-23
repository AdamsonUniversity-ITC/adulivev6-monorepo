import { beforeEach, describe, expect, it, vi } from "vitest"

const { postMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
}))

vi.mock("@/lib/api", () => ({
  hrmdoSvc: {
    post: postMock,
  },
}))

import {
  applyLeaveApplication,
  getValidationFieldErrors,
} from "./leave-applications-api"

describe("applyLeaveApplication", () => {
  beforeEach(() => {
    postMock.mockReset()
    postMock.mockResolvedValue({ data: { data: { id: 1 } } })
  })

  it("posts FormData with multipart content type", async () => {
    const formData = new FormData()
    formData.append("employee_no", "EMP-001")

    await applyLeaveApplication(formData)

    expect(postMock).toHaveBeenCalledTimes(1)
    expect(postMock).toHaveBeenCalledWith(
      "v1/leave-applications/apply",
      formData,
      {
        timeout: 120_000,
        headers: { "Content-Type": "multipart/form-data" },
      },
    )
  })
})

describe("getValidationFieldErrors", () => {
  it("maps leave_type_id gender and paternity credit validation messages", () => {
    const genderError = {
      response: {
        data: {
          message: "The given data was invalid.",
          errors: {
            leave_type_id: [
              "Paternity Leave (PL) is available only to male employees.",
            ],
          },
        },
      },
    }

    const creditError = {
      response: {
        data: {
          message: "The given data was invalid.",
          errors: {
            leave_type_id: [
              "Insufficient Paternity Leave credits for the selected dates.",
            ],
          },
        },
      },
    }

    expect(getValidationFieldErrors(genderError)).toEqual({
      leave_type_id:
        "Paternity Leave (PL) is available only to male employees.",
    })
    expect(getValidationFieldErrors(creditError)).toEqual({
      leave_type_id:
        "Insufficient Paternity Leave credits for the selected dates.",
    })
  })

  it("maps duplicate leave date_from validation message", () => {
    const duplicateError = {
      response: {
        data: {
          message: "The given data was invalid.",
          errors: {
            date_from: ["You already have a leave request on 2026-07-22."],
          },
        },
      },
    }

    expect(getValidationFieldErrors(duplicateError)).toEqual({
      date_from: "You already have a leave request on 2026-07-22.",
    })
  })
})
