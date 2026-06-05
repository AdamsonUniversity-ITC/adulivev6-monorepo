import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form"
import { Textarea } from "@repo/ui/components/textarea"
import type { UseFormReturn } from "react-hook-form"

import type { LeaveFormValues } from "../schema"

type DetailsStepProps = {
  form: UseFormReturn<LeaveFormValues>
}

export function DetailsStep({ form }: DetailsStepProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="reason"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reason</FormLabel>
            <FormControl>
              <Textarea
                placeholder="State the reason for your leave"
                rows={4}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address while on leave</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Address while on leave"
                rows={3}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
