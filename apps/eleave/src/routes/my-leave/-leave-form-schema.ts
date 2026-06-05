import { z } from "zod"

export const leaveFormSchema = z
  .object({
    leave_type_id: z.string().min(1, "Leave type is required"),
    date_from: z.string().min(1, "Start date is required"),
    date_to: z.string().min(1, "End date is required"),
    reason: z
      .string()
      .trim()
      .min(1, "Reason is required")
      .max(2000, "Reason must be 2000 characters or less"),
    address: z
      .string()
      .trim()
      .min(1, "Address is required")
      .max(500, "Address must be 500 characters or less"),
  })
  .superRefine((data, ctx) => {
    if (data.date_from && data.date_to && data.date_to < data.date_from) {
      ctx.addIssue({
        code: "custom",
        message: "End date must be on or after start date.",
        path: ["date_to"],
      })
    }
  })

export type LeaveFormValues = z.infer<typeof leaveFormSchema>

export const leaveFormDefaults: LeaveFormValues = {
  leave_type_id: "",
  date_from: "",
  date_to: "",
  reason: "",
  address: "",
}
