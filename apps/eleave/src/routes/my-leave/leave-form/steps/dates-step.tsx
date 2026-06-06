import { Checkbox } from "@repo/ui/components/checkbox"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form"
import { isValid, parseISO } from "date-fns"
import type { UseFormReturn } from "react-hook-form"

import { DatePicker } from "@/components/shared/date-picker"

import type { LeaveFormValues } from "../schema"
import {
  getLeaveDayExclusionsFromForm,
  isWeekendExcludedDate,
} from "../utils"

type DatesStepProps = {
  form: UseFormReturn<LeaveFormValues>
}

export function DatesStep({ form }: DatesStepProps) {
  const dateFrom = form.watch("date_from")
  const excludeSundays = form.watch("exclude_sundays")
  const excludeSaturdays = form.watch("exclude_saturdays")
  const weekendExclusions = getLeaveDayExclusionsFromForm({
    exclude_sundays: excludeSundays,
    exclude_saturdays: excludeSaturdays,
  })

  const isDateDisabled = (date: Date, options?: { minDate?: string }) => {
    if (isWeekendExcludedDate(date, weekendExclusions)) {
      return true
    }

    if (options?.minDate) {
      const from = parseISO(options.minDate)
      if (isValid(from) && date < from) {
        return true
      }
    }

    return false
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="date_from"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date From</FormLabel>
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="Select start date"
                disabledDate={(date) => isDateDisabled(date)}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date_to"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date To</FormLabel>
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="Select end date"
                disabledDate={(date) => isDateDisabled(date, { minDate: dateFrom })}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-medium">Weekend exclusions</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          <FormField
            control={form.control}
            name="exclude_saturdays"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <FormLabel className="font-normal">Exclude Saturdays</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="exclude_sundays"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <FormLabel className="font-normal">Exclude Sundays</FormLabel>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}
