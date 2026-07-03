import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card"
import { createFileRoute } from "@tanstack/react-router"
import { CreditCard } from "lucide-react"
import * as React from "react"

import { useDataTable } from "@/components/shared/datatable"
import { useEmployeeLeaveCredits } from "@/hooks/use-employee-leave-credits"

import { EmployeeLeaveCreditsDataTable } from "./-employee-leave-credits-datatable"

export const Route = createFileRoute("/employee-leave-credits/")({
  component: EmployeeLeaveCreditsPage,
})

function EmployeeLeaveCreditsPage() {
  const tanstackHook = useDataTable()

  React.useEffect(() => {
    tanstackHook.setPage(1)
  }, [tanstackHook.keyword, tanstackHook.setPage])

  const listParams = React.useMemo(
    () => ({
      page: tanstackHook.page,
      per_page: tanstackHook.rows,
      search: tanstackHook.keyword.trim() || undefined,
    }),
    [tanstackHook.page, tanstackHook.rows, tanstackHook.keyword],
  )

  const { data, isLoading, isError } = useEmployeeLeaveCredits(listParams)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_55%),linear-gradient(90deg,_#fef3c7_0%,_#fffbeb_52%,_#ffffff_100%)] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-900 shadow-sm">
            Admin
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Employee Leave Credits
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
            Browse active employees and review their current leave credit balances.
          </p>
        </div>
      </div>

      <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
              <CreditCard className="size-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Employees</CardTitle>
              {/* <CardDescription>
                One row per employee. Expand credits to view leave type balances.
              </CardDescription> */}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-5">
          <EmployeeLeaveCreditsDataTable
            tanstack={{ hook: tanstackHook }}
            response={data}
            isLoading={isLoading}
            isError={isError}
          />
        </CardContent>
      </Card>
    </div>
  )
}
