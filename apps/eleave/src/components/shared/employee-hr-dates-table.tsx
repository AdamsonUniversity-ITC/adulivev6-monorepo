import { CalendarDays } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table"

import { Skeleton } from "@/components/ui/skeleton"
import { formatHrDate } from "@/lib/format-hr-date"
import { cn } from "@/lib/utils"

export type EmployeeHrDatesRow = {
  label: string
  value: string | null
}

type EmployeeHrDatesTableProps = {
  className?: string
  birthdate?: string | null
  dateHired?: string | null
  permanencyDate?: string | null
  isLoading?: boolean
  isError?: boolean
}

export function EmployeeHrDatesTable({
  className,
  birthdate,
  dateHired,
  permanencyDate,
  isLoading = false,
  isError = false,
}: EmployeeHrDatesTableProps) {
  const rows: EmployeeHrDatesRow[] = [
    { label: "Birthdate", value: birthdate ?? null },
    { label: "Date Hired", value: dateHired ?? null },
    { label: "Date of Permanency", value: permanencyDate ?? null },
  ]

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
            <CalendarDays className="size-4" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold">Key Dates</p>
            <p className="text-muted-foreground text-sm">
              {isLoading
                ? "Loading key dates…"
                : isError
                  ? "Unable to load key dates."
                  : "Employee HR record dates"}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 px-4 py-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-muted-foreground px-4 py-6 text-sm">
            Key dates could not be loaded. Please refresh the page or try again
            later.
          </p>
        ) : (
          <Table>
            <TableHeader className="bg-muted/60 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 px-4 text-xs font-semibold">
                  Field
                </TableHead>
                <TableHead className="h-10 px-4 text-xs font-semibold">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label} className="border-border/60">
                  <TableCell className="px-4 py-2.5 text-sm font-medium">
                    {row.label}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-sm tabular-nums">
                    {formatHrDate(row.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
