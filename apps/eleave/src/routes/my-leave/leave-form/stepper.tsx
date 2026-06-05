import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

import { LEAVE_FORM_STEP_LABELS } from "./schema"

type LeaveFormStepperProps = {
  currentStep: number
}

export function LeaveFormStepper({ currentStep }: LeaveFormStepperProps) {
  return (
    <nav aria-label="Leave form progress" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 sm:gap-0">
        {LEAVE_FORM_STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1
          const isComplete = stepNumber < currentStep
          const isActive = stepNumber === currentStep

          return (
            <li
              key={label}
              className={cn(
                "flex items-center",
                index < LEAVE_FORM_STEP_LABELS.length - 1 && "sm:flex-1",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
                    isComplete && "border-primary bg-primary text-primary-foreground",
                    isActive && "border-primary text-primary",
                    !isComplete && !isActive && "border-muted-foreground/30 text-muted-foreground",
                  )}
                >
                  {isComplete ? <Check className="size-4" /> : stepNumber}
                </span>
                <span
                  className={cn(
                    "hidden text-sm font-medium sm:inline",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {index < LEAVE_FORM_STEP_LABELS.length - 1 ? (
                <div
                  className={cn(
                    "mx-3 hidden h-px flex-1 sm:block",
                    stepNumber < currentStep ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          )
        })}
      </ol>
      <p className="text-muted-foreground mt-3 text-sm sm:hidden">
        Step {currentStep} of {LEAVE_FORM_STEP_LABELS.length}:{" "}
        {LEAVE_FORM_STEP_LABELS[currentStep - 1]}
      </p>
    </nav>
  )
}
