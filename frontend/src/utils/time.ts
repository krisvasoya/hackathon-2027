/**
 * Time Formatting Utility for Indian timezone (Asia/Kolkata)
 * Formats time to 24-hour HH:MM format
 */

const indianTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/**
 * Formats a Date object or ISO datetime string into HH:MM (24-hour format).
 */
export function formatTime(value: Date | string | null | undefined): string {
  if (!value) return '—';
  try {
    const dateObj = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(dateObj.getTime())) return '—';
    return indianTimeFormatter.format(dateObj);
  } catch {
    return '—';
  }
}
