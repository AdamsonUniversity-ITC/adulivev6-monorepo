import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

import { LEAVE_FORM_STEP_LABELS } from "./schema"

type LeaveFormStepperProps = {
  currentStep: number
}

export function LeaveFormStepper({ currentStep }: LeaveFormStepperProps) {
  return (
    <nav
      aria-label="Leave form progress"
      className="rounded-2xl border border-slate-200/80 bg-slate-50/50 px-3 py-4 sm:px-4"
    >
      <ol className="flex flex-wrap items-start gap-4 sm:gap-0">
        {LEAVE_FORM_STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1
          const isComplete = stepNumber < currentStep
          const isActive = stepNumber === currentStep

          return (
            <li
              key={label}
              className={cn(
                "flex items-start",
                index < LEAVE_FORM_STEP_LABELS.length - 1 && "sm:flex-1",
              )}
            >
              <div className="flex min-w-[4.5rem] flex-col items-center gap-1.5 text-center">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
                    isComplete && "border-primary bg-primary text-primary-foreground",
                    isActive && "border-primary text-primary",
                    !isComplete && !isActive && "border-muted-foreground/30 text-muted-foreground",
                  )}
                >
                  {isComplete ? <Check className="size-4" /> : stepNumber}
                </span>
                <span
                  className={cn(
                    "max-w-[5.5rem] text-xs leading-tight font-medium sm:max-w-none sm:text-sm",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {index < LEAVE_FORM_STEP_LABELS.length - 1 ? (
                <div
                  className={cn(
                    "mx-2 mt-3 hidden h-px flex-1 sm:block",
                    stepNumber < currentStep ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
