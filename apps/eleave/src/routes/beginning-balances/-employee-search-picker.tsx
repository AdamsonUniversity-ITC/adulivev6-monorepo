import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { useQuery } from "@tanstack/react-query"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import {
  getAvatarUrlFromEmpNo,
  getInitialsFromDisplayName,
} from "@/lib/employee-teacher-display"
import { searchEmployees, type EmployeeSearchRecord } from "@/lib/employees-api"

const MIN_QUERY_LENGTH = 2

type EmployeeSearchPickerProps = {
  value: EmployeeSearchRecord | null
  onChange: (employee: EmployeeSearchRecord | null) => void
  disabled?: boolean
  error?: string
}

function EmployeeSearchAvatar({
  employee,
  size = "md",
}: {
  employee: Pick<EmployeeSearchRecord, "emp_no" | "name" | "position" | "email">
  size?: "md" | "sm"
}) {
  const avatarUrl = getAvatarUrlFromEmpNo(employee.emp_no)
  const displayName = employee.name ?? "Unknown"
  const avatarSize = size === "sm" ? "size-9" : "size-10"

  return (
    <>
      <Avatar className={`${avatarSize} shrink-0`}>
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={displayName} />
        ) : null}
        <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
          {getInitialsFromDisplayName(employee.name, employee.emp_no)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{displayName}</p>
        <p className="text-muted-foreground truncate text-xs">{employee.emp_no}</p>
        {employee.position ? (
          <p className="text-muted-foreground truncate text-xs">
            {employee.position?.split(" · ").filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>
    </>
  )
}

export function EmployeeSearchPicker({
  value,
  onChange,
  disabled = false,
  error,
}: EmployeeSearchPickerProps) {
  const [search, setSearch] = React.useState("")
  const trimmedSearch = search.trim()
  const debouncedSearch = useDebouncedValue(trimmedSearch, 300)

  const { data: hits = [], isFetching } = useQuery({
    queryKey: ["employee-search", debouncedSearch],
    queryFn: () => searchEmployees(debouncedSearch),
    enabled: !disabled && debouncedSearch.length >= MIN_QUERY_LENGTH,
    refetchOnWindowFocus: false,
  })

  return (
    <div className="space-y-2">
      <Label htmlFor="employee-search">Employee</Label>
      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <EmployeeSearchAvatar employee={value} />
          </div>
          {!disabled ? (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground shrink-0 text-xs underline"
              onClick={() => {
                onChange(null)
                setSearch("")
              }}
            >
              Change
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <Input
            id="employee-search"
            placeholder="Search by name, employee no, or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={disabled}
            autoComplete="off"
          />
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-1">
            {trimmedSearch.length < MIN_QUERY_LENGTH ? (
              <p className="text-muted-foreground p-3 text-sm">
                Type at least {MIN_QUERY_LENGTH} characters to search.
              </p>
            ) : isFetching ? (
              <p className="text-muted-foreground p-3 text-sm">Searching…</p>
            ) : hits.length === 0 ? (
              <p className="text-muted-foreground p-3 text-sm">No employees found.</p>
            ) : (
              hits.map((hit) => (
                <button
                  key={`${hit.emp_no ?? "unknown"}-${hit.user_id ?? "none"}`}
                  type="button"
                  className="hover:bg-muted flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors"
                  onClick={() => {
                    onChange(hit)
                    setSearch("")
                  }}
                >
                  <EmployeeSearchAvatar employee={hit} size="sm" />
                </button>
              ))
            )}
          </div>
        </>
      )}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
