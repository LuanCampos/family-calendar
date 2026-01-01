import { addDays, addWeeks, addMonths, addYears, parseISO, format, lastDayOfMonth, differenceInDays, differenceInWeeks, differenceInMonths, differenceInYears, startOfWeek } from 'date-fns';
import { logger } from '@/lib/logger';
import type { Event, RecurrenceRule } from '@/types/calendar';

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

  // Range defaults: from base date to +3 months if not provided
  const start = rangeStart ? parseISO(rangeStart) : baseDate;
  const end = rangeEnd ? parseISO(rangeEnd) : addMonths(baseDate, 3);

  const hasEndDate = !!rule.endDate;
  const endDate = hasEndDate ? parseISO(rule.endDate!) : null;
  const hasMaxOccurrences = !!rule.maxOccurrences;
  const maxOccurrences = hasMaxOccurrences ? rule.maxOccurrences! : null;

  const exceptions = new Set(event.recurrenceExceptions || []);
  const overrides = event.recurrenceOverrides || {};

  const interval = rule.interval || 1;
  let occurrenceCount = 0;

  // Safety cap to prevent runaway expansion in extreme views
  const MAX_INSTANCES_PER_RANGE = 2000;
  let truncated = false;

  const inRange = (date: Date) => date >= start && date <= end;

  // Record an occurrence for maxOccurrences accounting, and only materialize an instance if it falls
  // inside the requested date range.
  const recordOccurrence = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (exceptions.has(dateStr)) return;
    const override = overrides[dateStr] || {};

    occurrenceCount++;

    if (!inRange(date)) return;
    const instance: Event = {
      ...event,
      ...override,
      id: `${event.id}-${dateStr}`,
      date: dateStr,
      recurringEventId: event.id,
      isRecurringInstance: true,
    };
    instances.push(instance);
  };

  const stopNow = (cursor: Date) => {
    if (cursor > end) return true;
    if (hasEndDate && cursor > (endDate as Date)) return true;
    if (hasMaxOccurrences && occurrenceCount >= (maxOccurrences as number)) return true;
    if (instances.length >= MAX_INSTANCES_PER_RANGE) { truncated = true; return true; }
    return false;
  };

  const clampDom = (year: number, month0: number, dom: number) => {
    const last = lastDayOfMonth(new Date(year, month0, 1)).getDate();
    return Math.min(dom, last);
  };

  switch (rule.frequency) {
    case 'daily': {
      // IMPORTANT: maxOccurrences must be enforced from the base date, not per-range.
      // If maxOccurrences is set, walk from baseDate forward and only emit instances within range.
      // Otherwise, jump to the first on-or-after range start to avoid unnecessary work.
      const enforceGlobalMax = hasMaxOccurrences;

      // Jump by interval days from the first on-or-after date
      const diffDays = enforceGlobalMax ? 0 : Math.max(0, differenceInDays(start, baseDate));
      const offset = diffDays % interval === 0 ? diffDays : diffDays + (interval - (diffDays % interval));
      let cursor = addDays(baseDate, offset);
      while (!stopNow(cursor)) {
        recordOccurrence(cursor);
        if (hasMaxOccurrences && occurrenceCount >= (maxOccurrences as number)) break;
        cursor = addDays(cursor, interval);
      }
      break;
    }

    case 'weekly': {
      const daysOfWeek = rule.daysOfWeek && rule.daysOfWeek.length > 0
        ? rule.daysOfWeek.slice().sort((a, b) => a - b)
        : [baseDate.getDay()];

      const periodWeeks = interval;
      const baseWeekStart = startOfWeek(baseDate, { weekStartsOn: 0 });

      // When maxOccurrences is set, we must count occurrences starting from baseDate.
      // Without maxOccurrences, we can jump closer to the requested range for performance.
      const weeksFromBaseToStart = hasMaxOccurrences ? 0 : Math.max(0, differenceInWeeks(start, baseDate));
      const startAlignedWeeks = weeksFromBaseToStart % periodWeeks === 0
        ? weeksFromBaseToStart
        : weeksFromBaseToStart + (periodWeeks - (weeksFromBaseToStart % periodWeeks));
      let weekStart = addWeeks(baseWeekStart, startAlignedWeeks);

      while (!stopNow(weekStart)) {
        for (const dow of daysOfWeek) {
          const candidate = addDays(weekStart, dow);
          if (candidate < baseDate) continue;

          if (!hasMaxOccurrences && candidate < start) continue;
          if (candidate > end) break;
          if (hasEndDate && candidate > (endDate as Date)) break;

          if (!matchesRecurrenceRule(candidate, baseDate, rule)) continue;
          recordOccurrence(candidate);
          if (stopNow(candidate)) break;
        }
        if (hasMaxOccurrences && occurrenceCount >= (maxOccurrences as number)) break;
        weekStart = addWeeks(weekStart, periodWeeks);
      }
      break;
    }

    case 'biweekly': {
      const daysOfWeek = rule.daysOfWeek && rule.daysOfWeek.length > 0
        ? rule.daysOfWeek.slice().sort((a, b) => a - b)
        : [baseDate.getDay()];
      const periodWeeks = 2 * interval;
      const baseWeekStart = startOfWeek(baseDate, { weekStartsOn: 0 });

      const weeksFromBaseToStart = hasMaxOccurrences ? 0 : Math.max(0, differenceInWeeks(start, baseDate));
      const startAlignedWeeks = weeksFromBaseToStart % periodWeeks === 0
        ? weeksFromBaseToStart
        : weeksFromBaseToStart + (periodWeeks - (weeksFromBaseToStart % periodWeeks));
      let weekStart = addWeeks(baseWeekStart, startAlignedWeeks);

      while (!stopNow(weekStart)) {
        for (const dow of daysOfWeek) {
          const candidate = addDays(weekStart, dow);
          if (candidate < baseDate) continue;

          if (!hasMaxOccurrences && candidate < start) continue;
          if (candidate > end) break;
          if (hasEndDate && candidate > (endDate as Date)) break;
          if (!matchesRecurrenceRule(candidate, baseDate, rule)) continue;
          recordOccurrence(candidate);
          if (stopNow(candidate)) break;
        }
        if (hasMaxOccurrences && occurrenceCount >= (maxOccurrences as number)) break;
        weekStart = addWeeks(weekStart, periodWeeks);
      }
      break;
    }

    case 'monthly': {
      const dom = rule.dayOfMonth ?? baseDate.getDate();
      const monthsFromBaseToStart = hasMaxOccurrences ? 0 : Math.max(0, differenceInMonths(start, baseDate));
      const startAlignedMonths = monthsFromBaseToStart % interval === 0
        ? monthsFromBaseToStart
        : monthsFromBaseToStart + (interval - (monthsFromBaseToStart % interval));
      let cursor = addMonths(baseDate, startAlignedMonths);

      while (!stopNow(cursor)) {
        const y = cursor.getFullYear();
        const m0 = cursor.getMonth();
        const day = clampDom(y, m0, dom);
        const candidate = new Date(y, m0, day);
        if (!hasMaxOccurrences && candidate < start) {
          cursor = addMonths(cursor, interval);
          continue;
        }
        if (candidate > end) break;
        if (hasEndDate && candidate > (endDate as Date)) break;
        recordOccurrence(candidate);
        if (hasMaxOccurrences && occurrenceCount >= (maxOccurrences as number)) break;
        cursor = addMonths(cursor, interval);
      }
      break;
    }

    case 'yearly': {
      const dom = rule.dayOfMonth ?? baseDate.getDate();
      const moy = (rule.monthOfYear ?? baseDate.getMonth() + 1) - 1; // 0-based
      const yearsFromBaseToStart = hasMaxOccurrences ? 0 : Math.max(0, differenceInYears(start, baseDate));
      const startAlignedYears = yearsFromBaseToStart % interval === 0
        ? yearsFromBaseToStart
        : yearsFromBaseToStart + (interval - (yearsFromBaseToStart % interval));
      let cursor = addYears(baseDate, startAlignedYears);

      while (!stopNow(cursor)) {
        const y = cursor.getFullYear();
        const day = clampDom(y, moy, dom);
        const candidate = new Date(y, moy, day);
        if (!hasMaxOccurrences && candidate < start) {
          cursor = addYears(cursor, interval);
          continue;
        }
        if (candidate > end) break;
        if (hasEndDate && candidate > (endDate as Date)) break;
        recordOccurrence(candidate);
        if (hasMaxOccurrences && occurrenceCount >= (maxOccurrences as number)) break;
        cursor = addYears(cursor, interval);
      }
      break;
    }

    default: {
      // Fallback to conservative day-by-day when frequency is unknown
      for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
        if (stopNow(cursor)) break;
        if (!matchesRecurrenceRule(cursor, baseDate, rule)) continue;
        recordOccurrence(cursor);
        if (hasMaxOccurrences && occurrenceCount >= (maxOccurrences as number)) break;
      }
      break;
    }
  }

  logger.debug('recurrence.generate.instances', {
    baseDate: event.date,
    rangeStart: rangeStart,
    rangeEnd: rangeEnd,
    frequency: rule.frequency,
    interval,
    hasEndDate,
    hasMaxOccurrences,
    count: instances.length,
    truncated,
  });

  if (truncated) {
    logger.warn('recurrence.generate.instances.truncated', {
      limit: MAX_INSTANCES_PER_RANGE,
      baseDate: event.date,
      rangeStart,
      rangeEnd,
      frequency: rule.frequency,
    });
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
  const interval = rule.interval || 1;

  switch (rule.frequency) {
    case 'daily': {
      const days = differenceInDays(date, baseDate);
      return days >= 0 && days % interval === 0;
    }

    case 'weekly': {
      const weeks = differenceInWeeks(date, baseDate);
      const weekMatch = weeks >= 0 && weeks % interval === 0;
      const dow = date.getDay();
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        return weekMatch && rule.daysOfWeek.includes(dow);
      }
      return weekMatch && dow === baseDate.getDay();
    }

    case 'biweekly': {
      const weeks = differenceInWeeks(date, baseDate);
      const period = 2 * interval;
      const weekMatch = weeks >= 0 && weeks % period === 0;
      const dow = date.getDay();
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        return weekMatch && rule.daysOfWeek.includes(dow);
      }
      return weekMatch && dow === baseDate.getDay();
    }

    case 'monthly': {
      const months = differenceInMonths(date, baseDate);
      const monthMatch = months >= 0 && months % interval === 0;
      const day = rule.dayOfMonth ?? baseDate.getDate();
      return monthMatch && date.getDate() === day;
    }

    case 'yearly': {
      const years = differenceInYears(date, baseDate);
      const yearMatch = years >= 0 && years % interval === 0;
      const month = (rule.monthOfYear ?? baseDate.getMonth() + 1) - 1; // 0-based
      const day = rule.dayOfMonth ?? baseDate.getDate();
      return yearMatch && date.getMonth() === month && date.getDate() === day;
    }

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
