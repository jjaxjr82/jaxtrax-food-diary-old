import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

const TIMEZONE = 'America/New_York';

/**
 * Get today's date in Eastern timezone (YYYY-MM-DD format)
 */
export const getTodayInEastern = (): string => {
  return formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
};

/**
 * Get a date offset by days in Eastern timezone (YYYY-MM-DD format)
 * @param days - Number of days to offset (negative for past, positive for future)
 */
export const getDateOffsetInEastern = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd');
};

/**
 * Convert a date string to Eastern timezone and format as YYYY-MM-DD
 * @param dateStr - Date string (YYYY-MM-DD)
 * @param offsetDays - Optional days to offset
 */
export const getDateInEastern = (dateStr: string, offsetDays: number = 0): string => {
  // Parse the date string as local date (not UTC) to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offsetDays);
  return formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd');
};

/**
 * Format a date for display in Eastern timezone
 */
export const formatDateInEastern = (dateStr: string, formatStr: string = 'MMMM d, yyyy'): string => {
  const date = new Date(dateStr);
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, formatStr);
};
