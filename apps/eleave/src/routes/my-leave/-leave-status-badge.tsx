import { Badge } from "@repo/ui/components/badge"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

import {
  formatCancelStatusLabel,
  formatOverallStatusLabel,
  type LeaveCancelStatus,
  type LeaveOverallStatus,
} from "./-leave-status"

export const pendingBadgeClassName =
  "border-amber-200 bg-amber-100 font-normal text-amber-700 ring-1 ring-amber-200"

export function PendingStatusBadge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <Badge className={cn(pendingBadgeClassName, className)}>{children}</Badge>
}

export function OverallStatusBadge({ status }: { status: LeaveOverallStatus }) {
  const label = formatOverallStatusLabel(status)

  switch (status) {
    case "approved":
      return <Badge className="font-normal">{label}</Badge>
    case "partially_approved":
      return (
        <Badge variant="secondary" className="font-normal">
          {label}
        </Badge>
      )
    case "disapproved":
      return (
        <Badge variant="destructive" className="font-normal">
          {label}
        </Badge>
      )
    case "cancelled":
      return (
        <Badge variant="outline" className="font-normal">
          {label}
        </Badge>
      )
    case "pending":
    default:
      return <PendingStatusBadge>{label}</PendingStatusBadge>
  }
}

export function CancelStatusBadge({ status }: { status: LeaveCancelStatus }) {
  const label = formatCancelStatusLabel(status)

  switch (status) {
    case "approved":
      return <Badge className="font-normal">{label}</Badge>
    case "requested":
      return (
        <Badge variant="secondary" className="font-normal">
          {label}
        </Badge>
      )
    case "disapproved":
      return (
        <Badge variant="destructive" className="font-normal">
          {label}
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="font-normal">
          {label}
        </Badge>
      )
  }
}
