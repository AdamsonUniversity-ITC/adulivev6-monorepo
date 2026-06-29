import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import { CalendarDays, ClipboardList } from "lucide-react"
import * as React from "react"
import type { UseFormReturn } from "react-hook-form"

import { useLeaveTypes } from "@/hooks/use-leave-types"
import { validateLeaveFilingTiming } from "@/lib/validate-leave-filing-timing"
import { cn } from "@/lib/utils"

import { getSelectableDayPortionOptions, type LeaveFormValues } from "../schema"
import { formatLeaveDay, formatLeaveDayCount, sumLeaveDayCredits } from "../utils"
import { StepSection, stepFieldClassName } from "./-step-section"

type TypeDaysStepProps = {
  form: UseFormReturn<LeaveFormValues>
  canSelectEvening: boolean
}

export function TypeDaysStep({ form, canSelectEvening }: TypeDaysStepProps) {
  const leaveDays = form.watch("leave_days")
  const dateFrom = form.watch("date_from")
  const dateTo = form.watch("date_to")
  const leaveTypeId = form.watch("leave_type_id")
  const totalDays = sumLeaveDayCredits(leaveDays)
  const { data: leaveTypes = [], isLoading, isError } = useLeaveTypes()

  const syncLeaveTypeTimingError = React.useCallback(
    (nextLeaveTypeId: string) => {
      if (!nextLeaveTypeId || !dateFrom || !dateTo) {
        form.clearErrors("leave_type_id")
        return
      }

      const leaveType = leaveTypes.find((type) => String(type.id) === nextLeaveTypeId)
      if (!leaveType) {
        form.clearErrors("leave_type_id")
        return
      }

      const message = validateLeaveFilingTiming(leaveType, dateFrom, dateTo)
      if (message) {
        form.setError("leave_type_id", { message })
        return
      }

      form.clearErrors("leave_type_id")
    },
    [dateFrom, dateTo, form, leaveTypes],
  )

  React.useEffect(() => {
    if (leaveTypeId) {
      syncLeaveTypeTimingError(leaveTypeId)
    }
  }, [leaveTypeId, syncLeaveTypeTimingError])

  return (
    <div className="space-y-4">
      <StepSection
        icon={ClipboardList}
        title="Leave type"
        description="Choose the type of leave you are filing."
      >
        <FormField
          control={form.control}
          name="leave_type_id"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className="sr-only">Leave Type</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value)
                  syncLeaveTypeTimingError(value)
                }}
                value={field.value}
                disabled={isLoading || isError}
              >
                <FormControl>
                  <SelectTrigger className={cn("h-11 w-full", stepFieldClassName)}>
                    <SelectValue
                      placeholder={
                        isLoading
                          ? "Loading leave types..."
                          : isError
                            ? "Unable to load leave types"
                            : "Select leave type"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.leave_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isError ? (
                <p className="text-destructive text-sm">
                  Leave types could not be loaded. Please refresh and try again.
                </p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />
      </StepSection>

      <StepSection
        icon={CalendarDays}
        title="Leave days"
        description="Set the day portion for each date in your range."
      >
        {totalDays > 0 ? (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Total days
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {formatLeaveDayCount(totalDays)}
            </span>
          </div>
        ) : null}

        {leaveDays.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm">
            Select a valid date range in Step 1 to configure leave days.
          </div>
        ) : (
          <div className="space-y-2 pr-1">
            {leaveDays.map((day, index) => (
              <FormField
                key={day.date}
                control={form.control}
                name={`leave_days.${index}.day_portion`}
                render={({ field }) => (
                  <FormItem>
                    <div
                      className={cn(
                        "flex flex-col gap-3 rounded-xl border px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between",
                        index % 2 === 0 ? "border-slate-200 bg-white" : "border-slate-200/80 bg-slate-50/60",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium">{formatLeaveDay(day.date)}</span>
                      </div>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className={cn("h-10 w-full sm:w-44", stepFieldClassName)}>
                            <SelectValue placeholder="Select portion" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getSelectableDayPortionOptions(
                            canSelectEvening,
                            field.value,
                          ).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        )}

        {form.formState.errors.leave_days?.message ? (
          <p className="text-destructive mt-3 text-sm">
            {form.formState.errors.leave_days.message}
          </p>
        ) : null}
      </StepSection>
    </div>
  )
}
