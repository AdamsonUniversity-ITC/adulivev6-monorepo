import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type StepSectionProps = {
  icon: LucideIcon
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function StepSection({
  icon: Icon,
  title,
  description,
  children,
  className,
}: StepSectionProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm",
        className,
      )}
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-amber-50/40 px-4 py-3.5 sm:px-5">
        <div
          className={cn(
            "flex gap-3",
            description ? "items-start" : "items-center",
          )}
        >
          <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
            {description ? (
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

type StepToggleCardProps = {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function StepToggleCard({
  label,
  description,
  checked,
  onCheckedChange,
}: StepToggleCardProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors",
        checked
          ? "border-primary/30 bg-primary/5 shadow-sm"
          : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary/30"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="text-muted-foreground mt-0.5 block text-xs leading-relaxed">
          {description}
        </span>
      </span>
    </label>
  )
}

export const stepFieldClassName =
  "rounded-xl border-slate-200 bg-background shadow-sm transition-colors focus-visible:ring-primary/20"

export const stepTextareaClassName =
  "min-h-[112px] resize-y rounded-xl border-slate-200 bg-background shadow-sm transition-colors focus-visible:ring-primary/20"
