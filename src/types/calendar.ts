/**
 * Calendar and Event types
 */

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  interval?: number; // Number of periods between occurrences (default 1)
  endDate?: string; // YYYY-MM-DD format - when to stop recurring
  maxOccurrences?: number; // Max number of instances to generate
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday) for weekly/biweekly
  dayOfMonth?: number; // 1-31 for monthly
  monthOfYear?: number; // 1-12 for yearly
  unlimited?: boolean; // true = infinite recurrence (no end date or max occurrences)
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  time?: string; // HH:mm format
  duration?: number; // in minutes
  isAllDay?: boolean; // true if it's an all-day event
  familyId: string;
  createdBy: string; // userId
  tags: string[] | EventTag[]; // array of tag IDs or EventTag objects
  isPending?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Recurrence fields
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRule;
  recurringEventId?: string; // Reference to parent recurring event
  isRecurringInstance?: boolean; // true if this is an instance of a recurring event
  // Recurrence exceptions and overrides
  recurrenceExceptions?: string[]; // Dates (YYYY-MM-DD) to exclude from generated instances
  recurrenceOverrides?: Record<string, Partial<EventInput>>; // Per-date overrides applied to instances
}

export interface EventTag {
  id: string;
  name: string;
  color: string; // hex color like #3B82F6
  familyId: string;
  createdBy: string;
  createdAt?: string;
}

export interface EventInput {
  title: string;
  description?: string;
  date: string;
  time?: string;
  duration?: number;
  isAllDay?: boolean;
  tags?: string[];
  isPending?: boolean;
  // Recurrence fields
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRule;
}

export interface EventTagInput {
  name: string;
  color?: string;
}
