import type { ColumnDef } from "@tanstack/react-table"
import * as React from "react"

import DataTable from "@/components/shared/datatable/DataTable"
import type {
  RecordPagination,
  TanstackType,
} from "@/components/shared/datatable/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type {
  EmployeeLeaveCreditsRow,
  PaginatedEmployeeLeaveCreditsResponse,
} from "@/lib/employee-leave-credits-api"
import {
  formatEmployeeName,
  getAvatarUrlFromEmpNo,
  getEmployeeDepartment,
  getInitialsFromDisplayName,
} from "@/lib/employee-teacher-display"
import { groupLeaveBalanceRowsByCode } from "@/lib/group-leave-balance-rows"

import { ViewEmployeeLeaveCreditsSheet } from "./-view-employee-leave-credits-sheet"

function mapToRecordPagination(
  response: PaginatedEmployeeLeaveCreditsResponse | undefined,
): RecordPagination {
  const rows = response?.data ?? []
  const meta = response?.meta
  const total = meta?.total ?? 0
  const currentPage = meta?.current_page ?? 1
  const perPage = meta?.per_page ?? 10
  const from = meta?.from ?? (total === 0 ? 0 : (currentPage - 1) * perPage + 1)
  const to = meta?.to ?? (total === 0 ? 0 : from + rows.length - 1)

  return {
    current_page: currentPage,
    data: rows,
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

function countActiveLeaveTypes(row: EmployeeLeaveCreditsRow): number {
  return groupLeaveBalanceRowsByCode(row.leave_credits).filter(
    (credit) => credit.credits > 0,
  ).length
}

function hasActiveCredits(row: EmployeeLeaveCreditsRow): boolean {
  return row.leave_credits.some((credit) => credit.credits > 0)
}

type EmployeeLeaveCreditsDataTableProps = {
  tanstack: TanstackType
  response: PaginatedEmployeeLeaveCreditsResponse | undefined
  isLoading?: boolean
  isError?: boolean
}

export function EmployeeLeaveCreditsDataTable({
  tanstack,
  response,
  isLoading = false,
  isError = false,
}: EmployeeLeaveCreditsDataTableProps) {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [activeRow, setActiveRow] = React.useState<EmployeeLeaveCreditsRow | null>(
    null,
  )

  const openCreditsSheet = React.useCallback((row: EmployeeLeaveCreditsRow) => {
    setActiveRow(row)
    setIsSheetOpen(true)
  }, [])

  const columns = React.useMemo<ColumnDef<EmployeeLeaveCreditsRow>[]>(
    () => [
      {
        id: "employee",
        accessorKey: "employee_no",
        header: "Employee",
        cell: ({ row }) => {
          const item = row.original
          const displayName = formatEmployeeName(item.employee, item.employee_no)
          const avatarUrl = getAvatarUrlFromEmpNo(item.employee_no)

          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-10 shrink-0">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                  {item.employee
                    ? getInitialsFromDisplayName(
                        [item.employee.first_name, item.employee.last_name]
                          .filter(Boolean)
                          .join(" "),
                        item.employee_no,
                      )
                    : getInitialsFromDisplayName(null, item.employee_no)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {item.employee_no}
                </p>
                <p className="text-muted-foreground text-xs">
                  {getEmployeeDepartment(item.employee)}
                </p>
              </div>
            </div>
          )
        },
      },
      {
        id: "active_types",
        header: "Active leave types",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {countActiveLeaveTypes(row.original)}
          </span>
        ),
      },
      {
        id: "credits",
        header: "Credits",
        enableHiding: false,
        cell: ({ row }) => {
          const item = row.original

          if (!hasActiveCredits(item)) {
            return (
              <span className="text-muted-foreground text-sm">No active credits</span>
            )
          }

          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openCreditsSheet(item)}
            >
              View credits
            </Button>
          )
        },
      },
    ],
    [openCreditsSheet],
  )

  const tableData = React.useMemo(
    () => mapToRecordPagination(response),
    [response],
  )

  if (isError) {
    return (
      <div className="text-destructive rounded-md border border-dashed px-4 py-10 text-center text-sm">
        Unable to load employee leave credits. Please try again.
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <DataTable<EmployeeLeaveCreditsRow>
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
        />

        {!isLoading ? (
          <p className="text-muted-foreground text-sm">
            {tableData.total} employee{tableData.total === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      <ViewEmployeeLeaveCreditsSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        activeRow={activeRow}
      />
    </>
  )
}
