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
import { Switch } from "@repo/ui/components/switch"
import { Textarea } from "@repo/ui/components/textarea"
import { toast } from "@repo/ui/exports"
import * as React from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { EmailPreviewFrame } from "@/components/email-preview-frame"
import {
  useApplicantFollowUpRemarkPreview,
  useCreateApplicantFollowUpRemark,
  useUpdateApplicantFollowUpRemark,
} from "@/hooks/use-applicant-emails"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import {
  FOLLOW_UP_REMARK_TEXT_MAX_LENGTH,
  type ApplicantFollowUpRemarkRecord,
} from "@/lib/applicant-emails-api"
import { getValidationErrorMessage, getValidationFieldErrors } from "@/lib/leave-applications-api"

const PREVIEW_DEBOUNCE_MS = 400

const formSchema = z.object({
  label: z.string().trim().min(1, "Label is required.").max(255, "Label is too long."),
  text: z
    .string()
    .trim()
    .min(1, "Remark is required.")
    .max(
      FOLLOW_UP_REMARK_TEXT_MAX_LENGTH,
      `Remark must be ${FOLLOW_UP_REMARK_TEXT_MAX_LENGTH} characters or fewer.`,
    ),
  display_order: z.string().trim().regex(/^\d+$/, "Order must be a whole number (0 or more)."),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

type ApplicantFollowUpRemarkFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: ApplicantFollowUpRemarkRecord | null
  nextDisplayOrder: number
}

function defaultsFromRecord(
  record: ApplicantFollowUpRemarkRecord | null,
  nextDisplayOrder: number,
): FormValues {
  return {
    label: record?.label ?? "",
    text: record?.text ?? "",
    display_order: String(record?.display_order ?? nextDisplayOrder),
    is_active: record?.is_active ?? true,
  }
}

export function ApplicantFollowUpRemarkFormDialog({
  open,
  onOpenChange,
  record = null,
  nextDisplayOrder,
}: ApplicantFollowUpRemarkFormDialogProps) {
  const isEdit = record != null
  const createMutation = useCreateApplicantFollowUpRemark()
  const updateMutation = useUpdateApplicantFollowUpRemark()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultsFromRecord(record, nextDisplayOrder),
  })

  React.useEffect(() => {
    if (open) {
      form.reset(defaultsFromRecord(record, nextDisplayOrder))
    }
  }, [open, record, nextDisplayOrder, form])

  const pending = createMutation.isPending || updateMutation.isPending

  const trimmedText = (useWatch({ control: form.control, name: "text" }) ?? "").trim()
  const debouncedText = useDebouncedValue(trimmedText, PREVIEW_DEBOUNCE_MS)
  const previewText =
    open && debouncedText !== "" && debouncedText.length <= FOLLOW_UP_REMARK_TEXT_MAX_LENGTH
      ? debouncedText
      : null
  const previewQuery = useApplicantFollowUpRemarkPreview(previewText)
  const previewIsCurrent =
    previewText != null &&
    debouncedText === trimmedText &&
    !previewQuery.isFetching &&
    !previewQuery.isError &&
    previewQuery.data != null
  const previewUpdating =
    previewText != null &&
    trimmedText !== "" &&
    (previewQuery.isFetching || debouncedText !== trimmedText)

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      label: values.label.trim(),
      text: values.text.trim(),
      display_order: Number(values.display_order),
      is_active: values.is_active,
    }

    try {
      if (isEdit && record) {
        await updateMutation.mutateAsync({ id: record.id, payload })
        toast.success("Follow-up remark updated.")
      } else {
        await createMutation.mutateAsync(payload)
        toast.success("Follow-up remark created.")
      }
      onOpenChange(false)
    } catch (error) {
      const fieldErrors = getValidationFieldErrors(error)
      if (fieldErrors) {
        for (const [field, message] of Object.entries(fieldErrors)) {
          form.setError(field as keyof FormValues, { message })
        }
      }
      toast.error(
        getValidationErrorMessage(error) ??
          (isEdit ? "Could not save this remark." : "Could not create this remark."),
      )
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl lg:max-w-6xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit follow-up remark" : "New follow-up remark"}</DialogTitle>
          <DialogDescription>
            HR picks this remark on the HR Approval sheet. The remark text is placed after “HR
            Remarks:” in the follow-up email; the rest of the email stays the same.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="followup-remark-label">Label</Label>
                <Input
                  id="followup-remark-label"
                  disabled={pending}
                  placeholder="e.g. Submit supporting documents"
                  {...form.register("label")}
                />
                {form.formState.errors.label ? (
                  <p className="text-destructive text-xs">{form.formState.errors.label.message}</p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Shown in the dropdown. Not sent to the applicant.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="followup-remark-text">Remark sent to the applicant</Label>
                <Textarea
                  id="followup-remark-text"
                  disabled={pending}
                  rows={6}
                  aria-invalid={form.formState.errors.text != null}
                  aria-describedby="followup-remark-text-hint"
                  {...form.register("text")}
                />
                <p
                  id="followup-remark-text-hint"
                  className={
                    form.formState.errors.text
                      ? "text-destructive text-xs"
                      : "text-muted-foreground text-xs"
                  }
                >
                  {form.formState.errors.text?.message ??
                    `${trimmedText.length}/${FOLLOW_UP_REMARK_TEXT_MAX_LENGTH} characters. Line breaks are kept.`}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="followup-remark-order">Order</Label>
                <Input
                  id="followup-remark-order"
                  inputMode="numeric"
                  disabled={pending}
                  className="w-32"
                  {...form.register("display_order")}
                />
                {form.formState.errors.display_order ? (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.display_order.message}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">Lower numbers appear first.</p>
                )}
              </div>

              <div className="rounded-lg border p-3">
                <Controller
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Active</p>
                        <p className="text-muted-foreground text-xs">
                          Inactive remarks are hidden from the HR Approval dropdown.
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
              </div>
            </div>

            <EmailPreviewFrame
              title="Follow-up email preview with sample details"
              hint="Sample applicant and leave details"
              heightClassName="h-[24rem] lg:h-[30rem]"
              html={previewText != null ? previewQuery.data?.html : undefined}
              isCurrent={previewIsCurrent}
              isUpdating={previewUpdating}
              placeholder={
                trimmedText === ""
                  ? "Enter the remark to see the email preview."
                  : trimmedText.length > FOLLOW_UP_REMARK_TEXT_MAX_LENGTH
                    ? "Shorten the remark to see the email preview."
                    : null
              }
              errorMessage={
                previewText != null && previewQuery.isError
                  ? (getValidationErrorMessage(previewQuery.error) ??
                    "Could not load the email preview.")
                  : null
              }
            />
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
              {pending ? "Saving…" : isEdit ? "Save remark" : "Create remark"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
