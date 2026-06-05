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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type LeaveBalanceRow = {
  leave_type: string
  credits: number
  pending_filed_leave: number
}

export const MOCK_LEAVE_BALANCES: LeaveBalanceRow[] = [
  { leave_type: "Birthday Leave (BL)", credits: 0, pending_filed_leave: 0 },
  { leave_type: "Educational Leave (EDL)", credits: 0, pending_filed_leave: 0 },
  { leave_type: "Emergency Leave (EL)", credits: 4, pending_filed_leave: 0 },
  { leave_type: "Forced Leave (FL)", credits: 0, pending_filed_leave: 0 },
  { leave_type: "Leave of absence (LOA)", credits: 0, pending_filed_leave: 0 },
  { leave_type: "Maternity Leave (ML)", credits: 0, pending_filed_leave: 0 },
  { leave_type: "Paternity Leave (PL)", credits: 0, pending_filed_leave: 0 },
  { leave_type: "Sick Leave (SL) (SSS)", credits: 120, pending_filed_leave: 0 },
  { leave_type: "Solo Parent Leave (SPL)", credits: 0, pending_filed_leave: 0 },
  {
    leave_type: "Special Purpose Leave (SPL)",
    credits: 0,
    pending_filed_leave: 0,
  },
  {
    leave_type: "Vacation Leave (VL) / Sick Leave (SL)",
    credits: 16.5,
    pending_filed_leave: 0,
  },
]

function formatCredits(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

type LeaveBalanceTableProps = {
  className?: string
}

export function LeaveBalanceTable({ className }: LeaveBalanceTableProps) {
  const availableTypes = MOCK_LEAVE_BALANCES.filter((row) => row.credits > 0)
  const totalCredits = MOCK_LEAVE_BALANCES.reduce(
    (sum, row) => sum + row.credits,
    0,
  )

  return (
    <Card
      className={cn(
        "flex h-full min-h-0 flex-col gap-0 overflow-hidden py-0 shadow-sm",
        className,
      )}
    >
      <CardHeader className="border-b bg-muted/40 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Wallet className="size-4" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base">Leave Balance</CardTitle>
            <CardDescription>
              {availableTypes.length} active leave type
              {availableTypes.length === 1 ? "" : "s"} ·{" "}
              {formatCredits(totalCredits)} total credits
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div className="min-h-0 flex-1 overflow-y-auto">
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
              {MOCK_LEAVE_BALANCES.map((row) => {
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
        </div>
      </CardContent>
    </Card>
  )
}
