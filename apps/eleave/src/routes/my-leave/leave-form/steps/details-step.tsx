import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form"
import { Textarea } from "@repo/ui/components/textarea"
import { FileText, MapPin, Paperclip } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"

import { FileDropzone } from "@/components/shared/file-dropzone"

import type { LeaveFormValues } from "../schema"
import { StepSection, stepTextareaClassName } from "./-step-section"

type DetailsStepProps = {
  form: UseFormReturn<LeaveFormValues>
}

export function DetailsStep({ form }: DetailsStepProps) {
  const reason = form.watch("reason")
  const address = form.watch("address")

  return (
    <div className="space-y-4">
      <StepSection
        icon={FileText}
        title="Reason for leave"
        description="Briefly explain why you are filing this request."
      >
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Reason</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="State the reason for your leave"
                  rows={4}
                  className={stepTextareaClassName}
                  {...field}
                />
              </FormControl>
              <div className="flex items-center justify-between gap-2">
                <FormMessage />
                <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                  {reason.length}/2000
                </span>
              </div>
            </FormItem>
          )}
        />
      </StepSection>

      <StepSection
        icon={Paperclip}
        title="Supporting documents"
        description="Attach any files that support your leave request, such as medical certificates or travel documents."
      >
        <FormField
          control={form.control}
          name="supporting_documents"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Supporting documents</FormLabel>
              <FormControl>
                <FileDropzone
                  files={field.value ?? []}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </StepSection>

      <StepSection
        icon={MapPin}
        title="Address while on leave"
        description="Where you can be reached during your leave period."
      >
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Address while on leave</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Address while on leave"
                  rows={3}
                  className={stepTextareaClassName}
                  {...field}
                />
              </FormControl>
              <div className="flex items-center justify-between gap-2">
                <FormMessage />
                <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                  {address.length}/500
                </span>
              </div>
            </FormItem>
          )}
        />
      </StepSection>
    </div>
  )
}
