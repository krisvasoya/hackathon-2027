/**
 * Date Formatting Utility for Indian timezone (Asia/Kolkata)
 * Formats dates to DD/MM/YYYY
 */

const indianDateFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/**
 * Formats a Date object or ISO date string into DD/MM/YYYY format.
 */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—';
  try {
    const dateObj = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(dateObj.getTime())) return '—';
    return indianDateFormatter.format(dateObj);
  } catch {
    return '—';
  }
}

/**
 * Formats a Date object or ISO date string into DD/MM/YYYY HH:MM format.
 */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return '—';
  try {
    const dateObj = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(dateObj.getTime())) return '—';
    
    const datePart = indianDateFormatter.format(dateObj);
    
    const timePart = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(dateObj);

    return `${datePart} ${timePart}`;
  } catch {
    return '—';
  }
}
