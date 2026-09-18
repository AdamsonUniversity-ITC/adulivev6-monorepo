import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@repo/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import { Switch } from "@repo/ui/components/switch"
import { Textarea } from "@repo/ui/components/textarea"
import { toast } from "@repo/ui/exports"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import {
  useCreateLeaveType,
  useUpdateLeaveType,
} from "@/hooks/use-admin-leave-types"
import {
  FILING_TIMING_LABELS,
  FILING_TIMING_OPTIONS,
  getLeaveTypeValidationErrorMessage,
  getLeaveTypeValidationFieldErrors,
  type LeaveTypeRecord,
} from "@/lib/leave-types-api"

const formSchema = z.object({
  leave_code: z
    .string()
    .trim()
    .min(1, "Leave code is required.")
    .max(50, "Leave code is too long."),
  leave_name: z
    .string()
    .trim()
    .min(1, "Leave name is required.")
    .max(255, "Leave name is too long."),
  description: z.string().optional(),
  filing_timing: z.string().optional(),
  required_lead_days: z.coerce.number().int().min(0),
  display_order: z.coerce.number().int().min(0),
  is_active: z.boolean(),
  hide_leave_credits: z.boolean(),
  old_leave_type: z.string().optional(),
  requires_apply_credit_check: z.boolean(),
  apply_credit_error_message: z.string().optional(),
  enforces_dependent_care_limit: z.boolean(),
  dependent_care_yearly_limit: z.coerce.number().int().min(1).optional(),
})
  .superRefine((data, ctx) => {
    if (
      data.enforces_dependent_care_limit &&
      (data.dependent_care_yearly_limit == null ||
        Number.isNaN(data.dependent_care_yearly_limit) ||
        data.dependent_care_yearly_limit < 1)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a yearly limit of at least 1 when this limit is turned on.",
        path: ["dependent_care_yearly_limit"],
      })
    }
  })

type FormValues = z.infer<typeof formSchema>

type LeaveTypeFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: LeaveTypeRecord | null
}

const EMPTY_FILING = "__none__"

function defaultsFromRecord(record: LeaveTypeRecord | null): FormValues {
  return {
    leave_code: record?.leave_code ?? "",
    leave_name: record?.leave_name ?? "",
    description: record?.description ?? "",
    filing_timing: record?.filing_timing ?? "",
    required_lead_days: record?.required_lead_days ?? 0,
    display_order: record?.display_order ?? 0,
    is_active: record?.is_active ?? true,
    hide_leave_credits: record?.hide_leave_credits ?? false,
    old_leave_type: record?.old_leave_type ?? "",
    requires_apply_credit_check: record?.requires_apply_credit_check ?? false,
    apply_credit_error_message: record?.apply_credit_error_message ?? "",
    enforces_dependent_care_limit: record?.enforces_dependent_care_limit ?? false,
    dependent_care_yearly_limit: record?.dependent_care_yearly_limit ?? 2,
  }
}

export function LeaveTypeFormDialog({
  open,
  onOpenChange,
  record = null,
}: LeaveTypeFormDialogProps) {
  const isEdit = record != null
  const createMutation = useCreateLeaveType()
  const updateMutation = useUpdateLeaveType()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultsFromRecord(record),
  })

  React.useEffect(() => {
    if (open) {
      form.reset(defaultsFromRecord(record))
    }
  }, [open, record, form])

  const requiresCreditCheck = form.watch("requires_apply_credit_check")
  const enforcesDependentCare = form.watch("enforces_dependent_care_limit")
  const pending = createMutation.isPending || updateMutation.isPending

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      leave_name: values.leave_name.trim(),
      description: values.description?.trim() || null,
      filing_timing: values.filing_timing?.trim() || null,
      required_lead_days: values.required_lead_days,
      display_order: values.display_order,
      is_active: values.is_active,
      hide_leave_credits: values.hide_leave_credits,
      ...(isEdit
        ? { old_leave_type: values.old_leave_type?.trim() || null }
        : {}),
      requires_apply_credit_check: values.requires_apply_credit_check,
      apply_credit_error_message: values.requires_apply_credit_check
        ? values.apply_credit_error_message?.trim() || null
        : null,
      enforces_dependent_care_limit: values.enforces_dependent_care_limit,
      dependent_care_yearly_limit: values.enforces_dependent_care_limit
        ? values.dependent_care_yearly_limit
        : null,
    }

    try {
      if (isEdit && record) {
        await updateMutation.mutateAsync({ id: record.id, payload })
        toast.success("Leave type updated.")
      } else {
        await createMutation.mutateAsync({
          ...payload,
          leave_code: values.leave_code.trim().toLowerCase(),
        })
        toast.success("Leave type created.")
      }
      onOpenChange(false)
    } catch (error) {
      const fieldErrors = getLeaveTypeValidationFieldErrors(error)
      if (fieldErrors) {
        for (const [field, message] of Object.entries(fieldErrors)) {
          form.setError(field as keyof FormValues, { message })
        }
      }
      toast.error(
        getLeaveTypeValidationErrorMessage(error) ??
          (isEdit
            ? "Could not save changes to this leave type."
            : "Could not add this leave type."),
      )
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit leave type" : "Add leave type"}</DialogTitle>
          <DialogDescription>
            Set how this leave type is filed, shown, and limited. Some eligibility
            rules (such as who can file SIL, forced leave, or paternity/maternity
            leave) are still based on employee profile and cannot be changed here.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="leave-code">Short code</Label>
              <Input
                id="leave-code"
                disabled={isEdit || pending}
                placeholder="e.g. sil"
                {...form.register("leave_code")}
              />
              {form.formState.errors.leave_code ? (
                <p className="text-destructive text-xs">
                  {form.formState.errors.leave_code.message}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Short identifier used in the system (cannot change after creating).
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="leave-name">Leave name</Label>
              <Input
                id="leave-name"
                disabled={pending}
                {...form.register("leave_name")}
              />
              {form.formState.errors.leave_name ? (
                <p className="text-destructive text-xs">
                  {form.formState.errors.leave_name.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leave-description">Description</Label>
            <Textarea
              id="leave-description"
              disabled={pending}
              rows={3}
              {...form.register("description")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>When employees may file</Label>
              <Controller
                control={form.control}
                name="filing_timing"
                render={({ field }) => (
                  <Select
                    disabled={pending}
                    value={field.value || EMPTY_FILING}
                    onValueChange={(value) =>
                      field.onChange(value === EMPTY_FILING ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select when filing is allowed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY_FILING}>No restriction</SelectItem>
                      {FILING_TIMING_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {FILING_TIMING_LABELS[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="required-lead-days">Days in advance</Label>
              <Input
                id="required-lead-days"
                type="number"
                min={0}
                disabled={pending}
                {...form.register("required_lead_days")}
              />
              <p className="text-muted-foreground text-xs">
                How many days before (or after) filing is required. Use 0 if none.
              </p>
            </div>
          </div>

          <div className={isEdit ? "grid gap-4 sm:grid-cols-2" : "space-y-2"}>
            <div className="space-y-2">
              <Label htmlFor="display-order">List order</Label>
              <Input
                id="display-order"
                type="number"
                min={0}
                disabled={pending}
                {...form.register("display_order")}
              />
              {form.formState.errors.display_order ? (
                <p className="text-destructive text-xs">
                  {form.formState.errors.display_order.message}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Lower numbers appear first. Each leave type needs its own number.
                </p>
              )}
            </div>

            {isEdit ? (
              <div className="space-y-2">
                <Label htmlFor="old-leave-type">Old HR system name</Label>
                <Input
                  id="old-leave-type"
                  disabled={pending}
                  placeholder="Optional"
                  {...form.register("old_leave_type")}
                />
                <p className="text-muted-foreground text-xs">
                  Matching name from the older HR leave records, if any.
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <Controller
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Available for filing</p>
                    <p className="text-muted-foreground text-xs">
                      Turn off to hide this leave type from employees when they
                      apply.
                    </p>
                  </div>
                  <Switch
                    checked={field.value}
                    disabled={pending}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="hide_leave_credits"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Hide leave balance</p>
                    <p className="text-muted-foreground text-xs">
                      Hide remaining days/credits for this leave type on employee
                      screens.
                    </p>
                  </div>
                  <Switch
                    checked={field.value}
                    disabled={pending}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="requires_apply_credit_check"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Check remaining balance on apply</p>
                    <p className="text-muted-foreground text-xs">
                      Stop the employee from applying if they do not have enough
                      remaining days.
                    </p>
                  </div>
                  <Switch
                    checked={field.value}
                    disabled={pending}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />

            {requiresCreditCheck ? (
              <div className="space-y-2">
                <Label htmlFor="credit-error-message">Message when balance is too low</Label>
                <Input
                  id="credit-error-message"
                  disabled={pending}
                  placeholder="Insufficient leave credits for the selected dates."
                  {...form.register("apply_credit_error_message")}
                />
              </div>
            ) : null}

            <Controller
              control={form.control}
              name="enforces_dependent_care_limit"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Limit dependent care filings</p>
                    <p className="text-muted-foreground text-xs">
                      Limit how many times an employee can file this leave with
                      &quot;dependent&quot; in the reason each year. This is a use
                      count, not a leave balance.
                    </p>
                  </div>
                  <Switch
                    checked={field.value}
                    disabled={pending}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />

            {enforcesDependentCare ? (
              <div className="space-y-2">
                <Label htmlFor="dependent-care-yearly-limit">
                  Maximum uses per year
                </Label>
                <Input
                  id="dependent-care-yearly-limit"
                  type="number"
                  min={1}
                  disabled={pending}
                  {...form.register("dependent_care_yearly_limit")}
                />
                {form.formState.errors.dependent_care_yearly_limit ? (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.dependent_care_yearly_limit.message}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Set this once. The count starts over each calendar year.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
