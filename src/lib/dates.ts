import { format, isToday, isTomorrow, parseISO } from 'date-fns';

export function formatDayName(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE');
}

export function formatFullDate(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE, MMMM d');
}

export function formatTime(date: Date): string {
  return format(date, 'h:mm a');
}

export function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return format(new Date(timestamp), 'MMM d, h:mm a');
}

export function getLocalTimeAtOffset(timezoneOffset: number): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + timezoneOffset * 1000);
}

export function formatLocalTime(timezoneOffset: number): string {
  const localDate = getLocalTimeAtOffset(timezoneOffset);
  return format(localDate, 'h:mm a');
}
