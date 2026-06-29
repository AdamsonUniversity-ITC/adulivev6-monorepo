import { z } from "zod"

export const DAY_PORTION_OPTIONS = [
  { value: "wholeday", label: "Whole day" },
  { value: "am", label: "AM" },
  { value: "pm", label: "PM" },
  { value: "evening", label: "Evening" },
] as const

export const dayPortionSchema = z.enum(["wholeday", "am", "pm", "evening"])

export type DayPortion = z.infer<typeof dayPortionSchema>

export function getSelectableDayPortionOptions(
  canSelectEvening: boolean,
  currentPortion?: DayPortion | "",
) {
  const base = DAY_PORTION_OPTIONS.filter((option) => option.value !== "evening")

  if (canSelectEvening || currentPortion === "evening") {
    return [...base, { value: "evening", label: "Evening" } as const]
  }

  return base
}

export const leaveDaySchema = z.object({
  date: z.string().min(1),
  day_portion: z
    .union([dayPortionSchema, z.literal("")])
    .refine((value): value is DayPortion => value !== "", {
      message: "Select a day portion.",
    }),
})

export type LeaveDay = z.infer<typeof leaveDaySchema>

function validateDateRange(
  data: { date_from: string; date_to: string },
  ctx: z.RefinementCtx,
) {
  if (data.date_from && data.date_to && data.date_to < data.date_from) {
    ctx.addIssue({
      code: "custom",
      message: "End date must be on or after start date.",
      path: ["date_to"],
    })
  }
}

export const leaveFormStep1Schema = z
  .object({
    date_from: z.string().min(1, "Start date is required"),
    date_to: z.string().min(1, "End date is required"),
    exclude_sundays: z.boolean(),
    exclude_saturdays: z.boolean(),
  })
  .superRefine(validateDateRange)

export const leaveFormStep2Schema = z.object({
  leave_type_id: z.string().min(1, "Leave type is required"),
  leave_days: z
    .array(leaveDaySchema)
    .min(1, "At least one leave day is required"),
})

const supportingDocumentsSchema = z
  .array(z.instanceof(File))
  .max(10, "You can upload up to 10 supporting documents")

export const leaveFormStep3Schema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .max(2000, "Reason must be 2000 characters or less"),
  supporting_documents: supportingDocumentsSchema.default([]),
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .max(500, "Address must be 500 characters or less"),
})

export const leaveFormSchema = z
  .object({
    date_from: z.string().min(1, "Start date is required"),
    date_to: z.string().min(1, "End date is required"),
    exclude_sundays: z.boolean(),
    exclude_saturdays: z.boolean(),
    leave_type_id: z.string().min(1, "Leave type is required"),
    leave_days: z
      .array(leaveDaySchema)
      .min(1, "At least one leave day is required"),
    reason: z
      .string()
      .trim()
      .min(1, "Reason is required")
      .max(2000, "Reason must be 2000 characters or less"),
    supporting_documents: supportingDocumentsSchema.default([]),
    address: z
      .string()
      .trim()
      .min(1, "Address is required")
      .max(500, "Address must be 500 characters or less"),
  })
  .superRefine(validateDateRange)

export type LeaveFormValues = z.infer<typeof leaveFormSchema>

export const leaveFormDefaults: LeaveFormValues = {
  date_from: "",
  date_to: "",
  exclude_sundays: true,
  exclude_saturdays: false,
  leave_type_id: "",
  leave_days: [],
  reason: "",
  supporting_documents: [],
  address: "",
}

export const LEAVE_FORM_STEP_LABELS = [
  "Date range",
  "Leave type & days",
  "Details",
  "Review",
] as const

export const TOTAL_LEAVE_FORM_STEPS = LEAVE_FORM_STEP_LABELS.length
