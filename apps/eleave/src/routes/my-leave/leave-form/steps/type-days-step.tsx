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
import type { UseFormReturn } from "react-hook-form"

import { useLeaveTypes } from "@/hooks/use-leave-types"

import { DAY_PORTION_OPTIONS, type LeaveFormValues } from "../schema"
import { formatLeaveDay } from "../utils"

type TypeDaysStepProps = {
  form: UseFormReturn<LeaveFormValues>
}

export function TypeDaysStep({ form }: TypeDaysStepProps) {
  const leaveDays = form.watch("leave_days")
  const { data: leaveTypes = [], isLoading, isError } = useLeaveTypes()

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="leave_type_id"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Leave Type</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isLoading || isError}
            >
              <FormControl>
                <SelectTrigger className="w-full">
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

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <FormLabel>Leave days</FormLabel>
          <span className="text-muted-foreground text-xs">
            {leaveDays.length} day{leaveDays.length === 1 ? "" : "s"}
          </span>
        </div>

        {leaveDays.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
            Select a valid date range in Step 1 to configure leave days.
          </p>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border p-3">
            {leaveDays.map((day, index) => (
              <FormField
                key={day.date}
                control={form.control}
                name={`leave_days.${index}.day_portion`}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm">{formatLeaveDay(day.date)}</span>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Select portion" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DAY_PORTION_OPTIONS.map((option) => (
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
          <p className="text-destructive text-sm">
            {form.formState.errors.leave_days.message}
          </p>
        ) : null}
      </div>
    </div>
  )
}