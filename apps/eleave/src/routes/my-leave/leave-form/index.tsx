import { zodResolver } from "@hookform/resolvers/zod"
import { Form } from "@repo/ui/components/form"
import { Link, useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
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
import { fetchAuthUser, resolveEmployeeNo } from "@/lib/fetch-auth-user"
import { useLeaveTypes } from "@/hooks/use-leave-types"
import { useMyEmployeeHrProfile } from "@/hooks/use-employee-hr-profile"
import { useMyLeaveApplications } from "@/hooks/use-my-leave-applications"
import {
  applyLeaveApplication,
  getValidationErrorMessage,
  getValidationFieldErrors,
} from "@/lib/leave-applications-api"
import { mapLeaveApplicationToRow } from "@/lib/map-leave-application-to-row"
import { buildLeaveApplyFormData } from "@/lib/map-leave-form-to-apply-payload"
import { validateLeaveFilingTiming } from "@/lib/validate-leave-filing-timing"
import {
  leaveFormDefaults,
  leaveFormSchema,
  leaveFormStep1Schema,
  leaveFormStep2Schema,
  leaveFormStep3Schema,
  TOTAL_LEAVE_FORM_STEPS,
  type LeaveFormValues,
} from "./schema"
import { LeaveFormStepper } from "./-stepper"
import { DatesStep } from "./steps/dates-step"
import { DetailsStep } from "./steps/details-step"
import { ReviewStep } from "./steps/review-step"
import { TypeDaysStep } from "./steps/type-days-step"
import {
  getDaysInRange,
  getLeaveDayExclusionsFromForm,
  mapLeaveRowToFormValues,
  syncLeaveDays,
} from "./utils"

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

function applyApiFieldErrors(
  errors: Record<string, string>,
  setError: UseFormReturn<LeaveFormValues>["setError"],
) {
  for (const [field, message] of Object.entries(errors)) {
    if (!message) continue

    if (
      field === "date_from" ||
      field === "date_to" ||
      field === "leave_type_id" ||
      field === "reason" ||
      field === "address" ||
      field === "supporting_documents" ||
      field.startsWith("supporting_documents.") ||
      field.startsWith("leave_days")
    ) {
      setError(field as FieldPath<LeaveFormValues>, { message })
    }
  }
}

export function LeaveForm({ mode, leaveId }: LeaveFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = mode === "edit"
  const [currentStep, setCurrentStep] = React.useState(1)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const formTopRef = React.useRef<HTMLDivElement>(null)
  const isInitialStepRender = React.useRef(true)
  const { data: leaveTypes = [] } = useLeaveTypes()
  const { data: leaveApplicationsResponse } = useMyLeaveApplications()
  const { data: myHrProfile } = useMyEmployeeHrProfile(!isEdit)

  const leaveTypeNames = React.useMemo(
    () => new Map(leaveTypes.map((type) => [type.id, type.leave_name])),
    [leaveTypes],
  )

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: leaveFormDefaults,
  })

  React.useEffect(() => {
    if (isEdit) return

    const hrAddress = myHrProfile?.address?.trim()
    if (!hrAddress) return

    const currentAddress = form.getValues("address").trim()
    if (currentAddress !== "") return

    form.setValue("address", hrAddress, { shouldDirty: false })
  }, [form, isEdit, myHrProfile?.address])

  React.useEffect(() => {
    if (!isEdit || !leaveId) return

    const record = leaveApplicationsResponse?.data.find(
      (application) => String(application.id) === leaveId,
    )
    if (!record) return

    const row = mapLeaveApplicationToRow(
      record,
      leaveTypeNames.get(record.leave_type_id) ?? "Unknown leave type",
    )
    const values = mapLeaveRowToFormValues(row, leaveTypes)
    form.reset(values)
  }, [
    form,
    isEdit,
    leaveId,
    leaveApplicationsResponse?.data,
    leaveTypeNames,
    leaveTypes,
  ])

  React.useEffect(() => {
    if (isInitialStepRender.current) {
      isInitialStepRender.current = false
      return
    }

    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [currentStep])

  const validateStep = async (step: number): Promise<boolean> => {
    const values = form.getValues()

    if (step === 1) {
      const result = leaveFormStep1Schema.safeParse({
        date_from: values.date_from,
        date_to: values.date_to,
        exclude_sundays: values.exclude_sundays,
        exclude_saturdays: values.exclude_saturdays,
      })
      if (!result.success) {
        applyZodIssues(result.error.issues, form.setError)
        return false
      }

      const leaveDays = getDaysInRange(
        values.date_from,
        values.date_to,
        getLeaveDayExclusionsFromForm(values),
      )
      if (leaveDays.length === 0) {
        form.setError("date_to", {
          message:
            "Date range has no leave days after applying weekend exclusions.",
        })
        return false
      }

      return true
    }

    if (step === 2) {
      const exclusions = getLeaveDayExclusionsFromForm(values)
      const syncedDays = syncLeaveDays(
        values.date_from,
        values.date_to,
        values.leave_days,
        exclusions,
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

      const leaveType = leaveTypes.find(
        (type) => String(type.id) === values.leave_type_id,
      )
      if (leaveType) {
        const timingError = validateLeaveFilingTiming(
          leaveType,
          values.date_from,
          values.date_to,
        )
        if (timingError) {
          form.setError("leave_type_id", { message: timingError })
          return false
        }
      }

      return true
    }

    if (step === 3) {
      const result = leaveFormStep3Schema.safeParse({
        reason: values.reason,
        supporting_documents: values.supporting_documents,
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
        syncLeaveDays(
          values.date_from,
          values.date_to,
          values.leave_days,
          getLeaveDayExclusionsFromForm(values),
        ),
      )
    }

    setCurrentStep((step) => Math.min(step + 1, TOTAL_LEAVE_FORM_STEPS))
  }

  const handleBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 1))
  }

  const onSubmit = async (values: LeaveFormValues) => {
    if (currentStep !== TOTAL_LEAVE_FORM_STEPS) {
      return
    }

    setSubmitError(null)

    if (isEdit) {
      setSubmitError("Updating leave requests is not available yet.")
      return
    }

    try {
      const authResponse = await fetchAuthUser()
      const employeeNo = resolveEmployeeNo(authResponse.data)

      // console.log(employeeNo)
      if (!employeeNo) {
        setSubmitError("Unable to resolve your employee number from your account.")
        return
      }

      await applyLeaveApplication(buildLeaveApplyFormData(values, employeeNo))

      await queryClient.invalidateQueries({ queryKey: ["my-leave-applications"] })
      await queryClient.invalidateQueries({ queryKey: ["el-dependent-care-usage"] })
      await navigate({ to: "/my-leave" })
    } catch (error) {
      const fieldErrors = getValidationFieldErrors(error)
      if (fieldErrors) {
        applyApiFieldErrors(fieldErrors, form.setError)
      }

      setSubmitError(
        getValidationErrorMessage(error) ??
          "Unable to submit your leave application. Please try again.",
      )
    }
  }

  const stepDescription: Record<number, string> = {
    1: "Select the start and end dates for your leave.",
    2: "Choose a leave type and set the day portion for each date.",
    3: "Provide the reason and your address while on leave.",
    4: "Confirm everything looks correct before submitting.",
  }

  return (
    <div ref={formTopRef} className="mx-auto w-full max-w-2xl space-y-4">
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
          <form
            onSubmit={(event) => {
              event.preventDefault()
            }}
          >
            <CardContent className="space-y-5">
              <LeaveFormStepper currentStep={currentStep} />
              <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 px-4 py-3">
                <p className="text-sm leading-relaxed text-amber-950/90">
                  {stepDescription[currentStep]}
                </p>
              </div>

              {submitError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                  <p className="text-destructive text-sm">{submitError}</p>
                </div>
              ) : null}

              {currentStep === 1 ? <DatesStep form={form} /> : null}
              {currentStep === 2 ? <TypeDaysStep form={form} /> : null}
              {currentStep === 3 ? <DetailsStep form={form} /> : null}
              {currentStep === 4 ? (
                <ReviewStep form={form} isEdit={isEdit} />
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
                  <Button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      void handleNext()
                    }}
                  >
                    {currentStep === 3 ? "Review" : "Next"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={form.formState.isSubmitting}
                    onClick={() => void form.handleSubmit(onSubmit)()}
                  >
                    {form.formState.isSubmitting
                      ? "Submitting..."
                      : isEdit
                        ? "Update Leave"
                        : "Submit Leave"}
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
