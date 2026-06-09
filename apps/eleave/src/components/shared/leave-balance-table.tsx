import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table"
import { Badge } from "@repo/ui/components/badge"
import { Wallet } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export type LeaveBalanceRow = {
  leave_type: string
  credits: number
  pending_filed_leave: number
}

function formatCredits(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

type LeaveBalancePanelProps = {
  className?: string
  rows: LeaveBalanceRow[]
  isLoading?: boolean
  isError?: boolean
}

export function LeaveBalancePanel({
  className,
  rows,
  isLoading = false,
  isError = false,
}: LeaveBalancePanelProps) {
  const availableTypes = rows.filter((row) => row.credits > 0)
  const totalCredits = rows.reduce((sum, row) => sum + row.credits, 0)

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <div className="border-b border-slate-200 bg-muted/40 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Wallet className="size-4" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold">Leave Balance</p>
            <p className="text-muted-foreground text-sm">
              {isLoading
                ? "Loading leave credits…"
                : isError
                  ? "Unable to load leave balances."
                  : `${availableTypes.length} active leave type${availableTypes.length === 1 ? "" : "s"} · ${formatCredits(totalCredits)} total credits`}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 px-4 py-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-muted-foreground px-4 py-6 text-sm">
            Leave balances could not be loaded. Please refresh the page or try
            again later.
          </p>
        ) : (
          <Table>
            <TableHeader className="bg-muted/60 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 px-4 text-xs font-semibold">
                  Leave type
                </TableHead>
                <TableHead className="h-10 px-4 text-center text-xs font-semibold">
                  Credits
                </TableHead>
                <TableHead className="h-10 px-4 text-center text-xs font-semibold">
                  Pending
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const hasCredits = row.credits > 0
                const hasPending = row.pending_filed_leave > 0

                return (
                  <TableRow
                    key={row.leave_type}
                    className={cn(
                      "border-border/60",
                      hasCredits && "bg-primary/5 hover:bg-primary/10",
                    )}
                  >
                    <TableCell className="px-4 py-2.5 text-sm leading-snug whitespace-normal">
                      {row.leave_type}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-center">
                      <span
                        className={cn(
                          "text-sm tabular-nums",
                          hasCredits && "text-primary font-semibold",
                        )}
                      >
                        {formatCredits(row.credits)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-center">
                      {hasPending ? (
                        <Badge variant="secondary" className="font-normal">
                          {formatCredits(row.pending_filed_leave)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm tabular-nums">
                          0
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

type LeaveBalanceTableProps = LeaveBalancePanelProps

export function LeaveBalanceTable(props: LeaveBalanceTableProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="other-information"
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        props.className,
      )}
    >
      <AccordionItem value="other-information" className="border-0">
        <AccordionTrigger className="px-5 py-4 text-sm font-semibold hover:no-underline">
          Other Information
        </AccordionTrigger>
        <AccordionContent className="px-0 pb-0">
          <LeaveBalancePanel {...props} className="border-0 shadow-none" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
