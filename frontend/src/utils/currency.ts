/**
 * Currency Formatter Utility for Indian Rupee (INR)
 * Localized for Indian numbering system (e.g. ₹1,25,000.00)
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a numeric value into INR format (e.g. ₹1,25,000.00).
 * Handles strings or numbers.
 */
export function formatINR(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '₹0.00';
  }
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numericValue)) {
    return '₹0.00';
  }
  return inrFormatter.format(numericValue);
}

/**
 * Formats a numeric value into INR format without the currency symbol (e.g. 1,25,000.00)
 */
export function formatINRRaw(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '0.00';
  }
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numericValue)) {
    return '0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}
