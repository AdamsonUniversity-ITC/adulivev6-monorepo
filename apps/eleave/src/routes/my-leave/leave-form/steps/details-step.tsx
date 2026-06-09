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
import { useElDependentCareUsage } from "@/hooks/use-el-dependent-care-usage"
import { useLeaveTypes } from "@/hooks/use-leave-types"
import { cn } from "@/lib/utils"

import type { LeaveFormValues } from "../schema"
import {
  isEmergencyLeaveType,
  reasonContainsDependentCare,
} from "../utils"
import { StepSection, stepTextareaClassName } from "./-step-section"

type DetailsStepProps = {
  form: UseFormReturn<LeaveFormValues>
}

export function DetailsStep({ form }: DetailsStepProps) {
  const reason = form.watch("reason")
  const address = form.watch("address")
  const leaveTypeId = form.watch("leave_type_id")
  const { data: leaveTypes = [] } = useLeaveTypes()

  const isEmergencyLeave = isEmergencyLeaveType(leaveTypeId, leaveTypes)
  const showsDependentCareUsage =
    isEmergencyLeave && reasonContainsDependentCare(reason)

  const { data: dependentCareUsage, isLoading: isDependentCareUsageLoading } =
    useElDependentCareUsage(isEmergencyLeave)

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
              {showsDependentCareUsage ? (
                <p
                  className={cn(
                    "text-sm",
                    dependentCareUsage?.remaining === 0
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {isDependentCareUsageLoading
                    ? "Checking Dependent care usage for this year…"
                    : dependentCareUsage
                      ? dependentCareUsage.remaining === 0
                        ? `Dependent care: ${dependentCareUsage.used} of ${dependentCareUsage.limit} uses this year. You cannot file another Emergency Leave with this reason.`
                        : `Dependent care: ${dependentCareUsage.used} of ${dependentCareUsage.limit} uses this year (${dependentCareUsage.remaining} remaining).`
                      : null}
                </p>
              ) : null}
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
