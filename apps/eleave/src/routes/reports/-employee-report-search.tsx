import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@repo/ui/components/popover"
import { useQuery } from "@tanstack/react-query"
import { Search, X } from "lucide-react"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import {
  getAvatarUrlFromEmpNo,
  getInitialsFromDisplayName,
} from "@/lib/employee-teacher-display"
import { searchEmployees, type EmployeeSearchRecord } from "@/lib/employees-api"
import { cn } from "@/lib/utils"

const MIN_QUERY_LENGTH = 2

export function formatReportEmployeeLabel(employee: EmployeeSearchRecord): string {
  const name = employee.name?.trim() || "Unknown employee"
  const empNo = employee.emp_no?.trim()

  return empNo ? `${name} (${empNo})` : name
}

type EmployeeReportSearchProps = {
  value: EmployeeSearchRecord | null
  onChange: (employee: EmployeeSearchRecord | null) => void
}

export function EmployeeReportSearch({
  value,
  onChange,
}: EmployeeReportSearchProps) {
  const [search, setSearch] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const trimmedSearch = search.trim()
  const debouncedSearch = useDebouncedValue(trimmedSearch, 300)
  const canSearch = !value && debouncedSearch.length >= MIN_QUERY_LENGTH

  const { data: hits = [], isFetching } = useQuery({
    queryKey: ["employee-search", "report", debouncedSearch],
    queryFn: () => searchEmployees(debouncedSearch),
    enabled: canSearch,
    refetchOnWindowFocus: false,
  })

  const showResults = open && !value && trimmedSearch.length >= MIN_QUERY_LENGTH

  return (
    <Popover open={showResults} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={value ? formatReportEmployeeLabel(value) : search}
            onChange={(event) => {
              if (value) {
                return
              }

              setSearch(event.target.value)
              setOpen(true)
            }}
            onFocus={() => {
              if (!value && trimmedSearch.length >= MIN_QUERY_LENGTH) {
                setOpen(true)
              }
            }}
            readOnly={value !== null}
            placeholder="Search employee by name or number"
            autoComplete="off"
            className={cn("h-9 pr-9 pl-8 text-sm", value && "bg-slate-50")}
            aria-label="Search employee"
          />
          {value ? (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              onClick={() => {
                onChange(null)
                setSearch("")
                setOpen(false)
              }}
              aria-label="Clear selected employee"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-1"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {trimmedSearch.length < MIN_QUERY_LENGTH ? (
          <p className="text-muted-foreground p-3 text-sm">
            Type at least {MIN_QUERY_LENGTH} characters to search.
          </p>
        ) : isFetching ? (
          <p className="text-muted-foreground p-3 text-sm">Searching employees…</p>
        ) : hits.length === 0 ? (
          <p className="text-muted-foreground p-3 text-sm">No employees found.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {hits.map((hit) => {
              const displayName = hit.name ?? "Unknown employee"
              const avatarUrl = getAvatarUrlFromEmpNo(hit.emp_no)

              return (
                <button
                  key={`${hit.emp_no ?? "unknown"}-${hit.user_id ?? "none"}`}
                  type="button"
                  className="hover:bg-muted flex w-full items-center gap-3 rounded-md px-2 py-2 text-left"
                  onClick={() => {
                    if (!hit.emp_no?.trim()) {
                      return
                    }

                    onChange(hit)
                    setSearch("")
                    setOpen(false)
                  }}
                >
                  <Avatar className="size-9 shrink-0">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                    <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                      {getInitialsFromDisplayName(hit.name, hit.emp_no)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{displayName}</p>
                    <p className="text-muted-foreground truncate text-xs">{hit.emp_no}</p>
                    {hit.position ? (
                      <p className="text-muted-foreground truncate text-xs">{hit.position}</p>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
