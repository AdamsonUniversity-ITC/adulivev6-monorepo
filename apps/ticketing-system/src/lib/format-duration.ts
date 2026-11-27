/**
 * Human-readable elapsed time from decimal hours.
 *
 * 42.96 hours reads as "1d 18h" instead of "42.96h", which looks like 42 hours.
 * Days are 24-hour days, not business days.
 */
export function formatDuration(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || Number.isNaN(hours)) return "—";

  const totalMinutes = Math.round(Math.max(0, hours) * 60);
  if (totalMinutes < 1) return "less than 1m";

  const days = Math.floor(totalMinutes / 1440);
  const remainderAfterDays = totalMinutes % 1440;
  const wholeHours = Math.floor(remainderAfterDays / 60);
  const minutes = remainderAfterDays % 60;

  if (days > 0) {
    return wholeHours > 0 ? `${days}d ${wholeHours}h` : `${days}d`;
  }

  if (wholeHours > 0) {
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
  }

  return `${minutes}m`;
}
