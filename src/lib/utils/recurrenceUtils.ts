import { addDays, addWeeks, addMonths, addYears, parseISO, format, lastDayOfMonth } from 'date-fns';
import type { Event, EventInput, RecurrenceRule } from '@/types/calendar';

/**
 * Recurrence Utils - Generate recurring event instances
 */

/**
 * Generate instances of a recurring event for a specific date range
 * @param event The base recurring event
 * @param rule The recurrence rule
 * @param rangeStart Start date of the range (YYYY-MM-DD)
 * @param rangeEnd End date of the range (YYYY-MM-DD)
 * @returns Array of event instances within the range
 */
export const generateRecurringInstances = (
  event: Event,
  rule: RecurrenceRule,
  rangeStart?: string,
  rangeEnd?: string
): Event[] => {
  const instances: Event[] = [];
  const baseDate = parseISO(event.date);
  
  // If no range specified, generate a default range from event date
  const start = rangeStart ? parseISO(rangeStart) : baseDate;
  const end = rangeEnd ? parseISO(rangeEnd) : addMonths(baseDate, 3); // Default: 3 months
  
  let currentDate = baseDate;
  let occurrenceCount = 0;
  
  // Determine when to stop generating
  const hasEndDate = !!rule.endDate;
  const hasMaxOccurrences = !!rule.maxOccurrences;
  const isUnlimited = rule.unlimited === true;
  
  const endDate = hasEndDate ? parseISO(rule.endDate!) : null;
  const maxOccurrences = hasMaxOccurrences ? rule.maxOccurrences! : null;

  // Start from the first occurrence that falls within or before the range
  while (currentDate < start && !hasEndDate && !hasMaxOccurrences) {
    currentDate = getNextOccurrence(currentDate, rule);
  }

  // Generate instances
  while (currentDate <= end) {
    // Check end conditions
    if (hasEndDate && currentDate > endDate) break;
    if (hasMaxOccurrences && occurrenceCount >= maxOccurrences) break;
    if (!isUnlimited && !hasEndDate && !hasMaxOccurrences) break; // Fallback safety

    // Create instance
    const instance: Event = {
      ...event,
      id: `${event.id}-${format(currentDate, 'yyyy-MM-dd')}`,
      date: format(currentDate, 'yyyy-MM-dd'),
      recurringEventId: event.id,
      isRecurringInstance: true,
      isPending: event.isPending,
    };

    instances.push(instance);
    occurrenceCount++;

    // Move to next occurrence
    currentDate = getNextOccurrence(currentDate, rule);
  }

  return instances;
};

/**
 * Calculate the next occurrence date based on recurrence rule
 */
export const getNextOccurrence = (currentDate: Date, rule: RecurrenceRule): Date => {
  const interval = rule.interval || 1;

  switch (rule.frequency) {
    case 'daily':
      return addDays(currentDate, interval);

    case 'weekly':
      return addWeeks(currentDate, interval);

    case 'biweekly':
      return addWeeks(currentDate, 2 * interval);

    case 'monthly': {
      let nextDate = addMonths(currentDate, interval);
      
      // If dayOfMonth is specified, ensure we land on that day
      if (rule.dayOfMonth) {
        const lastDay = lastDayOfMonth(nextDate).getDate();
        const dayToSet = Math.min(rule.dayOfMonth, lastDay);
        nextDate.setDate(dayToSet);
      }

      return nextDate;
    }

    case 'yearly': {
      let nextDate = addYears(currentDate, interval);
      
      // If monthOfYear and dayOfMonth are specified
      if (rule.monthOfYear && rule.dayOfMonth) {
        const lastDay = lastDayOfMonth(new Date(nextDate.getFullYear(), rule.monthOfYear - 1, 1)).getDate();
        const dayToSet = Math.min(rule.dayOfMonth, lastDay);
        nextDate = new Date(nextDate.getFullYear(), rule.monthOfYear - 1, dayToSet);
      }

      return nextDate;
    }

    default:
      return addMonths(currentDate, interval);
  }
};

/**
 * Check if a date matches the recurrence rule
 */
export const matchesRecurrenceRule = (date: Date, baseDate: Date, rule: RecurrenceRule): boolean => {
  // Simple check for basic patterns
  const daysDiff = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  const interval = rule.interval || 1;

  switch (rule.frequency) {
    case 'daily':
      return daysDiff % interval === 0;

    case 'weekly':
      return daysDiff % (7 * interval) === 0;

    case 'biweekly':
      return daysDiff % (14 * interval) === 0;

    case 'monthly':
      return date.getDate() === baseDate.getDate();

    case 'yearly':
      return (
        date.getMonth() === baseDate.getMonth() &&
        date.getDate() === baseDate.getDate()
      );

    default:
      return false;
  }
};

/**
 * Format a recurrence rule for display
 */
export const formatRecurrenceRule = (rule: RecurrenceRule, t: (key: string) => string): string => {
  const interval = rule.interval || 1;
  const intervalText = interval > 1 ? `${t('recurrence.every')} ${interval} ` : '';

  const frequencyMap: Record<string, string> = {
    daily: t('recurrence.daily'),
    weekly: t('recurrence.weekly'),
    biweekly: t('recurrence.biweekly'),
    monthly: t('recurrence.monthly'),
    yearly: t('recurrence.yearly'),
  };

  let result = `${intervalText}${frequencyMap[rule.frequency]}`;

  if (rule.unlimited) {
    result += ` ${t('recurrence.unlimited')}`;
  } else if (rule.endDate) {
    result += ` ${t('recurrence.until')} ${format(parseISO(rule.endDate), 'dd/MM/yyyy')}`;
  } else if (rule.maxOccurrences) {
    result += ` (${rule.maxOccurrences} ${t('recurrence.occurrences')})`;
  }

  return result;
};

/**
 * Validate a recurrence rule
 */
export const validateRecurrenceRule = (rule: RecurrenceRule): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!rule.frequency) {
    errors.push('Frequency is required');
  }

  if (rule.interval !== undefined && rule.interval < 1) {
    errors.push('Interval must be at least 1');
  }

  if (rule.maxOccurrences !== undefined && rule.maxOccurrences < 1) {
    errors.push('Max occurrences must be at least 1');
  }

  if (rule.dayOfMonth && (rule.dayOfMonth < 1 || rule.dayOfMonth > 31)) {
    errors.push('Day of month must be between 1 and 31');
  }

  if (rule.monthOfYear && (rule.monthOfYear < 1 || rule.monthOfYear > 12)) {
    errors.push('Month of year must be between 1 and 12');
  }

  // If unlimited, cannot have endDate or maxOccurrences
  if (rule.unlimited) {
    if (rule.endDate) {
      errors.push('Cannot specify endDate for unlimited recurrence');
    }
    if (rule.maxOccurrences) {
      errors.push('Cannot specify maxOccurrences for unlimited recurrence');
    }
  }

  // If not unlimited, must have either endDate or maxOccurrences
  if (!rule.unlimited) {
    if (!rule.endDate && !rule.maxOccurrences) {
      errors.push('Must specify either end date or max occurrences');
    }

    if (rule.endDate && rule.maxOccurrences) {
      errors.push('Cannot specify both endDate and maxOccurrences');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
