import type { ReactNode } from "react";
import { AtSign, Lock, MessageSquare, type LucideIcon } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";

import { formatPriority, formatStatus } from "@/lib/format-labels";

const STATUS_CLASS: Record<string, string> = {
  open: "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300",
  in_progress:
    "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300",
  pending_approval:
    "border-violet-500/30 bg-violet-500/15 text-violet-800 dark:text-violet-300",
  resolved:
    "border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  closed: "border-border bg-muted/80 text-muted-foreground",
};

const PRIORITY_CLASS: Record<string, string> = {
  low: "border-border bg-muted/80 text-muted-foreground",
  medium: "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300",
  high: "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300",
  urgent: "border-rose-500/35 bg-rose-500/15 text-rose-800 dark:text-rose-300",
};

type BadgeSize = "sm" | "md";

const sizeClass: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0 text-[10px]",
  md: "px-2 py-0.5 text-[10px]",
};

export function StatusBadge({
  status,
  size = "sm",
  className,
}: {
  status: string;
  size?: BadgeSize;
  className?: string;
}) {
  const colors =
    STATUS_CLASS[status] ?? "border-border bg-muted text-foreground";
  return (
    <Badge
      className={[colors, sizeClass[size], className].filter(Boolean).join(" ")}
    >
      {formatStatus(status)}
    </Badge>
  );
}

export function PriorityBadge({
  priority,
  size = "sm",
  className,
  trailing,
}: {
  priority: string;
  size?: BadgeSize;
  className?: string;
  trailing?: ReactNode;
}) {
  const colors =
    PRIORITY_CLASS[priority] ?? "border-border bg-muted text-foreground";
  return (
    <Badge
      className={[
        colors,
        sizeClass[size],
        trailing ? "inline-flex items-center gap-0.5" : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {formatPriority(priority)}
      {trailing}
    </Badge>
  );
}

function UnreadChip({
  count,
  colors,
  label,
  icon: Icon,
}: {
  count: number;
  colors: string;
  label: string;
  icon: LucideIcon;
}) {
  if (count <= 0) return null;

  return (
    <Badge
      className={`${colors} inline-flex shrink-0 items-center gap-0.5 px-1.5 py-0 text-[10px] tabular-nums`}
      aria-label={`${count} ${label}${count === 1 ? "" : "s"}`}
    >
      <Icon className="size-2.5" aria-hidden />
      {count}
    </Badge>
  );
}

/**
 * Three channels share one row, so each count carries an icon: a bare number
 * would not say whether it is a customer reply, an internal note, or a mention.
 */
export function UnreadIndicators({
  conversation = 0,
  internal = 0,
  mentions = 0,
}: {
  conversation?: number;
  internal?: number;
  mentions?: number;
}) {
  if (conversation <= 0 && internal <= 0 && mentions <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1">
      <UnreadChip
        count={mentions}
        colors="border-primary/35 bg-primary/15 text-primary"
        label="unread mention"
        icon={AtSign}
      />
      <UnreadChip
        count={conversation}
        colors="border-cyan-500/35 bg-cyan-500/20 text-cyan-800 dark:text-cyan-200"
        label="unread reply"
        icon={MessageSquare}
      />
      <UnreadChip
        count={internal}
        colors="border-slate-500/30 bg-slate-500/15 text-slate-700 dark:text-slate-300"
        label="unread internal note"
        icon={Lock}
      />
    </span>
  );
}
