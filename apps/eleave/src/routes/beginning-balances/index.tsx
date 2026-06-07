import { Button } from "@repo/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card"
import { createFileRoute } from "@tanstack/react-router"
import { Plus, Wallet } from "lucide-react"
import * as React from "react"

import { useDataTable } from "@/components/shared/datatable"
import { useBeginningBalances } from "@/hooks/use-beginning-balances"
import { useLeaveTypes } from "@/hooks/use-leave-types"

import { BeginningBalanceFormDialog } from "./-beginning-balance-form-dialog"
import { BeginningBalancesDataTable } from "./-beginning-balances-datatable"

export const Route = createFileRoute("/beginning-balances/")({
  component: BeginningBalancesPage,
})

function BeginningBalancesPage() {
  const { data: leaveTypes = [] } = useLeaveTypes()
  const tanstackHook = useDataTable()
  const [leaveYearFilter, setLeaveYearFilter] = React.useState("all")
  const [leaveTypeFilter, setLeaveTypeFilter] = React.useState("all")
  const [formOpen, setFormOpen] = React.useState(false)

  React.useEffect(() => {
    tanstackHook.setPage(1)
  }, [tanstackHook.keyword, leaveYearFilter, leaveTypeFilter, tanstackHook.setPage])

  const listParams = React.useMemo(
    () => ({
      page: tanstackHook.page,
      per_page: tanstackHook.rows,
      search: tanstackHook.keyword.trim() || undefined,
      leave_year:
        leaveYearFilter === "all" ? undefined : Number(leaveYearFilter),
      leave_type_id:
        leaveTypeFilter === "all" ? undefined : Number(leaveTypeFilter),
    }),
    [
      tanstackHook.page,
      tanstackHook.rows,
      tanstackHook.keyword,
      leaveYearFilter,
      leaveTypeFilter,
    ],
  )

  const { data, isLoading, isError } = useBeginningBalances(listParams)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_55%),linear-gradient(90deg,_#fef3c7_0%,_#fffbeb_52%,_#ffffff_100%)] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-900 shadow-sm">
            Admin
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Beginning Balances
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
            Browse employees and open a profile to manage their beginning balances.
          </p>
        </div>

        <Button
          size="lg"
          className="shadow-sm"
          onClick={() => setFormOpen(true)}
        >
          <Plus className="size-4" />
          Add balance
        </Button>
      </div>

      <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Wallet className="size-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Employees</CardTitle>
              <CardDescription>
                One row per employee. View details to manage leave type balances.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-5">
          <BeginningBalancesDataTable
            tanstack={{ hook: tanstackHook }}
            response={data}
            isLoading={isLoading}
            isError={isError}
            leaveYearFilter={leaveYearFilter}
            onLeaveYearFilterChange={setLeaveYearFilter}
            leaveTypeFilter={leaveTypeFilter}
            onLeaveTypeFilterChange={setLeaveTypeFilter}
            leaveTypes={leaveTypes}
          />
        </CardContent>
      </Card>

      <BeginningBalanceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        leaveTypes={leaveTypes}
      />
    </div>
  )
}
