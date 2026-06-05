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

type DatesStepProps = {
  form: UseFormReturn<LeaveFormValues>
}

export function DatesStep({ form }: DatesStepProps) {
  const dateFrom = form.watch("date_from")

  return (
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
              disabledDate={(date) => {
                if (!dateFrom) return false
                const from = parseISO(dateFrom)
                return isValid(from) && date < from
              }}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
