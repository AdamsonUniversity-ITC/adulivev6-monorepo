import { zodResolver } from "@hookform/resolvers/zod"
import { Form } from "@repo/ui/components/form"
import { Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import * as React from "react"
import { useForm, type FieldPath, type UseFormReturn } from "react-hook-form"
import type { ZodIssue } from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { MOCK_LEAVE_REQUESTS } from "../-leave-mock-data"
import {
  leaveFormDefaults,
  leaveFormSchema,
  leaveFormStep1Schema,
  leaveFormStep2Schema,
  leaveFormStep3Schema,
  TOTAL_LEAVE_FORM_STEPS,
  type LeaveFormValues,
} from "./schema"
import { LeaveFormStepper } from "./stepper"
import { DatesStep } from "./steps/dates-step"
import { DetailsStep } from "./steps/details-step"
import { ReviewStep } from "./steps/review-step"
import { TypeDaysStep } from "./steps/type-days-step"
import { mapMockRowToFormValues, syncLeaveDays } from "./utils"

type LeaveFormProps = {
  mode: "create" | "edit"
  leaveId?: string
}

function applyZodIssues(
  issues: ZodIssue[],
  setError: UseFormReturn<LeaveFormValues>["setError"],
) {
  for (const issue of issues) {
    if (issue.path.length === 0) continue
    const name = issue.path.join(".") as FieldPath<LeaveFormValues>
    setError(name, { message: issue.message })
  }
}

export function LeaveForm({ mode, leaveId }: LeaveFormProps) {
  const isEdit = mode === "edit"
  const [currentStep, setCurrentStep] = React.useState(1)
  const [initialValues, setInitialValues] = React.useState<LeaveFormValues | null>(
    null,
  )

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: leaveFormDefaults,
  })

  React.useEffect(() => {
    if (!isEdit || !leaveId) return

    const row = MOCK_LEAVE_REQUESTS.find((request) => request.id === leaveId)
    if (!row) return

    const values = mapMockRowToFormValues(row)
    form.reset(values)
    setInitialValues(values)
  }, [form, isEdit, leaveId])

  const validateStep = async (step: number): Promise<boolean> => {
    const values = form.getValues()

    if (step === 1) {
      const result = leaveFormStep1Schema.safeParse({
        date_from: values.date_from,
        date_to: values.date_to,
      })
      if (!result.success) {
        applyZodIssues(result.error.issues, form.setError)
        return false
      }
      return true
    }

    if (step === 2) {
      const syncedDays = syncLeaveDays(
        values.date_from,
        values.date_to,
        values.leave_days,
      )
      form.setValue("leave_days", syncedDays, { shouldValidate: true })

      const result = leaveFormStep2Schema.safeParse({
        leave_type_id: values.leave_type_id,
        leave_days: syncedDays,
      })
      if (!result.success) {
        applyZodIssues(result.error.issues, form.setError)
        return false
      }
      return true
    }

    if (step === 3) {
      const result = leaveFormStep3Schema.safeParse({
        reason: values.reason,
        address: values.address,
      })
      if (!result.success) {
        applyZodIssues(result.error.issues, form.setError)
        return false
      }
      return true
    }

    return true
  }

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    if (!isValid) return

    if (currentStep === 1) {
      const values = form.getValues()
      form.setValue(
        "leave_days",
        syncLeaveDays(values.date_from, values.date_to, values.leave_days),
      )
    }

    setCurrentStep((step) => Math.min(step + 1, TOTAL_LEAVE_FORM_STEPS))
  }

  const handleBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 1))
  }

  const onSubmit = (values: LeaveFormValues) => {
    console.log(isEdit ? "update leave" : "create leave", {
      leaveId,
      ...values,
      leave_type_id: Number(values.leave_type_id),
    })
  }

  const stepDescription: Record<number, string> = {
    1: "Select the start and end dates for your leave.",
    2: "Choose a leave type and set the day portion for each date.",
    3: "Provide the reason and your address while on leave.",
    4: "Confirm everything looks correct before submitting.",
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" className="-ml-2 gap-1" asChild>
        <Link to="/my-leave">
          <ChevronLeft className="size-4" />
          Back to My Leave
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Leave" : "Apply for Leave"}</CardTitle>
          <CardDescription>
            {isEdit
              ? `Update leave request${leaveId ? ` #${leaveId}` : ""}.`
              : "Complete each step to submit a new leave request."}
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <LeaveFormStepper currentStep={currentStep} />
              <p className="text-muted-foreground text-sm">
                {stepDescription[currentStep]}
              </p>

              {currentStep === 1 ? <DatesStep form={form} /> : null}
              {currentStep === 2 ? <TypeDaysStep form={form} /> : null}
              {currentStep === 3 ? <DetailsStep form={form} /> : null}
              {currentStep === 4 ? (
                <ReviewStep
                  form={form}
                  isEdit={isEdit}
                  initialValues={initialValues}
                />
              ) : null}
            </CardContent>

            <CardFooter className="justify-between gap-2 border-t pt-6">
              <div>
                {currentStep === 1 ? (
                  <Button type="button" variant="outline" asChild>
                    <Link to="/my-leave">Cancel</Link>
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                )}
              </div>

              <div>
                {currentStep < TOTAL_LEAVE_FORM_STEPS ? (
                  <Button type="button" onClick={() => void handleNext()}>
                    {currentStep === 3 ? "Review" : "Next"}
                  </Button>
                ) : (
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {isEdit ? "Update Leave" : "Submit Leave"}
                  </Button>
                )}
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
