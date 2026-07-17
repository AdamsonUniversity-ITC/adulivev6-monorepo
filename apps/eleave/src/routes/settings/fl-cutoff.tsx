import { Button } from "@repo/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card"
import { createFileRoute } from "@tanstack/react-router"
import { Settings2 } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useFlCutoffPreferences,
  useUpdateFlCutoffPreferences,
} from "@/hooks/use-fl-cutoff-preferences"

export const Route = createFileRoute("/settings/fl-cutoff")({
  component: FlCutoffSettingsPage,
})

function FlCutoffSettingsPage() {
  const { data, isLoading, isError } = useFlCutoffPreferences()
  const updateMutation = useUpdateFlCutoffPreferences()

  const [schoolYear, setSchoolYear] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")

  React.useEffect(() => {
    const preference = data?.data
    const systemSchoolYear = data?.meta.system_school_year ?? ""

    setSchoolYear(preference?.school_year ?? systemSchoolYear)
    setStartDate(preference?.start_date ?? "")
    setEndDate(preference?.end_date ?? "")
  }, [data])

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (schoolYear.trim() === "" || startDate === "" || endDate === "") {
        toast.error("School year, start date, and end date are required.")
        return
      }

      try {
        await updateMutation.mutateAsync({
          school_year: schoolYear.trim(),
          start_date: startDate,
          end_date: endDate,
        })
        toast.success("FL cutoff preferences saved.")
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to save FL cutoff preferences.",
        )
      }
    },
    [endDate, schoolYear, startDate, updateMutation],
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-indigo-200/80 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_55%),linear-gradient(90deg,_#eef2ff_0%,_#ffffff_100%)] p-4 sm:p-5">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-900 shadow-sm">
            Settings
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            FL Cutoff Settings
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
            Configure the forced leave school year and computation window used for
            balance deductions and after-cutoff reporting.
          </p>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Settings2 className="size-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Forced leave cutoff period</CardTitle>
              <CardDescription>
                School year must match system preferences and emp_leave_credit_sy.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading preferences...</p>
          ) : isError ? (
            <p className="text-destructive text-sm">
              Unable to load FL cutoff preferences.
            </p>
          ) : (
            <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
              <div className="space-y-2">
                <Label htmlFor="fl-cutoff-school-year">School year</Label>
                <Input
                  id="fl-cutoff-school-year"
                  value={schoolYear}
                  onChange={(event) => setSchoolYear(event.target.value)}
                  placeholder={data?.meta.system_school_year ?? "2025-2026"}
                  required
                />
                {data?.meta.system_school_year ? (
                  <p className="text-muted-foreground text-xs">
                    System school year: {data.meta.system_school_year}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fl-cutoff-start-date">Start date</Label>
                  <Input
                    id="fl-cutoff-start-date"
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fl-cutoff-end-date">End date</Label>
                  <Input
                    id="fl-cutoff-end-date"
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    min={startDate || undefined}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save preferences"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
