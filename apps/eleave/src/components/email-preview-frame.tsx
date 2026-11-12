import { Loader2 } from "lucide-react"
import type * as React from "react"

type EmailPreviewFrameProps = {
  html: string | undefined
  isCurrent: boolean
  isUpdating: boolean
  errorMessage?: string | null
  label?: string
  title?: string
  /** Shown above the frame, next to the label (e.g. a "sample details" note). */
  hint?: React.ReactNode
  /** Replaces the frame when there is nothing to render yet. */
  placeholder?: React.ReactNode
  heightClassName?: string
}

export function EmailPreviewFrame({
  html,
  isCurrent,
  isUpdating,
  errorMessage = null,
  label = "Email preview",
  title = "Email preview",
  hint,
  placeholder,
  heightClassName = "h-[28rem]",
}: EmailPreviewFrameProps) {
  return (
    <div className="space-y-2" aria-busy={isUpdating}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-sm font-medium">{label}</p>
        {isUpdating ? (
          <Loader2 className="text-muted-foreground size-3.5 animate-spin motion-reduce:animate-none" />
        ) : null}
        {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
        <p className="sr-only" aria-live="polite">
          {isUpdating ? "Updating email preview." : isCurrent ? "Email preview is up to date." : ""}
        </p>
      </div>
      {errorMessage ? (
        <p className="text-destructive text-sm">{errorMessage}</p>
      ) : placeholder ? (
        <div
          className={`${heightClassName} text-muted-foreground flex w-full items-center justify-center rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm`}
        >
          {placeholder}
        </div>
      ) : html ? (
        <iframe
          title={title}
          sandbox=""
          srcDoc={html}
          className={`${heightClassName} w-full rounded-lg border border-slate-200 bg-white transition-opacity motion-reduce:transition-none ${isCurrent ? "" : "opacity-60"}`}
        />
      ) : (
        <div
          className={`bg-muted/40 ${heightClassName} w-full animate-pulse rounded-lg border border-slate-200 motion-reduce:animate-none`}
        />
      )}
    </div>
  )
}
