import * as React from "react"

import { LeaveBalancePanel } from "@/components/shared/leave-balance-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { EmployeeLeaveCreditsRow } from "@/lib/employee-leave-credits-api"
import {
  formatEmployeeName,
  getAvatarUrlFromEmpNo,
  getEmployeeDepartment,
  getInitialsFromDisplayName,
} from "@/lib/employee-teacher-display"

type ViewEmployeeLeaveCreditsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeRow: EmployeeLeaveCreditsRow | null
}

export function ViewEmployeeLeaveCreditsSheet({
  open,
  onOpenChange,
  activeRow,
}: ViewEmployeeLeaveCreditsSheetProps) {
  const displayName = activeRow
    ? formatEmployeeName(activeRow.employee, activeRow.employee_no)
    : ""
  const avatarUrl = activeRow ? getAvatarUrlFromEmpNo(activeRow.employee_no) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <SheetHeader className="shrink-0 border-b bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-5">
          <SheetTitle className="text-lg">Leave Credits</SheetTitle>
          <SheetDescription>
            Current leave credit balances for this employee.
          </SheetDescription>
        </SheetHeader>

        {activeRow ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <Avatar className="size-10 shrink-0">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                  {activeRow.employee
                    ? getInitialsFromDisplayName(
                        [activeRow.employee.first_name, activeRow.employee.last_name]
                          .filter(Boolean)
                          .join(" "),
                        activeRow.employee_no,
                      )
                    : getInitialsFromDisplayName(null, activeRow.employee_no)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {activeRow.employee_no}
                </p>
                <p className="text-muted-foreground text-xs">
                  {getEmployeeDepartment(activeRow.employee)}
                </p>
              </div>
            </div>

            <LeaveBalancePanel rows={activeRow.leave_credits} />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
