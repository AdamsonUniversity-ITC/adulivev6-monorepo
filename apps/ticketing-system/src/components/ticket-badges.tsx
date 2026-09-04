import { Badge } from "@repo/ui/components/badge";

import { formatPriority, formatStatus } from "@/lib/format-labels";

const STATUS_CLASS: Record<string, string> = {
  open: "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300",
  in_progress:
    "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300",
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
}: {
  priority: string;
  size?: BadgeSize;
  className?: string;
}) {
  const colors =
    PRIORITY_CLASS[priority] ?? "border-border bg-muted text-foreground";
  return (
    <Badge
      className={[colors, sizeClass[size], className].filter(Boolean).join(" ")}
    >
      {formatPriority(priority)}
    </Badge>
  );
}

export function UnreadBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;

  return (
    <Badge
      className={[
        "border-cyan-500/35 bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 shrink-0 px-1.5 py-0 text-[10px] tabular-nums",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${count} unread message${count === 1 ? "" : "s"}`}
    >
      {count}
    </Badge>
  );
}
