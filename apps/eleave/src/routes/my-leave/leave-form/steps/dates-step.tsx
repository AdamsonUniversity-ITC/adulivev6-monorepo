import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form"
import { isValid, parseISO } from "date-fns"
import { CalendarRange, Sun } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"

import { DatePicker } from "@/components/shared/date-picker"

import type { LeaveFormValues } from "../schema"
import {
  getLeaveDayExclusionsFromForm,
  isWeekendExcludedDate,
} from "../utils"
import { StepSection, StepToggleCard } from "./-step-section"

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
      <StepSection
        icon={CalendarRange}
        title="Leave period"
        description="Pick when your leave starts and ends."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="date_from"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Start date
                </FormLabel>
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
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  End date
                </FormLabel>
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
      </StepSection>

      <StepSection
        icon={Sun}
        title="Weekend exclusions"
        description="Optional — skip Saturdays or Sundays when counting leave days."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="exclude_saturdays"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <StepToggleCard
                    label="Exclude Saturdays"
                    description="Saturday dates won't be included in your leave days."
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="exclude_sundays"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <StepToggleCard
                    label="Exclude Sundays"
                    description="Sunday dates won't be included in your leave days."
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </StepSection>
    </div>
  )
}
