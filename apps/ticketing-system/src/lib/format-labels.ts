function titleCaseWords(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatStatus(value: string): string {
  if (value === "closed") {
    return "Cancelled";
  }
  return titleCaseWords(value.replace(/_/g, " "));
}

export function formatPriority(value: string): string {
  return titleCaseWords(value.replace(/_/g, " "));
}

export function formatBoardLabel(slug: string): string {
  const normalized = slug.trim();
  if (!normalized) {
    return "Board";
  }

  return `${normalized.toUpperCase()} Board`;
}
