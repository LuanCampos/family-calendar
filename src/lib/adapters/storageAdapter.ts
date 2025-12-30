import { eventAdapter } from './eventAdapter';
import { offlineAdapter } from './offlineAdapter';
import type { EventInput, EventTagInput } from '@/types/calendar';

/**
 * Storage Adapter - Main entry point for data operations
 * Routes to eventAdapter for calendar operations
 */

// Create storageAdapter object
export const storageAdapter = {
  // Event operations
  getEvents: (familyId: string, startDate?: string, endDate?: string) =>
    eventAdapter.getEvents(familyId, startDate, endDate),

  getEvent: (eventId: string) => eventAdapter.getEvent(eventId),

  createEvent: (familyId: string, input: EventInput, userId: string) =>
    eventAdapter.createEvent(familyId, input, userId),

  updateEvent: (eventId: string, input: Partial<EventInput>) =>
    eventAdapter.updateEvent(eventId, input),

  deleteEvent: (eventId: string, familyId: string) =>
    eventAdapter.deleteEvent(eventId, familyId),

  getEventTags: (familyId: string) => eventAdapter.getEventTags(familyId),

  createEventTag: (familyId: string, input: EventTagInput, userId: string) =>
    eventAdapter.createEventTag(familyId, input, userId),

  updateEventTag: (tagId: string, input: Partial<EventTagInput>, familyId: string) =>
    eventAdapter.updateEventTag(tagId, input, familyId),

  deleteEventTag: (tagId: string, familyId: string) =>
    eventAdapter.deleteEventTag(tagId, familyId),

  createRecurringEvent: (familyId: string, input: EventInput, userId: string) =>
    eventAdapter.createRecurringEvent(familyId, input, userId),

  offlineAdapter,
};

// Re-export individual functions for convenience
export const getEvents = (familyId: string, startDate?: string, endDate?: string) =>
  eventAdapter.getEvents(familyId, startDate, endDate);

export const getEvent = (eventId: string) => eventAdapter.getEvent(eventId);

export const createEvent = (familyId: string, input: EventInput, userId: string) =>
  eventAdapter.createEvent(familyId, input, userId);

export const updateEvent = (eventId: string, input: Partial<EventInput>) =>
  eventAdapter.updateEvent(eventId, input);

export const deleteEvent = (eventId: string, familyId: string) =>
  eventAdapter.deleteEvent(eventId, familyId);

export const getEventTags = (familyId: string) => eventAdapter.getEventTags(familyId);

export const createEventTag = (familyId: string, input: EventTagInput, userId: string) =>
  eventAdapter.createEventTag(familyId, input, userId);

export const updateEventTag = (tagId: string, input: Partial<EventTagInput>, familyId: string) =>
  eventAdapter.updateEventTag(tagId, input, familyId);

export const deleteEventTag = (tagId: string, familyId: string) =>
  eventAdapter.deleteEventTag(tagId, familyId);

export const createRecurringEvent = (familyId: string, input: EventInput, userId: string) =>
  eventAdapter.createRecurringEvent(familyId, input, userId);

// Re-export offline utilities
export { offlineAdapter };
