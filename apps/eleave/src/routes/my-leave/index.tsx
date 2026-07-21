import { createFileRoute, Link } from "@tanstack/react-router"
import { CalendarDays, Clock3, FileText, Plus, XCircle } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useLeaveBalances } from "@/hooks/use-leave-balances"
import { useLeaveTypes } from "@/hooks/use-leave-types"
import { useMyLeaveApplications } from "@/hooks/use-my-leave-applications"
import { LeaveBalancePanel } from "@/components/shared/leave-balance-table"
import { mapLeaveApplicationsToRows } from "@/lib/map-leave-application-to-row"
import { cn } from "@/lib/utils"

import { MyLeaveDataTable } from "./-leave-datatable"

export const Route = createFileRoute("/my-leave/")({
  component: MyLeavePage,
})

function MyLeavePage() {
  const {
    data: leaveApplicationsResponse,
    isLoading,
    isError,
  } = useMyLeaveApplications()
  const { data: leaveTypes = [] } = useLeaveTypes()
  const {
    data: leaveBalances = [],
    isLoading: isLeaveBalancesLoading,
    isError: isLeaveBalancesError,
  } = useLeaveBalances()

  const leaveBalanceRows = React.useMemo(
    () =>
      leaveBalances.map((balance) => ({
        leave_code: balance.leave_code,
        leave_type: balance.leave_type,
        credits: balance.credits,
        pending_filed_leave: balance.pending_filed_leave,
      })),
    [leaveBalances],
  )

  const leaveTypeNames = React.useMemo(
    () => new Map(leaveTypes.map((type) => [type.id, type.leave_name])),
    [leaveTypes],
  )

  const rows = React.useMemo(
    () =>
      mapLeaveApplicationsToRows(
        leaveApplicationsResponse?.data ?? [],
        leaveTypeNames,
      ),
    [leaveApplicationsResponse?.data, leaveTypeNames],
  )

  const stats = React.useMemo(() => {
    const pendingCount = rows.filter((row) => row.overall_status === "pending").length
    const approvedCount = rows.filter((row) => row.overall_status === "approved").length
    const disapprovedCount = rows.filter(
      (row) => row.overall_status === "disapproved",
    ).length

    return [
      {
        label: "Total requests",
        value: leaveApplicationsResponse?.meta.total ?? rows.length,
        icon: FileText,
        cardClassName:
          "border-blue-300/70 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.22),_transparent_55%),linear-gradient(90deg,_#93c5fd_0%,_#60a5fa_52%,_#3b82f6_100%)]",
        iconClassName: "bg-blue-700/35 text-white",
        labelClassName: "text-blue-50/90",
        valueClassName: "text-white",
      },
      {
        label: "Pending approval",
        value: pendingCount,
        icon: Clock3,
        cardClassName:
          "border-amber-200/80 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.28),_transparent_55%),linear-gradient(90deg,_#fef3c7_0%,_#fde68a_52%,_#fbbf24_100%)]",
        iconClassName: "bg-amber-700/15 text-amber-900",
        labelClassName: "text-amber-900/80",
        valueClassName: "text-amber-950",
      },
      {
        label: "Approved",
        value: approvedCount,
        icon: CalendarDays,
        cardClassName:
          "border-green-300/70 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_55%),linear-gradient(90deg,_#86efac_0%,_#4ade80_52%,_#22c55e_100%)]",
        iconClassName: "bg-green-800/25 text-white",
        labelClassName: "text-green-50/90",
        valueClassName: "text-white",
      },
      {
        label: "Disapproved",
        value: disapprovedCount,
        icon: XCircle,
        cardClassName:
          "border-red-300/70 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_55%),linear-gradient(90deg,_#fecaca_0%,_#f87171_52%,_#ef4444_100%)]",
        iconClassName: "bg-red-900/25 text-white",
        labelClassName: "text-red-50/90",
        valueClassName: "text-white",
      },
    ]
  }, [leaveApplicationsResponse?.meta.total, rows])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_55%),linear-gradient(90deg,_#fef3c7_0%,_#fffbeb_52%,_#ffffff_100%)] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-900 shadow-sm">
            My Requests
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            My Leave
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
            Review your leave credits, track request status, and submit new
            applications in one place.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Button size="lg" className="shadow-sm" asChild>
            <Link to="/my-leave/leave-form/{-$leaveId}">
              <Plus className="size-4" />
              Apply for Leave
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className={cn("overflow-hidden py-4 shadow-sm", stat.cardClassName)}
          >
            <CardContent className="flex items-center gap-4 px-5">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  stat.iconClassName,
                )}
              >
                <stat.icon className="size-4" />
              </div>
              <div>
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide",
                    stat.labelClassName,
                  )}
                >
                  {stat.label}
                </p>
                <p
                  className={cn(
                    "text-2xl font-semibold tabular-nums",
                    stat.valueClassName,
                  )}
                >
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_min(100%,20rem)]">
        <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
          <CardHeader className="border-b bg-muted/20 px-6 py-5">
            <CardTitle className="text-lg">Your Leave Requests</CardTitle>
            {/* <CardDescription>
              Search, sort, and open a request to view or edit details.
            </CardDescription> */}
          </CardHeader>
          <CardContent className="px-6 py-5">
            <MyLeaveDataTable
              rows={rows}
              isLoading={isLoading}
              isError={isError}
            />
          </CardContent>
        </Card>

        <aside className="flex min-h-0 flex-col">
          <LeaveBalancePanel
            className="h-full"
            rows={leaveBalanceRows}
            isLoading={isLeaveBalancesLoading}
            isError={isLeaveBalancesError}
          />
        </aside>
      </div>
    </div>
  )
}
