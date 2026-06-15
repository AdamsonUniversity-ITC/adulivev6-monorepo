import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog"
import { Button } from "@repo/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table"
import { toast } from "@repo/ui/exports"
import { Link } from "@tanstack/react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { ChevronLeft, Pencil, Trash2 } from "lucide-react"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useBeginningBalances } from "@/hooks/use-beginning-balances"
import { useAdminLeaveTypes } from "@/hooks/use-admin-leave-types"
import {
  deleteBeginningBalance,
  type BeginningBalanceRecord,
} from "@/lib/beginning-balances-api"
import {
  formatEmployeeName,
  getAvatarUrlFromEmpNo,
  getInitialsFromDisplayName,
} from "@/lib/employee-teacher-display"

import { BeginningBalanceFormDialog } from "./-beginning-balance-form-dialog"

function formatUpdatedAt(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy")
  } catch {
    return value
  }
}

type BeginningBalanceDetailViewProps = {
  employeeNo: string
}

export function BeginningBalanceDetailView({
  employeeNo,
}: BeginningBalanceDetailViewProps) {
  const queryClient = useQueryClient()
  const { data: leaveTypes = [] } = useAdminLeaveTypes()
  const [leaveYearFilter, setLeaveYearFilter] = React.useState("all")
  const [leaveTypeFilter, setLeaveTypeFilter] = React.useState("all")
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingRecord, setEditingRecord] =
    React.useState<BeginningBalanceRecord | null>(null)
  const [deletingRecord, setDeletingRecord] =
    React.useState<BeginningBalanceRecord | null>(null)

  const listParams = React.useMemo(
    () => ({
      employee_no: employeeNo,
      per_page: 100,
      page: 1,
      leave_year:
        leaveYearFilter === "all" ? undefined : Number(leaveYearFilter),
      leave_type_id:
        leaveTypeFilter === "all" ? undefined : Number(leaveTypeFilter),
    }),
    [employeeNo, leaveYearFilter, leaveTypeFilter],
  )

  const { data, isLoading, isError } = useBeginningBalances(listParams)
  const rows = data?.data ?? []
  const employee = rows[0]?.employee ?? null
  const displayName = formatEmployeeName(employee, employeeNo)
  const avatarUrl = getAvatarUrlFromEmpNo(employeeNo)

  const currentYear = new Date().getFullYear()
  const yearOptions = React.useMemo(
    () => [currentYear + 1, currentYear, currentYear - 1, currentYear - 2],
    [currentYear],
  )

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBeginningBalance(id),
    onSuccess: () => {
      toast.success("Beginning balance deleted.")
      queryClient.invalidateQueries({ queryKey: ["beginning-balances"] })
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] })
      setDeletingRecord(null)
    },
    onError: () => {
      toast.error("Failed to delete beginning balance.")
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" className="w-fit gap-2" asChild>
          <Link to="/beginning-balances">
            <ChevronLeft className="size-4" />
            Back to beginning balances
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-amber-200/80 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_55%),linear-gradient(90deg,_#fef3c7_0%,_#fffbeb_52%,_#ffffff_100%)] p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-14 shrink-0">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
            <AvatarFallback className="bg-slate-100 text-sm font-semibold text-slate-700">
              {employee
                ? getInitialsFromDisplayName(
                    [employee.first_name, employee.last_name]
                      .filter(Boolean)
                      .join(" "),
                    employeeNo,
                  )
                : getInitialsFromDisplayName(null, employeeNo)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.22em]">
              Employee beginning balances
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{displayName}</h1>
            <p className="text-muted-foreground mt-1 text-sm tabular-nums">{employeeNo}</p>
          </div>
        </div>
      </div>

      <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg">Balance details</CardTitle>
              <CardDescription>
                Leave type, year, and beginning balance records for this employee.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={leaveYearFilter} onValueChange={setLeaveYearFilter}>
                <SelectTrigger size="sm" className="w-[7.5rem]" aria-label="Filter by year">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                <SelectTrigger
                  size="sm"
                  className="w-[11.5rem]"
                  aria-label="Filter by leave type"
                >
                  <SelectValue placeholder="Leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.leave_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-5">
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave type</TableHead>
                  <TableHead className="w-24">Year</TableHead>
                  <TableHead className="w-32">Balance</TableHead>
                  <TableHead className="w-36">Updated</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="space-y-2 py-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-destructive h-24 text-center"
                    >
                      Unable to load balance details. Please try again.
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground h-24 text-center"
                    >
                      No beginning balances found for this employee.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((balance) => (
                    <TableRow key={balance.id}>
                      <TableCell>
                        <span className="text-sm">
                          {balance.leave_type?.leave_name ??
                            `#${balance.leave_type_id}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm tabular-nums">{balance.leave_year}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium tabular-nums">
                          {Number(balance.beginning_balance).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {formatUpdatedAt(balance.updated_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit balance"
                            onClick={() => {
                              setEditingRecord(balance)
                              setFormOpen(true)
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Delete balance"
                            onClick={() => setDeletingRecord(balance)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <BeginningBalanceFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingRecord(null)
          }
        }}
        leaveTypes={leaveTypes}
        record={editingRecord}
      />

      <AlertDialog
        open={deletingRecord != null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingRecord(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete beginning balance?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the beginning balance for {displayName} (
              {deletingRecord?.leave_type?.leave_name ?? "leave type"},{" "}
              {deletingRecord?.leave_year}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingRecord) {
                  deleteMutation.mutate(deletingRecord.id)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
