/**
 * Utility functions for date handling
 */

export const isValidDate = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const formatDateSafe = (dateString: string | null | undefined, options: Intl.DateTimeFormatOptions = {}): string => {
  if (!dateString || !isValidDate(dateString)) {
    return 'N/A';
  }
  
  // Create date object directly - let JavaScript handle timezone conversion
  const date = new Date(dateString);
  
  // Get user's local timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const formatter = new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: userTimezone,
    ...options
  });
  
  return formatter.format(date);
};

export const formatDateShortSafe = (dateString: string | null | undefined): string => {
  if (!dateString || !isValidDate(dateString)) {
    return 'N/A';
  }
  
  // Create date object directly - let JavaScript handle timezone conversion
  const date = new Date(dateString);
  
  // Get user's local timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const formatter = new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: userTimezone
  });
  
  return formatter.format(date);
};
