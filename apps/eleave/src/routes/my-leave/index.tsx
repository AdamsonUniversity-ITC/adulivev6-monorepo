import { createFileRoute, Link } from "@tanstack/react-router"
import { CalendarDays, Clock3, FileText, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { MyLeaveDataTable } from "./-leave-datatable"
import { LeaveBalanceTable } from "./-leave-balance"
import { MOCK_LEAVE_REQUESTS } from "./-leave-mock-data"

export const Route = createFileRoute("/my-leave/")({
  component: MyLeavePage,
})

const pendingCount = MOCK_LEAVE_REQUESTS.filter(
  (row) => row.status === "pending",
).length

const stats = [
  {
    label: "Total requests",
    value: MOCK_LEAVE_REQUESTS.length,
    icon: FileText,
  },
  {
    label: "Pending approval",
    value: pendingCount,
    icon: Clock3,
  },
  {
    label: "Approved",
    value: MOCK_LEAVE_REQUESTS.filter((row) => row.status === "approved").length,
    icon: CalendarDays,
  },
] as const

function MyLeavePage() {
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

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="py-4 shadow-sm">
            <CardContent className="flex items-center gap-4 px-5">
              <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
                <stat.icon className="size-4" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_min(100%,20rem)]">
        <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
          <CardHeader className="border-b bg-muted/20 px-6 py-5">
            <CardTitle className="text-lg">Your leave requests</CardTitle>
            <CardDescription>
              Search, sort, and open a request to view or edit details.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 py-5">
            <MyLeaveDataTable />
          </CardContent>
        </Card>

        <aside className="flex min-h-0 flex-col">
          <LeaveBalanceTable className="h-full" />
        </aside>
      </div>
    </div>
  )
}
