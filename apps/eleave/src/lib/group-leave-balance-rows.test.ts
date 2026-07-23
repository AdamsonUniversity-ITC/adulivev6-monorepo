import { describe, expect, it } from "vitest"

import { groupLeaveBalanceRowsByCode } from "./group-leave-balance-rows"

describe("groupLeaveBalanceRowsByCode", () => {
  it("retains pl and ml balance rows without hiding by gender", () => {
    const grouped = groupLeaveBalanceRowsByCode([
      {
        leave_code: "pl",
        leave_type: "Paternity Leave (PL)",
        credits: 2,
        pending_filed_leave: 0,
      },
      {
        leave_code: "ml",
        leave_type: "Maternity Leave (ML)",
        credits: 0,
        pending_filed_leave: 0,
      },
      {
        leave_code: "vl",
        leave_type: "Vacation Leave (VL)",
        credits: 5,
        pending_filed_leave: 1,
      },
    ])

    expect(grouped.map((row) => row.leave_code).sort()).toEqual([
      "ml",
      "pl",
      "vl",
    ])
  })
})
