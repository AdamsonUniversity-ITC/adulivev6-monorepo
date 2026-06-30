import { Button } from "@repo/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import { useNavigate } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { format, parseISO } from "date-fns"
import { Eye, X } from "lucide-react"
import * as React from "react"

import DataTable from "@/components/shared/datatable/DataTable"
import type {
  RecordPagination,
  TanstackType,
} from "@/components/shared/datatable/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { PaginatedBeginningBalancesResponse } from "@/lib/beginning-balances-api"
import {
  formatEmployeeName,
  getAvatarUrlFromEmpNo,
  getEmployeeDepartment,
  getInitialsFromDisplayName,
} from "@/lib/employee-teacher-display"
import {
  getLatestUpdatedAt,
  groupBeginningBalancesByEmployee,
  type EmployeeBeginningBalanceGroup,
} from "@/lib/group-beginning-balances-by-employee"
import type { LeaveTypeRecord } from "@/lib/leave-types-api"

function formatUpdatedAt(value: string | null): string {
  if (!value) {
    return "—"
  }

  try {
    return format(parseISO(value), "MMM d, yyyy")
  } catch {
    return value
  }
}

function mapToRecordPagination(
  response: PaginatedBeginningBalancesResponse | undefined,
): RecordPagination {
  const grouped = groupBeginningBalancesByEmployee(response?.data ?? [])
  const meta = response?.meta
  const total = meta?.total ?? 0
  const currentPage = meta?.current_page ?? 1
  const perPage = meta?.per_page ?? 10
  const from =
    meta?.from ?? (total === 0 ? 0 : (currentPage - 1) * perPage + 1)
  const to = meta?.to ?? (total === 0 ? 0 : from + grouped.length - 1)

  return {
    current_page: currentPage,
    data: grouped,
    first_page_url: "",
    from,
    last_page: meta?.last_page ?? 1,
    last_page_url: "",
    links: [],
    next_page_url: null,
    path: "",
    per_page: perPage,
    prev_page_url: null,
    to,
    total,
  }
}

const columns: ColumnDef<EmployeeBeginningBalanceGroup>[] = [
  {
    id: "employee",
    accessorKey: "employee_no",
    header: "Employee",
    cell: ({ row }) => {
      const group = row.original
      const displayName = formatEmployeeName(group.employee, group.employee_no)
      const avatarUrl = getAvatarUrlFromEmpNo(group.employee_no)

      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-10 shrink-0">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
            <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
              {group.employee
                ? getInitialsFromDisplayName(
                    [group.employee.first_name, group.employee.last_name]
                      .filter(Boolean)
                      .join(" "),
                    group.employee_no,
                  )
                : getInitialsFromDisplayName(null, group.employee_no)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{displayName}</p>
            <p className="text-muted-foreground text-xs tabular-nums">
              {group.employee_no}
            </p>
            <p className="text-muted-foreground text-xs">
              {getEmployeeDepartment(group.employee)}
            </p>
          </div>
        </div>
      )
    },
  },
  {
    id: "records",
    header: "Records",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">{row.original.balances.length}</span>
    ),
  },
  {
    id: "last_updated",
    header: "Last updated",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {formatUpdatedAt(getLatestUpdatedAt(row.original))}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => <ViewEmployeeButton employeeNo={row.original.employee_no} />,
  },
]

function ViewEmployeeButton({ employeeNo }: { employeeNo: string }) {
  const navigate = useNavigate()

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() =>
        void navigate({
          to: "/beginning-balances/view/$employeeNo",
          params: { employeeNo },
        })
      }
    >
      <Eye className="size-4" />
      View
    </Button>
  )
}

type BeginningBalancesDataTableProps = {
  tanstack: TanstackType
  response: PaginatedBeginningBalancesResponse | undefined
  isLoading?: boolean
  isError?: boolean
  leaveYearFilter: string
  onLeaveYearFilterChange: (value: string) => void
  leaveTypeFilter: string
  onLeaveTypeFilterChange: (value: string) => void
  leaveTypes: LeaveTypeRecord[]
}

export function BeginningBalancesDataTable({
  tanstack,
  response,
  isLoading = false,
  isError = false,
  leaveYearFilter,
  onLeaveYearFilterChange,
  leaveTypeFilter,
  onLeaveTypeFilterChange,
  leaveTypes,
}: BeginningBalancesDataTableProps) {
  const currentYear = new Date().getFullYear()
  const yearOptions = React.useMemo(
    () => [currentYear + 1, currentYear, currentYear - 1, currentYear - 2],
    [currentYear],
  )

  const tableData = React.useMemo(
    () => mapToRecordPagination(response),
    [response],
  )

  if (isError) {
    return (
      <div className="text-destructive rounded-md border border-dashed px-4 py-10 text-center text-sm">
        Unable to load beginning balances. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <DataTable<EmployeeBeginningBalanceGroup>
        tanstack={tanstack}
        data={tableData}
        states={{ isFetching: isLoading }}
        config={{
          search: true,
          pagination: true,
          searchMode: "debounce",
          searchDebounceMs: 300,
        }}
        columns={columns}
        styles={{
          searchbar: "pl-8",
        }}
      >
        <div className="mt-2 flex flex-wrap items-center gap-2 md:mt-0">
          <Select value={leaveYearFilter} onValueChange={onLeaveYearFilterChange}>
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

          <Select value={leaveTypeFilter} onValueChange={onLeaveTypeFilterChange}>
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

          {tanstack.hook.keyword ||
          leaveYearFilter !== "all" ||
          leaveTypeFilter !== "all" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => {
                tanstack.hook.setKeyword("")
                onLeaveYearFilterChange("all")
                onLeaveTypeFilterChange("all")
                tanstack.hook.setPage(1)
              }}
            >
              <X className="size-4" />
              Reset
            </Button>
          ) : null}
        </div>
      </DataTable>

      {!isLoading ? (
        <p className="text-muted-foreground text-sm">
          {tableData.total} employee{tableData.total === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  )
}
