/**
 * Shared date and string formatting utilities for London Mingler.
 */

export function formatDate(value?: string | Date | null): string {
  if (!value) return "";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

export function formatTime(timeStr?: string | null): string {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
}
